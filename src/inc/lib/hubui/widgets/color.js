class ColorWidget extends BaseWidget {
    static wtype = 'color';
    $el;
    #pickr;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'button',
            class: 'icon icon_btn_big',
            name: 'el',
            text: '',
            style: {
                color: '#000'
            }
        });

        waitRender(this.$el).then(() => {
            this.#pickr = Pickr.create({
                el: this.$el,
                theme: 'nano',
                default: data.value ? intToCol(data.value) : '#000',
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
                this.#pickr.hide();
            });

            this.update(data);
        });
    }

    update(data) {
        super.update(data);

        let col = null;
        if ('value' in data) col = intToCol(data.value) ?? '#000';
        if ('disable' in data) this.disable(this.$el, data.disable);

        if (col) {
            try {
                this.$el.style.color = col;
                this.#pickr.setColor(col);
            } catch (e) { }
        }
    }

    close() {
        this.#pickr.destroyAndRemove();
    }
}


function colToInt(str) {
    return parseInt(str.substr(1), 16);
}
