class LedWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_led',
            name: 'el',
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('color' in data) this.$el.style.setProperty('--on-color', intToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
        if ('value' in data) {
            if (data.value) this.$el.classList.add('w_led_on');
            else this.$el.classList.remove('w_led_on');
        }
    }
}

Renderer.register('led', LedWidget);
