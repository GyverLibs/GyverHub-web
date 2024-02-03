class Button extends BaseWidget {
    $btn;
    #color = 'var(--prim)';
    #fontSize = '45px';
    #inline = true;
    #pressed = false;
    #touch = false;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'button',
            class: 'icon w_btn',
            name: 'btn',
            text: "",
            style: {
                color: this.#color,
                fill: this.#color,
                fontSize: this.#fontSize,
                width: 'unset',
            },
            events: {
                click: () => this.set(2),
                mousedown: () => {
                    if(!this.#touch) this.set(1);
                },
                mouseup: () => {
                    if(!this.#touch&&this.#pressed) this.set(0);
                },
                mouseleave: () => {
                    if(!this.#touch&&this.#pressed) this.set(0);
                },
                touchstart: () => {
                    this.#touch=true;
                    this.#pressed = true;
                    this.set(1, false);
                },
                touchend: () => {
                    this.#pressed = false;
                    this.set(0, false);
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
            this.#color = intToCol(data.color);

            this.$btn.style.color = this.#color;
            this.$btn.style.fill = this.#color;
        }
        if ('fsize' in data) {
            this.#fontSize = data.fsize + 'px';

            const size = this.#fontSize;
            this.$btn.style.fontSize = size;
            this.$btn.style.width = this.#inline ? 'unset' : size;
        }
        if ('disable' in data) {
            this.disable(this.$btn, data.disable);
        }
    }

    #setIcon(text) {
        let icon = "";
        this.$btn.style.width = 'unset';
        if (text) {
            if (text.includes(".svg")) {
                hub.dev(focused).addFile(this.id, text, (data) => {
                    this.setPlabel();
                    this.$btn.innerHTML = dataTotext(data);
                    this.$btn.style.width = this.#fontSize;
                    this.$btn.style.fill = this.#color;
                }, perc => this.setPlabel(`[${perc}%]`));
                this.#inline = false;
                return;
            } else {
                icon = getIcon(text);
            }
        }
        this.$btn.innerHTML = icon;
        this.#inline = true;
    }
}
Renderer.register('button', Button);
