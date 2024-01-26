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

  async _parse(type, data) {
    let id = this.info.id;
    this._stop_tout();
    if (this.conn_lost) {
      this.conn_lost = false;
      this._hub.onPingLost(id);
      if (this.focused) this._hub.onDeviceConnChange(id, true);
    }

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

      // ============= FETCH =============
      case 'fetch_start':
        if (this.fs_mode != 'fetch' && this.fs_mode != 'fetch_file') break;
        this.fet_len = data.len;
        this.fet_buf = '';
        await this.post('fetch_next');
        this._fsToutStart();
        if (this.fs_mode == 'fetch') {
          this._hub.onFsFetchPerc(id, this.fet_index, 0);
        } else {
          this._hub.onFetchPerc(id, this.files[0].name, 0);
        }
        break;

      case 'fetch_chunk':
        if ((this.fs_mode != 'fetch' && this.fs_mode != 'fetch_file') || this.fet_buf == null) break;
        this.fet_buf += atob(data.data);

        if (data.last == 1) {  // last chunk
          let crc = crc32(this.fet_buf);
          if (this.fet_buf.length == this.fet_len && crc == data.crc32) {  // size+crc match
            let b64 = btoa(this.fet_buf);
            if (this.fs_mode == 'fetch') {
              this._hub.onFsFetchEnd(id, this.fet_name, this.fet_index, b64);
            } else {
              let file = this.files[0];
              this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${b64}`);
            }
          } else {
            let code = (crc != data.crc32) ? HubErrors.CrcMiss : HubErrors.SizeMiss;
            if (this.fs_mode == 'fetch') {
              this._hub.onFsFetchError(id, this.fet_index, code);
            } else {
              this._hub.onFetchError(id, this.files[0].name, this.files[0].data, code);
            }
          }
          this.fet_buf = null;
          if (this.fs_mode == 'fetch_file') {
            this._fsEnd();  // clear fs_mode!!!!
            await this._nextFile();
          } else {
            this._fsEnd();
          }
        } else {  // not last chunk
          let perc = Math.round(this.fet_buf.length / this.fet_len * 100);
          if (this.fs_mode == 'fetch') {
            this._hub.onFsFetchPerc(id, this.fet_index, perc);
          } else {
            this._hub.onFetchPerc(id, this.files[0].name, perc);
          }
          await this.post('fetch_next');
          this._fsToutStart();
        }
        break;

      case 'fetch_err':
        if (this.fs_mode != 'fetch' && this.fs_mode != 'fetch_file') break;
        this.fet_buf = null;
        if (this.fs_mode == 'fetch') {
          this._hub.onFsFetchError(id, this.fet_index, data.code);
          this._fsEnd();
        } else {
          this._hub.onFetchError(id, this.files[0].name, this.files[0].data, data.code);
          this._fsEnd();
          await this._nextFile();
        }
        break;

      // ============= UPLOAD =============
      case 'upload_next':
        if (this.fs_mode != 'upload') break;
        await this._uploadNextChunk();
        this._fsToutStart();
        break;

      case 'upload_done':
        if (this.fs_mode != 'upload') break;
        this._hub.onFsUploadEnd(id);
        this._fsEnd();
        await this.post('files');
        break;

      case 'upload_err':
        if (this.fs_mode != 'upload') break;
        this._hub.onFsUploadError(id, data.code);
        this._fsEnd();
        break;

      // ============= OTA =============
      case 'ota_next':
        if (this.fs_mode != 'ota') break;
        await this._otaNextChunk();
        this._fsToutStart();
        break;

      case 'ota_done':
        if (this.fs_mode != 'ota') break;
        this._hub.onOtaEnd(id);
        this._fsEnd();
        break;

      case 'ota_err':
        if (this.fs_mode != 'ota') break;
        this._hub.onOtaError(id, data.code);
        this._fsEnd();
        break;
    }
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
    if (this.ping) clearInterval(this.ping);
    this.ping = null;
  }
  _reset_ping() {
    this._stop_ping();
    this.ping = setInterval(async () => {
      if (this.conn_lost/* && !this.fsBusy()*/) this._hub.onPingLost(this.info.id);//TODO
      else await this.post('ping');
    }, this._hub.ping_prd);
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
    this.fs_mode = 'ota';
    if (this.isHttpAccessable() && this.info.http_t) {
      let formData = new FormData();
      formData.append(type, file);
      try {
        await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}&client_id=${this._hub.cfg.client_id}`, formData)
      } catch (e) {
        this._hub.onOtaError(this.info.id, e);
        this._fsEnd();
        throw e;
      }
      this._hub.onOtaEnd(this.info.id);
      this._fsEnd();

    } else {
      const data = await readFileAsArrayBuffer(file);
      let buffer = new Uint8Array(data);
      this.ota_bytes = Array.from(buffer);
      this.ota_size = this.ota_bytes.length;
      await this.post('ota', type);
      this._fsToutStart();
    }
  }

  async _otaNextChunk() {
    let i = 0;
    let data = '';
    while (true) {
      if (!this.ota_bytes.length) break;
      data += String.fromCharCode(this.ota_bytes.shift());
      if (++i >= this.info.max_upl * 3 / 4 - 60) break;  // 60 ~ uri
    }
    this._hub.onOtaPerc(this.info.id, Math.round((this.ota_size - this.ota_bytes.length) / this.ota_size * 100));
    await this.post('ota_chunk', (this.ota_bytes.length) ? 'next' : 'last', window.btoa(data));
  }

//#endregion

//#region FS

  async upload(file, path) {
    if (!this.isModuleEnabled(Modules.UPLOAD)) return;
    if (this.fsBusy()) {
      this._hub.onFsUploadError(this.info.id, HubErrors.FsBusy);
      return;
    }

    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path += '/';
    path += file.name;

    const data = await readFileAsArrayBuffer(file);
    let buffer = new Uint8Array(data);

    const res = await asyncConfirm('Upload ' + path + ' (' + buffer.length + ' bytes)?');
    if (!res) {
      this._hub.onFsUploadError(this.info.id, HubErrors.Cancelled);
      return;
    }
    this._hub.onFsUploadStart(this.info.id);
    this.fs_mode = 'upload';
    this.crc32 = crc32(buffer);

    if (this.isHttpAccessable() && this.info.http_t) {
      let formData = new FormData();
      formData.append('upload', file);
      try {
        await http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}&crc32=${this.crc32}&client_id=${this._hub.cfg.client_id}&size=${buffer.length}`, formData)
      } catch (e) {
        this._hub.onFsUploadError(this.info.id, e);
        this._fsEnd();
        throw e;
      }
      this._hub.onFsUploadEnd(this.info.id);
      this._fsEnd();
      await this.post('files');
    } else {
      this.upl_bytes = Array.from(buffer);
      this.upl_size = this.upl_bytes.length;
      await this.post('upload', path, this.upl_size);
      this._fsToutStart();
    }
  }

  async _uploadNextChunk() {
    if (this.crc32 !== null) {
      await this.post('upload_chunk', 'crc', this.crc32);
      this.crc32 = null;
      return;
    }
    let i = 0;
    let data = '';
    while (true) {
      if (!this.upl_bytes.length) break;
      data += String.fromCharCode(this.upl_bytes.shift());
      if (++i >= this.info.max_upl * 3 / 4 - 60) break; // 60 ~ uri
    }
    this._hub.onFsUploadPerc(this.info.id, Math.round((this.upl_size - this.upl_bytes.length) / this.upl_size * 100));
    await this.post('upload_chunk', (this.upl_bytes.length) ? 'next' : 'last', window.btoa(data));
  }

  async fetch(idx, path) {
    if (!this.isModuleEnabled(Modules.FETCH)) return;
    let id = this.info.id;
    if (this.fsBusy()) {
      this._hub.onFsFetchError(id, idx, HubErrors.FsBusy);
      return;
    }

    this.fs_mode = 'fetch';
    this.fet_name = path.split('/').pop();
    this.fet_index = idx;

    if (this.isHttpAccessable() && this.info.http_t) {
      let res;
      try {
        res = await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}&client_id=${this._hub.cfg.client_id}`,
          perc => this._hub.onFsFetchPerc(id, idx, perc),
          this._hub.http.tout);
      } catch (e) {
        this._hub.onFsFetchError(id, idx, e);
        this._fsEnd();
        throw e;
      }

      this._hub.onFsFetchEnd(id, this.fet_name, idx, res);
      this._fsEnd();
    } else {
      await this.post('fetch', path);
      this._fsToutStart();
    }
    this._hub.onFsFetchStart(id, idx);
  }

  // file

  resetFiles() {
    this.files = [];
    this.file_flag = false;
  }

  async addFile(name, path, data) {
    let has = this.files.some(f => f.name == name);
    if (!has) this.files.push({ name: name, path: path, data: data });
    if (this.file_flag && this.files.length == 1) await this._fetchNextFile();
  }

  async checkFiles() {
    this.file_flag = true;
    await this._fetchNextFile();
  }

  // private

  async _nextFile() {
    this.files.shift();
    await this._fetchNextFile();
  }

  _fsEnd() {
    this.fs_mode = null;
    this._fsToutEnd();
  }

  async _fetchNextFile() {
    if (!this.files.length) return;

    let id = this.info.id;
    let file = this.files[0];

    if (this.fsBusy()) {
      this._hub.onFetchError(id, file.name, file.data, HubErrors.FsBusy);
      return;
    }

    this.fs_mode = 'fetch_file';
    this._hub.onFetchStart(id, file.name);

    if (this.isHttpAccessable() && this.info.http_t) {
      let res;
      try {
        res = await http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${file.path}`,
          perc => this._hub.onFetchPerc(id, file.name, perc),
          this._hub.http.tout);
      } catch (e) {
        this._hub.onFetchError(id, file.name, file.data, Number(e));
        this._fsEnd();
        await this._nextFile();
        throw e;
      }
      this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${res}`);
      this._fsEnd();
      await this._nextFile();
    } else {
      post('fetch', file.path);
    }
  }

  _fsToutStart() {
    this._fsToutEnd();
    this.fs_tout = setTimeout(async () => {
      switch (this.fs_mode) {

        case 'upload':
          this._hub.onFsUploadError(this.info.id, HubErrors.Timeout);
          break;

        case 'fetch':
          this._hub.onFsFetchError(this.info.id, this.fet_index, HubErrors.Timeout);
          this.fet_buf = null;
          break;

        case 'fetch_file':
          if (!this.files[0]) return;
          this._hub.onFetchError(this.info.id, this.files[0].name, this.files[0].data, HubErrors.Timeout);
          this.fet_buf = null;
          await this._nextFile();
          break;

        case 'ota':
          this._hub.onOtaError(this.info.id, HubErrors.Timeout);
          break;
      }
      await this.fsStop();
    }, this._hub.tout_prd);
  }
  _fsToutEnd() {
    if (this.fs_tout) clearTimeout(this.fs_tout);
  }

//#endregion
};