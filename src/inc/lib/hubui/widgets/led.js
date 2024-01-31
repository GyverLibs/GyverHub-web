class Led extends BaseWidget {
    $led;
    #color;

    constructor(data, renderer) {
        super(data, renderer);
        this.#color = getDefColor();

        const $led = document.createElement('div');
        $led.classList.add('w_led');
        this.$led = $led;
        this.$containder.append($led);

        this.update(data);
    }

    update(data) {
        if ('color' in data) this.color(intToCol(data.color));
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

    color(color) {
        this.#color = color;
    }
};