class UiButton {
    constructor(cont, data) {
        cont.innerHTML = `<button data-type="${data.type}" id="${ID(data.id)}" style="font-size:${data.fsize ?? 45}px;color:${intToCol(data.color) ?? 'var(--prim)'}" class="icon w_btn" onclick="post_set('${data.id}',2)" onmousedown="if(!UiButton.touch)post_click('${data.id}',1)" onmouseup="if(!UiButton.touch&&UiButton.pressID)post_click('${data.id}',0)" onmouseleave="if(UiButton.pressID&&!UiButton.touch)post_click('${data.id}',0);" ontouchstart="UiButton.touch=1;post_click('${data.id}',1)" ontouchend="post_click('${data.id}',0)" data-color="${intToCol(data.color) ?? 'var(--prim)'}" data-size="${data.fsize ?? 45}px"></button>`;
        UiButton.setIcon(data.id, data.icon);
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('icon' in data) {
            UiButton.setIcon(id, data.icon);
        }
        if ('color' in data) {
            let col = intToCol(data.color);
            el.style.color = col;
            el.style.fill = col;
            el.setAttribute("data-color", col);
        }
        if ('fsize' in data) {
            let size = data.fsize + 'px';
            el.style.fontSize = size;
            if (!el.getAttribute("data-inline")) el.style.width = size;
            else el.style.width = 'unset';
            el.setAttribute("data-size", size);
        }
        if ('disable' in data) {
            Widget.disable(id, data.disable);
        }
    }

    static apply(id, icon) {
        let el = CMP(id);
        el.innerHTML = icon;
        el.style.width = el.getAttribute("data-size");
        el.style.fill = el.getAttribute("data-color");
    }

    static setIcon(id, text) {
        let el = CMP(id);
        if (!el) return;
        let icon = "";
        el.style.width = 'unset';
        if (text) {
            if (text.includes(".svg")) {
                hub.dev(focused).addFile(id, text, {
                    type: "icon",
                    callback(data) {
                        Widget.setPlabel(id);
                        el.innerHTML = dataTotext(data);
                        el.style.width = el.getAttribute("data-size");
                        el.style.fill = el.getAttribute("data-color");
                    }
                });
                el.removeAttribute("data-inline");
                return;
            } else {
                icon = getIcon(text);
            }
        }
        el.innerHTML = icon;
        el.setAttribute("data-inline", true);
    }

    static pressID = null;
    static touch = 0;
};