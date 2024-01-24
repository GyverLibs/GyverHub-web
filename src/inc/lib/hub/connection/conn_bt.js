// based on https://github.com/loginov-rocks/Web-Bluetooth-Terminal
class BTconn extends Connection {
  priority = 600;
  name = 'BT';
  
  #device;
  #characteristic;
  #buffer;
  #packet_buffer;

  /*
    service_uuid = 0xFFE0
    characteristic_uuid = 0xFFE1
    max_size = 20
    max_retries = 3
    buffer_size = 1024
  */
  constructor(hub, options) {
    super(hub, options);
    this.#buffer = new CyclicBuffer(this.options.buffer_size);
    this.#packet_buffer = new PacketBuffer(this.hub, this, true);
    this.addEventListener('statechange', () => this.onConnChange(this.getState()));
  }

  isConnected() {
    return this.#device && this.#device.gatt.connected && this.#characteristic;
  }

  getName() {
    return this.#device ? this.#device.name : null;
  }

  async discover() {
    if (this.isDiscovering() || !this.isConnected()) return;
    for (let pref of this.hub._preflist()) await this.send(pref);
    this._discoverTimer();
  }
  
  async search() {
    if (this.isDiscovering() || !this.isConnected()) return;
    await this.send(this.hub.cfg.prefix);
    this._discoverTimer();
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
    const value = new TextDecoder().decode(event.target.value);
    if (value) this.#packet_buffer.process(value);
  }
  _change_h = this._btchanged.bind(this);
}
