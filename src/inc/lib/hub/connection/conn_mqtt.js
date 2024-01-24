class MQTTconn extends Connection {
  priority = 500;
  name = 'MQTT';

  tout = 1500;

  _connecting = false;
  _client = null;
  _discover_f = false;
  _preflist = [];

  _reconnect = false;

  onConnChange(state) { }

  constructor(hub, options) {
    super(hub, options);
    setInterval(() => { if (this.hub.cfg.use_mqtt && !this.isConnected() && this._reconnect) this.connect() }, 3000);
  }

  isConnected() {
    return this._client && this._client.connected;
  }

  // discover
  async discover() {
    if (this.discovering) return;
    if (!this.isConnected()) {
      this._discover_f = true;
      return;
    }
    for (let dev of this.hub.devices) {
      this.send(dev.info.prefix + '/' + dev.info.id + '=' + this.hub.cfg.client_id);
    }
    this._discoverTimer(this.tout);
  }

  async search() {
    if (this.discovering || !this.isConnected()) return;
    this._upd_prefix(this.hub.cfg.prefix);
    this.send(this.hub.cfg.prefix + '=' + this.hub.cfg.client_id);
    this._discoverTimer(this.tout);
  }

  async connect() {
    this._reconnect = true;
    if (this._connecting || this.isConnected() || !this.hub.cfg.mq_host || !this.hub.cfg.mq_port || !this.hub.cfg.use_mqtt) return;

    const url = 'wss://' + this.hub.cfg.mq_host + ':' + this.hub.cfg.mq_port + '/mqtt';
    const options = {
      keepalive: 60,
      clientId: 'HUB-' + Math.round(Math.random() * 0xffffffff).toString(16),
      username: this.hub.cfg.mq_login,
      password: this.hub.cfg.mq_pass,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10 * 1000
    }

    try {
      this._client = mqtt.connect(url, options);
    } catch (e) {
      this.err('Connection fail');
      this.onConnChange(false);
      return;
    }

    this._connecting = true;

    this._client.on('connect', () => {
      this._connecting = false;
      this.onConnChange(true);
      this._preflist = [];
      this._upd_prefix(this.hub.cfg.prefix);
      for (let dev of this.hub.devices) this._sub_device(dev.info.prefix, dev.info.id);

      if (this._discover_f) {
        this._discover_f = false;
        this.discover();
      }
    });

    this._client.on('error', () => {
      this._connecting = false;
      this.onConnChange(false);
      this._client.end();
    });

    this._client.on('close', () => {
      this._connecting = false;
      this.onConnChange(false);
      this._client.end();
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
          this.hub._parsePacket(this, text);
          return;

          // prefix/hub/client_id/id
        } else if (parts.length == 4 && parts[2] == this.hub.cfg.client_id) {
          let dev = this.hub.dev(parts[3]);
          if (dev) dev.mq_buf.process(text);
          else this.hub._parsePacket(this, text);
          return;

          // prefix/hub/id/get/name
        } else if (parts.length == 5 && parts[3] == 'get') {
          let dev = this.hub.dev(parts[2]);
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
  
  async disconnect() {
    this._reconnect = false;
    if (this.isConnected()) this._client.end();
  }

  async send(topic) {
    topic = topic.split('=', 1);
    const msg = topic.length === 1 ? '' : topic[1];
    topic = topic[0];
    if (this.isConnected()) this._client.publish(topic, msg);  // no '\0'
  }
  
  _sub_device(prefix, id) {
    if (!this.isConnected()) return;
    this._client.subscribe(prefix + '/hub/' + id + '/get/#');
    this._upd_prefix(prefix);
  }
  _upd_prefix(prefix) {
    if (!this._preflist.includes(prefix)) {
      this._preflist.push(prefix);
      this._client.subscribe(prefix + '/hub');
      this._client.subscribe(prefix + '/hub/' + this.hub.cfg.client_id + '/#');
    }
  }
};
