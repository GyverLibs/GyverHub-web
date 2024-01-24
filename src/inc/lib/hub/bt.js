// based on https://github.com/loginov-rocks/Web-Bluetooth-Terminal
class BluetoothJS extends Transport {
  #device;
  #characteristic;
  #buffer;

  #SERVICE_UUID;
  #CHARACTERISTIC_UUID;

  #MAX_SIZE;
  #MAX_RETRIES;

  constructor(service_uuid = 0xFFE0, characteristic_uuid = 0xFFE1, max_size = 20, max_retries = 3) {
    super();
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

  async select() {
    await this.close();
    if (this.#device) {
      this.#device.removeEventListener('gattserverdisconnected', this._disconnect_h);
      this.#device = undefined;
    }
    this._setState(ConnectionState.CONNECTING);

    try {
      this.#device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.#SERVICE_UUID] }],
      });
      this.#device.addEventListener('gattserverdisconnected', this._disconnect_h);
    } finally {
      this._setState(ConnectionState.DISCONNECTED);
    }
  }
  
  async open() {
    if (!this.#device)
      return;

    await this.close();
    await this.#connect();
  }

  async close() {
    if (this.#characteristic) {
      this.#characteristic.removeEventListener('characteristicvaluechanged', this._change_h);
      try {
        await this.#characteristic.stopNotifications();
      } catch (e) {}
      this.#characteristic = undefined;
    }

    if (this.#device && this.#device.gatt.connected) {
      try {
        this.#device.gatt.disconnect();
      } catch (e) {}
    }
    this.#buffer.clear();
    this._setState(ConnectionState.DISCONNECTED);
  }
  async send(data) {
    data = new TextEncoder().encode(data);
    this.#buffer.push(data);

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

  async #connect() {
    this._setState(ConnectionState.CONNECTING);

    try {
      let server = this.#device.gatt;
      if (!server.connected) {
        server = await server.connect();
      }

      const service = await server.getPrimaryService(this.#SERVICE_UUID);
      this.#characteristic = await service.getCharacteristic(this.#CHARACTERISTIC_UUID);
      await this.#characteristic.startNotifications();
      this.#characteristic.addEventListener('characteristicvaluechanged', this._change_h);

    } catch (e) {
      this._setState(ConnectionState.DISCONNECTED);
      throw e;
    }
    this._setState(ConnectionState.CONNECTED);
  }

  async _handleDisconnection(event) {
    this._setState(ConnectionState.DISCONNECTED);
    await this.#connect();
  }
  _disconnect_h = this._handleDisconnection.bind(this);

  async _btchanged(event) {
    const value = new TextDecoder().decode(event.target.value);
    if (value) this.dispatchEvent(new MessageEvent(value));
  }
  _change_h = this._btchanged.bind(this);
}
