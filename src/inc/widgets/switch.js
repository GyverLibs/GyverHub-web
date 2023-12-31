class UiSwitch {
    constructor(cont, data) {
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <label id="swlabel_${data.id}" class="switch"><input type="checkbox" data-type="${data.type}" id='${ID(data.id)}' onclick="post_set('${data.id}',(this.checked ? 1 : 0))" ${data.value == '1' ? 'checked' : ''}><span class="slider"></span></label>`;

        UiSwitch.color(data.id, data.color);
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.checked = (Number(data.value) == 1);
        if ('color' in data) UiSwitch.color(id, data.color);
        if ('dsbl' in data) Widget.disable(id, data.dsbl);
    }

    static color(id, color) {
        if (color) {
            EL('style#' + id).innerHTML = `#swlabel_${id} input:checked+.slider{background:${intToCol(color) ?? 'var(--prim)'}`;
        }
    }
};