class UiColor {
    constructor(cont, data) {
        cont.innerHTML = `
          <div data-type="${data.type}" id="${ID(data.id)}" style="visibility:hidden">
            <div id="picker#${data.id}"></div>
          </div>
          <button id="picker_btn#${data.id}" style="margin-left:-25px;color:${intToCol(data.value) ?? '#000'}" class="icon icon_btn_big" onclick="UiColor.open('${data.id}')"></button>
          `;

        Widget.disable(data.id, data.dsbl);

        waitFrame().then(() => {
            let el = EL('picker#' + data.id);
            if (!el) return;

            let p = Pickr.create({
                el: el,
                theme: 'nano',
                default: intToCol(data.color) ?? '#000',
                defaultRepresentation: 'HEXA',
                components: {
                    preview: true,
                    hue: true,
                    interaction: {
                        hex: false,
                        input: true,
                        save: true
                    }
                }
            }).on('save', (color) => {
                let col = color.toHEXA().toString();
                post_set(data.id, colToInt(col));
                EL('picker_btn#' + data.id).style.color = col;
            });

            UiColor.pickers[data.id] = p;
        });
    }

    static update(id, data) {
        let col = null;
        if ('value' in data) col = intToCol(data.value);
        if ('color' in data) col = intToCol(data.color);

        if (col) {
            try {
                EL('picker_btn#' + id).style.color = col;
                UiColor.pickers[id].setColor(col);
            } catch (e) { }
        }
    }

    static open(id) {
        let el = CMP(id);
        if (el.getAttribute("disabled")) return;
        el.getElementsByTagName('button')[0].click()
    }

    static reset() {
        UiColor.pickers = {};
    }

    static pickers = {};
};