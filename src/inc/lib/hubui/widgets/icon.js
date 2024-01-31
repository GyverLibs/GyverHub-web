class Icon extends BaseWidget {
    #color;
    $icon;

    constructor(data, renderer) {
        this(data, renderer);
        this.#color = getDefColor();

        this.$container.append(createElement(this, {
            type: 'span',
            class: 'w_icon w_icon_led',
            text: "",
            name: 'icon',
            style: {
                fontSize: '35px',
            },
        }));

        this.update(data);
    }

    update(data) {
        if ('icon' in data) this.$icon.innerHTML = getIcon(data.icon);
        if ('fsize' in data) this.$icon.style.fontSize = data.fsize + 'px';
        if ('color' in data) this.#color = intToCol(data.color);
        if ('value' in data) {
            if (Number(data.value)) {
                this.$icon.classList.add('w_icon_on');
                this.$icon.style.color = this.#color;
                this.$icon.style.textShadow = '0 0 10px ' + this.#color;
            } else {
                this.$icon.classList.remove('w_icon_on');
                this.$icon.style.color = '';
                this.$icon.style.textShadow = '';
            }
        }
    }
};