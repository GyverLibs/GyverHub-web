class LedWidget extends BaseWidget {
    static wtype = 'led';
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

        if ('color' in data) this.$el.style.setProperty('--on-color', hexToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
        if ('value' in data) {
            if (data.value) this.$el.classList.add('w_led_on');
            else this.$el.classList.remove('w_led_on');
        }
    }

    static style = `
        .w_led {
            --on-color: var(--prim);
            margin: 0 auto;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--back);
            box-shadow: inset 0 0 2px 2px var(--black);
          }
          
          .w_led.w_led_on {
            background: var(--on-color);
            box-shadow: var(--on-color) 0 0 9px 1px, inset 2px 3px 0px 0px #fff3;
          }`;
}