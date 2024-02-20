class HTTPConnection extends Connection {
  static priority = 700;
  static name = 'HTTP';

  /*
    request_timeout
  */
  constructor(hub) {
    super(hub);
    this.options.enabled = false;
    this.options.local_ip = '192.168.0.1';
    this.options.port = '80';
    this.options.netmask = '24';
    this.options.request_timeout = 4000;
    this.options.delay = 100;
  }

  isConnected() {
    return this.options.enabled;
  }

  // discover
  async discover() {
    if (this.isDiscovering() || !this.isConnected()) return;
    for (const id of this.hub.getDeviceIds()) {
      const dev = this.hub.dev(id);
      if (dev.info.ip) {
        this._discoverTimer();
        try {
          await this.send(dev.info.ip, dev.info.http_port, `${dev.info.prefix}/${dev.info.id}`);
        } catch (e) {
          console.log(e);
        }
        this._discoverTimer();  // чтобы случайно не сбросить discovering
        await sleep(this.options.delay);
      }
    }
  }

  async discover_ip(ip='', port = undefined) {
    if (!port && ip.includes(':')) {
      const i = ip.lastIndexOf(':');
      port = ip.substring(i + 1);
      ip = ip.substring(0, i);
    }

    if (this.isDiscovering() || !this.isConnected()) return;
    this._discoverTimer();
    await this.send(ip, port, this.hub.prefix);
  }

  async search() {
    if (this.isDiscovering() || !this.isConnected()) return;
    const ips = getIPs(this.options.local_ip, this.options.netmask);
    if (!ips) return;

    let n = 0;
    this._discoverTimer();
    for (const i of ips) {
      this.#searchInner(i, n++);
    }
  }

  async #searchInner(ip, n) {
    await sleep(this.options.delay * n);
    if (!this.isDiscovering()) return;
    this._discoverTimer();
    try {
      await this.send(ip, undefined, this.hub.prefix);
    } catch (e) {
      console.log(e);
    }
  }

  async post(device, command, name = '', value = '') {
    let uri = device.info.prefix + '/' + device.info.id + '/' + this.hub.clientId + '/' + command;
    if (name) {
      uri += '/' + name;
      if (value) {
        uri += '=' + value;
      }
    }

    await this.send(device.info.ip, device.info.http_port, uri);
  }

  async send(ip, port, uri) {
    if (!port) port = this.options.port;
    const res = await http_get(`http://${ip}:${port}/hub/${uri}`, this.options.request_timeout);
    if (res.length) await this.hub._parsePacket(this, res, ip, port);
  }
};