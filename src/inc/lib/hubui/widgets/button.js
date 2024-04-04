class ButtonWidget extends BaseWidget {
    static wtype = 'button';
    $el;
    #color = 'var(--prim)';
    #fontSize = '45px';
    #inline = true;
    #pressed = false;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'button',
            class: 'icon w_btn',
            name: 'el',
            text: "",
            style: {
                color: this.#color,
                fill: this.#color,
                fontSize: this.#fontSize,
                width: 'unset',
            },
            events: {
                click: () => {
                },
                mousedown: () => {
                    this.#pressed = true;
                    if (!isTouchDevice()) this.set(1);
                },
                mouseup: () => {
                    if (!isTouchDevice() && this.#pressed) this.set(0);
                    this.#pressed = false;
                },
                mouseleave: () => {
                    if (!isTouchDevice() && this.#pressed) this.set(0);
                    this.#pressed = false;
                },
                touchstart: () => {
                    this.#pressed = true;
                    this.set(1);
                },
                touchend: () => {
                    this.#pressed = false;
                    this.set(0);
                },
            },
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('icon' in data) {
            this.#setIcon(data.icon);
        }
        if ('color' in data) {
            this.#color = hexToCol(data.color);

            this.$el.style.color = this.#color;
            this.$el.style.fill = this.#color;
        }
        if ('fsize' in data) {
            this.#fontSize = data.fsize + 'px';

            const size = this.#fontSize;
            this.$el.style.fontSize = size;
            this.$el.style.width = this.#inline ? 'unset' : size;
        }
        if ('disable' in data) {
            this.disable(this.$el, data.disable);
        }
    }

    #setIcon(text) {
        let icon = "";
        this.$el.style.width = 'unset';
        if (text) {
            if (text.includes(".svg")) {
                this.addFile(text, 'text', (data) => {
                    this.$el.innerHTML = data;
                    this.$el.style.width = this.#fontSize;
                    this.$el.style.fill = this.#color;
                });
                this.#inline = false;
                return;
            } else {
                icon = getIcon(text);
            }
        }
        this.$el.innerHTML = icon;
        this.#inline = true;
    }

    static style = `
        .w_btn {
            cursor: pointer;
            margin: -3px;
          }
          
          .w_btn:hover {
            filter: brightness(1.15);
          }
          
          .w_btn:active {
            filter: brightness(0.7);
          }`;
}