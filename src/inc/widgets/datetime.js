class UiDate {
    constructor(cont, data) {
        let date = new Date((data.value ?? 0) * 1000).toISOString().split('T')[0];
        cont.innerHTML = `<input data-type="${data.type}" id='${ID(data.id)}' class="w_date" style="color:${intToCol(data.color) ?? 'var(--prim)'}" type="date" value="${date}" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))">`;
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('T')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};

class UiTime {
    constructor(cont, data) {
        let time = new Date((data.value ?? 0) * 1000).toISOString().split('T')[1].split('.')[0];
        cont.innerHTML = `<input data-type="${data.type}" id='${ID(data.id)}' class="w_date" style="color:${intToCol(data.color) ?? 'var(--prim)'}" type="time" value="${time}" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))" step="1">`;
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('T')[1].split('.')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};

class UiDateTime {
    constructor(cont, data) {
        let datetime = new Date((data.value ?? 0) * 1000).toISOString().split('.')[0];
        cont.innerHTML = `<input data-type="${data.type}" id='${ID(data.id)}' class="w_date" style="color:${intToCol(data.color) ?? 'var(--prim)'}" type="datetime-local" value="${datetime}" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))" step="1">`;
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('.')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};