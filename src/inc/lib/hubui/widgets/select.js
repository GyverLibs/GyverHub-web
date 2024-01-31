class Select extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.$container.append(createElement(this, {
            type: 'select',
            class: 'w_select',
            name: 'el',
            style: {
                color: 'var(--prim)'
            },
            also($el) {
                $el.value = data.value;
                $el.addEventListener('change', () => {
                    this.set($el.value);
                });
            }
        }));

        this.update(data);
        this.disable(this.$el, data.disable);
    }

    update(data) {
        if ('value' in data) this.$el.value = data.value;
        if ('text' in data) {
            while (this.$el.options.length > 0) this.$el.remove(0); // clear
            if (data.text) {
                const ops = data.text.toString().split(';');
                for (const i in ops) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = ops[i].trim();
                    option.selected = (i == this.$el.value);
                    el.add(option);
                }
            }
        }
        if ('color' in data) this.$el.style.color = intToCol(data.color);
    }
}
