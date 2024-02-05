class LedWidget extends BaseWidget {
    $led;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_led',
            name: 'led',
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('color' in data) this.$el.style.setProperty('--on-color', intToCol(data.color));
        if ('disable' in data) this.disable(this.$led, data.disable);
        if ('value' in data) {
            if (data.value) this.$led.classList.add('w_led_on');
            else this.$led.classList.remove('w_led_on');
        }
    }
}

Renderer.register('led', LedWidget);
