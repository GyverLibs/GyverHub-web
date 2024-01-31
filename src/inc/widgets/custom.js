// HTML
class UiHTML {
    static render(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.html')) {
            hub.dev(focused).addFile(data.id, data.value, { type: "html" });
        } else {
            UiHTML.apply(data.id, data.value);
            cont.setAttribute('data-custom-type', 'html');
        }
    }

    static apply(id, text) {
        EL('widget#' + id).innerHTML = text;
    }

    static update(id, data) {
        if (!data.value) return;
        if (data.value.endsWith('.html')) {
            hub.dev(focused).addFile(id, data.value, { type: "html" });
        } else {
            UiHTML.apply(id, data.value);
        }
    }
};

// JS
class UiJS {
    static render(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.js')) {
            hub.dev(focused).addFile(data.id, data.value, { type: "js", cont: cont });
        } else {
            UiJS.apply(data.id, data.value, cont);
        }
    }

    static apply(id, text, cont) {
        let el = addDOM('custom_script_' + id, 'script', text, cont);
        el.setAttribute("data-custom-script", true);
    }

    static disable() {
        document.querySelectorAll('[data-custom-script]').forEach(el => el.remove());
    }
};

// CSS
class UiCSS {
    static render(cont, data) {
        if (!data.value) return;
        if (data.value.endsWith('.css')) {
            hub.dev(focused).addFile(data.id, data.value, { type: "css", cont: cont });
        } else {
            UiCSS.apply(data.id, data.value, cont);
        }
    }

    static apply(id, text, cont) {
        let el = addDOM('custom_style_' + id, 'style', text, cont);
        el.setAttribute("data-custom-style", true);
    }

    static disable() {
        document.querySelectorAll('[data-custom-style]').forEach(el => el.remove());
    }
};