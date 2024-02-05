// based on https://github.com/loginov-rocks/Web-Bluetooth-Terminal
class BLEConnection extends Connection {
  static priority = 600;
  static name = 'BLE';
  
  #device;
  #characteristic;
  #buffer;
  #packet_buffer;

  constructor(hub) {
    super(hub);
    this.options.enabled = false;
    this.options.buffer_size = 1024;
    this.options.service_uuid = 0xFFE0;
    this.options.characteristic_uuid = 0xFFE1;
    this.options.max_size = 20;
    this.options.max_retries = 3;

    this.#packet_buffer = new PacketBufferScanAll(data => {
      this.hub._parsePacket(this, data);
    });
    this.addEventListener('statechange', () => this.onConnChange(this.getState()));
  }

  isConnected() {
    return this.options.enabled && this.#device && this.#device.gatt.connected && this.#characteristic;
  }

  getName() {
    return this.#device ? this.#device.name : null;
  }

  async begin() {
    this.#buffer = new CyclicBuffer(this.options.buffer_size);

    if (this.options.enabled)
      await this.connect();
  }

  async select() {
    await this.disconnect();
    if (this.#device) {
      this.#device.removeEventListener('gattserverdisconnected', this._disconnect_h);
      this.#device = undefined;
    }
    this._setState(ConnectionState.CONNECTING);

    try {
      this.#device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.options.service_uuid] }],
      });
      this.#device.addEventListener('gattserverdisconnected', this._disconnect_h);
    } finally {
      this._setState(ConnectionState.DISCONNECTED);
    }
  }
  
  async connect() {
    if (!this.#device)
      return;

    await this.disconnect();
    await this.#connect();
  }

  async disconnect() {
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
      const data = this.#buffer.pop(this.options.max_size);
      const device = this.#device;
      let retry = 0;
      while (this.isConnected() && device == this.#device) {
        try {
          await this.#characteristic.writeValue(data);
          break;
        } catch (e) {
          if (retry === this.options.max_retries)
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

      const service = await server.getPrimaryService(this.options.service_uuid);
      this.#characteristic = await service.getCharacteristic(this.options.characteristic_uuid);
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
    if (event.target.value) this.#packet_buffer.push(event.target.value);
  }
  _change_h = this._btchanged.bind(this);
}
