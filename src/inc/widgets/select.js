class UiSelect {
    constructor(cont, data) {
        cont.innerHTML = `<select data-type="${data.type}" class="w_select" style="color:${intToCol(data.color) ?? 'var(--prim)'}" id='${ID(data.id)}' value="${data.value ?? ''}" onchange="post_set('${data.id}',this.value)"></select>`;

        waitFrame().then(() => UiSelect.render(data.id, data.text, data.value ?? ''));
        Widget.disable(data.id, data.disable);
    }

    static async render(id, text, value) {
        let el = CMP(id);
        while (el.options.length > 0) el.remove(0); // clear
        if (text) {
            let ops = text.toString().split(';');
            for (let i in ops) {
                let option = document.createElement('option');
                option.value = i;
                option.text = ops[i].trim();
                option.selected = (i == value);
                el.add(option);
            }
        }
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = data.value;
        if ('text' in data) UiSelect.render(id, data.text, el.value);
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};