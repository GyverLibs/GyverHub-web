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
        this.makeWidgets(this.#widgets, 'col', controls);
        this.device.loadUIFiles();
    }

    get #single(){
        return this.device.info.ui_mode == 1 || this.device.info.ui_mode == 3;
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

    set(widget, value, ack = true) {
        if (ack) {
            const old = this.#ackTimers.get(widget.id);
            if (old) clearTimeout(old);
            const t = setTimeout(() => {
                this.#ackTimers.delete(widget.id);
                widget.handleSetTimeout();
            }, 3000);
            this.#ackTimers.set(widget.id, t);
        }
        this.device.set(widget.id, value);
    }

    handleAck(name) {
        const t = this.#ackTimers.get(name);
        if (t) {
            clearTimeout(t);
            this.#ackTimers.delete(name);
            const w = this.#idMap.get(name);
            if (w) w.handleAck();
        }
    }

    close() {
        for (const t of this.#ackTimers.values())
            clearTimeout(t);
        this.#ackTimers.clear();
    }

    /**
     * Generate widgets from layout.
     * @param {Widget[]} cont 
     * @param {'row' | 'col'} type 
     * @param {object[]} data 
     */
    makeWidgets(cont, type, data) {
        this.#updateWWidth(type, data);
        
        for (const ctrl of data) {
            if (!ctrl.type) continue;

            if ((ctrl.type == 'row' || ctrl.type == 'col') && this.#single) {
                this.makeWidgets(cont, 'col', ctrl.data);
            } else {
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
    }

    /**
     * Build HTML tree from widgets.
     * @returns {HTMLElement}
     */
    build(){
        const $root = createElement(null, {
            type: "div",
            class: "main_col",
            style: {
                visibility: 'hidden',
                maxWidth: this.device.info.main_width + 'px',
            }
        });

        if (this.device.info.ui_mode >= 2) {
            $root.style.display = 'grid';
            $root.style.gridTemplateColumns = `repeat(auto-fit, minmax(${this.device.info.ui_block_width}px, 1fr))`;
        } else {
            $root.style.display = 'block';
        }

        for (const w of this.#widgets) {
            const $w = w.build();
            if ($w) $root.append($w);
        }

        $root.style.visibility = 'visible';
        return $root;
    }

    /**
     * Apply update to widget.
     * @param {string} id Widget id
     * @param {object} data 
     */
    applyUpdate(id, data) {
        const w = this.#idMap.get(id);
        if (w) w.update(data);
    }
}

class RowColWidget extends Widget {
    #children;
    #data;

    constructor(data, renderer) {
        super(data, renderer);
        this.#children = [];
        this.#data = data;

        renderer.makeWidgets(this.#children, data.type, data.data);
    }

    build() {
        const $root = document.createElement('div');
        $root.classList.add('widget_' + this.#data.type);
        $root.style.width = this.#data.wwidth_t + '%';

        for (const w of this.#children) {
            $root.append(w.build());
        }

        return $root;
    }
}

Renderer.register('row', RowColWidget);
Renderer.register('col', RowColWidget);


class MenuWidget extends Widget {
    constructor(data, renderer) {
        super(data, renderer);
        Menu.add(data);
    }
}

Renderer.register('menu', MenuWidget);
