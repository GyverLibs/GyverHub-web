// based on https://github.com/loginov-rocks/Web-Bluetooth-Terminal
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

class BluetoothJS {
  #device;
  #characteristic;
  #buffer;

  #SERVICE_UUID;
  #CHARACTERISTIC_UUID;

  #MAX_SIZE;
  #MAX_RETRIES;

  constructor(service_uuid = 0xFFE0, characteristic_uuid = 0xFFE1, max_size = 20, max_retries = 3) {
    this.#SERVICE_UUID = service_uuid;
    this.#CHARACTERISTIC_UUID = characteristic_uuid;
    this.#MAX_SIZE = max_size;
    this.#MAX_RETRIES = max_retries;
    this.#buffer = new CyclicBuffer(1024);
  }

  isConnected() {
    return this.#device && this.#device.gatt.connected && this.#characteristic;
  }

  getName() {
    return this.#device ? this.#device.name : null;
  }
  
  async open() {
    await this.close();
    if (!this.#device) {
      this.#device = await BluetoothJS.#requestDevice();
      this.#device.addEventListener('gattserverdisconnected', this._disconnect_h);
    }
    await this.#connect();
  }

  async close() {
    if (this.#characteristic) {
      this.#characteristic.removeEventListener('characteristicvaluechanged', this._change_h);
      await this.#characteristic.stopNotifications();
      this.#characteristic = undefined;
    }

    if (this.#device) {
      this.#device.removeEventListener('gattserverdisconnected', this._disconnect_h);
      if (this.#device.gatt.connected) {
        this.#device.gatt.disconnect();
      }
      this.#device = undefined;
    }
    this.#buffer.clear();
  }
  async send(data) {
    data = new TextEncoder().encode(data);
    this.#buffer.push(data);
    await this._send();
  }

  async _send() {
    while (this.isConnected() && !this.#buffer.isEmpty()) {
      const data = this.#buffer.pop(this.#MAX_SIZE);
      const device = this.#device;
      let retry = 0;
      while (this.isConnected() && device == this.#device) {
        try {
          await this.#characteristic.writeValue(data);
          break;
        } catch (e) {
          if (retry === this.#MAX_RETRIES)
            throw e;
          await sleep(1);
        }
      }
    }
  }

  static async #requestDevice() {
    return await navigator.bluetooth.requestDevice({
      filters: [{ services: [this._serviceUuid] }],
    });
  }

  async #connect() {
    let server = this.#device.gatt;
    if (!server.connected)
      server = await server.connect();

    const service = await server.getPrimaryService(this.#SERVICE_UUID);
    this.#characteristic = await service.getCharacteristic(this.#CHARACTERISTIC_UUID);

    await this.#characteristic.startNotifications();
    this.#characteristic.addEventListener('characteristicvaluechanged', this._change_h);
  }

  async _handleDisconnection(event) {
    await this.#connect();
  }
  _disconnect_h = this._handleDisconnection.bind(this);

  async _btchanged(event) {
    const value = new TextDecoder().decode(event.target.value);
    if (value) this.onmessage(value);
  }
  _change_h = this._btchanged.bind(this);

  async onopen() { }
  async onmessage(data) { }
  async onclose() { }
  async onerror(e) { }

  state() {
    return this.isConnected();
  }
}
