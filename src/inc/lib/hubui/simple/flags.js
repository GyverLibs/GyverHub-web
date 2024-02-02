class UiFlags {
    constructor(cont, data) {
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <div class="w_flags_cont w_flags_cont_tab"></div>`;

        UiFlags.render(data.id);
        UiFlags.color(data.id, intToCol(data.color) ?? getDefColor());
        Widget.disable(data.id, data.disable);
        waitFrame().then(() => UiFlags.resize(data.id));
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.setAttribute("data-value", data.value);
        if ('text' in data) el.setAttribute("data-text", data.text);
        if ('color' in data) UiFlags.color(id, data.color);
        UiFlags.render(id);
    }

    static render(id) {
        let el = CMP(id);
        let val = Number(el.getAttribute("data-value"));
        let text = el.getAttribute("data-text");
        el.innerHTML = "";
        let labels = text.split(';');
        for (let i = 0; i < labels.length; i++) {
            el.innerHTML += `
            <label id="flags_${id}" class="w_flags w_flags_txt">
                <input name="${id}" type="checkbox" onclick="UiFlags.click('${id}',this)" ${(val & 1) ? 'checked' : ''}>
                <span class="w_flags_s w_flags_span">${labels[i]}</span>
            </label>`;
            val >>= 1;
        }
    }

    static color(id, color) {
        if (color) {
            EL('style#' + id).innerHTML = `
            #flags_${id} input:checked+.w_flags_s{background:${color}}`;
        }
    }

    static click(id, el) {
        if (CMP(id).getAttribute("disabled")) return;
        let flags = document.getElementsByName(id);
        let encoded = 0;
        flags.forEach((w, i) => {
            if (w.checked) encoded |= (1 << flags.length);
            encoded >>= 1;
        });
        post_set(id, encoded);
    }

    static resize(id) {
        let txt = CMP(id).querySelectorAll(".w_flags_txt");
        let span = CMP(id).querySelectorAll(".w_flags_span");
        txt.forEach((ch, i) => {
            let len = span[i].innerHTML.length + 2;
            txt[i].style.width = (len + 0.5) + 'ch';
            span[i].style.width = len + 'ch';
        });
    }
};