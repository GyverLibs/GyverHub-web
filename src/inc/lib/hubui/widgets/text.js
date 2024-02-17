class TextWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_area w_area_passive',
            name: 'el'
        });
        this.$el.readOnly = true;
        this.$el.rows = 5;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('text', TextWidget);


class LogWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_area w_area_passive',
            name: 'el',
            style: {
                color: 'var(--prim)'
            },
        });
        this.$el.readOnly = true;
        this.$el.rows = 5;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) {
            this.$el.value = data.value.trim();
            this.$el.scrollTop = this.$el.scrollHeight;
        }
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('log', LogWidget);


class TextFileWidget extends BaseWidget {
    $el;
    #path;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_area w_area_passive',
            name: 'el'
        });
        this.$el.readOnly = true;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.#path = data.value;
        if ('rows' in data) this.$el.rows = data.rows;
        if ('action' in data || 'value' in data) {
            this.renderer.device.addFile(this.id, this.#path, 'text', (file) => {
                this.$el.value = file;
                this.setPlabel();
            });
        }
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('text_f', TextFileWidget);


class Display extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_disp',
            name: 'el',
            style: {
                fontSize: '20px',
                background: 'var(--prim)'
            },
            events: {
                wheel: e => {
                    e.preventDefault();
                    this.$el.scrollLeft += e.deltaY;
                }
            }
        });
        this.$el.readOnly = true;
        this.$el.rows = 2;

        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('color' in data) this.$el.style.background = intToCol(data.color);
        if ('fsize' in data) this.$el.style.fontSize = data.fsize + 'px';
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('display', Display);


class Area extends BaseWidget {
    $el;
    #changed;
    #regex;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'textarea',
            class: 'w_area',
            name: 'el',
            events: {
                keydown: e => {
                    if (e.key == 'Enter') this.#send(true);
                },
                input: () => {
                    this.#changed = true;
                },
                focusout: () => {
                    this.#send();
                }
            },
        });
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('regex' in data) this.#regex = data.regex;
        if ('color' in data) this.$el.style.boxShadow = '0px 2px 0px 0px ' + intToCol(data.color);
        if ('value' in data) this.$el.value = data.value;
        if ('maxlen' in data) this.$el.maxlength = Math.ceil(data.maxlen);
        if ('rows' in data) this.$el.rows = data.rows;
        if ('disable' in data) this.disable(this.$el, data.disable);
    }

    #send(force = false) {
        if (this.#regex) {
            const r = new RegExp(this.#regex);
            if (!r.test(this.$el.value)) {
                showPopupError("Wrong text!");
                return;
            }
        }
        if (force || this.#changed) {
            this.#changed = false;
            this.set(this.$el.value);
        }
    }
}

Renderer.register('area', Area);

