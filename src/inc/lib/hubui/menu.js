function updateSystemMenu() {
    let dev = hub.dev(focused);

    EL('menu_system').innerHTML = `<div id="menu_cfg" class="menu_item" onclick="cfg_h()">${lang.m_config}</div>`;
    EL('menu_system').innerHTML += `<div id="menu_info" class="menu_item" onclick="info_h()">${lang.m_info}</div>`;
    if (dev.isModuleEnabled(Modules.FILES)) {
        EL('menu_system').innerHTML += `<div id="menu_fsbr" class="menu_item" onclick="fsbr_h()">${lang.m_files}</div>`;
    }
    if (dev.isModuleEnabled(Modules.OTA) || dev.isModuleEnabled(Modules.OTA_URL)) {
        EL('menu_system').innerHTML += `<div id="menu_ota" class="menu_item" onclick="ota_h()">${lang.m_ota}</div>`;
    }
}

class Menu {
    static add(ctrl) {
        let labels = [];
        let inner = [];
        if (ctrl != null && ctrl.text) {
            labels = ctrl.text.toString().split(';');
            for (const i in labels) {
                inner.push(createElement(null, {
                    type: 'div',
                    class: i == ctrl.value ? "menu_item menu_act" : "menu_item",
                    text: labels[i].trim(),
                    events: {
                        click: () => {
                            try {
                                hub.dev(focused).fsStop();
                            } catch (e) { }
                            menu_show(0);
                            Menu.deact();
                            if (screen != 'ui') show_screen('ui');
                            hub.dev(focused).set('_menu', i);
                        }
                    }
                }));
            }
        }
        EL('menu_user').replaceChildren(...inner);
    }

    static clear() {
        Menu.add(null);
    }

    static deact() {
        let els = Array.from(document.getElementById('menu_user').children).filter(el => el.tagName == 'DIV');
        els.push(EL('menu_cfg'), EL('menu_info'), EL('menu_fsbr'), EL('menu_ota'));
        for (let el in els) if (els[el]) els[el].classList.remove('menu_act');
    }
}
