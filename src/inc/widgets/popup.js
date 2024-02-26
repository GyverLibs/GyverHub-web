class UiConfirm {
    static render(cont, data) {
        cont.innerHTML += `<div id="widget#${data.id}" style="display:none"><div data-type="${data.type}" id="${ID(data.id)}" data-text="${data.text ?? 'No text'}"></div></div>`;
    }

    static async update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            release_all();
            let res = await asyncConfirm(el.getAttribute("data-text"));
            post_set(id, res ? 1 : 0);
        }
        if ('text' in data) {
            el.setAttribute("data-text", data.text);
        }
    }
};

class UiPrompt {
    static render(cont, data) {
        cont.innerHTML += `<div id="widget#${data.id}" style="display:none"><div data-type="${data.type}" id="${ID(data.id)}" data-text="${data.text ?? 'No text'}" data-value="${data.value ?? ''}"></div></div>`;
    }

    static async update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            release_all();
            let res = await asyncPrompt(el.getAttribute("data-text"), el.getAttribute("data-value"));
            if (res !== null) {
                el.setAttribute("data-value", res);
                post_set(id, res);
            }
        }
        if ('value' in data) {
            el.setAttribute("data-value", data.value);
        }
        if ('text' in data) {
            el.setAttribute("data-text", data.text);
        }
    }
};