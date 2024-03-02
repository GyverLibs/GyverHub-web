class CyclicBuffer {
  #buffer;
  #head;
  #tail;
  #max;
  #full;

  constructor(size) {
    if (typeof size === "number") {
      this.#max = size;
      this.#buffer = new Uint8Array(this.#max);
    } else {
      this.#max = size.length;
      this.#buffer = size;
    }
    this.#head = this.#tail = 0;
    this.#full = false;
  }

  isFull(){
    return this.#full;
  }

  isEmpty(){
    return this.#head == this.#tail && !this.#full;
  }

  capacity(){
    return this.#max;
  }

  size() {
    if (this.#full) return this.#max;
    if (this.#head >= this.#tail) return this.#head - this.#tail;
    return this.#head + this.#max - this.#tail;
  }

  available() {
    if (this.#full) return 0;
    if (this.#head >= this.#tail) return this.#max - this.#head + this.#tail;
    return this.#tail - this.#head;
  }

  clear() {
    this.#head = this.#tail = 0;
    this.#full = false;
  }

  push(/** @type {Uint8Array} */ data) {
    if(data.length > this.available()) {
      return false;
    }

    if(this.#head + data.length > this.#max) {
        // split & copy
        let copiedElement = this.#max - this.#head;
        this.#buffer.set(new Uint8Array(data, 0, copiedElement), this.#head);
        this.#buffer.set(new Uint8Array(data, copiedElement, data.length - copiedElement), 0)
    } else {
        // copy
        this.#buffer.set(data, this.#head);
    }
    
    this.#head = (this.#head + data.length) & this.#max;
    this.#full = this.#head == this.#tail;
    return true;
  }

  /**
   * 
   * @param {number} size 
   * @returns {Uint8Array}
   */
  pop(size) {
    if (size > this.size())
      size = this.size();

    let data;
    if(this.#tail + size > this.#max) {
        // split & copy
        data = new Uint8Array(size);
        let copiedElement = this.#max - this.#tail;
        data.copy(new Uint8Array(this.#buffer, this.#tail, copiedElement), 0);
        data.copy(new Uint8Array(this.#buffer, 0, size - copiedElement), copiedElement);
    } else {
        // copy
        data = this.#buffer.subarray(this.#tail, this.#tail + size);
    }
    this.#tail = (this.#tail + size) % this.#max;
    this.#full = false;
    return data;
  }
}
