class SpinnerWidget extends BaseWidget {
    $el;
    $unit;
    #dec = 0;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_spinner_row',
            children: [
                {
                    type: 'button',
                    class: 'icon icon_btn btn_no_pad',
                    text: '',
                    events: {
                        click: () => this.#spin(-1)
                    }
                },
                {
                    type: 'div',
                    class: 'w_spinner_block',
                    children: [
                        {
                            type: 'input',
                            class: 'w_spinner',
                            name: 'el',
                            events: {
                                input: () => this.#spin(0),
                                keydown: e => {
                                    if (e.key == 'Enter') {
                                        e.preventDefault();
                                        this.#spin(0);
                                    }
                                },
                                wheel: e => this.#wheel(e),
                            }
                        },
                        {
                            type: 'label',
                            class: 'w_spinner_unit',
                            name: 'unit',
                            events: {
                                wheel: e => this.#wheel(e),
                            }
                        }
                    ]
                },
                {
                    type: 'button',
                    class: 'icon icon_btn btn_no_pad',
                    text: '',
                    events: {
                        click: () => this.#spin(+1)
                    }
                }
            ]
        });
        this.$el.type = 'number';
        this.$el.value = 0;
        this.$el.min = 0;
        this.$el.max = 100;
        this.$el.step = 1;
        
        this.disable(this.$el, data.disable);
        this.update(data);
        waitFrame().then(() => this.#spin(0, false));
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = data.value;
        if ('min' in data) this.$el.min = data.min;
        if ('max' in data) this.$el.max = data.max;
        if ('step' in data) this.$el.step = data.step;
        if ('dec' in data) this.#dec = data.dec;
        if ('unit' in data) this.$unit.textContent = data.unit;
        this.#spin(0, false);
    }

    #spin(dir, send = true) {
        const el = this.$el;
        if (dir && el.getAttribute("disabled")) return;
        let val = Number(el.value) + Number(el.step) * Math.sign(Number(dir));
        val = Math.max(Number(el.min), val);
        val = Math.min(Number(el.max), val);
        el.value = Number(val).toFixed(Number(this.#dec));
        el.style.width = el.value.length + 'ch';
        if (send) this.set(el.value);
    }

    #wheel(e) {
        e.preventDefault();
        this.#spin(-e.deltaY);
    }
}

Renderer.register('spinner', SpinnerWidget);
