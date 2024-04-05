class PluginLoader extends Widget {
    static wtype = 'plugin';
    #applyType;

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    async update(data) {
        super.update(data);
        if (!this.renderer.device.info.trust) {
            let res = await asyncConfirm(lang.unblock);
            if (res) this.renderer.device.info.trust = 1;
            setTimeout(() => location.reload(), 200);
            return;
        }

        if (!data.value || !data.wtype) return;
        this.#applyType = data.wtype;
        let plugins = getPlugins(this.renderer.device.info.id);
        if (data.wtype in plugins) {
            console.log('Already have plugin ' + data.wtype);
            return;
        }

        if (data.value.endsWith('.js')) {
            this.addFile(data.value, 'text', file => {
                this.#apply(file);
            });
        } else {
            this.#apply(data.value);
        }
    }

    async #apply(text) {
        if (!this.renderer.device.info.trust) return;

        let reg = this.renderer.widgetBase.registerText(text, this.#applyType);
        if (reg) {
            let id = this.renderer.device.info.id;
            let plugins = getPlugins(id);
            plugins[this.#applyType] = text.replace(reg, this.#applyType);
            savePlugins(plugins, id);
            this.renderer.dispatchEvent(new Event('pluginloaded'));
        }
    }
}

class LoadWidget extends Widget {
    static wtype = 'load';
    $el;
    #widget;

    constructor(data, renderer) {
        super(data, renderer);

        this.$el = makeDOM(this, {
            tag: 'div',
            html: waiter(),
            class: 'widget-main',
            style: {
                width: this.data.wwidth_perc + '%'
            }
        });

        const w = this.renderer._getPlugin(data.type);
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
        if ($w) this.$el.replaceWith($w);
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