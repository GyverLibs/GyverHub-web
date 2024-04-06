class TitleWidget extends BaseWidget {
    static wtype = 'title';
    $cont;
    $icon;
    $label;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div', 
            class: 'w-label',
            name: 'cont',
            style: {
                fontSize: '35px'
            },
            children: [
                {
                    tag: 'span',
                    class: 'w-icon',
                    name: 'icon',
                },
                {
                    tag: 'label',
                    name: 'label',
                }
            ]
        });
        
        this.update(data);
    }

    update(data) {
        data.nolabel = true;
        data.notab = true;
        data.square = false;
        super.update(data);

        if ('value' in data) this.$label.textContent = data.value;
        if ('color' in data) this.$cont.style.color = hexToCol(data.color);
        if ('font_size' in data) this.$cont.style.fontSize = data.font_size + 'px';
        if ('align' in data) this.align(data.align);
        if ('icon' in data) this.$icon.innerHTML = data.icon ? (getIcon(data.icon) + ' ') : '';
    }
}