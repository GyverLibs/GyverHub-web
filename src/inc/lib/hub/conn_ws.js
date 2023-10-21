class WSconn {
  constructor(device) {
    this.device = device;
  }
  get info() {
    return this.device.info;
  }

  start() {
    this._reconnect = true;
    if (this._ws) return;
    this._ws = new WebSocket(`ws://${this.info.ip}:${this.info.ws_port}/`, ['hub']);

    this._ws.onopen = () => {
      this.log(`${this.info.id} opened`);
      if (!this._reconnect) this._ws.close();
      this.device._hub.onWsConnChange(this.info.id, true);
    };

    this._ws.onclose = () => {
      this.log(`${this.info.id} closed`);
      this._ws = null;
      if (this._reconnect) setTimeout(() => {
        if (this._reconnect) this.start()
      }, 500);
      this.device._hub.onWsConnChange(this.info.id, false);
    };

    this._ws.onerror = () => {
      this.err(`${this.info.id}`);
    };

    this._ws.onmessage = (e) => {
      this.device.ws_buf.process(e.data);
    };
  }
  stop() {
    this._reconnect = false;
    if (!this._ws || this._ws.readyState >= 2) return;
    this.log(`${this.info.id} close...`);
    this._ws.close();
  }
  state() {
    return (this._ws && this._ws.readyState == 1);
  }
  send(text) {
    if (this.state()) this._ws.send(text.toString()); // no '\0'
  }

  _ws = null;
  _reconnect = false;

  // log
  log(t) {
    this.device._hub.log('[WS] ' + t);
  }
  err(e) {
    this.device._hub.err('[WS] ' + e);
  }
}