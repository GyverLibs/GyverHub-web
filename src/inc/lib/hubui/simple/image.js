class UiImage {
    constructor(cont, data) {
        cont.innerHTML = `<div>${waiter()}</div>`;
        if (data.value) hub.dev(focused).addFile(data.id, data.value, UiImage._cb(id));// TODO notify on fetch
    }

    static _cb(name){
        return (file) => {
            UiImage.apply(name, file);
            Widget.setPlabel(name);
        };
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            hub.dev(focused).addFile(id, data.value, UiImage._cb(id));
            el.setAttribute("data-path", data.value);
        }
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), UiImage._cb(id));
        }
    }

    static apply(id, file) {
        CMP(id).innerHTML = `<img style="width:100%" src="${file}">`;
    }
};