class UiIcon {
    static render(cont, data) {
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <span data-type="${data.type}" id="${ID(data.id)}" style="font-size:${data.fsize ?? 35}px" class="w_icon w_icon_led ${Number(data.value ?? 0) ? 'w_icon_on' : ''}">${data.icon ? getIcon(data.icon) : ""}</span>`;

        UiIcon.color(data.id, intToCol(data.color) ?? getDefColor());
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            if (Number(data.value)) el.classList.add('w_icon_on');
            else el.classList.remove('w_icon_on');
        }
        if ('icon' in data) el.innerHTML = getIcon(data.icon);
        if ('fsize' in data) el.style.fontSize = data.fsize + 'px';
        if ('color' in data) UiIcon.color(id, intToCol(data.color));
    }

    static color(id, color) {
        EL('style#' + id).innerHTML = `
        #${ID(id)}.w_icon_on {
            color: ${color};
            text-shadow: 0 0 10px ${color};
        }`;
    }
};