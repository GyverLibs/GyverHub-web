class TextWidget extends BaseWidget {
    static wtype = 'text';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'textarea',
            class: 'ui-area ui-area-passive',
            name: 'el',
            readOnly: true,
            rows: 5,
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class LogWidget extends BaseWidget {
    static wtype = 'log';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'textarea',
            class: 'ui-area ui-area-passive',
            name: 'el',
            readOnly: true,
            rows: 5,
            style: {
                color: 'var(--prim)'
            },
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) {
            this.$el.value = data.value.trim();
            this.$el.scrollTop = this.$el.scrollHeight;
        }
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class TextFileWidget extends BaseWidget {
    static wtype = 'text_f';
    $el;
    #path;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'textarea',
            class: 'ui-area ui-area-passive',
            name: 'el',
            readOnly: true,
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.#path = data.value;
        if ('rows' in data) this.$el.rows = data.rows;
        if ('action' in data || 'value' in data) {
            this.addFile(this.#path, 'text', (file) => {
                this.$el.value = file;
            });
        }
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class DisplayWidget extends BaseWidget {
    static wtype = 'display';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'textarea',
            class: 'w-disp',
            name: 'el',
            readOnly: true,
            rows: 2,
            style: {
                fontSize: '20px',
                background: 'var(--prim)'
            },
            events: {
                wheel: e => {
                    e.preventDefault();
                    this.$el.scrollLeft += e.deltaY;
                }
            }
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('color' in data) this.$el.style.background = hexToCol(data.color);
        if ('font_size' in data) this.$el.style.fontSize = data.font_size + 'px';
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }

    static style = `
        .w-disp {
            border: none;
            outline: none;
            font-family: var(--font_f);
            width: 100%;
            color: white;
            resize: none;
            cursor: default;
            padding: 3px 7px;
            border-radius: 5px;
            margin-bottom: 3px;
            /* overflow: hidden; */
            text-wrap: nowrap;
          }
          
          .w-disp::-webkit-resizer {
            display: none;
          }
          
          .w-disp::-webkit-scrollbar {
            display: none;
          }
          
          .w-disp::-webkit-scrollbar-track {
            display: none;
          }
          
          .w-disp::-webkit-scrollbar-thumb {
            display: none;
          }`;
}

class AreaWidget extends BaseWidget {
    static wtype = 'area';
    $el;
    #changed;
    #regex;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'textarea',
            class: 'ui-area',
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
            },
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('regex' in data) this.#regex = data.regex;
        if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + hexToCol(data.color);
        if ('value' in data) this.$el.value = data.value;
        if ('maxlen' in data) this.$el.maxlength = Math.ceil(data.maxlen);
        if ('rows' in data) this.$el.rows = data.rows;
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