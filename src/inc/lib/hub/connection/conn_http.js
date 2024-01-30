class HTTPconn extends Connection {
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
    this.options.netmask = '255.255.255.0';
    this.options.local_ip = '192.168.0.1';
    this.options.request_timeout = 15;
    this.options.delay = 5;
    this.options.discover_timeout = 10000;

    this.addEventListener('statechange', () => this.onConnChange(this.getState()));
  }

  // discover
  async discover() {
    if (this.isDiscovering() || !this.isConnected()) return;
    for (const id in this.hub.getDeviceIds()) {
      const dev = this.hub.dev(id);
      if (dev.ip) {
        try {
          await this.send(dev.ip, dev.http_port, `${dev.prefix}/${dev.id}`);
        } catch (e) {}
        await sleep(this.options.delay);
      }
    }
    this._discoverTimer();
  }

  async discover_ip(ip, port = undefined) {
    if (!checkIP(ip) || this.isDiscovering() || !this.isConnected()) return false;
    this._discoverTimer();
    await this.send(ip, port, this.hub.prefix);
    return true;
  }

  async search() {
    if (this.isDiscovering() || !this.isConnected()) return;
    const ips = getIPs(this.options.local_ip, this.options.netmask);
    if (!ips) return;

    this._discoverTimer();
    for (const i in ips) {
      try {
        await this.send(ips[i], this.options.port, this.hub.prefix);
      } catch (e) {}
      await sleep(this.options.delay);
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