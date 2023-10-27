class Device {
  tout_prd = 2800;
  ping_prd = 3000;

  constructor(hub) {
    this._hub = hub;
    this.ws = new WSconn(this);
    this.mq_buf = new PacketBuffer(hub, Conn.MQTT);
    this.ws_buf = new PacketBuffer(hub, Conn.HTTP);
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
  };

  connected() {
    return !this.conn_lost;
  }
  module(mod) {
    return !(this.info.modules & mod);
  }
  post(cmd, name = '', value = '') {
    cmd = cmd.toString();
    name = name.toString();
    value = value.toString();

    if (cmd == 'set') {
      if (!this.module(Modules.SET)) return;
      if (name) this.prev_set[name] = { value: value, stamp: Date.now() };
      this._updateControls(this.controls, name, 'value', value);
    }

    let uri0 = this.info.prefix + '/' + this.info.id + '/' + this._hub.cfg.client_id + '/' + cmd;
    let uri = uri0;
    if (name) {
      uri += '/' + name;
      if (value) uri += '=' + value;
    }

    switch (this.conn) {
      case Conn.HTTP:
        if (this.ws.state()) this.ws.send(uri);
        else this._hub.http.send(this.info.ip, this.info.http_port, `hub/${uri}`);
        break;

      /*NON-ESP*/
      case Conn.SERIAL:
        this._hub.serial.send(uri);
        break;

      case Conn.BT:
        this._hub.bt.send(uri);
        break;

      case Conn.MQTT:
        this._hub.mqtt.send(uri0 + (name.length ? ('/' + name) : ''), value);
        break;
      /*/NON-ESP*/
    }

    if (this.focused) {
      this._reset_ping();
      this._reset_tout();
    }
  }
  focus() {
    this.focused = true;
    this.post('ui');
    if (this.conn == Conn.HTTP && this.info.ws_port) this.ws.start();
  }
  unfocus() {
    this.focused = false;
    this._stop_ping();
    this._stop_tout();
    this.post('unfocus');
    if (this.conn == Conn.HTTP) this.ws.stop();
  }

  // fs
  fsStop() {
    if (this.fs_mode) this.post('fs_abort', this.fs_mode);
    this._fsEnd();  // clear tout + clear mode
  }
  fsBusy() {
    return !!this.fs_mode;
  }
  upload(file, path) {
    if (!this.module(Modules.UPLOAD)) return;
    if (this.fsBusy()) {
      this._hub.onFsUploadError(this.info.id, 'FS busy');
      return;
    }

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      if (!e.target.result) return;
      let buffer = new Uint8Array(e.target.result);
      if (!path.startsWith('/')) path = '/' + path;
      if (!path.endsWith('/')) path += '/';
      path += file.name;

      if (!confirm('Upload ' + path + ' (' + buffer.length + ' bytes)?')) {
        this._hub.onFsUploadError(this.info.id, 'Upload cancelled');
        return;
      }
      this._hub.onFsUploadStart(this.info.id);
      this.fs_mode = 'upload';

      if (this.conn == Conn.HTTP) {
        let formData = new FormData();
        formData.append('upload', file);
        http_post(`http://${this.info.ip}:${this.info.http_port}/hub/upload?path=${path}`, formData)
          .then((v) => {
            this._hub.onFsUploadEnd(this.info.id, v);
            this._fsEnd();
            this.post('files');
          })
          .catch((e) => this._hub.onFsUploadError(this.info.id, e))
      } else {
        this.upl_bytes = Array.from(buffer);
        this.upl_size = this.upl_bytes.length;
        this.post('upload', path, this.upl_size);
        this._fsToutStart();
      }
    }
  }
  uploadOta(file, type) {
    if (!this.module(Modules.OTA)) return;
    if (this.fsBusy()) {
      this._hub.onOtaError(this.info.id, 'FS busy');
      return;
    }
    if (!file.name.endsWith(this.info.ota_t)) {
      alert('Wrong file! Use .' + this.info.ota_t);
      return;
    }
    if (!confirm('Upload OTA ' + type + '?')) return;

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      if (!e.target.result) return;
      this._hub.onOtaStart(this.info.id);
      this.fs_mode = 'ota';

      if (this.conn == Conn.HTTP) {
        let formData = new FormData();
        formData.append(type, file);
        http_post(`http://${this.info.ip}:${this.info.http_port}/hub/ota?type=${type}`, formData)
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
      this._hub.onFsFetchError(id, idx, 'FS busy');
      return;
    }

    this.fs_mode = 'fetch';
    this.fet_name = path.split('/').pop();
    this.fet_index = idx;

    if (this.conn == Conn.HTTP) {
      http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${path}`,
        perc => this._hub.onFsFetchPerc(id, idx, perc))
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
  _updateControls(controls, name, key, value) {
    if (!this.controls) return;
    for (let ctrl of controls) {
      if (ctrl.type == 'row' || ctrl.type == 'col') {
        this._updateControls(ctrl.data, name, key, value);
      } else {
        if (ctrl.id == name) ctrl[key] = value;
      }
    }
  }
  _fetchNextFile() {
    if (!this.files.length) return;

    let id = this.info.id;
    let file = this.files[0];

    if (this.fsBusy()) {
      this._hub.onFetchError(id, file.name, file.data);
      return;
    }

    this.fs_mode = 'fetch_file';
    this._hub.onFetchStart(id, file.name);

    if (this.conn == Conn.HTTP) {
      http_fetch_blob(`http://${this.info.ip}:${this.info.http_port}/hub/fetch?path=${file.path}`,
        perc => this._hub.onFetchPerc(id, file.name, perc))
        .then(res => this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${res}`))
        .catch(e => this._hub.onFetchError(id, file.name, file.data))
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
    for (let name in updates) {
      let update = updates[name];
      for (let key in update) {
        let value = update[key];
        if (key == 'value') {
          if (this.prev_set[name] && this.prev_set[name].value == value && Date.now() - this.prev_set[name].stamp < this.tout_prd) {
            delete update[key];
            continue;
          }
        }
        this._updateControls(this.controls, name, key, value);
      }
      this._hub.onUpdate(this.info.id, name, update);
    }
  }
  _parse(type, data) {
    let id = this.info.id;
    this._stop_tout();
    if (this.conn_lost) {
      this.conn_lost = false;
      if (this.focused) this._hub.onDeviceConnChange(id, true);
    }

    switch (type) {
      case 'OK':
        break;

      case 'ui':
        this.controls = data.controls;
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

        if (data.last) {
          if (this.fet_buf.length == this.fet_len) {
            let b64 = btoa(this.fet_buf);
            if (this.fs_mode == 'fetch') {
              this._hub.onFsFetchEnd(id, this.fet_name, this.fet_index, b64);
              this._fsEnd();
            } else {
              let file = this.files[0];
              this._hub.onFetchEnd(id, file.name, file.data, `data:${getMime(file.path)};base64,${b64}`);
              this._fsEnd();
              this._nextFile();
            }
          }
          this.fet_buf = null;
        } else {
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
          this._hub.onFsFetchError(id, this.fet_index, 'Fetch error: ' + data.text);
          this._fsEnd();
        } else {
          this._hub.onFetchError(id, this.files[0].name, this.files[0].data);
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
        this._hub.onFsUploadEnd(id, 'Upload done');
        this._fsEnd();
        this.post('files');
        break;

      case 'upload_err':
        if (this.fs_mode != 'upload') break;
        this._hub.onFsUploadError(id, 'Upload error: ' + data.text);
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
        this._hub.onOtaError(id, 'OTA error: ' + data.text);
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
    }, this.tout_prd);
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
    }, this.ping_prd);
  }
  _otaNextChunk() {
    let i = 0;
    let data = '';
    while (true) {
      if (!this.upl_bytes.length) break;
      i++;
      data += String.fromCharCode(this.upl_bytes.shift());
      if (i >= this.info.max_upl * 3 / 4) break;
    }
    this._hub.onOtaPerc(this.info.id, Math.round((this.upl_size - this.upl_bytes.length) / this.upl_size * 100));
    this.post('ota_chunk', (this.upl_bytes.length) ? 'next' : 'last', window.btoa(data));
  }
  _uploadNextChunk() {
    let i = 0;
    let data = '';
    while (true) {
      if (!this.upl_bytes.length) break;
      i++;
      data += String.fromCharCode(this.upl_bytes.shift());
      if (i >= this.info.max_upl * 3 / 4) break;
    }
    this._hub.onFsUploadPerc(this.info.id, Math.round((this.upl_size - this.upl_bytes.length) / this.upl_size * 100));
    this.post('upload_chunk', (this.upl_bytes.length) ? 'next' : 'last', window.btoa(data));
  }
  _fsToutStart() {
    this._fsToutEnd();
    this.fs_tout = setTimeout(() => {
      switch (this.fs_mode) {

        case 'upload':
          this._hub.onFsUploadError(this.info.id, 'Upload timeout');
          break;

        case 'fetch':
          this._hub.onFsFetchError(this.info.id, this.fet_index, 'Fetch timeout');
          this.fet_buf = null;
          break;

        case 'fetch_file':
          this._hub.onFetchError(this.info.id, this.files[0].name, this.files[0].data);
          this.fet_buf = null;
          this._nextFile();
          break;

        case 'ota':
          this._hub.onOtaError(this.info.id, 'OTA timeout');
          break;
      }
      this.fsStop();
    }, this.tout_prd);
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
  conn_arr = [0, 0, 0, 0];
  controls = null;
  granted = false;
  focused = false;
  tout = null;
  ping = null;
  conn_lost = false;
  prev_set = {};
  fs_mode = null;   // upload, fetch, ota, fetch_file
  fs_tout = null;
  upl_bytes = null;
  upl_size = null;
  fet_name = '';
  fet_index = 0;
  fet_buf = null;
  fet_len = 0;
  files = [];
  file_flag = false;
};