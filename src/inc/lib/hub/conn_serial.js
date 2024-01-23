class SERIALconn extends Discover {
  tout = 500;

  onConnChange(state) { }
  onPortChange(selected) { }

  constructor(hub) {
    super(hub);
    this.buf = new PacketBuffer(hub, Conn.SERIAL, true);
    this.ser = new SerialJS();
    this.ser.onportchange = (selected) => this.onPortChange(selected);
    this.ser.onopen = () => {
      this.log('Connected');
      this.onConnChange(true);
    }
    this.ser.onclose = () => {
      this.log('Disconnected');
      this.onConnChange(false);
    }
    this.ser.onerror = (e) => this.err(e);
    this.ser.onmessage = (data) => this.buf.process(data);
  }

  // discover
  async discover() {
    if (this.discovering || !this.ser.state()) return;
    for (let pref of this._hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.ser.state()) return;
    await this.send(this._hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }

  // core
  getName() {
    return this.ser.getName();
  }
  async hasPort() {
    return await this.ser.hasPort();
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
