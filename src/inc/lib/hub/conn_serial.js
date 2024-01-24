class SERIALconn extends Discover {
  tout = 500;

  onConnChange(state) { }
  onPortChange(selected) { }

  constructor(hub) {
    super(hub);
    this.buf = new PacketBuffer(hub, Conn.SERIAL, true);
    this.ser = new SerialJS();
    this.ser.addEventListener('message', ev => this.buf.process(ev.message));
    this.ser.addEventListener('statechange', () => this.onConnChange(this.ser.getState()));
  }

  // discover
  async discover() {
    if (this.discovering || !this.ser.isConnected()) return;
    for (let pref of this._hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.ser.isConnected()) return;
    await this.send(this._hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }

  // core
  getName() {
    return this.ser.getName();
  }
  async auto_open(baud) {
    await this.ser.auto_open(baud);
  }
  async select() {
    await this.ser.select();
  }
  async open() {
    await this.ser.open(this._hub.cfg.baudrate);
  }
  async close() {
    await this.ser.close();
  }
  async send(text) {
    await this.ser.send(text + '\0');
  }

  // log
  log(t) {
    this._hub.log('[SERIAL] ' + t);
  }
  err(e) {
    this._hub.err('[SERIAL] ' + e);
  }
}
