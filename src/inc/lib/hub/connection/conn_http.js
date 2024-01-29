class HTTPconn extends Connection {
  static priority = 700;
  static name = 'HTTP';

  /*
    local_ip
    netmask
    port
    request_timeout
  */
  constructor(hub) {
    super(hub);
  }

  // discover
  async discover() {
    if (this.isDiscovering()) return;
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

  async discover_ip(ip, port) {
    if (!checkIP(ip) || this.isDiscovering()) return false;
    await this.send(ip, port, this.hub.cfg.prefix);
    this._discoverTimer();
    return true;
  }

  async search() {
    if (this.isDiscovering()) return;
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

    const res = await http_get(`http://${http_port.info.ip}:${http_port.info.http_port}/hub/${uri}`, this.options.request_timeout);
    if (res.length) await this.hub._parsePacket(this, res, http_port.info.ip, http_port.info.http_port);
  }

  async send(ip, port, uri) {
    const res = await http_get(`http://${ip}:${port}/hub/${uri}`, this.options.request_timeout);
    if (res.length) await this.hub._parsePacket(this, res, ip, port);
  }
};