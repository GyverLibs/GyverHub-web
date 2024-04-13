class SelectWidget extends BaseWidget {
    static wtype = 'select';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout( {
            tag: 'select',
            class: 'w-select',
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
        if ('value' in data) this.$el.value = data.value;
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
    }

    static style = `
        .w-select {
            border: none;
            outline: none;
            cursor: pointer;
            font-size: 18px;
            font-family: var(--font_f);
            width: 100%;
            border-radius: 4px;
            background: none;
            padding-left: 7px;
            min-height: 30px;
          }
          
          select option {
            background: var(--back);
          }`;
}