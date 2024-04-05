class InputWidget extends BaseWidget {
    static wtype = 'input';
    $el;
    #changed;
    #regex;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-inp-cont',
            children: [
                {
                    tag: 'input',
                    class: 'w-inp',
                    name: 'el',
                    type: 'text',
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

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('regex' in data) this.#regex = data.regex;
        if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + hexToCol(data.color);
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

    static style = `
        .w-inp {
            font-size: 17px;
            border: none;
            font-family: var(--font_f);
            width: 100%;
            color: var(--font);
            padding-left: 4px;
            margin-top: -4px;
            background: none;
            box-shadow: 0px 2px 0px 0px var(--prim);
          }
          
          .w-inp:focus {
            filter: brightness(1.3);
            outline: none;
          }
          
          .w-inp-cont {
            display: flex;
            width: 100%;
          }`;
}

class PassWidget extends BaseWidget {
    static wtype = 'pass';
    $el;
    #changed;
    #regex;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-inp-cont',
            children: [
                {
                    tag: 'input',
                    class: 'w-inp',
                    name: 'el',
                    type: 'password',
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
                    tag: 'div',
                    class: 'btn-inp-block',
                    children: [
                        {
                            tag: 'button',
                            class: 'icon w-eye',
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

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('regex' in data) this.#regex = data.regex;
        if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + hexToCol(data.color);
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

    static style = `
        .w-eye {
            font-size: 18px;
            cursor: pointer;
            color: var(--font2);
            margin-top: -7px;
          }`;
}