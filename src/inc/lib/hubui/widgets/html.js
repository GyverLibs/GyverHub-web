class HTMLWidget extends BaseWidget {
    static name = 'html';
    $el;
    #root;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            name: 'el',
        });
        this.#root = this.$el.attachShadow({
            mode: 'closed'
        });
        this.#root.innerHTML = waiter();
        
        this.update(data);
    }

    update(data) {
        super.update(data);

        if (!data.value) return;
        if (data.value.endsWith('.html')) {
            this.addFile(data.value, 'text', file => {
                this.#apply(file);
            });
        } else {
            this.#apply(data.value);
        }
    }

    #apply(text) {
        if (!this.renderer.device.info.trust) {
            this.#root.replaceChildren();
            this.setPlabel('[BLOCKED]');
            return;
        }
        this.#root.innerHTML = text;
    }
}