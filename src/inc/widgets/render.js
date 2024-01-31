class UiRender {
    contIdx = 0;
    prevWidth = 1;
    dup_names = '';
    root = null;

    widgets = {};

    add(type, w_class) {
        this.widgets[type] = w_class;
    }
    addWidget(type, wid, ctrl) {
        let w = this.widgets[type];
        if (w && w.render) w.render(wid, ctrl);
    }
    updateWidget(type, id, data) {
        let w = this.widgets[type];
        if (w && w.update) w.update(id, data);
    }
    clearWidgets() {
        for (let w of Object.values(this.widgets)) {
            if (w.clear) w.clear();
        }
    }
    resizeWidgets() {
        for (let w of Object.values(this.widgets)) {
            if (w.resize) w.resize();
        }
    }
    isHidden(type) {
        let w = this.widgets[type];
        return (w && w.hidden == 1);
    }

    reset() {
        this.contIdx = 0;
        this.prevWidth = 1;
        this.dup_names = '';
    }

    render(cont, type, data, single) {
        let non_widgets = ['menu', 'dummy', 'js', 'css', 'confirm', 'prompt', 'plugin', 'hook', 'ui_file'];
        switch (type) {
            case 'row':
                let sumw = 0;
                for (let ctrl of data) {
                    if (!ctrl.type || non_widgets.includes(ctrl.type)) continue;
                    if (!ctrl.wwidth) ctrl.wwidth = this.prevWidth;
                    else this.prevWidth = ctrl.wwidth;
                    sumw += ctrl.wwidth;
                }
                for (let ctrl of data) {
                    if (!ctrl.type || non_widgets.includes(ctrl.type)) continue;
                    ctrl.wwidth_t = ctrl.wwidth * 100 / sumw;
                }
                break;

            case 'col':
                for (let ctrl of data) {
                    if (!ctrl.type || non_widgets.includes(ctrl.type)) continue;
                    ctrl.wwidth_t = 100;
                }
                break;
        }

        // render all widgets
        for (let ctrl of data) {
            if (!ctrl.type) continue;
            // hook
            if (ctrl.type == 'hook') {
                UiHook.bind(ctrl.id, ctrl.value);
                continue;
            }
            // rows and cols
            if (ctrl.type == 'row' || ctrl.type == 'col') {
                if (single) { // single row
                    this.render(cont, 'col', ctrl.data, single);
                } else {
                    this.contIdx++;
                    let newCont = 'container#' + this.contIdx;
                    cont.innerHTML += `<div class="${'widget_' + ctrl.type}" id="${newCont}" style="width:${ctrl.wwidth_t}%"></div>`;
                    this.render(EL(newCont), ctrl.type, ctrl.data, single);
                }
            } else {
                // widgets
                if (ctrl.id && CMP(ctrl.id)) {
                    if (this.dup_names.length) this.dup_names += ', ';
                    this.dup_names += ctrl.id;
                    continue;
                }

                switch (ctrl.type) {
                    case 'space': ctrl.nolabel = 1; ctrl.notab = 1; break;
                    case 'title': ctrl.nolabel = 1; ctrl.notab = 1; ctrl.square = 0; break;

                    case 'menu': Menu.render(ctrl); continue;
                    case 'dummy': continue;
                    case 'ui_file': UiFile.render(cont, ctrl, type, single); continue;
                    case 'plugin': UiPlugin.render(this.root, ctrl); continue;
                    case 'js': UiJS.render(this.root, ctrl); continue;
                    case 'css': UiCSS.render(this.root, ctrl); continue;
                    case 'confirm': UiConfirm.render(cont, ctrl); continue;
                    case 'prompt': UiPrompt.render(cont, ctrl); continue;
                }

                if (this.isHidden(ctrl.type)) {
                    this.addWidget(ctrl.type, null, ctrl);
                    continue;
                }

                // widget
                let wid = new Widget(cont, ctrl, ctrl.wwidth_t);
                this.addWidget(ctrl.type, wid, ctrl);
                // case 'func': UiFunc.render(wid, ctrl); break;  // TODO func
            }
        } // for (let ctrl of data)
    }
}