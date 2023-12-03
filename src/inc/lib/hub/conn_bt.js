/*NON-ESP*/
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
    this.bt.onopen = () => {
      this.log('Connected');
      this.onConnChange('open');
    }
    this.bt.onclose = () => {
      this.log('Disconnected');
      this.onConnChange('close');
    }
    this.bt.onerror = (e) => this.err(e);
    this.bt.onmessage = (data) => this.buf.process(data);
  }
  async discover() {
    if (this.discovering || !this.bt.state()) return;
    for (let pref of this._hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.bt.state()) return;
    await this.send(this._hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }
  async open() {
    if (!this.bt.state()) {
      this.log('Connecting');
      this.onConnChange('connecting');
      await this.bt.open();
    }
  }
  async close() {
    await this.bt.close();
  }
  async send(text) {
    await this.bt.send(text + '\0');
  }

  // log
  log(t) {
    this._hub.log('[BT] ' + t);
  }
  err(e) {
    this._hub.err('[BT] ' + e);
  }
}
/*/NON-ESP*/