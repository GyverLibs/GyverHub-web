class SliderWidget extends BaseWidget {
    static wtype = 'slider';
    $el;
    $out;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'input',
            class: 'w-slider',
            name: 'el',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            dec: 0,
            value: 0,
            events: {
                input: () => {
                    this.#move()
                },
                wheel: e => {
                    e.preventDefault();
                    if (this.disabled()) return;
                    this.$el.value = Number(this.$el.value) - Math.sign(Number(e.deltaY)) * Number(this.$el.step);
                    this.#move();
                },
            },
        }, {
            tag: 'div',
            class: 'w-slider-out',
            children: [
                {
                    tag: 'output',
                    name: 'out'
                }
            ]
        });

        this.update(data);

        waitFrame().then(() => this.#move(false));
    }

    update(data) {
        super.update(data);
        if ('color' in data) this.$el.style.backgroundImage = `linear-gradient(${hexToCol(data.color)}, ${hexToCol(data.color)})`;
        if ('min' in data) this.$el.min = data.min;
        if ('max' in data) this.$el.max = data.max;
        if ('step' in data) this.$el.step = data.step;
        if ('disable' in data) this.disable(this.$el, data.disable);
        if ('value' in data) this.$el.value = data.value;
        this.#move(false);
    }

    #move(send = true) {
        this.$el.style.backgroundSize = (Number(this.$el.value) - Number(this.$el.min)) * 100 / (Number(this.$el.max) - Number(this.$el.min)) + '% 100%';
        this.$out.textContent = Number(this.$el.value).toFixed(Number(this.data.dec ?? 0)) + (this.data.unit ?? '');
        if (send) this.set(this.$el.value);
    }

    static style = `
        .w-slider {
            -webkit-appearance: none;
            -moz-appearance: none;
            width: 100%;
            height: 35px;
            padding: 0;
            margin: 0;
            background: var(--dark);
            background-repeat: no-repeat;
            background-image: linear-gradient(var(--prim), var(--prim));
            border-radius: 5px;
            cursor: pointer;
            touch-action: none;
          }
          
          .w-slider:hover {
            filter: brightness(1.1);
          }
          
          .w-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 1px;
            width: 1px;
          }
          
          .w-slider::-webkit-slider-thumb:hover {
            filter: brightness(1.1);
          }
          
          .w-slider::-moz-range-thumb {
            -moz-appearance: none;
            outline: none;
            border: none;
            background: none;
            height: 1px;
            width: 1px;
          }
          
          .w-slider-out {
            margin-left: -110px;
            pointer-events: none;
            text-align: right;
            z-index: 1;
            width: 100px;
            padding-right: 10px;
          }`;
}