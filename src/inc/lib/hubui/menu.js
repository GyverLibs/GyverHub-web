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
        let inner = '';
        if (ctrl != null && ctrl.text) {
            labels = ctrl.text.toString().split(';');
            for (let i in labels) {
                let sel = (i == ctrl.value) ? 'menu_act' : '';
                inner += `<div onclick="Menu.click(${i})" class="menu_item ${sel}">${labels[i].trim()}</div>`;
            }
        }
        EL('menu_user').innerHTML = inner;
    }

    static clear() {
        Menu.add(null);
    }

    static click(num) {
        try {
            hub.dev(focused).fsStop();
        } catch (e) { }
        menu_show(0);
        Menu.deact();
        if (screen != 'ui') show_screen('ui');
        post_set('_menu', num);
    }

    static deact() {
        let els = Array.from(document.getElementById('menu_user').children).filter(el => el.tagName == 'DIV');
        els.push(EL('menu_cfg'), EL('menu_info'), EL('menu_fsbr'), EL('menu_ota'));
        for (let el in els) if (els[el]) els[el].classList.remove('menu_act');
    }
};