class GyverHub extends EventEmitter {
  onHubError(text) { }
  onDiscover(id, conn) { }
  onDeviceConnChange(id, state) { }
  onWsConnChange(id, state) { }
  onWaitAnswer(id, state) { }
  onPingLost(id) { }

  onError(id, code) { }
  onUpdate(id, name, data) { }
  onInfo(id, info) { }
  onFsbr(id, fs, total, used) { }
  onPrint(id, text, color) { }
  onUi(id, controls) { }
  onData(id, data) { }
  onAlert(id, text) { }
  onNotice(id, text, color) { }
  onPush(id, text) { }
  onAck(id, name) { }
  onFsError(id) { }

  // vars
  devices = [];
  connections = [];
  cfg = {
    prefix: 'MyDevices', client_id: new Date().getTime().toString(16).slice(-8),
    use_local: false, local_ip: '192.168.1.1', netmask: 24, http_port: 80,
    use_bt: false,
    use_serial: false, baudrate: 115200,
    use_mqtt: false, mq_host: 'test.mosquitto.org', mq_port: '8081', mq_login: '', mq_pass: '',
    use_tg: false, tg_token: '', tg_chat: '',
    api_ver: 3,

    discover_timeout: 3000,
    port: 80,
    request_timeout: 500
  };

  api_v = 1;
  skip_prd = 1000;  // skip updates
  tout_prd = 2500;  // connection timeout
  ping_prd = 3000;  // ping period > timeout

  constructor() {
    this.connections.push(new HTTPconn(this, this.cfg));
    /*@[if_not_target:esp]*/
    this.connections.push(
      new MQTTconn(this, {discover_timeout: 3000}),
      new TGconn(this),
      new SERIALconn(this, this.cfg),
      new BTconn(this, {
        service_uuid: 0xFFE0,
        characteristic_uuid: 0xFFE1,
        max_size: 20,
        max_retries: 3,
        buffer_size: 1024,
        discover_timeout: 3000,
      })
    );
    /*@/[if_not_target:esp]*/
  }

  get mqtt() {
    for (const connection of this.connections) {
      if (connection instanceof MQTTconn)
        return connection;
    }
  }

  get bt() {
    for (const connection of this.connections) {
      if (connection instanceof BTconn)
        return connection;
    }
  }

  get serial() {
    for (const connection of this.connections) {
      if (connection instanceof SERIALconn)
        return connection;
    }
  }

  get tg() {
    for (const connection of this.connections) {
      if (connection instanceof TGconn)
        return connection;
    }
  }

  _preflist() {
    let list = [this.cfg.prefix];
    for (let dev of this.devices) {
      if (!list.includes(dev.info.prefix)) list.push(dev.info.prefix);
    }
    return list;
  }

  // network

  /**
   * Check if hub currently allows discover.
   * @returns {boolean}
   */
  #isDiscovering() {
    for (const connection of this.connections) {
      if (connection.isDiscovering())
        return true;
    }
    return false;
  }

  /**
   * Initialize connections.
   */
  async begin() {
    for (const connection of this.connections) {
      await connection.begin();
    }
  }

  //#region Device communication

  /**
   * Send command to device by id
   * @param {string} id 
   * @param {string} cmd 
   * @param {string} name 
   * @param {string} value 
   */
  async post(id, cmd, name = '', value = '') {
    await this.dev(id).post(cmd, name, value);
  }

  /**
   * Discover all known devices by all active connnections.
   */
  async discover() {
    for (let dev of this.devices) {
      dev.active_connections.clear();
    }

    for (const connection of this.connections) {
      await connection.discover();
    }

    this._checkDiscoverEnd();
  }

  /**
   * Search for new devices on all active connections.
   */
  async search() {
    for (const connection of this.connections) {
      await connection.search();
    }

    this._checkDiscoverEnd();
  }

  // private
  _checkDiscoverEnd() {
    if (!this.#isDiscovering()) this.dispatchEvent(new Event('discoverfinished'));
  }

  //#endregion

  //#region Import export

  /**
   * Export devices list to json-compatiable format
   * @returns {object[]}
   */
  exportDevices() {
    let devs = [];
    for (let d of this.devices) {
      devs.push(d.info);
    }
    return devs;
  }

  /**
   * Export config to json-compatiable format
   * @returns {object}
   */
  exportConfig() {
    const config = Object.assign({}, this.cfg);
    config.devices = this.exportDevices();
    return config;
  }

  /**
   * Import devices list from json-compatiable format
   * @param {object[]} devs 
   */
  importDevices(devs) {
    this.devices.clear();
    for (let di of devs) {
      let dev = new Device(this);
      for (let key in di) {
        dev.info[key] = di[key];
      }
      this.devices.push(dev);
    }
  }

  /**
   * Import config from json-compatiable format
   * @param {object} cfg 
   */
  importConfig(cfg) {
    const devs = cfg.devices;
    delete cfg.devices;
    this.cfg = cfg;
    this.importDevices(devs);
  }

  //#endregion

  //#region Device list management


  dev(id) {
    if (!id) return null;
    for (let d of this.devices) {
      if (d.info.id == id) return d;
    }
    return null;
  }

  /**
   * Add or update device info.
   * @param {object} data 
   * @param {Connection | undefined} conn 
   */
  addDevice(data, conn = undefined) {
    let device = this.dev(data.id);
    let infoChanged = false;

    if (device) {  // exists
      for (const key in data) {
        if (device.info[key] !== data[key]) {
          device.info[key] = data[key];
          infoChanged = true;
        }
      }

      if (conn) device.addConnection(conn);
      if (infoChanged) this.dispatchEvent(new DeviceEvent('deviceinfochanged', device));

    } else {    // not exists
      device = new Device(this);
      infoChanged = true;

      for (let key in data) {
        device.info[key] = data[key];
      }

      if (conn) device.addConnection(conn);
      this.devices.push(device);
      this.dispatchEvent(new DeviceEvent('deviceadded', device));
    }

    if (infoChanged) {
      /*@[if_not_target:esp]*/
      this.mqtt.sub_device(device.info.prefix, device.info.id);
      /*@/[if_not_target:esp]*/
      this.dispatchEvent(new Event('devicesconfigchanged'));
    }
  }

  /**
   * Move device in list
   * @param {string} id 
   * @param {number} dir 
   */
  moveDevice(id, dir) {
    if (this.devices.length == 1) return;
    let idx = 0;
    for (let d of this.devices) {
      if (d.info.id == id) break;
      idx++;
    }
    if (dir == 1 ? idx <= this.devices.length - 2 : idx >= 1) {
      let b = this.devices[idx];
      this.devices[idx] = this.devices[idx + dir];
      this.devices[idx + dir] = b;
    }
  }

  /**
   * Remove device from hub
   * @param {string} id 
   */
  deleteDevice(id) {
    for (let i in this.devices) {
      if (this.devices[i].info.id == id) {
        this.devices.splice(i, 1);
        this.dispatchEvent(new Event('devicesconfigchanged'));
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

    for (let code in HubCodes) {
      const re = new RegExp(`(#${Number(code).toString(16)})([:,\\]\\}])`, "ig");
      data = data.replaceAll(re, `"${HubCodes[code]}"$2`);
    }

    const re = new RegExp(`(#[0-9a-f][0-9a-f])([:,\\]\\}])`, "ig");
    if (data.match(re)) {
      this.onHubError('Device has newer API version. Update App!');
      return;
    }

    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('Wrong packet (JSON): ' + e + ' in: ' + data);
      // this.onHubError('Wrong packet (JSON)');
      return;
    }

    if (!data.id) return this.onHubError('Wrong packet (ID)');
    if (data.client && this.cfg.client_id != data.client) return;
    let type = data.type;
    delete data.type;

    if (type == 'discover') {
      if (!this.#isDiscovering())
        return;

      if (conn instanceof HTTPconn) {
        data.ip = ip;
        data.http_port = port;
      }
      this.addDevice(data, conn);
    }

    let device = this.dev(data.id);
    if (device) {
      await device._parse(type, data);
    }
  }
};