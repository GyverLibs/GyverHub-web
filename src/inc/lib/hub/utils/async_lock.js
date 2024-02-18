function makeWaiter() {
    let resolve, reject;
    const wait = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {wait, resolve, reject};
}

class AsyncLock {
    #locked = false;
    #queue = [];

    get locked() {
        return this.#locked;
    }

    async runExclusive(callback, timeout = -1) {
        const release = await this.acquire(timeout);

        try {
            return await callback();
        } finally {
            release();
        }
    }

    async acquire(timeout = -1) {
        if (!this.#locked) {
            this.#locked = true;
            return this.#newReleaser();
        }

        if (timeout === 0)
            throw new TimeoutError();

        let {wait, resolve, reject} = makeWaiter();
        if (timeout > 0) {
            const timer = new AsyncTimer(timeout, () => reject(new TimeoutError()));
            timer.start();
            this.#queue.push({ resolve, reject, timer });
        } else {
            this.#queue.push({ resolve, reject, timer: undefined });
        }
        this.#dispatch();
        return await wait;
    }

    #dispatch() {
        if (!this.#locked && this.#queue.length) {
            const entry = this.#queue.shift();
            this.#locked = true;
            if (entry.timer) clearTimeout(entry.timer);
            entry.resolve(this.#newReleaser());
        }
    }

    #newReleaser() {
        let called = false;

        return () => {
            if (called) return;
            called = true;

            this.#release();
        };
    }

    #release() {
        if (this.#locked)
            this.#locked = false;
        this.#dispatch();
    }

    cancel() {
        this.#queue.forEach((entry) => entry.reject(this._cancelError));
        this.#queue = [];
    }
}
