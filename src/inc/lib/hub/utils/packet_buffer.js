class PacketBufferScanFirst {
  #callback;
  #timeout;
  #buf;
  #tout;

  constructor(callback, timeout = 600) {
    this.#callback = callback;
    this.#timeout = timeout;
    this.#buf = [];
  }

  push(data) {
    if (this.#tout) clearTimeout(this.#tout);
    this.#tout = setTimeout(() => this.#buf.length = 0, this.#timeout);

    if (!this.#buf && !data.startsWith('#{'))
      return;

    this.#buf.push(data);

    if (data.endsWith('}#') && this.#buf[0][0] === data[data.length - 1]) {
      this.#callback(this.#buf.join(''));
      this.#buf.length = 0;

      if (this.#tout) clearTimeout(this._tout);
      this.#tout = null;
    }
  }

  clear() {
    if (this.#tout) clearTimeout(this.#tout);
    this.#tout = undefined;
    this.#buf.length = 0;
  }
};

class PacketBufferScanAll {
  #callback;
  #timeout;
  /** @type {Uint8Array} */ #buf;  

  #tout = null;

  constructor(callback, timeout = 600) {
    this.#callback = callback;
    this.#timeout = timeout;
    this.#buf = null;
  }

  /**
   * 
   * @param {Uint8Array} data 
   */
  push(data) {
    if (this.#tout) clearTimeout(this.#tout);
    this.#tout = setTimeout(() => this.#buf = null, this.#timeout);

    if (this.#buf) {
      const merged = new Uint8Array(this.#buf.length + data.length);
      merged.set(this.#buf);
      merged.set(data, this.#buf.length);
      this.#buf = merged;
      data = null;
    } else {
      this.#buf = data;
    }

    this.#pump();
  }

  #pump() {
    let index = 0;
    const decoder = new TextDecoder();

    while (true) {
      let startIndex = this.#indexOfSeq('#{', index);
      let endIndex = this.#indexOfSeq('}#', startIndex);
  
      if (startIndex === this.#buf.length || endIndex === this.#buf.length)
        break;

      const text = decoder.decode(this.#buf.subarray(startIndex, endIndex + 2));
      this.#callback(text);

      index = endIndex + 2;
    }

    if (index) {
      this.#buf = this.#buf.slice(index);
    }
  }

  #indexOfSeq(seq, fromIndex = 0) {
    while (true) {
      const i = this.#buf.indexOf(seq.charCodeAt(0), fromIndex);
      if (i === -1 || i > this.#buf.length - 2)
        return this.#buf.length;

      if (this.#buf[i + 1] === seq.charCodeAt(1)) {
        return i;
      }
      
      fromIndex = i + 1;
    }
  }
};