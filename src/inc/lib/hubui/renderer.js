class Renderer {
    static #WIDGETS = new Map();
    static #VIRTUAL_WIDGETS = new Set();

    /**
     * Register widget class
     * @param {string} name 
     * @param {typeof Widget} cls 
     * @param {boolean} virtual 
     */
    static register(name, cls, virtual = false) {
        Renderer.#WIDGETS.set(name, cls);
        if (virtual) Renderer.#VIRTUAL_WIDGETS.add(name);
    }

    /** @type {Device} */
    device;
    #widgets;
    #idMap;
    #prevWidth;
    #ackTimers;

    constructor(device, controls) {
        this.device = device;
        this.#widgets = [];
        this.#idMap = new Map();
        this.#prevWidth = 1;
        this.#ackTimers = new Map();

        this.device.resetUIFiles();
        this._makeWidgets(this.#widgets, 'col', controls);
        this.device.loadUIFiles();
    }

    #updateWWidth(type, data) {
        switch (type) {
            case 'row':
                let sumw = 0;
                for (const ctrl of data) {
                    if (!ctrl.type || Renderer.#VIRTUAL_WIDGETS.has(ctrl.type)) continue;
                    if (!ctrl.wwidth) ctrl.wwidth = this.#prevWidth;
                    else this.#prevWidth = ctrl.wwidth;
                    sumw += ctrl.wwidth;
                }
                for (const ctrl of data) {
                    if (!ctrl.type || Renderer.#VIRTUAL_WIDGETS.has(ctrl.type)) continue;
                    ctrl.wwidth_t = ctrl.wwidth * 100 / sumw;
                }
                break;

            case 'col':
                for (const ctrl of data) {
                    if (!ctrl.type || Renderer.#VIRTUAL_WIDGETS.has(ctrl.type)) continue;
                    ctrl.wwidth_t = 100;
                }
                break;
        }
    }

    /**
     * Generate widgets from layout.
     * @param {Widget[]} cont 
     * @param {'row' | 'col'} type 
     * @param {object[]} data 
     */
    _makeWidgets(cont, type, data) {
        this.#updateWWidth(type, data);
        
        for (const ctrl of data) {
            if (!ctrl.type) continue;

            const cls = Renderer.#WIDGETS.get(ctrl.type);
            if (cls === undefined) {
                console.log('W: Missing widget:', ctrl);
                continue;
            }

            const obj = new cls(ctrl, this);
            this.#idMap.set(obj.id, obj)
            cont.push(obj);
        }
    }

    async _set(widget, value, ack = true) {
        try {
            await this.device.set(widget.id, value);
        } catch (e) {
            console.log(e);
            if (ack) widget.handleSetTimeout();
        }
        if (ack) widget.handleAck();
    }

    /**
     * Build HTML tree from widgets.
     * @returns {HTMLElement}
     */
    build(){
        const res = [];
        for (const w of this.#widgets) {
            const $w = w.build();
            if ($w) res.push($w);
        }

        return res;
    }

    /**
     * Закрытие рендерера (остановка таймеров). Нужно вызвать перед удалением рендерера.
     */
    close() {
        for (const t of this.#ackTimers.values())
            clearTimeout(t);
        this.#ackTimers.clear();
        for (const w of this.#idMap.values()) {
            w.close();
        }
    }

    /**
     * Обработчик пакета update с устройства
     * @param {string} id Widget id
     * @param {object} data 
     */
    handleUpdate(id, data) {
        const w = this.#idMap.get(id);
        if (w) w.update(data);
    }
}

// TODO: remove on new version
Renderer.register('css', Widget, true);
Renderer.register('js', Widget, true);
Renderer.register('hook', Widget, true);
Renderer.register('func', Widget, true);
Renderer.register('plugin', Widget, true);
