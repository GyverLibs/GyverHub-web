class UiLog {
    constructor(cont, data) {
        cont.innerHTML = `<textarea style="color:var(--prim)" class="w_area w_area_passive" readonly></textarea>`;
        
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