class PluginLoader extends Widget {
    static wtype = 'plugin';

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);

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
        // if (!this.renderer.device.info.trust) return;
        if (Renderer.registerPlugin(text))
            this.renderer.dispatchEvent(new Event('pluginloaded'));
    }
}

class LoadWidget extends Widget {
    static wtype = 'load';
    $el;
    #widget;

    constructor(data, renderer) {
        super(data, renderer);

        this.$el = document.createElement('div');
        this.$el.classList.add('widget_col');
        this.$el.style.width = this.data.wwidth_t + '%';
        this.$el.innerHTML = waiter();

        const w = this.renderer._getPlugin(data.wtype);
        if (w) this.#apply(w);
        else this.renderer.addEventListener('pluginloaded', () => {
            const w = this.renderer._getPlugin(data.type);
            if (w) this.#apply(w);
        });

        this.update(data);
    }

    update(data) {
        super.update(data);
        if (this.#widget) this.#widget.update(data);
    }

    #apply(w) {
        if (!this.renderer.device.info.trust) {
            this.$el.innerHTML = noTrust();
            return;
        }
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


/*
class PluginWidget extends Widget {
    static wtype = 'plugin';
    widgetClass;

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);

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
        if (!this.renderer.device.info.trust) return;

        const f = new Function('return (' + text + ');');
        this.widgetClass = f();
        this.renderer.dispatchEvent(new Event('pluginloaded'));
    }
}

class CustomWidgetOld extends Widget {
    static wtype = 'custom';
    $el;
    #widget;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.createElement('div');
        this.$el.classList.add('widget_col');
        this.$el.style.width = this.data.wwidth_t + '%';
        this.$el.innerHTML = waiter();

        const w = this.renderer._getPlugin(data.wtype);
        if (w) this.#apply(w);
        else this.renderer.addEventListener('pluginloaded', () => {
            const w = this.renderer._getPlugin(data.wtype);
            if (w) this.#apply(w);
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if (this.#widget) this.#widget.update(data);
    }

    #apply(w) {
        if (!this.renderer.device.info.trust) {
            this.$el.innerHTML = '<p>Settings/Trust device first</p>';
            return;
        }
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
*/