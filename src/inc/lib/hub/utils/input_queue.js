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
      this.#queue.remove(value);
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
      const res = this.#getIfMatches(types);
      if (res) return [res.type, res.data];

      [wait, release] = makeWaiter();
      this.#listeners.push(release);
      await wait;
    }

    throw new Error("timed out");
  }

  #getIfMatches(types) {
    for (let i = 0; i < this.#queue.length; i++) {
      const element = this.#queue[i];
      if (types.includes(element.type)) {
        this.#queue.splice(i, 1);
        return element;
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

class InputQueue {
    #queue;

    constructor() {
        this.#queue = [];

    }

    async get(types, timeout) {

    }

    put(type, data) {
        this.#queue.push({
            type, data, 
        });
    }
}