class Led extends BaseWidget {
    $led;
    #color;

    constructor(data, renderer) {
        super(data, renderer);
        this.#color = getDefColor();

        this.makeLayout({
            type: 'div',
            class: 'w_led',
            name: 'led',
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('color' in data) this.#color = intToCol(data.color);
        if ('disable' in data) this.disable(this.$led, data.disable);
        if ('value' in data) {
            if (data.value) {
                this.$led.classList.add('w_led_on');
                this.$led.style.background = this.#color;
                this.$led.style.boxShadow = this.#color + ' 0 0 9px 1px, inset 2px 3px 0px 0px #fff3;';
            } else {
                this.$led.classList.remove('w_led_on');
                this.$led.style.background = '';
                this.$led.style.boxShadow = '';
            }
        }
    }
};
Renderer.register('led', Led);
