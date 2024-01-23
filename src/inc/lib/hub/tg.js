class Bot {
  onpoll() { }
  onerror(e) { }
  async onmessage(data) { }

  timeout = 10;
  period = 100;

  setToken(token) {
    this._token = token;
  }

  start() {
    this._state = true;
    this._offset = -1;
    this._poll();
  }

  stop() {
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
