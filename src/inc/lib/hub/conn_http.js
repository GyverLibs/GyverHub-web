class HTTPconn extends Discover {
  tout_btw = 15;
  tout = 3300;

  constructor(hub) {
    super(hub);
  }

  // discover
  discover() {
    if (this.discovering) return;
    for (let i in this._hub.devices) {
      setTimeout(() => {
        let dev = this._hub.devices[i].info;
        if (dev.ip) this.send(dev.ip, dev.http_port, `hub/${dev.prefix}/${dev.id}`);
      }, this.tout_btw * i);
    }
    this._discoverTimer(this.tout_btw * this._hub.devices.length + this.tout);
  }
  discover_ip(ip, port) {
    if (!checkIP(ip)) return false;
    if (this.discovering) return false;
    this.send(ip, port, `hub/${this._hub.cfg.prefix}`);
    this._discoverTimer(this.tout);
    return true;
  }
  search() {
    if (this.discovering) return;
    let ips = getIPs(this._hub.cfg.local_ip, this._hub.cfg.netmask);
    if (!ips) return;

    for (let i in ips) {
      setTimeout(() => {
        this.send(ips[i], this._hub.cfg.http_port, `hub/${this._hub.cfg.prefix}`);
      }, this.tout_btw * i);
    }
    this._discoverTimer(this.tout_btw * ips.length + this.tout);
  }
  send(ip, port, uri) {
    http_get(`http://${ip}:${port}/${uri}`)
      .then(res => {
        if (res.length) this._hub._parsePacket(Conn.HTTP, res, ip, port);
      })
      .catch(e => { });
  }

  // log
  log(t) {
    log('[HTTP] ' + t);
  }
  err(e) {
    err('[HTTP] ' + e);
  }
};