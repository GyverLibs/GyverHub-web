class UiSlider {
    constructor(cont, data) {
        cont.innerHTML = `<input oninput="UiSlider.move(this)" type="range" class="w_slider" min="0" max="100" step="1" data-dec="${data.dec ?? 0}"
        data-unit="" onwheel="UiSlider.wheel(event,this)"><div class="w_slider_out"><output id="out#${data.id}"></output></div>`;

        waitFrame().then(() => UiSlider.move(CMP(data.id), false));
        UiSlider.color(data.id, data.color);
        Widget.disable(data.id, data.disable);
    }

    static color(id, color) {
        if (color) CMP(id).style.backgroundImage = `linear-gradient(${intToCol(color)}, ${intToCol(color)})`;
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = data.value;
        if ('color' in data) UiSlider.color(id, data.color);
        if ('min' in data) el.min = data.min;
        if ('max' in data) el.max = data.max;
        if ('step' in data) el.step = data.step;
        if ('dec' in data) el.setAttribute("data-dec", data.dec);
        if ('unit' in data) el.setAttribute("data-unit", data.unit);
        UiSlider.move(el, false);
    }

    static move(el, send = true) {
        el.style.backgroundSize = (Number(el.value) - Number(el.min)) * 100 / (Number(el.max) - Number(el.min)) + '% 100%';
        EL('out#' + el.name).innerHTML = Number(el.value).toFixed(Number(el.getAttribute("data-dec"))) + el.getAttribute("data-unit");
        if (send) post_set_prd(el.name, el.value);
    }

    static wheel(e, el) {
        e.preventDefault();
        el.value = Number(el.value) - Math.sign(Number(e.deltaY)) * Number(el.step);
        UiSlider.move(el);
    }
}