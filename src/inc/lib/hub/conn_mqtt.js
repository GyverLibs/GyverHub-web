class MQTTconn extends Discover {
  tout = 1500;

  onConnChange(state) { }

  constructor(hub) {
    super(hub);
    setInterval(() => { if (this._hub.cfg.use_mqtt && !this.state() && this._reconnect) this.start() }, 3000);
  }

  // discover
  discover() {
    if (this.discovering) return;
    if (!this.state()) {
      this._discover_f = true;
      return;
    }
    for (let dev of this._hub.devices) {
      this.send(dev.info.prefix + '/' + dev.info.id, this._hub.cfg.client_id);
    }
    this._discoverTimer(this.tout);
  }
  search() {
    if (this.discovering || !this.state()) return;
    this._upd_prefix(this._hub.cfg.prefix);
    this.send(this._hub.cfg.prefix, this._hub.cfg.client_id);
    this._discoverTimer(this.tout);
  }

  // core
  async send(topic, msg = '') {
    if (this.state()) this._client.publish(topic, msg);  // no '\0'
  }
  state() {
    return (this._client && this._client.connected);
  }
  stop() {
    this._reconnect = false;
    if (this.state()) this._client.end();
  }
  start() {
    this._reconnect = true;
    if (this._connecting || this.state() || !this._hub.cfg.mq_host || !this._hub.cfg.mq_port || !this._hub.cfg.use_mqtt) return;

    const url = 'wss://' + this._hub.cfg.mq_host + ':' + this._hub.cfg.mq_port + '/mqtt';
    const options = {
      keepalive: 60,
      clientId: 'HUB-' + Math.round(Math.random() * 0xffffffff).toString(16),
      username: this._hub.cfg.mq_login,
      password: this._hub.cfg.mq_pass,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10 * 1000
    }

    try {
      this.log('Connecting');
      this._client = mqtt.connect(url, options);
    } catch (e) {
      this.err('Connection fail');
      this.onConnChange(false);
      return;
    }

    this._connecting = true;

    this._client.on('connect', () => {
      this._connecting = false;
      this.log('Connected');
      this.onConnChange(true);
      this._preflist = [];
      this._upd_prefix(this._hub.cfg.prefix);
      for (let dev of this._hub.devices) this._sub_device(dev.info.prefix, dev.info.id);

      if (this._discover_f) {
        this._discover_f = false;
        this.discover();
      }
    });

    this._client.on('error', () => {
      this._connecting = false;
      this.onConnChange(false);
      this._client.end();
      this.err('Error');
    });

    this._client.on('close', () => {
      this._connecting = false;
      this.onConnChange(false);
      this._client.end();
      this.log('Close');
    });

    this._client.on('message', (topic, text) => {
      topic = topic.toString();
      text = text.toString();
      let parts = topic.split('/');
      if (parts.length < 2) return;

      for (let pref of this._preflist) {
        if (parts[0] != pref || parts[1] != 'hub') continue;

        // prefix/hub
        if (parts.length == 2) {
          this._hub._parsePacket(Conn.MQTT, text);
          return;

          // prefix/hub/client_id/id
        } else if (parts.length == 4 && parts[2] == this._hub.cfg.client_id) {
          let dev = this._hub.dev(parts[3]);
          if (dev) dev.mq_buf.process(text);
          else this._hub._parsePacket(Conn.MQTT, text);
          return;

          // prefix/hub/id/get/name
        } else if (parts.length == 5 && parts[3] == 'get') {
          let dev = this._hub.dev(parts[2]);
          if (dev) {
            let upd = {};
            upd[parts[4]] = {value: text};
            dev._checkUpdates(upd);
          }
          return;
        }
      }
    });
  }
  
  _sub_device(prefix, id) {
    if (!this.state()) return;
    this._client.subscribe(prefix + '/hub/' + id + '/get/#');
    this._upd_prefix(prefix);
  }
  _upd_prefix(prefix) {
    if (!this._preflist.includes(prefix)) {
      this._preflist.push(prefix);
      this._client.subscribe(prefix + '/hub');
      this._client.subscribe(prefix + '/hub/' + this._hub.cfg.client_id + '/#');
    }
  }

  _connecting = false;
  _client = null;
  _discover_f = false;
  _preflist = [];

  _reconnect = false;

  // log
  log(t) {
    this._hub.log('[MQTT] ' + t);
  }
  err(e) {
    this._hub.err('[MQTT] ' + e);
  }
};
