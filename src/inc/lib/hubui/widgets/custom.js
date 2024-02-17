class HTMLWidget extends BaseWidget {
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

Renderer.register('html', HTMLWidget);


class CustomWidget extends Widget {
    $el;
    #widget;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.createElement('div');
        this.$el.classList.add('widget_col');
        this.$el.style.width = this.data.wwidth_t + '%';
        this.$el.innerHTML = waiter();
        
        this.update(data);
    }

    update(data) {
        super.update(data);

        if (this.#widget) this.#widget.update(data);

        if (!data.value) return;
        if (data.value.endsWith('.js')) {
            this.addFile(data.value, 'text', file => {
                this.#apply(file);
            });
        } else {
            this.#apply(data.value);
        }
    }

    #apply(text) {
        if (!this.renderer.device.info.trust) {
            this.$el.innerHTML = '<p>Dangerous element blocked!</p>';
            return;
        }
        const f = new Function('return (' + text + ');');
        const w = f();
        if (this.#widget) this.#widget.close();
        this.#widget = new w(this.data, this.renderer);
        const $w = this.#widget.build();
        if ($w) this.$el.replaceChildren($w);
        else this.$el.replaceChildren();
    }

    build() {
        return this.$el;
    }

    close() {
        if (this.#widget) this.#widget.close();
        this.#widget = undefined;
    }
    
    handleSetTimeout() {
        if (this.#widget) this.#widget.handleSetTimeout();
    }

    handleAck() {
        if (this.#widget) this.#widget.handleAck();
    }
}

Renderer.register('custom', CustomWidget);


class UiFileWidget extends Widget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.createElement('div');
        this.$el.classList.add('widget_col');
        this.$el.style.width = this.data.wwidth_t + '%';
    
        this.addFile(data.value, 'text', (file) => {
            let controls = null;
            try {
                controls = JSON.parse('[' + file + ']');
            } catch (e) {
                console.log('JSON parse error in ui_json from ' + data.path);
            }
            
            const children = [];
            this.renderer._makeWidgets(children, 'col', controls);
            this.$el.replaceChildren()
            for (const w of children) {
                const $w = w.build();
                if ($w) this.$el.append($w);
            }
        });
    }

    build() {
        return this.$el;
    }
}

Renderer.register('ui_file', UiFileWidget);
