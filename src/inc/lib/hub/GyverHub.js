class GyverHub {
  onHubError(text) { }

  // devices
  onSaveDevices() { }
  onAddDevice(dev) { }
  onUpdDevice(dev) { }
  onDiscoverEnd() { }
  onDiscover(id, conn) { }

  // data
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

  // connection
  onDeviceConnChange(id, state) { }
  onWsConnChange(id, state) { }
  onWaitAnswer(id, state) { }
  onPingLost(id) { }
  onError(id, code) { }

  // fs
  onFsError(id) { }

  // upload
  onFsUploadStart(id) { }
  onFsUploadEnd(id) { }
  onFsUploadError(id, code) { }
  onFsUploadPerc(id, perc) { }

  // ota
  onOtaStart(id) { }
  onOtaEnd(id) { }
  onOtaError(id, code) { }
  onOtaPerc(id, perc) { }
  onOtaUrlEnd(id) { }
  onOtaUrlError(id, code) { }

  // fetch fs
  onFsFetchStart(id, index) { }
  onFsFetchEnd(id, name, index, data) { }
  onFsFetchError(id, index, code) { }
  onFsFetchPerc(id, index, perc) { }

  // fetch
  onFetchStart(id, name) { }
  onFetchEnd(id, name, data, file) { }
  onFetchError(id, name, data, code) { }
  onFetchPerc(id, name, perc) { }

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

  // network
  begin() {
    for (const connection of this.connections) {
      connection.begin();
    }
  }
  post(id, cmd, name = '', value = '') {
    this.dev(id).post(cmd, name, value);
  }
  discover() {
    for (let dev of this.devices) {
      dev.conn = undefined;
      dev.active_connections = [];
    }

    for (const connection of this.connections) {
      connection.discover();
    }

    this._checkDiscoverEnd();
  }
  search() {
    for (const connection of this.connections) {
      connection.search();
    }

    this._checkDiscoverEnd();
  }
  async send(device, uri) {
    await device.conn.send(uri)
    // switch (device.conn) {
    //   case Conn.HTTP:
    //     await this.http.send(this.info.ip, this.info.http_port, uri);
    //     break;
    // }
  }

  // devices
  dev(id) {
    if (!id) return null;
    for (let d of this.devices) {
      if (d.info.id == id) return d;
    }
    return null;
  }
  export() {
    let devs = [];
    for (let d of this.devices) {
      devs.push(d.info);
    }
    return JSON.stringify(devs);
  }
  import(str) {
    let devsi = JSON.parse(str);
    this.devices = [];
    for (let di of devsi) {
      let dev = new Device(this);
      for (let key in di) {
        dev.info[key] = di[key];
      }
      this.devices.push(dev);
    }
  }
  delete(id) {
    for (let i in this.devices) {
      if (this.devices[i].info.id == id) {
        this.devices.splice(i, 1);
        this.onSaveDevices();
        return;
      }
    }
  }
  addDevice(data, conn = undefined) {
    let device = this.dev(data.id);
    let flag = false;
    if (device) {  // exists
      for (let key in data) {
        if (device.info[key] != data[key]) {
          device.info[key] = data[key];
          flag = true;
        }
      }
      device.active_connections.push(conn);
      if (conn.priority > device.conn.priority) {  // priority
        device.conn = conn;
        flag = true;
      }
      if (flag) this.onUpdDevice(device.info);
    } else {    // not exists
      device = new Device(this);
      for (let key in data) {
        device.info[key] = data[key];
      }
      device.conn = conn;
      this.devices.push(device);
      this.onAddDevice(device.info);
      flag = true;
    }
    if (flag) {
      /*@[if_not_target:esp]*/
      this.mqtt.sub_device(device.info.prefix, device.info.id);
      /*@/[if_not_target:esp]*/
      this.onSaveDevices();
    }
  }
  moveDevice(id, dir) {
    if (this.devices.length == 1) return;
    let idx = 0;
    for (let d of this.devices) {
      if (d.info.id == id) break;
      idx++;
    }
    if ((dir == 1 && idx <= this.devices.length - 2) || (dir == -1 && idx >= 1)) {
      let b = this.devices[idx];
      this.devices[idx] = this.devices[idx + dir];
      this.devices[idx + dir] = b;
    }
  }

  // log
  log(t) {
    console.log('Log: ' + t);
  }
  err(e) {
    console.log('Error: ' + e.toString());
    this.onHubError(e.toString());
  }

  // private
  _checkDiscoverEnd() {
    if (!this._discovering()) this.onDiscoverEnd();
  }
  _discovering() {
    for (const connection of this.connections) {
      if (connection.isDiscovering())
        return true;
    }
    return false;
  }
  _preflist() {
    let list = [this.cfg.prefix];
    for (let dev of this.devices) {
      if (!list.includes(dev.info.prefix)) list.push(dev.info.prefix);
    }
    return list;
  }
  _parsePacket(conn, data, ip = null, port = null) {
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
      this.err('Device has newer API version. Update App!');
      return;
    }

    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('Wrong packet (JSON): ' + e + ' in: ' + data);
      // this.err('Wrong packet (JSON)');
      return;
    }

    if (!data.id) return this.err('Wrong packet (ID)');
    if (data.client && this.cfg.client_id != data.client) return;
    let type = data.type;
    delete data.type;

    if (type == 'discover' && this._discovering()) {
      if (conn instanceof HTTPconn) {
        data.ip = ip;
        data.http_port = port;
      }
      this.addDevice(data, conn);
    }

    let device = this.dev(data.id);

    if (device) {
      device._parse(type, data);

      let id = data.id;
      switch (type) {
        case 'error':
          this.onError(id, data.code);
          break;

        case 'refresh':
          this.post(id, 'ui');
          break;

        case 'script':
          eval(data.script);
          break;

        case 'ack':
          this.onAck(id, data.name);
          break;

        case 'fs_err':
          this.onFsError(id);
          break;

        case 'info':
          this.onInfo(id, data.info);
          break;

        case 'files':
          this.onFsbr(id, data.fs, data.total, data.used);
          break;

        case 'print':
          this.onPrint(id, data.text, data.color);
          break;

        case 'discover':
          if (this._discovering()) this.onDiscover(id, conn);
          break;

        case 'ui':
          if (device.module(Modules.UI)) this.onUi(id, data.controls);
          this.post(id, 'unix', Math.floor(new Date().getTime() / 1000));
          break;

        case 'data':
          if (device.module(Modules.DATA)) this.onData(id, data.data);
          break;

        case 'alert':
          this.onAlert(id, data.text);
          break;

        case 'notice':
          this.onNotice(id, data.text, intToCol(data.color));
          break;

        case 'push':
          this.onPush(id, data.text);
          break;

        case 'ota_url_ok':
          this.onOtaUrlEnd(id);
          break;

        case 'ota_url_err':
          this.onOtaUrlError(id, data.code);
          break;
      }
    }
  }
};