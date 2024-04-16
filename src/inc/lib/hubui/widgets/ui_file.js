class UiFileWidget extends Widget {
    static wtype = 'ui_file';
    $el;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.createElement('div');
        this.$el.classList.add('container-' + data.rowcol);
        this.$el.style.width = this.data.wwidth_perc + '%';

        this.update(data);
    }

    update(data) {
        super.update(data);
        if (!('value' in data)) return;

        if (typeof data.value === 'string') {
            if (data.value.endsWith('.json')) {
                this.addFile(data.value, 'text', (file) => this.#apply(file));
            } else {
                this.#apply(data.value);
            }
        } else {
            this.#setControls(data.value);
        }
    }

    #apply(text) {
        if (!text || !text.length) return;

        text = decodeHubJson(text);
        if (!text) {
            console.log('Device has newer API version. Update App!');
            return;
        }

        let controls = [];
        try {
            controls = JSON.parse(text);
        } catch (e) {
            console.log('JSON parse error in ui_json from ' + text);
        }
        this.#setControls(controls);
    }

    #setControls(controls) {
        const children = [];
        this.renderer._makeWidgets(children, this.data.rowcol, controls, true);
        this.$el.replaceChildren()
        for (const w of children) {
            const $w = w.build();
            if ($w) this.$el.append($w);
        }
    }

    build() {
        return this.$el;
    }
}