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

class Device extends EventEmitter {
  /** @type {Connection[]} */
  active_connections = [];
  /** @type {object} */
  info;

  #input_queue;

  // device
  prev_set = {};

  skip_prd = 1000;  // skip updates
  tout_prd = 2500;  // connection timeout

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
    this.#input_queue = new InputQueue(1000, 1000);  // TODO config
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
      throw e;
    }
    this.dispatchEvent(new DeviceEvent("transfersuccess", this));
    this.dispatchEvent(new DeviceEvent("transferend", this));
    return res;
  }

  async _parse(type, data) {
    this.#input_queue.put(type, data);
    this.dispatchEvent(new DeviceCommandEvent("command", this, type, data));
    this.dispatchEvent(new DeviceCommandEvent("command." + type, this, type, data));

    switch (type) {
    case 'ui':
      await this.#post('unix', Math.floor(new Date().getTime() / 1000));
      break;

    case 'refresh':
      await this.updateUi();
      break;

    case 'update':
      this._checkUpdates(data.updates);
      break;
    }
  }

  //#endregion

  //#region Connection

  /**
   * Check if device is accessable by http.
   * @returns {boolean}
   */
  isHttpAccessable() {
    for (const connection of this.active_connections) {
      if (connection instanceof HTTPconn)
        return true;
    }
    return false;
  }

  /**
   * Get primary connection
   * @returns {Connection}
   */
  getConnection() {
    return this.active_connections.maxBy(conn => conn.priority);
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
          this.active_connections.remove(conn);
          this.dispatchEvent(new DeviceEvent('connectionchanged', this));
          break;
      }
    })
  }

  //#endregion

  //#region UI files

  #files = [];
  #file_flag = false;

  async _fetchFiles() {
    while (this.#files.length) {
      const file = this.#files.shift();
  
      let res;
      try {
        res = await this.fetch(file.path, file.progress);
      } catch (e) {
        return;
      }
      file.callback(`data:${getMime(file.path)};base64,${res}`);
    }
  }

  async loadUIFiles() {
    this.#file_flag = true;
    await this._fetchFiles();
  }

  resetUIFiles() {
    this.#files.length = 0;
    this.#file_flag = false;
  }

  /**
   * Register an UI file to load.
   * @param {string} id
   * @param {string} path
   * @param {(string) => undefined} callback 
   */
  async addFile(id, path, callback, progress = undefined) {
    let has = this.#files.some(f => f.id == id);
    if (!has) this.#files.push({
      id, path, callback, progress
    });
    if (this.#file_flag && this.#files.length == 1) await this._fetchFiles();
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

  //#endregion

  //#region Interraction > UI

  async updateUi(){
    await this.#postAndWait('ui', ['ui']);
  }

  async set(name, value){
    await this.#postAndWait('set', ['ui', 'ack'], name, value);
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
    if (this.info.ws_port && this.active_connections.some(conn => conn instanceof HTTPconn)) {
      this._hub.config.set('connections', 'WS', 'ip', this.info.ip);
      this._hub.config.set('connections', 'WS', 'port', this.info.ws_port);
      this._hub.config.set('connections', 'WS', 'enabled', true);
      await this._hub.ws.disconnect();
      await this._hub.ws.connect();
      setTimeout(() => {
        if (!this._hub.ws.isConnected()) {
          this.ws._hub.disconnect();
        }
      }, this.tout_prd);
    }

    await this.updateUi();
  }

  async unfocus() {
    await this.#post('unfocus');
    await this._hub.ws.disconnect();
  }

  //#endregion

  //#region Interraction > FS

  async deleteFile(path) {
    await this.#postAndWait('delete', ['files'], path);
  }

  async createFile(path) {
    await this.#postAndWait('mkfile', ['files'], path);
  }

  async renameFile(path, new_name) {
    await this.#postAndWait('rename', ['files'], path, new_name);
  }

  async formatFS() {
    await this.#postAndWait('format', ['files']);
  }

  async updateFileList() {
    await this.#postAndWait('files', ['files']);
  }

  async fsStop() {
     await this.#post('fs_abort');
  }

  fsBusy() {
    return false;
  }

  async upload(file, path, progress = undefined) {
    if (!this.isModuleEnabled(Modules.UPLOAD)) 
      throw new Error(HubErrors.Disabled);
    if (this.fsBusy())
      throw new Error(HubErrors.FsBusy);

    const data = await readFileAsArrayBuffer(file);
    const buffer = new Uint8Array(data);

    const crc = crc32(buffer);

    if (this.isHttpAccessable() && this.info.http_t) {
      let formData = new FormData();
      formData.append('upload', file);
      await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}&crc32=${crc}&client_id=${this._hub.clientId}&size=${buffer.length}`, formData)
    } else {
      if (!progress) progress = () => {};

      const upl_bytes = Array.from(buffer);
      const upl_size = upl_bytes.length;
      const max_enc_len = this.info.max_upl * 3 / 4 - 60;

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
        throw new Error(data.code);
    }

    await this.updateFileList();
  }

  async fetch(path, progress = undefined) {
    if (!this.isModuleEnabled(Modules.FETCH))
      throw new Error(HubErrors.Disabled);
    if (this.fsBusy())
      throw new Error(HubErrors.FsBusy);

    if (!progress) progress = () => {};

    if (this.isHttpAccessable() && this.info.http_t) {
      return await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}&client_id=${this._hub.clientId}`, 
          progress, this._hub.http.tout);

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
            throw new Error(HubErrors.SizeMiss);
  
          const crc = crc32(fet_buf);
          if (crc != data.crc32)
            throw new Error(HubErrors.CrcMiss);

          return btoa(fet_buf);
        }

        // not last chunk
        progress(Math.round(fet_buf.length / fet_len * 100));
        [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
      }

      if (cmd === 'fetch_err')
        throw new Error(data.code);
    }
  }
  
  //#endregion

  //#region Interraction > OTA

  async otaUrl(type, url) {
    const [t, data] = await this.#postAndWait('ota_url', ['ota_url_ok', 'ota_url_err'], type, url);
    if (t === 'ota_url_err')
      throw new Error(data.code);
  }

  async uploadOta(file, type, progress = undefined) {
    if (!this.isModuleEnabled(Modules.OTA)) 
      throw new Error(HubErrors.Disabled);
  
    if (this.fsBusy())
      throw new Error(HubErrors.FsBusy);

    if (this.isHttpAccessable() && this.info.http_t) {
      let formData = new FormData();
      formData.append(type, file);
      await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}&client_id=${this._hub.clientId}`, formData)
    } else {
      if (!progress) progress = () => {};

      const fdata = await readFileAsArrayBuffer(file);
      const buffer = new Uint8Array(fdata);
      const ota_bytes = Array.from(buffer);
      const ota_size = ota_bytes.length;
      const max_enc_len = this.info.max_upl * 3 / 4 - 60;

      let [cmd, data] = await this.#postAndWait('ota', ['ota_next', 'ota_done', 'ota_err'], type);

      while (cmd === 'ota_next') {
        const data2 = String.fromCharCode.apply(null, ota_bytes.splice(0, max_enc_len));
        progress(Math.round((ota_size - ota_bytes.length) / ota_size * 100));
        [cmd, data] = await this.#postAndWait('ota_chunk', ['ota_next', 'ota_done', 'ota_err'], (ota_bytes.length) ? 'next' : 'last', window.btoa(data2));
      }

      if (cmd === 'ota_err')
        throw new Error(data.code);
    }
  }

  //#endregion
};