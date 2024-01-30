class Device {
  active_connections = [];
  info = {
    id: 'undefined',
    prefix: 'undefined',
    name: 'undefined',
    icon: '',
    PIN: 0,
    version: '',
    max_upl: 200,
    modules: 0,
    ota_t: '.bin',
    ip: null,
    http_port: null,
    ws_port: 81,
    http_t: 1,
    api_v: 0,
    platform: '',
  };
  #input_queue;

  // device
  focused = false;
  tout = null;
  ping = null;
  conn_lost = false;
  prev_set = {};

  skip_prd = 1000;  // skip updates
  tout_prd = 2500;  // connection timeout
  ping_prd = 3000;  // ping period > timeout

  // external
  granted = false;
  cfg_flag = false;

  constructor(hub, id) {
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
  async post(cmd, name = '', value = '') {
    if (cmd == 'set') {
      if (!this.isModuleEnabled(Modules.SET)) return;
      if (name) {
        if (this.prev_set[name]) clearTimeout(this.prev_set[name]);
        this.prev_set[name] = setTimeout(() => delete this.prev_set[name], this.skip_prd);
      }
    }

    await this.getConnection().post(this, cmd, name, value);

    if (this.focused) {
      this._reset_ping();
      this._reset_tout();
    }
  }

  async #postAndWait(cmd, types, name = '', value = '') {
    await this.post(cmd, name, value);
    return await this.#input_queue.get(types);
  }

  _stop_tout() {
    if (this.tout) {  // waiting answer
      this._hub.onWaitAnswer(this.info.id, false);
      clearTimeout(this.tout);
      this.tout = null;
    }
  }
  _reset_tout() {
    if (this.tout) return;
    this._hub.onWaitAnswer(this.info.id, true);
    this.tout = setTimeout(() => {
      if (this.focused /*&& !this.fsBusy()*/) this._hub.onDeviceConnChange(this.info.id, false);//TODO
      this.conn_lost = true;
      this._stop_tout();
    }, this.tout_prd);
  }
  _stop_ping() {
    if (this.ping) {
      clearInterval(this.ping);
      this.ping = null;
    }
  }
  _reset_ping() {
    this._stop_ping();
    this.ping = setInterval(async () => {
      if (this.conn_lost/* && !this.fsBusy()*/) this._hub.onPingLost(this.info.id);//TODO
      else await this.post('ping');
    }, this.ping_prd);
  }

  _checkUpdates(updates) {
    if (typeof(updates) != 'object') return;
    for (let name in updates) {
      if (name.includes(';')) {
        name.split(';').forEach(n => updates[n] = updates[name]);
        delete updates[name];
      }
    }
    for (let name in updates) {
      if ('value' in updates[name] && this.prev_set[name]) delete updates[name].value;
      if (Object.keys(updates[name]).length) this._hub.onUpdate(this.info.id, name, updates[name]);
    }
  }

  async _parse(type, data, conn) {
    let id = this.info.id;
    this._stop_tout();
    if (this.conn_lost) {
      this.conn_lost = false;
      this._hub.onPingLost(id);
      if (this.focused) this._hub.onDeviceConnChange(id, true);
    }

    this.#input_queue.put(type, data);

    /**
     * ping -> ok
     * unfocus -> <none>
     * fs_abort -> <none>
     * 
     * set -> ok | ui | update
     * ui -> ui
     */

    switch (type) {
      case 'ui':
        if (this.isModuleEnabled(Modules.UI)) this._hub.onUi(id, data.controls);
        await this.post('unix', Math.floor(new Date().getTime() / 1000));
        break;

      case 'error':
        this._hub.onError(id, data.code);
        break;

      case 'ack':
        this._hub.onAck(id, data.name);
        break;

      case 'fs_err':
        this._hub.onFsError(id);
        break;

      case 'files':
        this._hub.onFsbr(id, data.fs, data.total, data.used);
        break;

        // ============= HUB EVENTS =============

      case 'discover':
        this._hub.onDiscover(id, conn);
        break;

      case 'update': // ok
        this._checkUpdates(data.updates);
        break;

      case 'refresh': // ok
        await this.post('ui');
        break;

      case 'script': // ok
        eval(data.script);
        break;

      case 'print': // ok
        this._hub.onPrint(id, data.text, data.color);
        break;

      case 'alert': // ok
        this._hub.onAlert(id, data.text);
        break;

      case 'notice': // ok
        this._hub.onNotice(id, data.text, intToCol(data.color));
        break;

      case 'push': // ok
        this._hub.onPush(id, data.text);
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

    conn.addEventListener('statechange', e => {
      switch (e.state) {
        case ConnectionState.DISCONNECTED:
          this.active_connections.remove(conn);
          break;
      }
    })
  }

  //#endregion

  //#region UI files

  files = [];
  async _fetchFiles() {
    while (this.files) {
      let file = this.files.shift();
  
      Widget.setPlabel(file.name, '[FETCH...]');
      let res;
      try {
        res = await this.fetch(file.path, perc => {
          Widget.setPlabel(file.name, `[${perc}%]`);
        });
      } catch (e) {
        Widget.setPlabel(file.name, '[ERROR]');
        return;
      }
      file.callback(`data:${getMime(file.path)};base64,${res}`);
    }
  }

  file_flag = false;
  resetFiles() {
    this.files = [];
    this.file_flag = false;
  }

  async addFile(name, path, callback) {
    let has = this.files.some(f => f.name == name);
    if (!has) this.files.push({
      name, path, callback,
    });
    if (this.file_flag && this.files.length == 1) await this._fetchFiles();
  }

  async checkFiles() {
    this.file_flag = true;
    await this._fetchFiles();
  }

  //#endregion

  //#region Interraction > Common

  async focus() {
    this.focused = true;
    await this.#postAndWait('ui', ['ok']);
    // if (this.conn == Conn.HTTP && this.info.ws_port) {
    //   this.ws.connect();
    //   setTimeout(() => {
    //     if (!this.ws.state()) this.ws.disconnect();
    //   }, this.tout_prd);
    // }
  }

  async unfocus() {
    this.focused = false;
    this._stop_ping();
    this._stop_tout();
    await this.post('unfocus');
    // if (this.conn == Conn.HTTP) this.ws.disconnect();
  }

  async getInfo() {
    const [type, data] = await this.#postAndWait('info', ['info', 'ok']);
    if (type === 'info') return data;
    return undefined;
  }

  async reboot() {
    await this.#postAndWait('reboot', ['ok']);
  }

  async sendCli(command) {
    await this.#postAndWait('cli', ['ok'], 'cli', command);
  }

  //#endregion

  //#region Interraction > FS

  async deleteFile(path) {
    res = await this.#postAndWait('delete', ['files'], path);
  }

  async createFile(path) {
    res = await this.#postAndWait('mkfile', ['files'], path);
  }

  async renameFile(path, new_name) {
    res = await this.#postAndWait('rename', ['files'], path, new_name);
  }

  async formatFS() {
    res = await this.#postAndWait('format', ['files']);
  }

  async updateFileList() {
    res = await this.#postAndWait('files', ['files']);
  }

  async #onFiles(data) {
    this._hub.onFsbr(id, data.fs, data.total, data.used);
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