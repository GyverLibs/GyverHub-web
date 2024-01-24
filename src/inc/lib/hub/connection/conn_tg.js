class Bot {

  onpoll() { }
  onerror(e) { }
  async onmessage(data) { }

  timeout = 10;
  period = 100;

  setToken(token) {
    this._token = token;
  }

  connect() {
    this._state = true;
    this._offset = -1;
    this._poll();
  }

  disconnect() {
    this._state = false;
    if (this._tout) clearTimeout(this._tout);
    this._tout = null;
  }

  state() {
    return this._state && this._token.length;
  }

  async send(chat, text, params = {}) {
    params.chat_id = chat;
    params.text = text;
    params.disable_notification = true;
    let resp = await fetch(`https://api.telegram.org/bot${this._token}/sendMessage`, {
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
    this._tout = null;
    let data = null;
    try {
      let resp = await fetch(`https://api.telegram.org/bot${this._token}/getUpdates?offset=${this._offset}&timeout=${this.timeout}`);
      data = await resp.json();
    } catch (e) {
    }

    if (data) {
      if (data.ok) {
        for (let upd of data.result) {
          this.onmessage(upd);
          this._offset = upd.update_id + 1;
        }
        if (this._state) this.onpoll();
      } else {
        if ('description' in data) this.onerror(data.description);
        else this.onerror('Error');
      }
    } else {
      this.onerror('Error');
    }

    if (this._state) this._tout = setTimeout(() => this._poll(), this.period);
  }

  _offset = -1;
  _state = false;
  _token = '';
  _tout = null;
};


class TGconn extends Connection {
  priority = 400;
  name = 'TG';

  tout = 1000;

  onConnChange(state) { }

  constructor(hub) {
    super(hub);
    this.bot = new Bot();

    this.bot.onpoll = () => {
      this._reconnect = true;
      this.onConnChange(1);
    }

    this.bot.onerror = (e) => {
      this.onConnChange(0);
      this.err(e);
      this.bot.disconnect();
    }

    this.bot.onmessage = (data) => {
      try {
        if (data.channel_post.text == '/start') {
          let msg = 'Channel *' + data.channel_post.chat.title + '* id: `' + data.channel_post.chat.id + '`';
          this.bot.send(data.channel_post.chat.id, msg, { parse_mode: "MarkdownV2" });
          return;
        }
      } catch (e) { }

      try {
        if (data.channel_post.chat.id != this.hub.cfg.tg_chat) return;
        let [id, ...rest] = data.channel_post.text.split(':');
        let data = rest.join(':');
        if (!this._buffers.hasOwnProperty(id)) {
          this._buffers[id] = new PacketBuffer(this.hub, this, false, 1500);
        }
        this._buffers[id].process(text);
      } catch (e) { }
    };

    setInterval(() => { if (this.hub.cfg.use_tg && !this.bot.state() && this._reconnect) this.connect() }, 3000);
  }
  async discover() {
    if (this.discovering || !this.bot.state()) return;
    for (let pref of this.hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.bot.state()) return;
    await this.send(this.hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }
  async connect() {
    this.bot.setToken(this.hub.cfg.tg_token);
    this.bot.connect();
  }
  async disconnect() {
    this.bot.disconnect();
    this._reconnect = false;
    this.onConnChange(0);
  }
  async send(text) {
    if (this.hub.cfg.tg_chat.length) await this.bot.send(this.hub.cfg.tg_chat, 'app:' + text);
  }

  _reconnect = false;
  _buffers = {};

  // log
  log(t) {
    this.hub.log('[TG] ' + t);
  }
  err(e) {
    this.hub.err('[TG] ' + e);
  }
}
