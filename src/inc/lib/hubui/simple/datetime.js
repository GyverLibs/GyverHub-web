class UiDate {
    constructor(cont, data) {
        cont.innerHTML = `<input class="w_date" type="date" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))">`;
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('T')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};

class UiTime {
    constructor(cont, data) {
        cont.innerHTML = `<input class="w_date" type="time" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))" step="1">`;
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('T')[1].split('.')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};

class UiDateTime {
    constructor(cont, data) {
        cont.innerHTML = `<input class="w_date" type="datetime-local" onclick="this.showPicker()" onchange="post_set('${data.id}',getUnix(this))" step="1">`;
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) el.value = new Date(data.value * 1000).toISOString().split('.')[0];
        if ('color' in data) el.style.color = intToCol(data.color);
    }
};