class LogWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_area w_area_passive',
            name: 'el',
            style: {
                color: 'var(--prim)'
            },
        });
        this.$el.readonly = true;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) {
            this.$el.innerHTML = data.value.trim();
            this.$el.scrollTop = el.scrollHeight;
        }
        if ('rows' in data) {
            this.$el.rows = data.rows;
        }
    }
}
Renderer.register('log', LogWidget);
