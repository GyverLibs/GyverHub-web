class UiTitle {
    constructor(cont, data) {
        cont.innerHTML = `<div id=lbl_cont#${data.id} class='w_label' style="color:${intToCol(data.color) ?? 'unset'};font-size:${data.fsize ?? 35}px"><span id="lbl_icon#${data.id}" class="w_icon">${data.text ? (getIcon(data.text) + ' ') : ''}</span><label data-type="${data.type}" id='${ID(data.id)}'>${data.value ?? ''}</label></div>`;
        Widget.align(data.id, data.align);
    }

    static update(id, data) {
        let el = CMP(id);
        let cont = EL('lbl_cont#' + id);
        if ('value' in data) el.innerHTML = data.value;
        if ('color' in data) cont.style.color = intToCol(data.color);
        if ('fsize' in data) cont.style.fontSize = data.fsize + 'px';
        if ('align' in data) Widget.align(id, data.align);
        if ('text' in data) {
            EL('lbl_icon#' + id).innerHTML = data.text ? (getIcon(data.text) + ' ') : '';
        }
    }
};