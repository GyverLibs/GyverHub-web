class CyclicBuffer {
  #buffer;
  #head;
  #tail;
  #max;
  #full;

  constructor(size) {
    this.#max = size;
    this.#buffer = new Uint8Array(this.#max);
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
        this.#buffer.set(data.subarray(0, copiedElement), this.#head);
        this.#buffer.set(data.subarray(copiedElement, data.length), 0)
    } else {
        // copy
        this.#buffer.set(data, this.#head);
    }
    
    this.#head = (this.#head + data.length) & this.#max;
    this.#full = this.#head == this.#tail;
    return true;
  }

  pop(size) {
    if (size > this.size())
      size = this.size();

    let data;
    if(this.#tail + size > this.#max) {
        // split & copy
        data = Buffer.alloc(size);
        let copiedElement = this.#max - this.#tail;
        data.copy(this.#buffer.subarray(this.#tail, this.#max), 0);
        data.copy(this.#buffer.subarray(0, size - copiedElement), copiedElement);
    } else {
        // copy
        data = this.#buffer.subarray(this.#tail, this.#tail + size);
    }
    this.#tail = (this.#tail + size) % this.#max;
    this.#full = false;
    return data;
  }
}
