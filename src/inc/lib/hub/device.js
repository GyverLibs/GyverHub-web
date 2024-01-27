class Device {
  active_connections = [];

  // device
  focused = false;
  tout = null;
  ping = null;
  conn_lost = false;
  prev_set = {};
  files = [];
  file_flag = false;

  // fs
  fs_mode = null;   // upload, fetch, ota, fetch_file  // used in ui.js!
  fs_tout = null;

  // ota
  ota_bytes = null;
  ota_size = null;

  // upload
  crc32 = null;
  upl_bytes = null;
  upl_size = null;

  // fetch
  fet_name = '';
  fet_index = 0;
  fet_buf = null;
  fet_len = 0;

  // external
  granted = false;
  cfg_flag = false;


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

  constructor(hub) {
    this._hub = hub;
  }

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

  /**
   * Check if module is enabled
   * @param {Module} mod 
   * @returns {boolean}
   */
  isModuleEnabled(mod) {
    return !(this.info.modules & mod);
  }

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
        this.prev_set[name] = setTimeout(() => delete this.prev_set[name], this._hub.skip_prd);
      }
    }

    await this.getConnection().post(this, cmd, name, value);

    if (this.focused) {
      this._reset_ping();
      this._reset_tout();
    }
  }

  async focus() {
    this.focused = true;
    await this.post('ui');
    // if (this.conn == Conn.HTTP && this.info.ws_port) {
    //   this.ws.connect();
    //   setTimeout(() => {
    //     if (!this.ws.state()) this.ws.disconnect();
    //   }, this._hub.tout_prd);
    // }
  }

  async unfocus() {
    this.focused = false;
    this._stop_ping();
    this._stop_tout();
    await this.post('unfocus');
    // if (this.conn == Conn.HTTP) this.ws.disconnect();
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
    }, this._hub.tout_prd);
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
    }, this._hub.ping_prd);
  }

  // private

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

  inq = new InputQueue(1000, 1000);

  async #postAndWait(cmd, types, name = '', value = '') {
    await this.post(cmd, name, value);
    return await this.inq.get(types);
  }

  async _parse(type, data) {
    let id = this.info.id;
    this._stop_tout();
    if (this.conn_lost) {
      this.conn_lost = false;
      this._hub.onPingLost(id);
      if (this.focused) this._hub.onDeviceConnChange(id, true);
    }

    this.inq.put(type, data);

    switch (type) {
      case 'OK':
        break;

      case 'update':
        this._checkUpdates(data.updates);
        break;

      case 'refresh':
        await this.post('ui');
        break;

      case 'script':
        eval(data.script);
        break;

      case 'ui':
        if (this.isModuleEnabled(Modules.UI)) this._hub.onUi(id, data.controls);
        await this.post('unix', Math.floor(new Date().getTime() / 1000));
        break;

      case 'data':
        if (this.isModuleEnabled(Modules.DATA)) this._hub.onData(id, data.data);
        break;

      // ============= HUB EVENTS =============
      case 'error':
        this._hub.onError(id, data.code);
        break;

      case 'ack':
        this._hub.onAck(id, data.name);
        break;

      case 'fs_err':
        this._hub.onFsError(id);
        break;

      case 'info':
        this._hub.onInfo(id, data.info);
        break;

      case 'files':
        this._hub.onFsbr(id, data.fs, data.total, data.used);
        break;

      case 'print':
        this._hub.onPrint(id, data.text, data.color);
        break;

      case 'discover':
        this._hub.onDiscover(id, conn);
        break;

      case 'alert':
        this._hub.onAlert(id, data.text);
        break;

      case 'notice':
        this._hub.onNotice(id, data.text, intToCol(data.color));
        break;

      case 'push':
        this._hub.onPush(id, data.text);
        break;

      // ============= OTA URL =============
      case 'ota_url_ok':
        this._hub.onOtaUrlEnd(id);
        break;

      case 'ota_url_err':
        this._hub.onOtaUrlError(id, data.code);
        break;
    }
  }

//#region OTA

  async uploadOta(file, type) {
    if (!this.isModuleEnabled(Modules.OTA)) return;
    if (this.fsBusy()) {
      this._hub.onOtaError(this.info.id, HubErrors.FsBusy);
      return;
    }
    if (!file.name.endsWith(this.info.ota_t)) {
      alert('Wrong file! Use .' + this.info.ota_t);
      return;
    }
    const res = await asyncConfirm('Upload OTA ' + type + '?');
    if (!res) return;

    this._hub.onOtaStart(this.info.id);
    try {
      if (this.isHttpAccessable() && this.info.http_t) {
        let formData = new FormData();
        formData.append(type, file);
        await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}&client_id=${this._hub.cfg.client_id}`, formData)
      } else {
        const fdata = await readFileAsArrayBuffer(file);
        const buffer = new Uint8Array(fdata);
        const ota_bytes = Array.from(buffer);
        const ota_size = ota_bytes.length;
        const max_enc_len = this.info.max_upl * 3 / 4 - 60;
  
        let [cmd, data] = await this.#postAndWait('ota', ['ota_next', 'ota_done', 'ota_err'], type);
  
        while (cmd === 'ota_next') {
          const data2 = String.fromCharCode.apply(null, ota_bytes.splice(0, max_enc_len));
          this._hub.onOtaPerc(this.info.id, Math.round((ota_size - ota_bytes.length) / ota_size * 100));
          [cmd, data] = await this.#postAndWait('ota_chunk', ['ota_next', 'ota_done', 'ota_err'], (ota_bytes.length) ? 'next' : 'last', window.btoa(data2));
        }
  
        if (cmd === 'ota_err')
          throw new Error(data.code);
      }
    } catch (e) {
      this._hub.onOtaError(this.info.id, e);
      return;
    }
    this._hub.onOtaEnd(this.info.id);
  }

//#endregion

//#region FS

  async upload(file, path) {
    if (!this.isModuleEnabled(Modules.UPLOAD)) return;
    if (this.fsBusy()) {
      this._hub.onFsUploadError(this.info.id, HubErrors.FsBusy);
      return;
    }

    const data = await readFileAsArrayBuffer(file);
    const buffer = new Uint8Array(data);

    const res = await asyncConfirm('Upload ' + path + ' (' + buffer.length + ' bytes)?');
    if (!res) {
      this._hub.onFsUploadError(this.info.id, HubErrors.Cancelled);
      return;
    }

    const crc32v = crc32(buffer);

    this._hub.onFsUploadStart(this.info.id);
    try {
      if (this.isHttpAccessable() && this.info.http_t) {
        let formData = new FormData();
        formData.append('upload', file);
        await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}&crc32=${crc32v}&client_id=${this._hub.cfg.client_id}&size=${buffer.length}`, formData)
      } else {
        const upl_bytes = Array.from(buffer);
        const upl_size = upl_bytes.length;
        const max_enc_len = this.info.max_upl * 3 / 4 - 60;

        let [cmd, data] = await this.#postAndWait('upload', ['upload_next', 'upload_done', 'upload_err'], path, upl_size);

        if (cmd === 'upload_next')
          [cmd, data] = await this.#postAndWait('ota_chunk', ['upload_next', 'upload_done', 'upload_err'], crc, crc32v);

        while (cmd === 'upload_next') {
          const data2 = String.fromCharCode.apply(null, upl_bytes.splice(0, max_enc_len));
          this._hub.onFsUploadPerc(this.info.id, Math.round((upl_size - upl_bytes.length) / upl_size * 100));
          [cmd, data] = await this.#postAndWait('upload_chunk', ['upload_next', 'upload_done', 'upload_err'], (upl_bytes.length) ? 'next' : 'last', window.btoa(data2));
        }

        if (cmd === 'upload_err')
          throw new Error(data.code);
      }
    } catch (e) {
      this._hub.onFsUploadError(this.info.id, e);
      return;
    }
    this._hub.onFsUploadEnd(this.info.id);

    await this.post('files');
  }

  async fetch(idx, path) {
    if (!this.isModuleEnabled(Modules.FETCH)) return;
  
    const id = this.info.id;
  
    if (this.fsBusy()) {
      this._hub.onFsFetchError(id, idx, HubErrors.FsBusy);
      return;
    }

    const fet_name = path.split('/').pop();

    this._hub.onFsFetchStart(id, idx);
    try {
      if (this.isHttpAccessable() && this.info.http_t) {
        const res = await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}&client_id=${this._hub.cfg.client_id}`,
            perc => this._hub.onFsFetchPerc(id, idx, perc),
            this._hub.http.tout);
        this._hub.onFsFetchEnd(id, fet_name, idx, res);

      } else {
        let [cmd, data] = await this.#postAndWait('fetch', ['fetch_start', 'fetch_err'], path);
        let fet_len, fet_buf;
        if (cmd === 'fetch_start') {
          fet_len = data.len;
          fet_buf = '';
          [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
          this._hub.onFsFetchPerc(id, idx, 0);
        }

        while (cmd === 'fetch_chunk') {
          fet_buf += atob(data.data);

          if (data.last) { 
            if (fet_buf.length != fet_len)
              throw new Error(HubErrors.SizeMiss);
    
            const crc = crc32(fet_buf);
            if (crc != data.crc32)
              throw new Error(HubErrors.CrcMiss);

            const b64 = btoa(fet_buf);
            this._hub.onFsFetchEnd(id, fet_name, idx, b64);
            break;
          }

          // not last chunk
          const perc = Math.round(fet_buf.length / fet_len * 100);
          this._hub.onFsFetchPerc(id, idx, perc);
          [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
        }

        if (cmd === 'fetch_err') {
          throw new Error(data.code);
        }
      }
    } catch (e) {
      this._hub.onFsFetchError(id, idx, e);
    }
  }

  async _fetchNextFile() {
    if (!this.files.length) return;
    let file = this.files.shift();

    let id = this.info.id;

    if (this.fsBusy()) {
      this._hub.onFetchError(id, file.name, file.data, HubErrors.FsBusy);
      return;
    }

    this._hub.onFetchStart(id, file.name);
    try {
      if (this.isHttpAccessable() && this.info.http_t) {
        const res = await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${file.path}`,
            perc => this._hub.onFetchPerc(id, file.name, perc),
            this._hub.http.tout);
        this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${res}`);
      } else {
        let [cmd, data] = await this.#postAndWait('fetch', ['fetch_start', 'fetch_err'], file.path);
        let fet_len, fet_buf;
        if (cmd === 'fetch_start') {
          fet_len = data.len;
          fet_buf = '';
          [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
          this._hub.onFetchPerc(id, file.name, 0);
        }

        while (cmd === 'fetch_chunk') {
          fet_buf += atob(data.data);

          if (data.last) { 
            if (fet_buf.length != fet_len)
              throw new Error(HubErrors.SizeMiss);
    
            const crc = crc32(fet_buf);
            if (crc != data.crc32)
              throw new Error(HubErrors.CrcMiss);

            const b64 = btoa(fet_buf);
            this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${b64}`);
            break;
          }

          // not last chunk
          const perc = Math.round(fet_buf.length / fet_len * 100);
          this._hub.onFetchPerc(id, file.name, perc);
          [cmd, data] = await this.#postAndWait('fetch_next', ['fetch_chunk', 'fetch_err']);
        }

        if (cmd === 'fetch_err') {
          throw new Error(data.code);
        }
      }
    } catch (e) {
      this._hub.onFetchError(id, file.name, file.data, Number(e));
    }
  }

  async _fetchFiles() {
    while (this.files)
      await this._fetchNextFile();
  }

  // file

  resetFiles() {
    this.files = [];
    this.file_flag = false;
  }

  async addFile(name, path, data) {
    let has = this.files.some(f => f.name == name);
    if (!has) this.files.push({ name: name, path: path, data: data });
    if (this.file_flag && this.files.length == 1) await this._fetchFiles();
  }

  async checkFiles() {
    this.file_flag = true;
    await this._fetchFiles();
  }
//#endregion
};