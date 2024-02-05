class SliderWidget extends BaseWidget {
    $el;
    $out;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_slider',
            name: 'el',
            events: {
                input: () => {
                    this.#move()
                },
                wheel: e => {
                    e.preventDefault();
                    if (this.$el.getAttribute("disabled")) return;
                    this.$el.value = Number(this.$el.value) - Math.sign(Number(e.deltaY)) * Number(this.$el.step);
                    this.#move();
                },
            },
        }, {
            type: 'div',
            class: 'w_slider_out',
            children: [
                {
                    type: 'output',
                    name: 'out'
                }
            ]
        });
        this.$el.type = 'range';
        this.$el.min = 0;
        this.$el.max = 100;
        this.$el.step = 1;
        this.$el.dec = 0;
        this.$el.value = 0;
        
        this.update(data);

        waitFrame().then(() => this.#move(false));
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('color' in data)  this.$el.style.backgroundImage = `linear-gradient(${intToCol(data.color)}, ${intToCol(data.color)})`;
        if ('min' in data) this.$el.min = data.min;
        if ('max' in data) this.$el.max = data.max;
        if ('step' in data) this.$el.step = data.step;
        if ('disable' in data) this.disable(this.$el, data.disable);
        this.#move(false);
    }

    #move(send = true) {
        this.$el.style.backgroundSize = (Number(this.$el.value) - Number(this.$el.min)) * 100 / (Number(this.$el.max) - Number(this.$el.min)) + '% 100%';
        this.$out.innerHTML = Number(this.$el.value).toFixed(Number(this.data.dec ?? 0)) + (this.data.unit ?? '');
        if (send) this.set(this.$el.value);
    }
}

Renderer.register('slider', SliderWidget);
