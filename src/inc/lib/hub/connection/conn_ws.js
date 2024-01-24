class WSconn extends Connection {
  priority = 800;
  name = 'WS';

  #ws;
  #packet_buffer;
  #reconnect;

  constructor(hub, options) {
    super(hub, options);
    this.device = device;
    this.#packet_buffer = new PacketBuffer(this.hub, this);
  }

  isConnected() {
    return this.#ws && this.#ws.readyState == 1;
  }

  async connect() {
    if (this.#ws) return;

    this._setState(ConnectionState.CONNECTING);
    this.#reconnect = true;
    this.#ws = new WebSocket(`ws://${this.options.ip}:${this.options.port}/`, ['hub']);

    this._ws.onopen = () => {
      this._setState(ConnectionState.CONNECTED);
    };

    this._ws.onclose = async () => {
      this._setState(ConnectionState.DISCONNECTED);
      this.#ws = undefined;
      await sleep(500);
      if (this.#reconnect)
        await this.connect();
    };

    this.#ws.onmessage = (e) => {
      this.#packet_buffer.process(e.data);
    };
  }

  async disconnect() {
    this._setState(ConnectionState.DISCONNECTED);
    this.#reconnect = false;
    if (this.isConnected())
      this.#ws.close();
  }

  async send(text) {
    if (this.isConnected())
      this.#ws.send(text);
  }
}