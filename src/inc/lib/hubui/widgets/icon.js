class IconWidget extends BaseWidget {
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
        if ('color' in data) this.$el.style.setProperty('--on-color', intToCol(data.color));
        if ('value' in data) {
            if (Number(data.value)) this.$el.classList.add('w_icon_on');
            else this.$el.classList.remove('w_icon_on');
        }
    }
}

Renderer.register('icon', IconWidget);
