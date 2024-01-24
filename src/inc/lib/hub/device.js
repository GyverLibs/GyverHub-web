class Device {

  constructor(hub) {
    this._hub = hub;
  }

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

  connected() {
    return !this.conn_lost;
  }
  module(mod) {
    return !(this.info.modules & mod);
  }
  async post(cmd, name = '', value = '') {
    cmd = cmd.toString();
    name = name.toString();
    value = value.toString();

    if (cmd == 'set') {
      if (!this.module(Modules.SET)) return;
      if (name) {
        if (this.prev_set[name]) clearTimeout(this.prev_set[name]);
        this.prev_set[name] = setTimeout(() => delete this.prev_set[name], this._hub.skip_prd);
      }
    }

    let uri0 = this.info.prefix + '/' + this.info.id + '/' + this._hub.cfg.client_id + '/' + cmd;
    let uri = uri0;
    if (name) {
      uri += '/' + name;
      if (value) uri += '=' + value;
    }

    await this._hub.send(this, uri);

    if (this.focused) {
      this._reset_ping();
      this._reset_tout();
    }
  }
  focus() {
    this.focused = true;
    this.post('ui');
    if (this.conn == Conn.HTTP && this.info.ws_port) {
      this.ws.connect();
      setTimeout(() => {
        if (!this.ws.state()) this.ws.disconnect();
      }, this._hub.tout_prd);
    }
  }
  unfocus() {
    this.focused = false;
    this._stop_ping();
    this._stop_tout();
    this.post('unfocus');
    if (this.conn == Conn.HTTP) this.ws.disconnect();
  }

  // fs
  fsStop() {
    if (this.fs_mode) this.post('fs_abort', this.fs_mode);
    this._fsEnd();  // clear tout + clear mode
  }
  fsBusy() {
    return !!this.fs_mode;
  }
  async upload(file, path) {
    if (!this.module(Modules.UPLOAD)) return;
    if (this.fsBusy()) {
      this._hub.onFsUploadError(this.info.id, HubErrors.FsBusy);
      return;
    }

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (e) => {
      if (!e.target.result) return;
      let buffer = new Uint8Array(e.target.result);
      if (!path.startsWith('/')) path = '/' + path;
      if (!path.endsWith('/')) path += '/';
      path += file.name;

      const res = await asyncConfirm('Upload ' + path + ' (' + buffer.length + ' bytes)?');
      if (!res) {
        this._hub.onFsUploadError(this.info.id, HubErrors.Cancelled);
        return;
      }
      this._hub.onFsUploadStart(this.info.id);
      this.fs_mode = 'upload';
      this.crc32 = crc32(buffer);

      if (this.conn == Conn.HTTP && this.info.http_t) {
        let formData = new FormData();
        formData.append('upload', file);
        http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}&crc32=${this.crc32}&client_id=${this._hub.cfg.client_id}&size=${buffer.length}`, formData)
          .then(() => {
            this._hub.onFsUploadEnd(this.info.id);
            this._fsEnd();
            this.post('files');
          })
          .catch((e) => this._hub.onFsUploadError(this.info.id, e))
          .finally(() => this._fsEnd());
      } else {
        this.upl_bytes = Array.from(buffer);
        this.upl_size = this.upl_bytes.length;
        this.post('upload', path, this.upl_size);
        this._fsToutStart();
      }
    }
  }
  async uploadOta(file, type) {
    if (!this.module(Modules.OTA)) return;
    if (this.fsBusy()) {
      this._hub.onOtaError(this.info.id, HubErrors.FsBusy);
      return;
    }
    if (!file.name.endsWith(this.info.ota_t)) {
      alert('Wrong file! Use .' + this.info.ota_t);
      return;
    }
    const res = asyncConfirm('Upload OTA ' + type + '?');
    if (!res) return;

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      if (!e.target.result) return;
      this._hub.onOtaStart(this.info.id);
      this.fs_mode = 'ota';

      if (this.conn == Conn.HTTP && this.info.http_t) {
        let formData = new FormData();
        formData.append(type, file);
        http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}&client_id=${this._hub.cfg.client_id}`, formData)
          .then(() => this._hub.onOtaEnd(this.info.id))
          .catch((e) => this._hub.onOtaError(this.info.id, e))
          .finally(() => this._fsEnd());
      } else {
        let buffer = new Uint8Array(e.target.result);
        this.upl_bytes = Array.from(buffer);
        this.upl_size = this.upl_bytes.length;
        this.post('ota', type);
        this._fsToutStart();
      }
    }
  }
  fetch(idx, path) {
    if (!this.module(Modules.FETCH)) return;
    let id = this.info.id;
    if (this.fsBusy()) {
      this._hub.onFsFetchError(id, idx, HubErrors.FsBusy);
      return;
    }

    this.fs_mode = 'fetch';
    this.fet_name = path.split('/').pop();
    this.fet_index = idx;

    if (this.conn == Conn.HTTP && this.info.http_t) {
      http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}&client_id=${this._hub.cfg.client_id}`,
        perc => this._hub.onFsFetchPerc(id, idx, perc),
        this._hub.http.tout)
        .then(res => this._hub.onFsFetchEnd(id, this.fet_name, idx, res))
        .catch(e => this._hub.onFsFetchError(id, idx, e))
        .finally(() => this._fsEnd());
    } else {
      this.post('fetch', path);
      this._fsToutStart();
    }
    this._hub.onFsFetchStart(id, idx);
  }

  // file
  resetFiles() {
    this.files = [];
    this.file_flag = false;
  }
  addFile(name, path, data) {
    let has = this.files.some(f => f.name == name);
    if (!has) this.files.push({ name: name, path: path, data: data });
    if (this.file_flag && this.files.length == 1) this._fetchNextFile();
  }
  checkFiles() {
    this.file_flag = true;
    this._fetchNextFile();
  }

  // private
  _fetchNextFile() {
    if (!this.files.length) return;

    let id = this.info.id;
    let file = this.files[0];

    if (this.fsBusy()) {
      this._hub.onFetchError(id, file.name, file.data, HubErrors.FsBusy);
      return;
    }

    this.fs_mode = 'fetch_file';
    this._hub.onFetchStart(id, file.name);

    if (this.conn == Conn.HTTP && this.info.http_t) {
      http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${file.path}`,
        perc => this._hub.onFetchPerc(id, file.name, perc),
        this._hub.http.tout)
        .then(res => this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${res}`))
        .catch(e => this._hub.onFetchError(id, file.name, file.data, Number(e)))
        .finally(() => {
          this._fsEnd();
          this._nextFile();
        });
    } else {
      post('fetch', file.path);
    }
  }
  _fsEnd() {
    this.fs_mode = null;
    this._fsToutEnd();
  }
  _nextFile() {
    this.files.shift();
    this._fetchNextFile();
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
  _parse(type, data) {
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

      // ============= FETCH =============
      case 'fetch_start':
        if (this.fs_mode != 'fetch' && this.fs_mode != 'fetch_file') break;
        this.fet_len = data.len;
        this.fet_buf = '';
        this.post('fetch_next');
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
            this._nextFile();
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
          this.post('fetch_next');
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
          this._nextFile();
        }
        break;

      // ============= UPLOAD =============
      case 'upload_next':
        if (this.fs_mode != 'upload') break;
        this._uploadNextChunk();
        this._fsToutStart();
        break;

      case 'upload_done':
        if (this.fs_mode != 'upload') break;
        this._hub.onFsUploadEnd(id);
        this._fsEnd();
        this.post('files');
        break;

      case 'upload_err':
        if (this.fs_mode != 'upload') break;
        this._hub.onFsUploadError(id, data.code);
        this._fsEnd();
        break;

      // ============= OTA =============
      case 'ota_next':
        if (this.fs_mode != 'ota') break;
        this._otaNextChunk();
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
    this.ping = setInterval(() => {
      if (this.conn_lost/* && !this.fsBusy()*/) this._hub.onPingLost(this.info.id);//TODO
      else this.post('ping');
    }, this._hub.ping_prd);
  }
  _otaNextChunk() {
    let i = 0;
    let data = '';
    while (true) {
      if (!this.upl_bytes.length) break;
      data += String.fromCharCode(this.upl_bytes.shift());
      if (++i >= this.info.max_upl * 3 / 4 - 60) break;  // 60 ~ uri
    }
    this._hub.onOtaPerc(this.info.id, Math.round((this.upl_size - this.upl_bytes.length) / this.upl_size * 100));
    this.post('ota_chunk', (this.upl_bytes.length) ? 'next' : 'last', window.btoa(data));
  }
  _uploadNextChunk() {
    if (this.crc32 !== null) {
      this.post('upload_chunk', 'crc', this.crc32);
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
    this.post('upload_chunk', (this.upl_bytes.length) ? 'next' : 'last', window.btoa(data));
  }
  _fsToutStart() {
    this._fsToutEnd();
    this.fs_tout = setTimeout(() => {
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
          this._nextFile();
          break;

        case 'ota':
          this._hub.onOtaError(this.info.id, HubErrors.Timeout);
          break;
      }
      this.fsStop();
    }, this._hub.tout_prd);
  }
  _fsToutEnd() {
    if (this.fs_tout) clearTimeout(this.fs_tout);
  }

  _log(t) {
    this._hub.log(this.info.name + ' ' + t);
  }
  _err(e) {
    this._hub.log(this.info.name + ' ' + e);
  }

  conn = Conn.NONE;
  active_connections = [];
  granted = false;
  focused = false;
  tout = null;
  ping = null;
  conn_lost = false;
  prev_set = {};
  fs_mode = null;   // upload, fetch, ota, fetch_file
  fs_tout = null;
  crc32 = null;
  upl_bytes = null;
  upl_size = null;
  fet_name = '';
  fet_index = 0;
  fet_buf = null;
  fet_len = 0;
  files = [];
  file_flag = false;
  cfg_flag = false;
};