class UiPlugin {
    constructor(cont, data, dev_id) {
        if (data.js && data.js.length && !EL(dev_id + '_script')) {
            if (data.js.endsWith('.js')) {
                hub.dev(dev_id).addFile('_script', data.js, { type: "plugin_js", cont: cont });
            } else {
                UiPlugin.applyScript(dev_id, data.js);
            }
        }
        if (data.css && data.css.length && !EL(dev_id + '_style')) {
            if (data.css.endsWith('.css')) {
                hub.dev(dev_id).addFile('_style', data.css, { type: "plugin_css" });
            } else {
                UiPlugin.applyStyle(dev_id, data.css);
            }
        }
    }

    static applyScript(dev_id, text) {
        addDOM(dev_id + '_script', 'script', text.replaceAll('function ', 'function ' + dev_id + '_'), document.body);
    }
    static applyStyle(dev_id, text) {
        addDOM(dev_id + '_style', 'style', text, document.body);
    }

    static enableStyle(dev_id) {
        let el = EL(dev_id + '_style');
        if (el) el.disabled = false;
    }
    static disableStyle(dev_id) {
        let el = EL(dev_id + '_style');
        if (el) el.disabled = true;
    }
};