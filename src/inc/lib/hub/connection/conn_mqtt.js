class MQTTConnection extends Connection {
  static priority = 500;
  static name = 'MQTT';

  #client;
  #preflist;
  #buffers;

  onConnChange(state) { }

  constructor(hub) {
    super(hub);
    this.options.enabled = true;
    this.options.host = 'test.mosquitto.org';
    this.options.port = '8081';
    this.options.login = '';
    this.options.password = '';

    this.#preflist = [];
    this.#buffers = new Map();
    this.addEventListener('statechange', () => this.onConnChange(this.getState()));
    this.hub.addEventListener('deviceadded', ev => this.#sub_device(ev.device.info.prefix, ev.device.info.id));
  }

  isConnected() {
    return this.#client && this.#client.connected;
  }

  async discover() {
    if (this.isDiscovering() || !this.isConnected()) return;
    for (const id of this.hub.getDeviceIds()) {
      const dev = this.hub.dev(id);
      this._discoverTimer();
      await this.send(dev.info.prefix + '/' + dev.info.id + '=' + this.hub.clientId);
    }
  }

  async search() {
    if (this.isDiscovering() || !this.isConnected()) return;
    await this.#upd_prefix(this.hub.prefix);
    this._discoverTimer();
    await this.send(this.hub.prefix + '=' + this.hub.clientId);
  }

  async connect() {
    await this.disconnect();
    this._setState(ConnectionState.CONNECTING);

    /*@[if_dev]*/
    this.options.host = 'mqtt.neko-dev.ru';
    this.options.port = '443';
    this.options.login = 'testuser';
    this.options.password = 'gyverhubtest';
    /*@/[if_dev]*/

    const url = 'wss://' + this.options.host + ':' + this.options.port + '/mqtt';
    const options = {
      keepalive: 60,
      clientId: this.hub.clientId,
      username: this.options.login,
      password: this.options.password,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10 * 1000
    }

    try {
      this.#client = await mqtt.connectAsync(url, options);
    } catch (e) {
      this._setState(ConnectionState.DISCONNECTED);
      return;
    }

    this.#client.on('connect', () => {
      this._setState(ConnectionState.CONNECTED);
    });
    this.#client.on('reconnect', () => {
      this._setState(ConnectionState.CONNECTING);
    });
    this.#client.on('close', () => {
      this._setState(ConnectionState.DISCONNECTED);
    });

    this.#client.on('error', () => {
      this.disconnect();
    });

    this.#client.on('message', (topic, text) => {
      topic = topic.toString();
      text = text.toString();
      let parts = topic.split('/');

      if (parts.length < 2 || parts[1] != 'hub' || !this.#preflist.includes(parts[0]))
        return;
      
      // prefix/hub
      if (parts.length == 2) {
        this.hub._parsePacket(this, text);

      // prefix/hub/client_id/id
      } else if (parts.length == 4 && parts[2] == this.hub.clientId) {
        let buffer = this.#buffers.get(parts[3]);
        if (!buffer) {
          buffer = new PacketBufferScanFirst(data => {
            this.hub._parsePacket(this, data);
          }, 1500);
          this.#buffers.set(parts[3], buffer);
        }
        buffer.push(text);

        // prefix/hub/id/get/name
      } else if (parts.length == 5 && parts[3] == 'get') {
        let dev = this.hub.dev(parts[2]);
        if (dev) {
          let upd = {};
          upd[parts[4]] = {value: text};
          dev._checkUpdates(upd);
        }
      }
    });

    this.#preflist = [];
    await this.#upd_prefix(this.hub.prefix);
    for (const id of this.hub.getDeviceIds()) {
      const dev = this.hub.dev(id);
      await this.#sub_device(dev.info.prefix, dev.info.id);
    }

    this._setState(ConnectionState.CONNECTED);
  }
  
  async disconnect() {
    if (this.#client) {
      try {
        await this.#client.endAsync();
      } catch (e) {}
    }
    this.#client = undefined;
    this._setState(ConnectionState.DISCONNECTED);
  }

  async send(topic) {
    const i = topic.indexOf('=');
    let msg = '';
    if (i !== -1) {
      msg = topic.substring(i + 1);
      topic = topic.substring(0, i);
    }

    if (this.isConnected()) {
      await this.#client.publishAsync(topic, msg);
    }
  }
  async sub_device(prefix, id) {
    await this.#sub_device(prefix, id);
  }
  async #sub_device(prefix, id) {
    if (!this.isConnected()) return;
    await this.#client.subscribeAsync(prefix + '/hub/' + id + '/get/#');
    await this.#upd_prefix(prefix);
  }
  async #upd_prefix(prefix) {
    if (!this.isConnected() || this.#preflist.includes(prefix)) return;
    this.#preflist.push(prefix);
    await this.#client.subscribeAsync(prefix + '/hub');
    await this.#client.subscribeAsync(prefix + '/hub/' + this.hub.clientId + '/#');
  }
};
