class UiDisplay {
    static render(cont, data) {
        cont.innerHTML = `<textarea data-type="${data.type}" id="${ID(data.id)}" onwheel="UiDisplay.wheel(event,this)" class="w_disp" style="font-size:${data.fsize ?? 20}px;background:${intToCol(data.color) ?? 'var(--prim)'}" rows="${data.rows ?? 2}" readonly>${data.value ?? ''}</textarea>`;
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.innerHTML = data.value;
        if ('color' in data) el.style.background = intToCol(data.color);
        if ('fsize' in data) el.style.fontSize = data.fsize + 'px';
        if ('rows' in data) el.rows = data.rows;
    }

    static wheel(e, el) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
    }
};