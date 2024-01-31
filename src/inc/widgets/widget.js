class Widget {
    constructor(cont, data, width) {
        cont.innerHTML += `
        <div id="widget_main#${data.id}" class="widget_main ${data.square ? 'wsquare' : ''}" style="width:${width}%">
            <div id="widget_inner#${data.id}" class="widget_inner ${(data.notab && data.notab == 1) ? 'widget_notab' : ''}">
            <div id="wlabel_cont#${data.id}" class="widget_label ${data.nolabel ? 'wnolabel' : ''}">
                <span id="whint#${data.id}" class="whint" onclick="asyncAlert(this.title)">?</span>
                <span id="wlabel#${data.id}">${(data.label && data.label.length) ? data.label : data.type.toUpperCase()}</span>
                <span id="plabel#${data.id}" class="plabel"></span>
                <span id="wsuffix#${data.id}" class="wsuffix">${data.suffix ?? ''}</span>
            </div>
            <div id=widget#${data.id} class="widget_body ${data.disable ? 'widget_dsbl' : ''}" style="${(data.wheight && data.wheight > 25) ? ('min-height:' + data.wheight + 'px') : ''}"></div>
            </div>
        </div>
        `;

        waitFrame().then(() => Widget.hint(data.id, data.hint));
        return EL('widget#' + data.id);
    }

    static update(type, id, data) {
        if ('label' in data) {
            EL('wlabel#' + id).innerHTML = data.label.length ? data.label : type.toUpperCase();
        }
        if ('suffix' in data) {
            EL('wsuffix#' + id).innerHTML = data.suffix;
        }
        if ('nolabel' in data) {
            if (data.nolabel) EL('wlabel_cont#' + id).classList.add('wnolabel');
            else EL('wlabel_cont#' + id).classList.remove('wnolabel');
        }
        if ('square' in data) {
            if (data.square) EL('widget_main#' + id).classList.add('wsquare');
            else EL('widget_main#' + id).classList.remove('wsquare');
        }
        if ('notab' in data) {
            if (data.notab) EL('widget_inner#' + id).classList.add('widget_notab');
            else EL('widget_inner#' + id).classList.remove('widget_notab');
        }
        if ('disable' in data) {
            if (data.disable) EL('widget#' + id).classList.add('widget_dsbl');
            else EL('widget#' + id).classList.remove('widget_dsbl');
        }
        if ('hint' in data) {
            Widget.hint(id, data.hint)
        }
    }

    static hint(id, text) {
        let htext = 'name: ' + id + '\n' + (text ?? '');
        EL('wlabel#' + id).title = htext;
        let hint = EL('whint#' + id);
        hint.title = htext;
        hint.style.display = (text && text.length) ? 'inline-block' : 'none';
    }

    static disable(id, disable) {
        let el = CMP(id);
        if (disable) {
            el.setAttribute('disabled', '1');
            el.classList.add('disable');
        } else {  // null/undefined/0/false
            el.removeAttribute('disabled');
            el.classList.remove('disable');
        }
    }

    static align(id, align) {
        EL('widget#' + id).style.justifyContent = ["flex-start", "center", "flex-end"][Number(align ?? 1)];
    }

    static setPlabel(id, text = null) {
        let pl = EL('plabel#' + id);
        if (pl) pl.innerHTML = text ?? '';
    }
};