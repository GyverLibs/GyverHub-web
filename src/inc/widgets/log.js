class UiLog {
    static render(cont, data) {
        cont.innerHTML = `<textarea data-type="${data.type}" id="${ID(data.id)}" style="color:var(--prim)" class="w_area w_area_passive" rows="${data.rows ?? 5}" readonly>${data.value ? data.value.trim() : ''}</textarea>`;
        
        waitFrame().then(() => CMP(data.id).scrollTop = CMP(data.id).scrollHeight);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            el.innerHTML = data.value.trim();
            el.scrollTop = el.scrollHeight;
        }
        if ('rows' in data) {
            el.rows = data.rows;
        }
    }
};