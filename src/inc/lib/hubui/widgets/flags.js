class FlagsWidget extends BaseWidget {
    static wtype = 'flags';
    $el;
    #value = 0;
    #items = [];

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
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
        if ('color' in data) this.$el.style.setProperty('--checked-color', hexToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
        this.#render();
    }

    #render() {
        const labels = [];
        let val = this.#value;
        for (const i in this.#items) {
            const $i = makeDOM(null, {
                tag: 'label',
                class: 'w_flags' + (val & 1 ? ' checked' : ''),
                text: this.#items[i],
            });
            $i.dataset.flagIndex = i;
            labels.push($i);
            val >>= 1;
        }
        this.$el.replaceChildren(...labels);
    }

    static style = `
        .w_flags {
            padding: 4px 13px;
            margin: 3px;
            border-radius: 35px;
            background: var(--dark);
            font-size: 18px;
            color: var(--font);
            user-select: none;
            --checked-color: var(--prim);
          }
          
          .w_flags_cont:not(.disable) .w_flags {
            cursor: pointer;
          }
          
          .w_flags_cont:not(.disable) .w_flags:hover {
            background: var(--black);
          }
          
          .w_flags.checked {
            background: var(--checked-color) !important;
            color: white;
          }
          
          .w_flags_cont {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
          }`;
}
