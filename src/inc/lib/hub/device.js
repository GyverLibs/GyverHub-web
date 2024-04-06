class DeviceEvent extends Event {
  constructor(name, device) {
    super(name);
    this.device = device;
  }
}

class DeviceCommandEvent extends DeviceEvent {
  constructor(name, device, cmd, data) {
    super(name, device);
    this.cmd = cmd;
    this.data = data;
  }
}

class DeviceUpdateEvent extends DeviceEvent {
  constructor(device, name, data) {
    super("update", device);
    this.name = name;
    this.data = data;
  }
}

class DeviceErrorEvent extends DeviceEvent {
  constructor(device, error) {
    super("error", device);
    this.error = error;
  }
}

class DeviceConnectionStatusEvent extends DeviceEvent {
  constructor(device, status) {
    super("connectionstatus", device);
    this.status = status;
  }
}

class Device extends EventEmitter {
  /** @type {Connection[]} */
  active_connections = [];
  /** @type {object} */
  info;

  #input_queue;
  #pingTimer;

  // device
  prev_set = {};

  skip_prd = 1000;  // skip updates
  tout_prd = 2500;  // connection timeout
  object_tout = 1500;
  get_tout = 1500;
  ping_prd = 3000;

  // external
  granted = false;
  cfg_flag = false;

  /**
   * @param {GyverHub} hub 
   * @param {string} id 
   */
  constructor(hub, id) {
    super();
    this._hub = hub;
    this.info = hub.config.getDevice(id);
    this.#input_queue = new InputQueue(this.object_tout, this.get_tout);  // TODO config
    this.#pingTimer = new AsyncTimer(this.ping_prd, async () => {
      try {
        await this.#postAndWait('ping', ['OK', 'update', 'refresh', 'print']);
        this.dispatchEvent(new DeviceConnectionStatusEvent(this, true)); // TODO
      } catch (e) {
        console.log('[PING]', e);
        this.dispatchEvent(new DeviceConnectionStatusEvent(this, false)); // TODO
      }
      this.#pingTimer.restart();
    });
  }

  /**
   * Check if module is enabled
   * @param {Module} mod 
   * @returns {boolean}
   */
  isModuleEnabled(mod) {
    return !(this.info.modules & mod);
  }

  //#region Communication

  /**
   * Send command to device
   * @param {string} cmd 
   * @param {string} name 
   * @param {string} value 
   */
  async #post(cmd, name = '', value = '') {
    if (cmd == 'set' && name && this.isModuleEnabled(Modules.SET)) {
      if (this.prev_set[name]) clearTimeout(this.prev_set[name]);
      this.prev_set[name] = setTimeout(() => delete this.prev_set[name], this.skip_prd);
    }

    console.log('[OUT]', this.info.id, cmd, name, value);
    await this.getConnection().post(this, cmd, name, value);
  }

  /**
   * Send command to device and wait for response
   * @param {string} cmd Command
   * @param {string[]} types List of possible responses
   * @param {string} name 
   * @param {string} value 
   * @returns {Promise<[string, object]>}
   */
  async #postAndWait(cmd, types, name = '', value = '') {
    this.dispatchEvent(new DeviceEvent("transferstart", this));
    let res;
    try {
      await this.#post(cmd, name, value);
      res = await this.#input_queue.get(types);
    } catch (e) {
      this.dispatchEvent(new DeviceEvent("transfererror", this));
      this.dispatchEvent(new DeviceEvent("transferend", this));
      // this.dispatchEvent(new DeviceConnectionStatusEvent(this, false));
      throw e;
    }
    this.dispatchEvent(new DeviceEvent("transfersuccess", this));
    this.dispatchEvent(new DeviceEvent("transferend", this));
    // this.dispatchEvent(new DeviceConnectionStatusEvent(this, true));
    // if (this.#pingTimer.running) this.#pingTimer.restart();
    return res;
  }

  async _parse(type, data) {
    this.#input_queue.put(type, data);
    this.dispatchEvent(new DeviceCommandEvent("command", this, type, data));
    this.dispatchEvent(new DeviceCommandEvent("command." + type, this, type, data));

    switch (type) {
      case 'ui':
        await this.#postAndWait('unix', ['OK'], Math.floor(new Date().getTime() / 1000));
        break;

      case 'location':
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((p) => this.sendLocation(p), undefined, { enableHighAccuracy: data.high_accuracy });
        }
        break;

      case 'refresh':
        await this.updateUi();
        break;

      case 'update':
        this._checkUpdates(data.updates);
        break;

      case 'error':
        this.dispatchEvent(new DeviceErrorEvent(this, new DeviceError(data.code)));
    }
  }

  //#endregion

  //#region Connection

  /**
   * Check if device is accessable by http.
   * @returns {boolean}
   */
  isHttpAccessable() {
    return this.active_connections.some(conn => conn instanceof HTTPConnection);
  }

  /**
   * Get primary connection
   * @returns {Connection | null}
   */
  getConnection() {
    return this.active_connections.length ? Array_maxBy(this.active_connections, conn => conn.priority) : null;
  }

  /**
   * Check if device is connected to hub.
   * @returns {boolean}
   */
  isConnected() {
    return this.active_connections.length !== 0;
  }

  /**
   * Add new active connection to device.
   * @param {Connection} conn 
   */
  addConnection(conn) {
    if (this.active_connections.includes(conn)) return;

    this.active_connections.push(conn);
    this.dispatchEvent(new DeviceEvent('connectionchanged', this));

    conn.addEventListener('statechange', e => {
      switch (e.state) {
        case ConnectionState.DISCONNECTED:
          Array_remove(this.active_connections, conn);
          this.dispatchEvent(new DeviceEvent('connectionchanged', this));
          break;
      }
    })
  }

  //#endregion

  //#region Interraction > Common

  async getInfo() {
    const [type, data] = await this.#postAndWait('info', ['info', 'OK']);
    if (type === 'info') return data.info;
    return undefined;
  }

  async reboot() {
    await this.#postAndWait('reboot', ['OK']);
  }

  async sendCli(command) {
    await this.#postAndWait('cli', ['OK'], 'cli', command);
  }

  sendLocation(p) {
    try {
      let stamp = Math.round(p.timestamp / 1000);
      let value = '';
      [
        p.coords.latitude ? p.coords.latitude.toFixed(6) : 0,
        p.coords.longitude ? p.coords.longitude.toFixed(6) : 0,
        p.coords.altitude ? p.coords.altitude.toFixed(6) : 0,
        p.coords.speed ? p.coords.speed : 0,
        p.coords.heading ? p.coords.heading : 0,
        p.coords.accuracy ? p.coords.accuracy : 0,
      ].map(v => value += v + ';');
      this.#post('location', stamp, value.slice(0, -1));
    } catch (e) { }
  }

  //#endregion

  //#region Interraction > UI

  async updateUi() {
    return (await this.#postAndWait('ui', ['ui']))[1];
  }

  async set(name, value) {
    const [cmd, data] = await this.#postAndWait('set', ['ui', 'ack'], name, value);
    if (cmd === 'ui') return data;
    if (data.name !== name) throw new HubError("set / ack check failed!");
    return undefined;
  }

  _checkUpdates(updates) {
    if (typeof updates !== 'object')
      return;

    for (const [keys, data] of Object.entries(updates)) {
      if (typeof data !== 'object')
        continue;
      if ('value' in data && this.prev_set[keys])
        delete data.value;
      if (!Object.keys(data).length)
        continue;

      const names = keys.includes(';') ? keys.split(';') : [keys];
      for (const name of names)
        this.dispatchEvent(new DeviceUpdateEvent(this, name, data));
    }
  }

  async focus() {
    if (this.info.ws_port && this._hub._ws && this.active_connections.some(conn => conn instanceof HTTPConnection)) {
      const ws = this._hub._ws;

      await ws.disconnect();
      ws.options.ip = this.info.ip;
      ws.options.port = this.info.ws_port;
      ws.options.enabled = true;
      
      await ws.connect();

      if (!ws.isConnected()) {
        await ws.disconnect();
      } else {
        this.addConnection(ws)
      }
    }

    this.#pingTimer.start();
    return await this.updateUi();
  }

  async unfocus() {
    this.#pingTimer.cancel();
    await this.#post('unfocus');
    if (this._hub._ws) await this._hub._ws.disconnect();
  }

  //#endregion

  //#region Interraction > FS

  async deleteFile(path) {
    return (await this.#postAndWait('delete', ['files'], path))[1];
  }

  async createFile(path) {
    return (await this.#postAndWait('mkfile', ['files'], path))[1];
  }

  async renameFile(path, new_name) {
    return (await this.#postAndWait('rename', ['files'], path, new_name))[1];
  }

  async formatFS() {
    return (await this.#postAndWait('format', ['files']))[1];
  }

  async updateFileList() {
    return (await this.#postAndWait('files', ['files']))[1];
  }

  async fsStop() {
    if (this.isModuleEnabled(Modules.FETCH) || this.isModuleEnabled(Modules.UPLOAD) || this.isModuleEnabled(Modules.OTA))
      await this.#post('fs_abort', 'all');
  }

  async upload(file, path, progress = undefined) {
    if (!this.isModuleEnabled(Modules.UPLOAD))
      throw new DeviceError(HubErrors.Disabled);

    const data = await readFileAsArrayBuffer(file);
    const buffer = new Uint8Array(data);

    const crc = crc32(buffer);

    if (this.isHttpAccessable() && this.info.http_transfer) {
      let formData = new FormData();
      formData.append('upload', file, "upload");
      await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}&crc32=${crc}&client_id=${this._hub.clientId}&size=${buffer.length}`, formData)
    } else {
      if (!progress) progress = () => { };

      const upl_bytes = Array.from(buffer);
      const upl_size = upl_bytes.length;
      const max_enc_len = this.info.max_upload * 3 / 4 - 60;

      let [cmd, data] = await this.#postAndWait('upload', ['upload_next', 'upload_err'], path, upl_size);

      if (cmd === 'upload_next')
        [cmd, data] = await this.#postAndWait('upload_chunk', ['upload_next', 'upload_err'], 'crc', crc);

      while (cmd === 'upload_next') {
        const data2 = String.fromCharCode.apply(null, upl_bytes.splice(0, max_enc_len));
        progress(Math.round((upl_size - upl_bytes.length) / upl_size * 100));
        if (upl_bytes.length)
          [cmd, data] = await this.#postAndWait('upload_chunk', ['upload_next', 'upload_err'], 'next', window.btoa(data2));
        else
          [cmd, data] = await this.#postAndWait('upload_chunk', ['upload_done', 'upload_err'], 'last', window.btoa(data2));
      }

      if (cmd === 'upload_err')
        throw new DeviceError(data.code);
    }

    await this.updateFileList();
  }

  async fetch(path, type, progress = undefined) {
    if (!this.isModuleEnabled(Modules.FETCH))
      throw new DeviceError(HubErrors.Disabled);

    if (!progress) progress = () => { };

    if (this.isHttpAccessable() && this.info.http_transfer) {
      return await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}&client_id=${this._hub.clientId}`,
        type, progress, this._hub.config.get('connections', 'HTTP', 'request_timeout'));

    } else {
      let [cmd, data] = await this.#postAndWait('fetch', ['fetch_start', 'fetch_err'], path);
      let fet_len, fet_buf;
      if (cmd === 'fetch_start') {
        fet_len = data.len;
        fet_buf = '';
        [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
        progress(0);
      }

      while (cmd === 'fetch_chunk') {
        fet_buf += atob(data.data);

        if (data.last) {
          if (fet_buf.length != fet_len)
            throw new DeviceError(HubErrors.SizeMiss);

          const crc = crc32(fet_buf);
          if (crc != data.crc32)
            throw new DeviceError(HubErrors.CrcMiss);

          if (type === 'url')
            return `data:${getMime(path)};base64,${btoa(fet_buf)}`;
          else if (type === 'text')
            return new TextDecoder().decode(Uint8Array.from(fet_buf, (m) => m.codePointAt(0)));
        }

        // not last chunk
        progress(Math.round(fet_buf.length / fet_len * 100));
        [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
      }

      if (cmd === 'fetch_err')
        throw new DeviceError(data.code);
    }
  }

  //#endregion

  //#region Interraction > OTA

  async otaUrl(type, url) {
    const [t, data] = await this.#postAndWait('ota_url', ['ota_url_ok', 'ota_url_err'], type, url);
    if (t === 'ota_url_err')
      throw new DeviceError(data.code);
  }

  async uploadOta(file, type, progress = undefined) {
    if (!this.isModuleEnabled(Modules.OTA))
      throw new DeviceError(HubErrors.Disabled);

    if (this.isHttpAccessable() && this.info.http_transfer) {
      let formData = new FormData();
      formData.append(type, file, "ota");
      await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}&client_id=${this._hub.clientId}`, formData)
    } else {
      if (!progress) progress = () => { };

      const fdata = await readFileAsArrayBuffer(file);
      const buffer = new Uint8Array(fdata);
      const ota_bytes = Array.from(buffer);
      const ota_size = ota_bytes.length;
      const max_enc_len = this.info.max_upload * 3 / 4 - 60;

      let [cmd, data] = await this.#postAndWait('ota', ['ota_next', 'ota_done', 'ota_err'], type);

      while (cmd === 'ota_next') {
        const data2 = String.fromCharCode.apply(null, ota_bytes.splice(0, max_enc_len));
        progress(Math.round((ota_size - ota_bytes.length) / ota_size * 100));
        [cmd, data] = await this.#postAndWait('ota_chunk', ['ota_next', 'ota_done', 'ota_err'], (ota_bytes.length) ? 'next' : 'last', window.btoa(data2));
      }

      if (cmd === 'ota_err')
        throw new DeviceError(data.code);
    }
  }

  //#endregion
};