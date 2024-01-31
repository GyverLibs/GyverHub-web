class UiFunc {
    static render(wid, data) {
        wid.setAttribute("data-defaults", JSON.stringify(data));
        wid.setAttribute("data-func", focused + '_' + data.func);
    }

    static show(cont) {
        cont.querySelectorAll('[data-func]').forEach(wid => {
            let func = wid.getAttribute("data-func");
            if (typeof window[func] !== "function") return;
            let data = wid.getAttribute("data-defaults");
            if (!data) return;
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.log("Plugin data error: " + func);
                return;
            }
            wid.removeAttribute("data-defaults");
            try {
                wid.innerHTML = window[func](data.id, data);
            } catch (e) {
                console.log("Plugin error: " + func);
            }
        });
    }

    static update(dev_id, id, data) {
        let func = dev_id + '_update_' + data.func;
        if (typeof window[func] === "function") {
            try {
                window[func](id, data);
            } catch (e) {
                console.log("Plugin error: " + e);
            }
        }
    }
};