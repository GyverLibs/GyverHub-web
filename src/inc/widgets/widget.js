class Widget {
    constructor(cont, ctrl, width) {
        let hint = 'ID: ' + ctrl.id + '\n' + (ctrl.hint ?? '');

        cont.innerHTML += `
            <div id="widget_main#${ctrl.id}" class="widget_main ${ctrl.square ? 'wsquare' : ''}" style="width:${width}%">
              <div id="widget_inner#${ctrl.id}" class="widget_inner ${(ctrl.notab && ctrl.notab == 1) ? 'widget_notab' : ''}">
                <div id="wlabel_cont#${ctrl.id}" class="widget_label ${ctrl.nolabel ? 'wnolabel' : ''}">
                  <span id="wlabel#${ctrl.id}" title="${hint}" onclick="alert(this.title)">${(ctrl.label && ctrl.label.length) ? ctrl.label : ctrl.type}</span>
                  <span id="plabel#${ctrl.id}" class="plabel"></span>
                  <span id="wsuffix#${ctrl.id}" class="wsuffix">${ctrl.suffix ?? ''}</span>
                </div>
                <div id=widget#${ctrl.id} class="widget_body ${ctrl.dsbl ? 'widget_dsbl' : ''}" style="${(ctrl.wheight && ctrl.wheight > 25) ? ('min-height:' + ctrl.wheight + 'px') : ''}"></div>
              </div>
            </div>
            `;

        return EL('widget#' + ctrl.id);
    }

    static update(name, type, data) {
        if ('label' in data) {
            EL('wlabel#' + name).innerHTML = data.label.length ? data.label : type;
        }
        if ('suffix' in data) {
            EL('wsuffix#' + name).innerHTML = data.suffix;
        }
        if ('nolabel' in data) {
            if (data.nolabel) EL('wlabel_cont#' + name).classList.add('wnolabel');
            else EL('wlabel_cont#' + name).classList.remove('wnolabel');
        }
        if ('square' in data) {
            if (data.square) EL('widget_main#' + name).classList.add('wsquare');
            else EL('widget_main#' + name).classList.remove('wsquare');
        }
        if ('notab' in data) {
            if (data.notab) EL('widget_inner#' + name).classList.add('widget_notab');
            else EL('widget_inner#' + name).classList.remove('widget_notab');
        }
        if ('dsbl' in data) {
            if (data.dsbl) EL('widget#' + name).classList.add('widget_dsbl');
            else EL('widget#' + name).classList.remove('widget_dsbl');
        }
        if ('hint' in data) {
            EL('wlabel#' + name).title = 'ID: ' + name + '\n' + data.hint;
        }
    }

    static disable(id, dsbl) {
        let el = CMP(id);
        if (dsbl) {
            el.setAttribute('disabled', '1');
            el.classList.add('dsbl');
        } else {  // null/undefined/0/false
            el.removeAttribute('disabled');
            el.classList.remove('dsbl');
        }
    }

    static align(id, align) {
        EL('widget#' + id).style.justifyContent = ["flex-start", "center", "flex-end"][Number(align ?? 1)];
    }
};