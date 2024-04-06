class WebSocketConnection extends Connection {
  static priority = 800;
  static name = 'WS';

  #ws;
  #packet_buffer;
  #reconnect;

  onConnChange(s) { }

  constructor(hub) {
    super(hub);
    this.options.enabled = false;
    this.options.ip = false;
    this.options.port = false;
    this.options.connect_timeout = 3300;

    this.#packet_buffer = new PacketBufferScanFirst(data => {
      this.hub._parsePacket(this, data);
    });
  }

  isConnected() {
    return this.#ws && this.#ws.readyState == 1;
  }

  async begin() { }
  async discover() { }
  async search() { }

  async connect() {
    if (this.#ws) return;

    this._setState(ConnectionState.CONNECTING);
    this.#reconnect = true;

    try {
      this.#ws = await WebSocketConnection.#wsOpenAsync(`ws://${this.options.ip}:${this.options.port}/`, ['hub'], this.options.connect_timeout);

      this._setState(ConnectionState.CONNECTED);
      this.#packet_buffer.clear();

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

    } catch (e) {
      console.log(e);
      this._setState(ConnectionState.DISCONNECTED);
    }
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

  /**
   * 
   * @param {string} url 
   * @param {string[]} protos 
   * @param {number} timeout 
   * @returns {Promise<WebSocket>}
   */
  static #wsOpenAsync(url, protos, timeout) {
    return new Promise((res, rej) => {
      const tid = setTimeout(handler, timeout);

      function handler(e) {
        ws.removeEventListener('open', handler);
        ws.removeEventListener('error', handler);
        clearTimeout(tid);

        if (ws.readyState === WebSocket.OPEN)
          res(ws);
        else rej(e ?? new TimeoutError());
      }

      let ws;
      try {
        ws = new WebSocket(url, protos);
      } catch (e) {
        console.log(e);
        return;
      }
      ws.addEventListener('open', handler);
      ws.addEventListener('error', handler);
    })
  }
}