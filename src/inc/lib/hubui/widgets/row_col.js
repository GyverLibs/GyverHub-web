class RowColWidget extends Widget {
    #children;
    #data;

    constructor(data, renderer) {
        super(data, renderer);
        this.#children = [];
        this.#data = data;

        this.renderer._makeWidgets(this.#children, data.type, data.data);
    }

    build() {
        const $root = document.createElement('div');
        $root.classList.add('widget_' + this.#data.type);
        $root.style.width = this.#data.wwidth_t + '%';

        for (const w of this.#children) {
            const $w = w.build();
            if ($w) $root.append($w);
        }

        return $root;
    }
}

Renderer.register('row', RowColWidget);
Renderer.register('col', RowColWidget);
