class PacketBuffer {
  _buf = '';
  _start = false;
  
  constructor(hub, conn, byletter = false) {
    this._hub = hub;
    this._conn = conn;
    this._byletter = byletter;
  }

  process(data) {
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
    if (this._buf.startsWith('\n{')) this._start = true;
    if (this._buf.endsWith('}\n')) {
      if (this._start) this._hub._parsePacket(this._conn, this._buf);
      this._start = false;
      this._buf = '';
    }
  }
};