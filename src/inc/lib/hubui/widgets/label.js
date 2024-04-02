class LabelWidget extends BaseWidget {
    static name = 'label';
    $lbl_cont;
    $lbl_icon;
    $lbl;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_label',
            name: 'lbl_cont',
            style: {
                fontSize: '33px'
            },
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
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('value' in data) this.$lbl.textContent = data.value;
        if ('color' in data) this.$lbl_cont.style.color = hexToCol(data.color);
        if ('fsize' in data) this.$lbl_cont.style.fontSize = data.fsize + 'px';
        if ('align' in data) this.align(data.align);
        if ('icon' in data) this.$lbl_icon.innerHTML = data.icon ? (getIcon(data.icon) + ' ') : '';
    }

    static style = `
        .w_label {
            padding: 0px 10px;
            text-wrap: nowrap;
          }`;
}
