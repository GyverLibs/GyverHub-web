class InputWidget extends BaseWidget {
    $el;
    #changed;
    #regex;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_inp_cont',
            children: [
                {
                    type: 'input',
                    class: 'w_inp',
                    name: 'el',
                    events: {
                        keydown: e => {
                            if (e.key == 'Enter') this.#send(true);
                        },
                        input: () => {
                            this.#changed = true;
                        },
                        focusout: () => {
                            this.#send();
                        }
                    }
                }
            ]
        });
        this.$el.type = 'text';

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('regex' in data) this.#regex = data.regex;
        if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + intToCol(data.color);
        if ('value' in data) this.$el.value = data.value;
        if ('maxlen' in data) this.$el.maxlength = Math.ceil(data.maxlen);
        if ('disable' in data) this.disable(this.$el, data.disable);
    }

    #send(force = false) {
        if (this.#regex) {
            const r = new RegExp(this.#regex);
            if (!r.test(this.$el.value)) {
                showPopupError("Wrong text!");
                return;
            }
        }
        if (force || this.#changed) {
            this.#changed = false;
            this.set(this.$el.value);
        }
    }
}

Renderer.register('input', InputWidget);


class PassWidget extends BaseWidget {
    $el;
    #changed;
    #regex;
  
    constructor(data, renderer) {
        super(data, renderer);
  
        this.makeLayout({
          type: 'div',
          class: 'w_inp_cont',
          children: [
            {
              type: 'input',
              class: 'w_inp',
              name: 'el',
              events: {
                  keydown: e => {
                      if (e.key == 'Enter') this.#send(true);
                  },
                  input: () => {
                      this.#changed = true;
                  },
                  focusout: () => {
                      this.#send();
                  }
              }
            },
            {
              type: 'div',
              class: 'btn_inp_block',
              children: [
                {
                  type: 'button',
                  class: 'icon w_eye',
                  text: '',
                  events: {
                    click: () => {
                      this.$el.type = this.$el.type == 'text' ? 'password' : 'text';
                    }
                  }
                }
              ]
            }
          ]
      });
      this.$el.type = 'password';
  
      this.update(data);
    }

    update(data) {
      super.update(data);
      if ('regex' in data) this.#regex = data.regex;
      if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + intToCol(data.color);
      if ('value' in data) this.$el.value = data.value;
      if ('maxlen' in data) this.$el.maxlength = Math.ceil(data.maxlen);
      if ('disable' in data) this.disable(this.$el, data.disable);
    }

    #send(force = false) {
        if (this.#regex) {
            const r = new RegExp(this.#regex);
            if (!r.test(this.$el.value)) {
                showPopupError("Wrong text!");
                return;
            }
        }
        if (force || this.#changed) {
            this.#changed = false;
            this.set(this.$el.value);
        }
    }
}

Renderer.register('pass', PassWidget);
