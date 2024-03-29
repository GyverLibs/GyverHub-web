class SelectWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout( {
            type: 'select',
            class: 'w_select',
            name: 'el',
            style: {
                color: 'var(--prim)'
            },
            events: {
                change: () => this.set(this.$el.value)
            },
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('text' in data) {
            const options = [];
            if (data.text) {
                const ops = data.text.toString().split(/[;,]/);
                for (const i in ops) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = ops[i].trim();
                    option.selected = (i == this.$el.value);
                    options.push(option);
                }
            }
            this.$el.replaceChildren(...options);
        }
        if ('color' in data) this.$el.style.color = intToCol(data.color);
    }
}

Renderer.register('select', SelectWidget);
