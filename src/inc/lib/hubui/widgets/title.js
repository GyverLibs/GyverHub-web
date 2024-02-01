class Title extends BaseWidget {
    $cont;
    $icon;
    $label;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div', 
            class: 'w_label',
            name: 'cont',
            style: {
                fontSize: '35px'
            },
            children: [
                {
                    type: 'span',
                    class: 'w_icon',
                    name: 'icon',
                },
                {
                    type: 'label',
                    name: 'label',
                }
            ]
        });
        
        this.align(data.align);
        this.update(data);
    }

    update(data) {
        if ('value' in data) this.$label.innerHTML = data.value;
        if ('color' in data) this.$cont.style.color = intToCol(data.color);
        if ('fsize' in data) this.$cont.style.fontSize = data.fsize + 'px';
        if ('align' in data) this.align(data.align);
        if ('icon' in data) this.$icon.innerHTML = data.icon ? (getIcon(data.icon) + ' ') : '';
    }
}
Renderer.register('title', Title);