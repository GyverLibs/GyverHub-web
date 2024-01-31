class UiTable {
    static render(cont, data) {
        if (!data.value) data.value = '';
        let isFile = (!data.value.includes(';') && data.value.endsWith(".csv"));

        cont.innerHTML = `<div data-type="${data.type}" data-align="${data.align ?? ''}" data-width="${data.width ?? ''}" id="${ID(data.id)}" style="display:contents" data-path="${isFile ? data.value : ''}" data-csv="${isFile ? '' : data.value}"></div>`;

        if (isFile) {
            hub.dev(focused).addFile(data.id, data.value, { type: "csv" });
            CMP(data.id).innerHTML = waiter();
        } else {
            UiTable.show(data.id);
        }
    }

    static update(id, data) {
        let el = CMP(id);
        if ('action' in data) {
            hub.dev(focused).addFile(id, el.getAttribute("data-path"), { type: "csv" });
        }
        if ('value' in data) {
            let val = data.value;
            if (!val.includes(';') && val.endsWith(".csv")) {   // file
                hub.dev(focused).addFile(id, val, { type: "csv" });
                el.setAttribute("data-path", val);
            } else {
                el.setAttribute("data-csv", val);
                UiTable.show(id);
            }
        }
        if ('align' in data) {
            el.setAttribute("data-align", data.align);
            UiTable.show(id);
        }
        if ('width' in data) {
            el.setAttribute("data-width", data.width);
            UiTable.show(id);
        }
    }

    static apply(id, csv) {
        CMP(id).setAttribute("data-csv", csv);
        UiTable.show(id);
    }

    static async show(id) {
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