class FlagsWidget extends BaseWidget {
    $el;
    #value = 0;
    #items = [];

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_flags_cont',
            name: 'el',
            events: {
                click: e => {
                    if (this.$el.getAttribute("disabled")) return;
                    const i = e.target.dataset.flagIndex;
                    if (i === undefined) return;
                    const unset = e.target.classList.contains('checked');
                    if (unset) this.#value &= ~(1 << i);
                    else this.#value |= 1 << i;
                    this.set(this.#value);
                    this.#render();
                }
            }
        });
        
        this.disable(this.$el, data.disable);
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.#value = Number(data.value);
        if ('text' in data) this.#items = data.text.split(/[,;]/);
        if ('color' in data) this.$el.style.setProperty('--checked-color', intToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
        this.#render();
    }

    #render() {
        const labels = [];
        let val = this.#value;
        for (const i in this.#items) {
            const $i = createElement(null, {
                type: 'label',
                class: 'w_flags' + (val & 1 ? ' checked' : ''),
                text: this.#items[i],
            });
            $i.dataset.flagIndex = i;
            labels.push($i);
            val >>= 1;
        }
        this.$el.replaceChildren(...labels);
    }
}

Renderer.register('flags', FlagsWidget);
