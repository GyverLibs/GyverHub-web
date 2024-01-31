class Display extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        createElement(this, {
            type: 'textarea',
            class: 'w_disp',
            name: 'el',
            style: {
                fontSize: '20px',
                background: 'var(--prim)'
            },
            also($el) {
                $el.readonly = true;
                $el.rows = 2;
                $el.addEventListener('wheel', e => {
                    e.preventDefault();
                    $el.scrollLeft += e.deltaY;
                })
            }
        });
    }

    update(data) {
        if ('value' in data) this.$el.innerHTML = data.value;
        if ('color' in data) this.$el.style.background = intToCol(data.color);
        if ('fsize' in data) this.$el.style.fontSize = data.fsize + 'px';
        if ('rows' in data) this.$el.rows = data.rows;
    }
}
