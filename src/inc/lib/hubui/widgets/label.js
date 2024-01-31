class Label extends BaseWidget {
    $lbl_cont;
    $lbl_icon;
    $lbl;

    constructor(data, renderer) {
        super(data, renderer);
        const $cont = document.createElement('div');
        $cont.classList.add('w_label');
        this.$lbl_cont = $cont;
        this.$container.append(this.$lbl_cont);

        const $icon = document.createElement('span');
        $icon.classList.add('w_icon');
        this.$lbl_icon = $icon;
        $cont.append($icon);

        const $lbl = document.createElement('label');
        this.$lbl = $lbl;
        $cont.append($lbl);
        
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
