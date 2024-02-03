class WSconn extends Connection {
  static priority = 800;
  static name = 'WS';

  #ws;
  #packet_buffer;
  #reconnect;

  onConnChange(s){}

  constructor(hub) {
    super(hub);
    this.options.enabled = false;
    this.options.ip = false;
    this.options.port = false;
    this.options.discover_timeout = 3000;

    this.#packet_buffer = new PacketBufferScanFirst(data => {
      this.hub._parsePacket(this, data);
    });
    this.addEventListener('statechange', () => this.onConnChange(this.getState()));
  }

  isConnected() {
    return this.#ws && this.#ws.readyState == 1;
  }

  async begin(){}
  async discover(){}
  async search(){}

  async connect() {
    if (this.#ws) return;

    this._setState(ConnectionState.CONNECTING);
    this.#reconnect = true;
    this.#ws = new WebSocket(`ws://${this.options.ip}:${this.options.port}/`, ['hub']);

    this.#ws.onopen = () => {
      this._setState(ConnectionState.CONNECTED);
      this.#packet_buffer.clear();
    };

    this.#ws.onclose = async () => {
      this._setState(ConnectionState.DISCONNECTED);
      this.#ws = undefined;
      await sleep(500);
      if (this.#reconnect)
        await this.connect();
    };

    this.#ws.onmessage = (e) => {
      this.#packet_buffer.push(e.data);
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