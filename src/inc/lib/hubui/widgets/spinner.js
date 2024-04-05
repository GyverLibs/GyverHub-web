class SpinnerWidget extends BaseWidget {
    static wtype = 'spinner';
    $el;
    $unit;
    #dec = 0;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-spinner-row',
            children: [
                {
                    tag: 'button',
                    class: 'icon icon-btn',
                    style: { padding: 0 },
                    text: '',
                    events: {
                        click: () => this.#spin(-1)
                    }
                },
                {
                    tag: 'div',
                    class: 'w-spinner-block',
                    children: [
                        {
                            tag: 'input',
                            class: 'w-spinner',
                            name: 'el',
                            type: 'number',
                            min: 0,
                            max: 100,
                            step: 1,
                            value: 0,
                            events: {
                                input: () => this.#spin(0),
                                keydown: e => {
                                    if (e.key == 'Enter') {
                                        e.preventDefault();
                                        this.#spin(0);
                                    }
                                },
                                wheel: e => this.#wheel(e),
                            }
                        },
                        {
                            tag: 'label',
                            class: 'w-spinner-unit',
                            name: 'unit',
                            events: {
                                wheel: e => this.#wheel(e),
                            }
                        }
                    ]
                },
                {
                    tag: 'button',
                    class: 'icon icon-btn',
                    style: { padding: 0 },
                    text: '',
                    events: {
                        click: () => this.#spin(+1)
                    }
                }
            ]
        });

        this.disable(this.$el, data.disable);
        this.update(data);
        waitFrame().then(() => this.#spin(0, false));
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('min' in data) this.$el.min = data.min;
        if ('max' in data) this.$el.max = data.max;
        if ('step' in data) this.$el.step = data.step;
        if ('dec' in data) this.#dec = data.dec;
        if ('unit' in data) this.$unit.textContent = data.unit;
        this.#spin(0, false);
    }

    #spin(dir, send = true) {
        const el = this.$el;
        if (dir && el.getAttribute("disabled")) return;
        let val = Number(el.value) + Number(el.step) * Math.sign(Number(dir));
        val = Math.max(Number(el.min), val);
        val = Math.min(Number(el.max), val);
        el.value = Number(val).toFixed(Number(this.#dec));
        el.style.width = el.value.length + 'ch';
        if (send) this.set(el.value);
    }

    #wheel(e) {
        e.preventDefault();
        this.#spin(-e.deltaY);
    }

    static style = `
        .w-spinner-row {
            display: flex;
            align-items: center;
          }

          .w-spinner-block {
            margin: 0px 10px;
            display: flex;
          }
          
          .w-spinner {
            outline: none;
            border: none;
            background: none;
            text-align: center;
            margin: 0;
            padding: 0;
            font-family: var(--font_f);
            color: var(--font2);
            font-size: 20px;
          }
          
          .w-spinner-unit {
            font-family: var(--font_f);
            color: var(--font2);
            font-size: 20px;
          }`;
}