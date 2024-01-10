class UiRender {
    contIdx = 0;
    prevWidth = 1;
    dup_names = '';
    root = null;

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
                UiHook.add(ctrl.id, ctrl.value);
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
                // check transparent widgets
                switch (ctrl.type) {
                    // transparent
                    case 'space': ctrl.nolabel = 1; ctrl.notab = 1; break;
                    case 'title': ctrl.nolabel = 1; ctrl.notab = 1; ctrl.square = 0; break;

                    // non-widget
                    case 'menu': Menu.add(ctrl); continue;
                    case 'ui_file': new UiFile(cont, ctrl, type, single); continue;
                    case 'dummy': continue;
                    case 'js': new UiJS(this.root, ctrl); continue;
                    case 'css': new UiCSS(this.root, ctrl); continue;
                    case 'confirm': new UiConfirm(cont, ctrl); continue;
                    case 'prompt': new UiPrompt(cont, ctrl); continue;
                    case 'plugin': new UiPlugin(this.root, ctrl, focused); continue;
                    default: break;
                }

                // widget
                let wid = new Widget(cont, ctrl, ctrl.wwidth_t);
                switch (ctrl.type) {
                    case 'input': new UiInput(wid, ctrl); break;
                    case 'pass': new UiPass(wid, ctrl); break;
                    case 'area': new UiArea(wid, ctrl); break;
                    case 'button': new UiButton(wid, ctrl); break;
                    case 'switch_t': new UiSwitch(wid, ctrl); break;
                    case 'switch_i': new UiSwicon(wid, ctrl); break;
                    case 'title': new UiTitle(wid, ctrl); break;
                    case 'label': new UiLabel(wid, ctrl); break;
                    case 'text': new UiText(wid, ctrl); break;
                    case 'text_f': new UiText_f(wid, ctrl); break;
                    case 'display': new UiDisplay(wid, ctrl); break;
                    case 'image': new UiImage(wid, ctrl); break;
                    case 'table': new UiTable(wid, ctrl); break;
                    case 'log': new UiLog(wid, ctrl); break;
                    case 'date': new UiDate(wid, ctrl); break;
                    case 'time': new UiTime(wid, ctrl); break;
                    case 'datetime': new UiDateTime(wid, ctrl); break;
                    case 'slider': new UiSlider(wid, ctrl); break;
                    case 'spinner': new UiSpinner(wid, ctrl); break;
                    case 'select': new UiSelect(wid, ctrl); break;
                    case 'color': new UiColor(wid, ctrl); break;
                    case 'led': new UiLED(wid, ctrl); break;
                    case 'icon': new UiIcon(wid, ctrl); break;
                    case 'html': new UiHTML(wid, ctrl); break;
                    case 'func': new UiFunc(focused, wid, ctrl); break;
                    case 'gauge': new UiGauge(wid, ctrl); break;
                    case 'gauge_r': new UiGaugeR(wid, ctrl); break;
                    case 'gauge_l': new UiGaugeL(wid, ctrl); break;
                    case 'joy': new UiJoy(wid, ctrl); break;
                    case 'dpad': new UiDpad(wid, ctrl); break;
                    case 'flags': new UiFlags(wid, ctrl); break;
                    case 'tabs': new UiTabs(wid, ctrl); break;
                    case 'canvas': new UiCanvas(wid, ctrl); break;
                    case 'plot': new UiPlot(wid, ctrl); break;
                    case 'stream': new UiStream(wid, ctrl); break;
                    default: break;
                } // switch (ctrl.type)
            }
        } // for (let ctrl of data)
    }
}