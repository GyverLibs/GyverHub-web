class Renderer extends EventEmitter {
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
        if (typeof eval(cls).style === 'function') {
            addDOM(name + '_style', 'style', eval(cls).style(), EL('widget_styles'));
        }
    }

    /** @type {Device} */
    device;
    #widgets;
    #idMap;
    #idMapExt;
    #files;
    #filesLoaded;

    constructor(device) {
        super();
        this.device = device;
        this.#widgets = [];
        this.#idMap = new Map();
        this.#idMapExt = new Map();
        this.#files = [];
        this.#filesLoaded = false;
    }

    update(controls) {
        this.close();
        this.#widgets.length = 0;
        this.#idMap.clear();
        this.#idMapExt.clear();
        this.#files.length = 0;
        this.#filesLoaded = false;

        this._makeWidgets(this.#widgets, 'col', controls);
        this.#filesLoaded = true;
        this.#loadFiles();
    }

    #updateWWidth(type, data) {
        switch (type) {
            case 'row':
                let sumw = 0;
                for (const ctrl of data) {
                    if (!ctrl.type || Renderer.#VIRTUAL_WIDGETS.has(ctrl.type)) continue;
                    if (!ctrl.wwidth) ctrl.wwidth = 1;
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
    _makeWidgets(cont, type, data, isExt = false) {
        this.#updateWWidth(type, data);

        const idMap = isExt ? this.#idMapExt : this.#idMap;
        for (const ctrl of data) {
            if (!ctrl.type) continue;

            const cls = Renderer.#WIDGETS.get(ctrl.type);
            if (cls === undefined) {
                console.log('W: Missing widget:', ctrl);
                continue;
            }

            const obj = new cls(ctrl, this);
            idMap.set(obj.id, obj)
            cont.push(obj);
        }
    }

    async _set(widget, value, ack = true) {
        try {
            await this.device.set(widget.id, value);
        } catch (e) {
            console.log(e);
            if (ack) widget._handleSetError(e);
        }
        if (ack) widget._handleAck();
    }

    /**
     * Build HTML tree from widgets.
     * @returns {HTMLElement}
     */
    build() {
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

    /**
     * Register an UI file to load.
     * @param {Widget} widget
     * @param {string} path
     * @param {string} type
     * @param {(string) => undefined} callback 
     */
    _addFile(widget, path, type, callback) {
        let has = this.#files.some(f => f.widget.id == widget.id);
        if (!has) this.#files.push({
            widget, path, type, callback
        });
        this.#loadFiles();
    }

    async #loadFiles() {
        if (!this.#filesLoaded) return;

        while (this.#files.length) {
            const file = this.#files.shift();

            let res;
            try {
                res = await this.device.fetch(file.path, file.type, file.widget._handleFileProgress.bind(file.widget));
            } catch (e) {
                console.log(e);
                file.widget._handleFileError(e);
                continue;
            }
            file.widget._handleFileLoaded(res);
            file.callback(res);
        }
    }

    _getPlugin(name) {
        const widget = this.#idMap.get(name);
        if (!widget || !(widget instanceof PluginWidget)) return undefined;
        return widget.widgetClass;
    }
}

function registerWidgets() {
    Renderer.register('button', ButtonWidget);
    Renderer.register('canvas', CanvasWidget);
    Renderer.register('color', ColorWidget);
    Renderer.register('date', DateWidget);
    Renderer.register('time', TimeWidget);
    Renderer.register('datetime', DateTimeWidget);
    Renderer.register('dpad', DpadWidget);
    Renderer.register('flags', FlagsWidget);
    Renderer.register('gauge', GaugeWidget);
    Renderer.register('gauge_l', GaugeWidget);
    Renderer.register('gauge_r', GaugeWidget);
    Renderer.register('html', HTMLWidget);
    Renderer.register('image', ImageWidget);
    Renderer.register('icon', IconWidget);
    Renderer.register('input', InputWidget);
    Renderer.register('pass', PassWidget);
    Renderer.register('joy', JoyWidget);
    Renderer.register('label', Label);
    Renderer.register('led', LedWidget);
    Renderer.register('map', MapWidget);
    Renderer.register('menu', MenuWidget);
    Renderer.register('plot', PlotWidget);
    Renderer.register('plugin', PluginWidget);
    Renderer.register('custom', CustomWidget);
    Renderer.register('confirm', ConfirmWidget, true);
    Renderer.register('prompt', PromptWidget, true);
    Renderer.register('row', RowColWidget);
    Renderer.register('col', RowColWidget);
    Renderer.register('select', SelectWidget);
    Renderer.register('slider', SliderWidget);
    Renderer.register('spinner', SpinnerWidget);
    Renderer.register('stream', StreamWidget);
    Renderer.register('switch_t', SwitchWidget);
    Renderer.register('switch_i', SwitchIconWidget);
    Renderer.register('table', TableWidget);
    Renderer.register('tabs', TabsWidget);
    Renderer.register('text', TextWidget);
    Renderer.register('log', LogWidget);
    Renderer.register('text_f', TextFileWidget);
    Renderer.register('display', Display);
    Renderer.register('area', Area);
    Renderer.register('title', Title);
    Renderer.register('ui_file', UiFileWidget);
    Renderer.register('space', SpaceWidget);
    Renderer.register('dummy', Widget, true);

    // TODO: remove on new version
    Renderer.register('css', Widget, true);
    Renderer.register('js', Widget, true);
    Renderer.register('hook', Widget, true);
    Renderer.register('func', Widget, true);
}