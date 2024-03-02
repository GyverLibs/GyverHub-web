class TelegramConnection extends Connection {
  static priority = 400;
  static name = 'TG';

  #running;
  #offset;
  #buffers;

  constructor(hub) {
    super(hub);
    this.options.enabled = false;
    this.options.token = '';
    this.options.chat = 0;
    this.options.discover_timeout = 10000;

    this.#buffers = new Map();
  }

  isConnected() {
    return this.#running;
  }

  async connect() {
    if (!this.options.token || !this.options.chat)
      return;

    this.#running = true;
    this.#offset = -1;
    this._setState(ConnectionState.CONNECTING);
    this.#poll();
  }

  async disconnect() {
    this.#running = false;
    this._setState(ConnectionState.DISCONNECTED);
  }

  async send(text) {
    if (!this.options.chat) return;
    await this.#sendMessage(this.options.chat, 'app:' + text)
  }
  
  async #sendMessage(chat_id, text, params) {
    params.chat_id = chat_id;
    params.text = text;
    params.disable_notification = true;
    const resp = await fetch(`https://api.telegram.org/bot${this.options.token}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
    });
    const data = await resp.json();
    return data.ok;
  }

  async #poll() {
    while (this.#running) {
      let data = null;
      try {
        const resp = await fetch(`https://api.telegram.org/bot${this.options.token}/getUpdates?offset=${this.#offset}&timeout=${this.options.pool_time}`);
        data = await resp.json();
      } catch (e) {
      }

      if (!this.#running) break;

      if (data && data.ok) {
        this._setState(ConnectionState.CONNECTED);

        for (let upd of data.result) {
          await this.#onmessage(upd);
          this.#offset = upd.update_id + 1;
        }

      } else {
        this._setState(ConnectionState.DISCONNECTED);
      }

      if (!this.#running) break;

      await sleep(this.options.pool_delay);
    }
  }
  
  async #onmessage(data){
    try {
      if (data.channel_post.text == '/start') {
        const msg = 'Channel *' + data.channel_post.chat.title + '* id: `' + data.channel_post.chat.id + '`';
        await this.#sendMessage(data.channel_post.chat.id, msg, { parse_mode: "MarkdownV2" });
        return;
      }
    } catch (e) { }

    try {
      if (data.channel_post.chat.id != this.options.chat) return;
      const [id, ...rest] = data.channel_post.text.split(':');
      const data = rest.join(':');
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
