class UiTable {
    constructor(cont, data) {
        if (!data.value) data.value = '';
        let isFile = (!data.value.includes(';') && data.value.endsWith(".csv"));

        cont.innerHTML = `<div data-type="${data.type}" data-align="${data.align ?? ''}" data-width="${data.width ?? ''}" id="${ID(data.id)}" style="display:contents" data-path="${isFile ? data.value : ''}" data-csv="${isFile ? '' : data.value}"></div>`;

        if (isFile) {
            hub.dev(focused).addFile(data.id, data.value, UiTable._cb(data.id));
            CMP(data.id).innerHTML = waiter();
        } else {
            UiTable.render(data.id);
        }
    }

    static _cb(name){
        return (file) => {
            UiTable.apply(name, dataTotext(file).replaceAll(/\\n/ig, "\n"));
            Widget.setPlabel(name);
        };
    }

    static update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), UiTable._cb(id));
        }
        if ('value' in data) {
            let val = data.value;
            if (!val.includes(';') && val.endsWith(".csv")) {   // file
                hub.dev(focused).addFile(id, val, UiTable._cb(id));
                el.setAttribute("data-path", val);
            } else {
                el.setAttribute("data-csv", val);
                UiTable.render(id);
            }
        }
        if ('align' in data) {
            el.setAttribute("data-align", data.align);
            UiTable.render(id);
        }
        if ('width' in data) {
            el.setAttribute("data-width", data.width);
            UiTable.render(id);
        }
    }

    static apply(id, csv) {
        CMP(id).setAttribute("data-csv", csv);
        UiTable.render(id);
    }

    static async render(id) {
        let el = CMP(id);
        let aligns = el.getAttribute("data-align").split(';');
        let widths = el.getAttribute("data-width").split(';');
        let table = parseCSV(el.getAttribute("data-csv"));
        let inner = `<table class="w_table">`;
        for (let row of table) {
            inner += '<tr>';
            for (let col in row) {
                inner += `<td width="${widths[col] ? (widths[col] + '%') : ''}" align="${aligns[col] ? aligns[col] : 'center'}">${row[col]}</td>`;
            }
            inner += '</tr>';
        }
        inner += '</table>';
        el.innerHTML = inner;
    }
};