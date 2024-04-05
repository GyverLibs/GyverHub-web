/*@[if_target:none]*/
class UiFileWidget extends Widget {
    static wtype = 'ui_file';
    $el;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.createElement('div');
        this.$el.classList.add('container-col');
        this.$el.style.width = this.data.wwidth_perc + '%';
    
        this.update(data);
    }

    update(data) {
        super.update(data);
        if (!("value" in data)) return;

        if (typeof value === 'string')
            this.addFile(data.value, 'text', (file) => {
                let controls = null;
                try {
                    controls = JSON.parse('[' + file + ']');
                } catch (e) {
                    console.log('JSON parse error in ui_json from ' + data.path);
                }
                this.#setControls(controls);
            });
        else this.#setControls(data.value);
    }

    #setControls(controls){
        const children = [];
        this.renderer._makeWidgets(children, 'col', controls, true);
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
/*@/[if_target:none]*/