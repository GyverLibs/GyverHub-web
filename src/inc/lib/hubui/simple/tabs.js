class UiTabs {
    constructor(cont, data) {
        let tabs = '';
        if (data.text) {
            let labels = data.text.split(';');
            for (let i in labels) {
                tabs += `<li onclick="UiTabs.click('${data.id}',${i})">${labels[i].trim()}</li>`;
            }
        }
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <div data-type="${data.type}" id="${ID(data.id)}" class="w_tabs"><ul onwheel="UiTabs.wheel(event,this)">${tabs}</ul></div>`;

        UiTabs.color(data.id, intToCol(data.color) ?? getDefColor());
        waitFrame().then(() => UiTabs.change(data.id, data.value ?? 0));
        Widget.disable(data.id, data.disable);
    }

    static click(id, num) {
        if (CMP(id).getAttribute("disabled")) return;
        post_set(id, num);
        UiTabs.change(id, num, false);
    }

    static change(id, num, move = true) {
        let el = CMP(id);
        let list = el.children[0].children;
        for (let i = 0; i < list.length; i++) {
            if (i == num) list[i].classList.add('w_tab_act');
            else list[i].classList.remove('w_tab_act');
        }
        if (move) el.children[0].scrollLeft = el.children[0].scrollWidth * num / list.length;
    }

    static update(id, data) {
        if ('value' in data) UiTabs.change(id, Number(data.value));
        if ('color' in data) UiTabs.color(id, data.color);
    }

    static color(id, color) {
        if (color) {
            EL('style#' + id).innerHTML = `
            #${ID(id)}.w_tabs>ul>li.w_tab_act {background: ${color} !important;}`;
        }
    }

    static wheel(e, el) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
    }
};