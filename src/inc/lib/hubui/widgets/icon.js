class IconWidget extends BaseWidget {
    static wtype = 'icon';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'span',
            class: 'w-icon w-icon-led',
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
        if ('font_size' in data) this.$el.style.fontSize = data.font_size + 'px';
        if ('color' in data) this.$el.style.setProperty('--on-color', hexToCol(data.color));
        if ('value' in data) {
            if (Number(data.value)) this.$el.classList.add('w-icon-on');
            else this.$el.classList.remove('w-icon-on');
        }
    }

    static style = `
        .w-icon {
            font-weight: bold;
            font-family: 'FA5';
        }
        
        .w-icon-led {
            --on-color: var(--prim);
            color: var(--black);
            text-shadow: 0 0 4px #0003;
          }
          
          .w-icon-led.w-icon-on {
            color: var(--on-color);
            text-shadow: 0 0 10px var(--on-color);
          }`;
}