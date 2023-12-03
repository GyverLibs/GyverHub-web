class UiText {
    constructor(cont, data) {
        cont.innerHTML = `<textarea data-type="${data.type}" id="${ID(data.id)}" class="w_area w_area_passive" rows="${data.rows ?? 5}" readonly>${data.value ?? ''}</textarea>`;
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.innerHTML = data.value;
        if ('rows' in data) el.rows = data.rows;
    }
};

class UiText_f {
    constructor(cont, data) {
        cont.innerHTML = `<textarea data-type="${data.type}" id="${ID(data.id)}" data-path="${data.value ?? ''}" class="w_area w_area_passive" rows="${data.rows ?? 5}" readonly></textarea>`;
        if (data.value) hub.dev(focused).addFile(data.id, data.value, { type: "text" });
    }

    static update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), { type: "text" });
        }
        if ('value' in data) {
            hub.dev(focused).addFile(id, data.value, { type: "text" });
            el.setAttribute("data-path", data.value);
        }
        if ('rows' in data) {
            el.rows = data.rows;
        }
    }

    static apply(id, text) {
        CMP(id).innerHTML = text;
    }
};