class PacketBuffer {
  _buf = '';
  _tout = null;

  constructor(hub, conn, byletter = false) {
    this._hub = hub;
    this._conn = conn;
    this._byletter = byletter;
  }

  process(data) {
    if (this._tout) clearTimeout(this._tout);
    this._tout = setTimeout(() => this._buf = '', 500);

    if (this._byletter) {
      for (let t of data) {
        this._buf += t;
        this.check();
      }
    } else {
      this._buf += data;
      this.check();
    }
  }

  check() {
    if (this._buf.startsWith('\n{') && this._buf.endsWith('}\n')) {
      this._hub._parsePacket(this._conn, this._buf);
      this._buf = '';
      if (this._tout) clearTimeout(this._tout);
      this._tout = null;
    }
  }
};