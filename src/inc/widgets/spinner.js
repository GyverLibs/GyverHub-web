class UiSpinner {
    constructor(cont, data) {
        cont.innerHTML = `
        <div class="w_spinner_row">
          <button class="icon icon_btn btn_no_pad" onclick="UiSpinner.spin('${data.id}',-1)"></button>
          <div class="w_spinner_block">
            <input data-type="${data.type}" id="${ID(data.id)}" class="w_spinner" type="number" oninput="UiSpinner.input('${data.id}')" onkeydown="UiSpinner.checkDown(event,'${data.id}')" value="${data.value ?? 0}" min="${data.min ?? 0}" max="${data.max ?? 100}" step="${data.step ?? 1}" data-dec="${data.dec ?? 0}" data-unit="${data.unit ?? ''}" onwheel="UiSpinner.wheel(event,'${data.id}')">
            <label class="w_spinner_unit" id="unit#${data.id}" onwheel="UiSpinner.wheel(event,'${data.id}')"></label>
          </div>
          <button class="icon icon_btn btn_no_pad" onclick="UiSpinner.spin('${data.id}',1)"></button>
        </div>
      `;

        waitFrame().then(() => UiSpinner.spin(data.id, 0, false));
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = data.value;
        if ('min' in data) el.min = data.min;
        if ('max' in data) el.max = data.max;
        if ('step' in data) el.step = data.step;
        if ('dec' in data) el.setAttribute("data-dec", data.dec);
        if ('unit' in data) el.setAttribute("data-unit", data.unit);
        UiSpinner.spin(id, 0, false);
    }

    static spin(id, dir, send = true) {
        let el = CMP(id);
        if (dir && el.getAttribute("disabled")) return;
        let val = Number(el.value) + Number(el.step) * Math.sign(Number(dir));
        val = Math.max(Number(el.min), val);
        val = Math.min(Number(el.max), val);
        el.value = Number(val).toFixed(Number(el.getAttribute("data-dec")));
        el.style.width = el.value.length + 'ch';
        EL('unit#' + id).innerHTML = el.getAttribute("data-unit");
        if (send) post_set_prd(id, el.value);
    }

    static input(id) {
        UiSpinner.spin(id, 0);
    }

    static wheel(e, id) {
        e.preventDefault();
        UiSpinner.spin(id, -e.deltaY);
    }

    static checkDown(e, id) {
        if (e.key == 'Enter') {
            e.preventDefault();
            UiSpinner.spin(id, 0);
        }
    }
};