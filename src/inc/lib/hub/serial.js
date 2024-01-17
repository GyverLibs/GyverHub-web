/*NON-ESP*/
class SerialJS {
  async onportchange(selected) { }
  async onopen() { }
  async onmessage(data) { }
  async onclose() { }
  async onerror(e) { }

  state() {
    return (this._port != null);
  }
  getName() {
    let id = this._ncport ? this._ncport.getInfo().usbProductId : null;
    switch (id) {
      case 0x7584: return 'CH340S';
      case 0x55d3: return 'CH343';
      case 0x7522: case 0x7523: return 'CH340';
      case 0x5512: case 0x5523: case 0x5584: return 'CH341';
      case 0x9500: case 0x0102: case 0x0501: case 0x80a9: case 0xea60: case 0xea61: case 0xea63: return 'CP210x';
      case 0x0402: case 0x0403: case 0x0404: case 0x0405: case 0x6001: case 0x0602: case 0x6010: return 'FT232';
      case null: return 'none';
      default: return 'unknown';
    }
  }
  async hasPort() {
    await this.update();
    return this._ncport != null;
  }
  async update() {
    const ports = await navigator.serial.getPorts();
    this._ncport = ports.length ? ports[0] : null;
  }
  async select() {
    await this.close();
    const ports = await navigator.serial.getPorts();
    for (let port of ports) await port.forget();
    try {
      await navigator.serial.requestPort();
      await this.update();
      await this.onportchange(true);
    } catch (e) {
      this.onerror(e);
      await this.update();
      await this.onportchange(false);
    }
  }
  async open(baud) {
    try {
      if (this._port) throw "Already open";
      const ports = await navigator.serial.getPorts();
      if (!ports.length) throw "No port";
      this._port = ports[0];
      try {
        await this._port.open({ baudRate: baud });
        this.onopen();
        await this._readLoop();
      } finally {
        await this._port.close();
        this._port = null;
        this.onclose();
      }
    } catch (e) {
      this.onerror(e);
    }
  }
  async close() {
    this._closing = true;
    if (this._reader) await this._reader.cancel();
  }
  async send(text) {
    if (!this._port) return this.onerror("Not open");
    try {
      const encoder = new TextEncoder();
      const writer = this._port.writable.getWriter();
      await writer.write(encoder.encode(text));
      writer.releaseLock();
    } catch (e) {
      this.onerror(e);
    }
  }
  async toggle(baud) {
    if (this.state()) await this.close();
    else await this.open(baud);
  }

  // private
  _port = null;
  _reader = null;
  _closing = false;
  _ncport = null;

  async _readLoop() {
    this._closing = false;
    while (this._port.readable && !this._closing) {
      this._reader = this._port.readable.getReader();
      try {
        while (true) {
          const read = await this._reader.read();
          if (read.done) break;
          const data = new TextDecoder().decode(read.value);
          this.onmessage(data);
        }
      } finally {
        this._reader.releaseLock();
        this._reader = null;
      }
    }
  }
}
/*/NON-ESP*/