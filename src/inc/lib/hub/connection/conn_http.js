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
    for (let i in this.hub.devices) {
      let dev = this.hub.devices[i].info;
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
    await this.send(ip, port, this.hub.cfg.prefix);
    this._discoverTimer();
    return true;
  }

  async search() {
    if (this.isDiscovering() || !this.isConnected()) return;
    let ips = getIPs(this.options.local_ip, this.options.netmask);
    if (!ips) return;

    for (let i in ips) {
      try {
        await this.send(ips[i], this.options.port, this.hub.cfg.prefix);
      } catch (e) {}
      await sleep(this.options.delay);
    }
    this._discoverTimer();
  }

  async post(device, command, name = '', value = '') {
    let uri = device.info.prefix + '/' + device.info.id + '/' + this.hub.cfg.client_id + '/' + command;
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