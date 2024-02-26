/*NON-ESP*/
class TGconn extends Discover {
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
      this.bot.stop();
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
        if (data.channel_post.chat.id != this._hub.cfg.tg_chat) return;
        let [id, ...rest] = data.channel_post.text.split(':');
        let data = rest.join(':');
        if (!this._buffers.hasOwnProperty(id)) {
          this._buffers[id] = new PacketBuffer(this._hub, Conn.TG, false, 1500);
        }
        this._buffers[id].process(text);
      } catch (e) { }
    };

    setInterval(() => { if (this._hub.cfg.use_tg && !this.bot.state() && this._reconnect) this.start() }, 3000);
  }
  async discover() {
    if (this.discovering || !this.bot.state()) return;
    for (let pref of this._hub._preflist()) await this.send(pref);
    this._discoverTimer(this.tout);
  }
  async search() {
    if (this.discovering || !this.bot.state()) return;
    await this.send(this._hub.cfg.prefix);
    this._discoverTimer(this.tout);
  }
  async start() {
    this.bot.setToken(this._hub.cfg.tg_token);
    this.bot.start();
  }
  async stop() {
    this.bot.stop();
    this._reconnect = false;
    this.onConnChange(0);
  }
  send(text) {
    if (this._hub.cfg.tg_chat.length) this.bot.send(this._hub.cfg.tg_chat, 'app:' + text);
  }

  _reconnect = false;
  _buffers = {};

  // log
  log(t) {
    this._hub.log('[TG] ' + t);
  }
  err(e) {
    this._hub.err('[TG] ' + e);
  }
}
/*/NON-ESP*/