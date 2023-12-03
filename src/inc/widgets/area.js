class UiArea {
    constructor(cont, data) {
        cont.innerHTML = `<textarea data-type="${data.type}" class="w_area" id="${ID(data.id)}" name="${data.id}" onkeydown="UiInput.checkDown(this,event)" oninput="UiInput.check(this)" pattern="${data.regex ?? ''}" maxlength="${data.maxlen ?? ''}" onfocusout="UiInput.send(this)">${data.value ?? ''}</textarea>`;
        UiInput.color(ID(data.id), data.color);
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.innerHTML = data.value;
        if ('maxlen' in data) el.maxlength = Math.ceil(data.maxlen);
        if ('rows' in data) el.rows = data.rows;
        if ('dsbl' in data) Widget.disable(id, data.dsbl);
    }
};