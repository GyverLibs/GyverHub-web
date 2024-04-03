class IconWidget extends BaseWidget {
    static wtype = 'icon';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'span',
            class: 'w_icon w_icon_led',
            text: "",
            name: 'el',
            style: {
                fontSize: '35px',
            },
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('icon' in data) this.$el.innerHTML = getIcon(data.icon);
        if ('fsize' in data) this.$el.style.fontSize = data.fsize + 'px';
        if ('color' in data) this.$el.style.setProperty('--on-color', hexToCol(data.color));
        if ('value' in data) {
            if (Number(data.value)) this.$el.classList.add('w_icon_on');
            else this.$el.classList.remove('w_icon_on');
        }
    }

    static style = `
        .w_icon {
            font-weight: bold;
            font-family: 'FA5';
        }
        
        .w_icon_led {
            --on-color: var(--prim);
            color: var(--black);
            text-shadow: 0 0 4px #0003;
          }
          
          .w_icon_led.w_icon_on {
            color: var(--on-color);
            text-shadow: 0 0 10px var(--on-color);
          }`;
}