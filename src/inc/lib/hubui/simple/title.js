class UiTitle {
    constructor(cont, data) {
        cont.innerHTML = `<div class='w_label'><span class="w_icon"></span><label></label></div>`;
        Widget.align(data.id, data.align);
    }

    static update(id, data) {
        let el = CMP(id);
        let cont = EL('lbl_cont#' + id);
        if ('value' in data) el.innerHTML = data.value;
        if ('color' in data) cont.style.color = intToCol(data.color);
        if ('fsize' in data) cont.style.fontSize = data.fsize + 'px';
        if ('align' in data) Widget.align(id, data.align);
        if ('icon' in data) {
            EL('lbl_icon#' + id).innerHTML = data.icon ? (getIcon(data.icon) + ' ') : '';
        }
    }
};