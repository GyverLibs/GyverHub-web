class Label extends BaseWidget {
    $lbl_cont;
    $lbl_icon;
    $lbl;

    constructor(data, renderer) {
        super(data, renderer);

        this.$container.append(createElement(this, {
            type: 'div',
            class: 'w_label',
            name: 'lbl_cont',
            children: [
                {
                    type: 'span',
                    class: 'w_icon',
                    name: 'lbl_icon',
                },
                {
                    type: 'label',
                    name: 'lbl',
                }
            ]
        }));
        
        this.update(data);
    }

    update(id, data) {
        if ('value' in data) this.$lbl.innerHTML = data.value;
        if ('color' in data) this.$lbl_cont.style.color = intToCol(data.color);
        if ('fsize' in data) this.$lbl_cont.style.fontSize = data.fsize + 'px';
        if ('align' in data) this.align(data.align);
        if ('icon' in data) this.$lbl_icon.innerHTML = data.icon ? (getIcon(data.icon) + ' ') : '';
    }
}
Renderer.register('label', Label);
