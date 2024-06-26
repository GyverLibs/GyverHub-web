class FlagsWidget extends BaseWidget {
    static wtype = 'flags';
    $el;
    #value = 0;
    #items = [];

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-flags-cont',
            name: 'el',
            events: {
                click: e => {
                    if (this.disabled()) return;
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
        if ('text' in data) this.#items = data.text.split(';');
        if ('color' in data) this.$el.style.setProperty('--checked-color', hexToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
        if ('font_size' in data) this.$el.style.fontSize = data.font_size + 'px';
        this.#render();
    }

    #render() {
        const labels = [];
        let val = this.#value;
        for (const i in this.#items) {
            const $i = makeDOM(null, {
                tag: 'div',
                class: 'w-flags' + (val & 1 ? ' checked' : ''),
                children: makeIconLabel(this.#items[i]),
            });
            $i.dataset.flagIndex = i;
            labels.push($i);
            val >>= 1;
        }
        this.$el.replaceChildren(...labels);
    }

    static style = `
        .w-flags {
            padding: 5px 12px;
            margin: 3px;
            border-radius: 35px;
            background: var(--dark);
            color: var(--font);
            user-select: none;
            --checked-color: var(--prim);
          }
          
          .w-flags-cont:not(.widget-disable) .w-flags {
            cursor: pointer;
          }
          
          .w-flags-cont:not(.widget-disable) .w-flags:hover {
            background: var(--black);
          }
          
          .w-flags.checked {
            background: var(--checked-color) !important;
            color: white;
          }
          
          .w-flags-cont {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            font-size: 19px;
          }`;
}
