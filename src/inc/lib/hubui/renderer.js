class Renderer {
    static #WIDGETS = new Map();
    static #VIRTUAL_WIDGETS = new Set();

    static register(name, cls, virtual = false) {
        Renderer.#WIDGETS.set(name, cls);
        if (virtual) Renderer.#VIRTUAL_WIDGETS.add(name);
    }

    device;
    #widgets;
    #idMap;
    prevWidth;

    constructor(id, controls) {
        this.device = hub.dev(id);
        this.#widgets = [];
        this.#idMap = new Map();
        this.prevWidth = 1;

        this.device.resetFiles();
        this.makeWidgets(this.#widgets, 'col', controls);
        this.device.checkFiles();
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
                    if (!ctrl.wwidth) ctrl.wwidth = this.prevWidth;
                    else this.prevWidth = ctrl.wwidth;
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

    makeWidgets(cont, type, data) {
        this.#updateWWidth(type, data);
        
        for (const ctrl of data) {
            if (!ctrl.type) continue;

            if ((ctrl.type == 'row' || ctrl.type == 'col') && this.#single) {
                this.makeWidgets(cont, 'col', ctrl.data);
            } else {
                const cls = Renderer.#WIDGETS.get(ctrl.type);
                const obj = new cls(ctrl, this);
                this.#idMap.set(obj.id, obj)
                cont.append(obj);
            }
        }
    }

    build(){
        const $root = document.createElement("div");
        $root.classList.add('main_col');
        $root.style.visibility = 'hidden';
        $root.style.maxWidth = this.device.info.main_width + 'px';

        if (this.device.info.ui_mode >= 2) {
            $root.style.display = 'grid';
            $root.style.gridTemplateColumns = `repeat(auto-fit, minmax(${this.device.info.ui_block_width}px, 1fr))`;
        } else {
            $root.style.display = 'block';
        }

        for (const w of this.#widgets) {
            $root.append(w.build());
        }

        $root.style.visibility = 'visible';
        return $root;
    }

    applyUpdate(id, data) {
        let w = this.#idMap.get(id);
        if (w) w.update(data);
    }
}

class RowColWidget extends Widget {
    #children;

    constructor(data, renderer) {
        super(data, renderer);
        this.#children = [];

        renderer.makeWidgets(this.#children, data.type, data.data);
    }

    build() {
        const $root = document.createElement('div');
        $root.classList.add('widget_' + data.type);
        $root.style.width = data.wwidth_t + '%';

        for (const w of this.#children) {
            $root.append(w.build());
        }

        return $root;
    }
}

Renderer.register('row', RowColWidget);
Renderer.register('col', RowColWidget);
