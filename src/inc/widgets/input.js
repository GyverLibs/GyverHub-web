class UiInput {
    constructor(cont, data) {
        cont.innerHTML = `
          <div class="w_inp_cont">
            <input data-type="${data.type}" class="w_inp" type="text" value="${data.value ?? ''}" id="${ID(data.id)}" name="${data.id}" onkeydown="UiInput.checkDown(this,event)" oninput="UiInput.check(this)" data-regex="${data.regex ?? ''}" maxlength="${data.maxlen ?? ''}" onfocusout="UiInput.send(this)">
          </div>
        `;
        UiInput.color(data.id, data.color);
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('color' in data) UiInput.color(id, data.color);
        if ('value' in data) el.value = data.value;
        if ('regex' in data) el.setAttribute("data-regex", data.regex);
        if ('maxlen' in data) el.maxlength = Math.ceil(data.maxlen);
        if ('dsbl' in data) Widget.disable(id, data.dsbl);
    }

    static color(id, color) {
        if (color) CMP(id).style.boxShadow = '0px 2px 0px 0px ' + intToCol(color);
    }

    static send(arg, force = false) {
        let pattern = arg.getAttribute("data-regex");
        if (pattern.length) {
            const r = new RegExp(pattern);
            if (!r.test(arg.value)) {
                showPopupError("Wrong text!");
                return;
            }
        }
        if (force || arg.getAttribute('data-changed')) {
            arg.removeAttribute('data-changed');
            post_set(arg.name, arg.value);
        }
    }

    static check(arg) {
        // Widget.setPlabel(arg.name, '•');
        Ack.set(arg.name);
        arg.setAttribute('data-changed', '1');
    }

    static checkDown(arg, event) {
        if (event.key == 'Enter') UiInput.send(arg, true);
    }
};