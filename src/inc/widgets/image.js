class UiImage {
    constructor(cont, data) {
        cont.innerHTML = `<div data-type="${data.type}" data-path="${data.value ?? ''}" id="${ID(data.id)}">${waiter()}</div>`;
        if (data.value) hub.dev(focused).addFile(data.id, data.value, { type: "img" });// TODO notify on fetch
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            hub.dev(focused).addFile(id, data.value, { type: "img" });
            el.setAttribute("data-path", data.value);
        }
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), { type: "img" });
        }
    }

    static apply(id, file) {
        CMP(id).innerHTML = `<img style="width:100%" src="${file}">`;
    }
};