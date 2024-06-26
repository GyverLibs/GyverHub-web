class SwitchWidget extends BaseWidget {
    static wtype = 'switch_t';
    $el;
    $slider;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'switch-cont',
            children: [
                {
                    tag: 'label',
                    class: 'switch',
                    children: [
                        {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'el',
                            events: {
                                change: () => {
                                    this.$slider.style.backgroundColor = this.$el.checked ? hexToCol(this.data.color) : '';
                                    this.set(this.$el.checked ? 1 : 0)
                                }
                            }
                        },
                        {
                            tag: 'span',
                            class: 'slider',
                            name: 'slider',
                        }
                    ]
                }
            ]
        });
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('color' in data && this.$el.checked) this.$slider.style.backgroundColor = hexToCol(data.color);
        if ('value' in data) {
            this.$el.checked = (Number(data.value) == 1);
            this.$slider.style.backgroundColor = this.$el.checked ? hexToCol(this.data.color) : '';
        }
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class SwitchIconWidget extends BaseWidget {
    static wtype = 'switch_i';
    $el;
    $slider;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'icon icon-btn-big w-swicon',
            name: 'el',
            style: {
                fontSize: '45px',
                width: '75px',
            },
            events: {
                click: () => {
                    if (this.$el.getAttribute('disabled')) return;
                    this.$el.classList.toggle('w-swicon-on');
                    this.set(this.$el.classList.contains('w-swicon-on') ? 1 : 0);
                }
            }
        });
        
        this.update(data);
    }
    
    update(data) {
        super.update(data);

        if ('value' in data) {
            if (Number(data.value) == 1) this.$el.classList.add('w-swicon-on');
            else this.$el.classList.remove('w-swicon-on');
        }
        if ('font_size' in data) {
            this.$el.style.fontSize = data.font_size + 'px';
            this.$el.style.width = data.font_size * 1.7 + 'px';
        }
        if ('icon' in data) this.$el.innerHTML = getIcon(data.icon);
        if ('color' in data) this.$el.style.setProperty('--on-color', hexToCol(data.color));
        if ('disable' in data) this.disable(this.$el, data.disable);
    }

    static style = `
        .w-swicon {
            --on-color: var(--prim);
            border-radius: 50%;
            aspect-ratio: 1;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            color: var(--on-color);
            border: 2px solid var(--on-color);
          }
          
          .w-swicon-on {
            color: var(--tab);
            background: var(--on-color);
          }`;
}