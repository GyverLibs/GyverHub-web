class AsyncTimer {
    #timeout;
    #handler;
    #tid;

    constructor(timeout = undefined, handler = undefined) {
        this.#timeout = timeout;
        this.#handler = handler;
    }

    get running() {
        return this.#tid !== undefined;
    }

    start(timeout = undefined) {
        if (timeout === undefined) timeout = this.#timeout;

        if (timeout === undefined || this.running) return;

        this.#tid = setTimeout(() => {
            this.handle();
        }, timeout);
    }

    cancel() {
        if (this.running) clearTimeout(this.#tid);
        this.#tid = undefined;
    }

    restart(timeout = undefined) {
        this.cancel();
        this.start(timeout);
    }

    handle() {
        const handler = this.#handler;
        if (handler !== undefined) handler();
    }
}
