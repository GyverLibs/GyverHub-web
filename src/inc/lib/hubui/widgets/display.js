class Display extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_disp',
            name: 'el',
            style: {
                fontSize: '20px',
                background: 'var(--prim)'
            },
            events: {
                wheel: e => {
                    e.preventDefault();
                    this.$el.scrollLeft += e.deltaY;
                }
            }
        });
        this.$el.readonly = true;
        this.$el.rows = 2;

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.innerHTML = data.value;
        if ('color' in data) this.$el.style.background = intToCol(data.color);
        if ('fsize' in data) this.$el.style.fontSize = data.fsize + 'px';
        if ('rows' in data) this.$el.rows = data.rows;
    }
}
Renderer.register('display', Display);
