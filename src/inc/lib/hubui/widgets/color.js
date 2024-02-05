class ColorWidget extends BaseWidget {
    $el;
    #pickr;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'button',
            class: 'icon icon_btn_big',
            name: 'el',
            text: '',
            style: {
                marginLeft: '-25px',
                color: '#000'
            }
        });

        this.#pickr = Pickr.create({
            el: this.$el,
            theme: 'nano',
            default: intToCol(data.value) ?? '#000',
            defaultRepresentation: 'HEXA',
            useAsButton: true,
            components: {
                preview: true,
                hue: true,
                interaction: {
                    hex: false,
                    input: true,
                    save: true
                }
            }
        }).on('save', (color) => {
            const col = color.toHEXA().toString();
            this.$el.style.color = col;
            this.set(colToInt(col));
        });
        
        this.update(data);
    }

    update(data) {
        super.update(data);

        let col = null;
        if ('value' in data) col = intToCol(data.value);
        if ('color' in data) col = intToCol(data.color);
        if ('disable' in data) this.disable(this.$el, data.disable);

        if (col) {
            try {
                this.$el.style.color = col;
                this.#pickr.setColor(col);
            } catch (e) { }
        }
    }
}

Renderer.register('color', ColorWidget);
