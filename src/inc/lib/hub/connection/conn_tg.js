class TGconn extends Connection {
  priority = 400;
  name = 'TG';

  #running;
  #offset;
  #buffers;

  onConnChange(state) { }

  constructor(hub) {
    super(hub);
    this.#buffers = new Map();
  }

  isConnected() {
    return this.#running;
  }

  async discover() {
    if (this.discovering || !this.isConnected()) return;
    for (let pref of this.hub._preflist()) await this.send(pref);
    this._discoverTimer();
  }

  async search() {
    if (this.discovering || !this.isConnected()) return;
    await this.send(this.hub.cfg.prefix);
    this._discoverTimer();
  }

  async connect() {
    this.#running = true;
    this.#offset = -1;
    this._setState(ConnectionState.CONNECTING);
    this._poll();
  }

  async disconnect() {
    this.#running = false;
    this._setState(ConnectionState.DISCONNECTED);
  }

  async send(text) {
    if (!this.hub.cfg.tg_chat) return;
    await this.#sendMessage(this.hub.cfg.tg_chat, 'app:' + text)
  }
  
  async #sendMessage(chat_id, text, params) {
    params.chat_id = chat_id;
    params.text = text;
    params.disable_notification = true;
    let resp = await fetch(`https://api.telegram.org/bot${this.options.token}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
    });
    let data = await resp.json();
    return data.ok;
  }

  async _poll() {
    while (this.#running) {
      let data = null;
      try {
        let resp = await fetch(`https://api.telegram.org/bot${this.options.token}/getUpdates?offset=${this.#offset}&timeout=${this.options.pool_time}`);
        data = await resp.json();
      } catch (e) {
      }

      if (!this.#running) break;

      if (data && data.ok) {
        this._setState(ConnectionState.CONNECTED);

        for (let upd of data.result) {
          await this.onmessage(upd);
          this.#offset = upd.update_id + 1;
        }

      } else {
        this._setState(ConnectionState.DISCONNECTED);
      }

      if (!this.#running) break;

      await sleep(this.options.pool_delay);
    }
  }
  
  async onmessage(data){
    try {
      if (data.channel_post.text == '/start') {
        let msg = 'Channel *' + data.channel_post.chat.title + '* id: `' + data.channel_post.chat.id + '`';
        await this.#sendMessage(data.channel_post.chat.id, msg, { parse_mode: "MarkdownV2" });
        return;
      }
    } catch (e) { }

    try {
      if (data.channel_post.chat.id != this.hub.cfg.tg_chat) return;
      let [id, ...rest] = data.channel_post.text.split(':');
      let data = rest.join(':');
      let buffer = this.#buffers.get(id);
      if (!buffer) {
        buffer = new PacketBufferScanFirst(data => {
          this.hub._parsePacket(this, data);
        }, 1500);
        this.#buffers.set(id, buffer);
      }
      buffer.push(text);
    } catch (e) { }
  }
}
