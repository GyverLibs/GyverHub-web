function makeWaiter() {
  let release;
  const wait = new Promise(res => {
    release = res;
  });
  return [wait, release];
}

class InputQueue {
  #queue = [];
  #listeners = [];

  #object_timeout;
  #get_timeout;

  constructor(object_timeout, get_timeout){
    this.#object_timeout = object_timeout;
    this.#get_timeout = get_timeout;
  }

  get length() {
    return this.#queue.length;
  }

  clear() {
    this.#queue.clear();
  }

  put(type, data) {
    const timer = setTimeout(() => {
      Array_remove(this.#queue, value);
    }, this.#object_timeout);

    const value = { type, data, timer };
    this.#queue.push(value);
    this.#flush();
    return this.length;
  }

  async get(types) {
    let timed_out = false;
    let wait, release = () => {};

    setTimeout(() => {
      timed_out = true;
      release();
    }, this.#get_timeout);

    while (!timed_out) {
      const value = this.#getIfMatches(types);
      if (value) return [value.type, value.data];

      [wait, release] = makeWaiter();
      this.#listeners.push(release);
      await wait;
    }

    throw new TimeoutError();
  }

  #getIfMatches(types) {
    for (let i = 0; i < this.#queue.length; i++) {
      const value = this.#queue[i];
      if (types.includes(value.type)) {
        this.#queue.splice(i, 1);
        clearTimeout(value.timer);
        return value;
      }
    }
    return undefined;
  }

  #flush() {
    while (this.#listeners.length > 0) {
      this.#listeners.shift()();
    }
  }
}
