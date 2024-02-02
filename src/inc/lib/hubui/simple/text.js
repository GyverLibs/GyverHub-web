class UiText {
    constructor(cont, data) {
        cont.innerHTML = `<textarea class="w_area w_area_passive"  readonly></textarea>`;
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.innerHTML = data.value;
        if ('rows' in data) el.rows = data.rows;
    }
};

class UiText_f {
    constructor(cont, data) {
        cont.innerHTML = `<textarea data-path="${data.value ?? ''}" class="w_area w_area_passive" readonly></textarea>`;
        if (data.value) hub.dev(focused).addFile(data.id, data.value, UiText_f._cb(data.id));
    }

    static _cb(name){
        return (file) => {
            UiText_f.apply(name, dataTotext(file));
            Widget.setPlabel(name);
        };
    }

    static update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), UiText_f._cb(id));
        }
        if ('value' in data) {
            hub.dev(focused).addFile(id, data.value, UiText_f._cb(id));
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