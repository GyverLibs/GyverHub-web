class SwitchWidget extends BaseWidget {
    $el;
    $slider;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'switch_cont',
            children: [
                {
                    type: 'label',
                    class: 'switch',
                    children: [
                        {
                            type: 'input',
                            name: 'el',
                            events: {
                                change: () => {
                                    this.$slider.style.backgroundColor = this.$el.checked ? intToCol(this.data.color) ?? 'var(--prim)' : '';
                                    this.set(this.$el.checked ? 1 : 0)
                                }
                            }
                        },
                        {
                            type: 'span',
                            class: 'slider',
                            name: 'slider',
                        }
                    ]
                }
            ]
        });
        this.$el.type = 'checkbox';
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('color' in data && this.$el.checked) this.$slider.style.backgroundColor = intToCol(data.color);
        if ('value' in data) {
            this.$el.checked = (Number(data.value) == 1);
            this.$slider.style.backgroundColor = this.$el.checked ? intToCol(this.data.color) ?? 'var(--prim)' : '';
        }
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('switch_t', SwitchWidget);


class SwitchIconWidget extends BaseWidget {
    $el;
    $slider;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'icon icon_btn_big w_swicon',
            name: 'el',
            style: {
                fontSize: '45px',
                width: '75px',
            },
            events: {
                click: () => {
                    if (this.$el.getAttribute('disabled')) return;
                    this.$el.classList.toggle('w_swicon_on');
                    this.set(this.$el.classList.contains('w_swicon_on') ? 1 : 0);
                }
            }
        });
        
        this.update(data);
    }
    
    update(data) {
        super.update(data);

        if ('value' in data) {
            if (Number(data.value) == 1) this.$el.classList.add('w_swicon_on');
            else this.$el.classList.remove('w_swicon_on');
        }
        if ('fsize' in data) {
            this.$el.style.fontSize = data.fsize + 'px';
            this.$el.style.width = data.fsize * 1.7 + 'px';
        }
        if ('icon' in data) this.$el.innerHTML = getIcon(data.icon);
        if ('color' in data) this.$el.style.setProperty('--on-color', intToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

Renderer.register('switch_i', SwitchIconWidget);
