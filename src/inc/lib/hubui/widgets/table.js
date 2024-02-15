class TableWidget extends BaseWidget {
    $el;
    #align = '';
    #width = '';
    #data = '';
    #path = '';

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'table',
            class: 'w_table',
            name: 'el',
        });

        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('align' in data) this.#align = data.align;
        if ('width' in data) this.#width = data.width;
        if ('value' in data) {
            let val = data.value;
            if (!val.includes(';') && val.endsWith(".csv")) {   // file
                this.#path = val;
            } else {
                this.#path = '';
                this.#data = val;
            }
        }

        if ('action' in data || 'value' in data) this.#reload();
        else if ('align' in data || 'width' in data) this.#render();
    }

    #reload() {
        if (this.#path) {
            this.$el.innerHTML = waiter();
            this.renderer.device.addFile(this.id, this.#path, 'text', file => {
                this.#data = file.replaceAll(/\\n/ig, "\n");
                this.#render();
                this.setPlabel();
            });
        } else {
            this.#render();
        }
    }

    #render() {
        const aligns = this.#align.split(/[,;]/);
        const widths = this.#width.split(/[,;]/);
        const table = parseCSV(this.#data);
        const items = [];
        for (const row of table) {
            const $row = document.createElement('tr');
            for (const col in row) {
                const $col = document.createElement('td');
                if (widths[col]) $col.width = widths[col] + '%';
                $col.align = aligns[col] ?? 'center';
                $col.textContent = row[col];
                $row.append($col);
            }
            items.push($row);
        }
        this.$el.replaceChildren(...items);
    }
}

function parseCSV(str) {
  // https://stackoverflow.com/a/14991797
  const arr = [];
  let quote = false;
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if ((cc == ';' || cc == ',' ) && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
}

Renderer.register('table', TableWidget);
