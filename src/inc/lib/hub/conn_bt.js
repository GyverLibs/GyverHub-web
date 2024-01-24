class BTconn extends Discover {
  tout = 1000;

  onConnChange(state) { }
  getName() {
    return this.bt.getName();
  }

  constructor(hub) {
    super(hub);
    this.buf = new PacketBuffer(hub, Conn.BT, true);
    this.bt = new BluetoothJS();
    this.bt.addEventListener('message', ev => this.buf.process(ev.message));
    this.bt.addEventListener('statechange', () => this.onConnChange(this.bt.getState()));
  }
  async discover() {
    if (this.discovering || !this.bt.isConnected()) return;
    for (let pref of this._hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.bt.isConnected()) return;
    await this.send(this._hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }
  async open() {
    await this.bt.open();
  }
  async close() {
    await this.bt.close();
  }
  async send(text) {
    await this.bt.send(text + '\0');
  }
}
