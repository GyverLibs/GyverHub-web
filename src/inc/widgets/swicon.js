class UiSwicon {
    constructor(cont, data) {
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <div data-type="${data.type}" id="${ID(data.id)}" style="font-size:${data.fsize ?? 45}px;width:${data.fsize ? data.fsize * 1.7 : 75}px" class="icon icon_btn_big w_swicon ${data.value == '1' ? 'w_swicon_on' : ''}" onclick="UiSwicon.click('${data.id}')">${data.icon ? getIcon(data.icon) : ''}</div>`;

        UiSwicon.color(data.id, intToCol(data.color) ?? getDefColor());
        Widget.disable(data.id, data.disable);
    }
    
    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            if (Number(data.value) == 1) el.classList.add('w_swicon_on');
            else el.classList.remove('w_swicon_on');
        }
        if ('fsize' in data) {
            el.style.fontSize = data.fsize + 'px';
            el.style.width = data.fsize * 1.7 + 'px';
        }
        if ('icon' in data) el.innerHTML = getIcon(data.icon);
        if ('color' in data) UiSwicon.color(id, intToCol(data.color));
        if ('disable' in data) Widget.disable(id, data.disable);
    }

    static click(id) {
        let el = CMP(id);
        if (el.getAttribute('disabled')) return;
        el.classList.toggle('w_swicon_on');
        post_set(id, (el.classList.contains('w_swicon_on') ? 1 : 0));
    }

    static color(id, color) {
        if (color) {
            EL('style#' + id).innerHTML = `
            #${ID(id)}.w_swicon {
                color: ${color};
                border: 2px solid ${color};
            }
            #${ID(id)}.w_swicon_on {
                color: var(--tab);
                background: ${color};
            `;
        }
    }
};