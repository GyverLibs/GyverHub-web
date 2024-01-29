// HTML
class UiHTML {
    constructor(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.html')) {
            hub.dev(focused).addFile(data.id, data.value, (file) => {
                UiHTML.apply(data.id, dataTotext(file));
                Widget.setPlabel(data.id);
            });
        } else {
            UiHTML.apply(data.id, data.value);
            cont.setAttribute('data-custom', 'html');
        }
    }

    static apply(id, text) {
        EL('widget#' + id).innerHTML = text;
    }

    static update(id, data) {
        if (!data.value) return;
        if (data.value.endsWith('.html')) {
            hub.dev(focused).addFile(id, data.value, (file) => {
                UiHTML.apply(id, dataTotext(file));
                Widget.setPlabel(id);
            });
        } else {
            UiHTML.apply(id, data.value);
        }
    }
};

// JS
class UiJS {
    constructor(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.js')) {
            hub.dev(focused).addFile(data.id, data.value, (file) => {
                let el = addDOM('custom_script_' + data.id, 'script', dataTotext(file), cont);
                el.setAttribute("data-custom-script", true);
            });
        } else {
            UiJS.apply(data.id, data.value, cont);
        }
    }

    static disable() {
        document.querySelectorAll('[data-custom-script]').forEach(el => el.remove());
    }
};

// CSS
class UiCSS {
    constructor(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.css')) {
            hub.dev(focused).addFile(data.id, data.value, (file) => {
                let el = addDOM('custom_style_' + data.id, 'style', dataTotext(file), cont);
                el.setAttribute("data-custom-style", true);
            });
        } else {
            UiCSS.apply(data.id, data.value, cont);
        }
    }

    static disable() {
        document.querySelectorAll('[data-custom-style]').forEach(el => el.remove());
    }
};