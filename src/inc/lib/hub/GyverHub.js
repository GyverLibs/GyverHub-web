class SystemErrorEvent extends Event {
  constructor(text) {
    super('systemerror');
    this.text = text;
  }
}

class GyverHub extends EventEmitter {
  /** @type {Config} */
  config;
  /** @type {Connection[]} */
  #connections = [];
  /** @type {Device[]} */
  #devices = [];
  _ws;

  static api_v = 2;

  constructor() {
    super();
    this.config = new Config();
    this.config.set('hub', 'prefix', 'MyDevices');
    this.config.set('hub', 'client_id', Math.round(Math.random() * 0xffffffff).toString(16));
  }

  addConnection(connClass) {
    for (const connection of this.#connections)
      if (connection instanceof connClass)
        return connection;

    const conn = new connClass(this);
    conn.addEventListener('statechange', e => {
      this.dispatchEvent(new ConnectionStateChangeEvent('connectionstatechange', e.connection, e.state));
      this.dispatchEvent(new ConnectionStateChangeEvent('connectionstatechange.' + conn.name, e.connection, e.state));
      if (conn.isConnected()) conn.discover();
    });
    this.#connections.push(conn);

    if (conn.name === 'HTTP') {
      this._ws = this.addConnection(WebSocketConnection);
    }

    return conn;
  }

  get mqtt() {
    for (const connection of this.#connections) {
      if (connection instanceof MQTTConnection)
        return connection;
    }
  }

  get bt() {
    for (const connection of this.#connections) {
      if (connection instanceof BLEConnection)
        return connection;
    }
  }

  get serial() {
    for (const connection of this.#connections) {
      if (connection instanceof SerialConnection)
        return connection;
    }
  }

  get tg() {
    for (const connection of this.#connections) {
      if (connection instanceof TelegramConnection)
        return connection;
    }
  }

  get http() {
    for (const connection of this.#connections) {
      if (connection instanceof HTTPConnection)
        return connection;
    }
  }

  /**
   * ID клиента (хаба).
   * @type {string}
   */
  get clientId() {
    return this.config.get('hub', 'client_id');
  }

  /**
   * Текущий префикс устройств.
   * @type {string}
   */
  get prefix() {
    return this.config.get('hub', 'prefix');
  }

  /**
   * Получить список всех известных префиксов (текущий и префиксы устройств), без дубликатов.
   * @returns {string[]}
   */
  getAllPrefixes() {
    const list = [this.prefix];
    for (const dev_info of Object.values(this.config.get('devices') ?? {}))
      if (dev_info.prefix && !list.includes(dev_info.prefix))
        list.push(dev_info.prefix);

    return list;
  }

  /**
   * Initialize connections.
   */
  async begin() {
    for (const connection of this.#connections) {
      await connection.begin();
    }
  }

  //#region Device communication

  /**
   * Discover all known devices by all active connnections.
   */
  async discover() {
    for (let dev of this.#devices) {
      dev.active_connections.length = 0;
    }

    for (const connection of this.#connections) {
      connection.discover();
    }

    this._checkDiscoverEnd();
  }

  /**
   * Search for new devices on all active connections.
   */
  async search() {
    for (const connection of this.#connections) {
      connection.search();
    }

    this._checkDiscoverEnd();
  }

  async add(id) {
    for (const connection of this.#connections) {
      connection.add(id);
    }

    this._checkDiscoverEnd();
  }

  /**
   * Check if hub currently allows discover.
   * @returns {boolean}
   */
  #isDiscovering() {
    return this.#connections.some(conn => conn.isDiscovering());
  }

  _checkDiscoverEnd() {
    if (!this.#isDiscovering()) this.dispatchEvent(new Event('discoverfinished'));
  }

  //#endregion

  //#region Device list management

  /**
   * Получить объект устройства по ID.
   * @param {string} id 
   * @returns {Device | null}
   */
  dev(id) {
    if (!id) return null;
    for (let d of this.#devices) {
      if (d.info.id == id) return d;
    }
    if (this.config.get('devices', id, 'id') === id) {
      const device = new Device(this, id);
      this.#devices.push(device);
      this.dispatchEvent(new DeviceEvent('devicecreated', device));
      return device;
    }
    return null;
  }

  /**
   * Получить список ID устройств.
   * @returns {string[]}
   */
  getDeviceIds() {
    const ids = this.#devices.map(d => d.info.id);
    const cfg = this.config.get('devices');
    if (cfg)
      for (const i of Object.keys(cfg))
        if (!ids.includes(i))
          ids.push(i);
    return ids;
  }

  /**
   * Add or update device info.
   * @param {object} data 
   * @param {Connection | undefined} conn 
   */
  addDevice(data, conn = undefined) {
    let device = this.dev(data.id);

    if (device) {  // exists
      let infoChanged = false;
      for (const key in data) {
        if (device.info[key] !== data[key]) {
          device.info[key] = data[key];
          infoChanged = true;
        }
      }
      let checkData = {
        ws_port: data.ws_port,
        http_port: data.http_port,
        udp_port: data.udp_port,
        http_transfer: data.http_transfer,
      }
      for (const key in checkData) {
        if (device.info[key] && !checkData[key]) {
          device.info[key] = 0;
          infoChanged = true;
        }
      }

      if (conn) device.addConnection(conn);
      if (infoChanged) this.dispatchEvent(new DeviceEvent('deviceinfochanged', device));

    } else {    // not exists
      if (!data.prefix) data.prefix = this.prefix;
      device = new Device(this, data.id);

      for (const key in data) {
        device.info[key] = data[key];
      }

      if (conn) device.addConnection(conn);
      this.#devices.push(device);
      this.dispatchEvent(new DeviceEvent('devicecreated', device));
      this.dispatchEvent(new DeviceEvent('deviceadded', device));
    }
  }

  /**
   * Move device in list
   * @param {string} id 
   * @param {number} dir 
   */
  moveDevice(id, dir) {
    if (this.#devices.length == 1) return;
    let idx = 0;
    for (let d of this.#devices) {
      if (d.info.id == id) break;
      idx++;
    }
    if (dir == 1 ? idx <= this.#devices.length - 2 : idx >= 1) {
      let b = this.#devices[idx];
      this.#devices[idx] = this.#devices[idx + dir];
      this.#devices[idx + dir] = b;
    }
  }

  /**
   * Remove device from hub
   * @param {string} id 
   */
  deleteDevice(id) {
    this.config.delete('devices', id);
    for (const i in this.#devices) {
      if (this.#devices[i].info.id === id) {
        this.#devices.splice(i, 1);
        return;
      }
    }
  }

  //#endregion

  async _parsePacket(conn, data, ip = null, port = null) {
    if (!data || !data.length) return;

    data = data.trim()
      .replaceAll("#{", "{")
      .replaceAll("}#", "}")
      .replaceAll(/([^\\])\\([^\"\\nrt])/ig, "$1\\\\$2")
      .replaceAll(/\t/ig, "\\t")
      .replaceAll(/\n/ig, "\\n")
      .replaceAll(/\r/ig, "\\r");

    for (const code in HubCodes) {
      const re = new RegExp(`(#${Number(code).toString(16)})([:,\\]\\}])`, "ig");
      data = data.replaceAll(re, `"${HubCodes[code]}"$2`);
    }

    const re = /(#[0-9a-f][0-9a-f])([:,\]\}])/ig;
    if (data.match(re)) {
      this.dispatchEvent(new SystemErrorEvent('Device has newer API version. Update App!'));
      return;
    }

    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('Wrong packet (JSON): ' + e + ' in: ' + data);
      this.dispatchEvent(new SystemErrorEvent('Wrong packet (JSON)'));
      return;
    }

    if (!data.id) {
      this.dispatchEvent(new SystemErrorEvent('Wrong packet (ID)'));
      return;
    }
    if (data.client && this.clientId != data.client) return;
    const type = data.type;
    delete data.type;

    // console.log('[IN]', type, data);

    if (type == 'discover') {
      if (!this.#isDiscovering()) {
        console.log('Device not added (not discovering):', data);
        return;
      }

      if (conn instanceof HTTPConnection) {
        data.ip = ip;
        data.http_port = port;
      }
      this.addDevice(data, conn);
    }

    const device = this.dev(data.id);
    if (device) {
      console.log('[IN]', type, data);
      device.addConnection(conn);
      await device._parse(type, data);
    }
    return device;
  }
};