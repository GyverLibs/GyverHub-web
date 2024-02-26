class Menu {
    static render(ctrl) {
        let inner = '';
        let labels = [];
        if (ctrl != null && ctrl.text) {
            labels = ctrl.text.toString().split(';');
            for (let i in labels) {
                let sel = (i == ctrl.value) ? 'menu_act' : '';
                inner += `<div onclick="Menu.click(${i})" class="menu_item ${sel}">${labels[i].trim()}</div>`;
            }
        }
        EL('menu_user').innerHTML = inner;
        EL('menu_system').innerHTML = `<div id="menu_cfg" class="menu_item" onclick="cfg_h()">${lang.m_config}</div>`;
        EL('menu_system').innerHTML += `<div id="menu_info" class="menu_item" onclick="info_h()">${lang.m_info}</div>`;
        let count = 2;
        let dev = hub.dev(focused);

        if (dev.module(Modules.FILES)) {
            count++;
            EL('menu_system').innerHTML += `<div id="menu_fsbr" class="menu_item" onclick="fsbr_h()">${lang.m_files}</div>`;
        }
        if (dev.module(Modules.OTA) || dev.module(Modules.OTA_URL)) {
            count++;
            EL('menu_system').innerHTML += `<div id="menu_ota" class="menu_item" onclick="ota_h()">${lang.m_ota}</div>`;
        }
        document.querySelector(':root').style.setProperty('--menu_h', ((labels.length + count) * 35 + 10) + 'px');
    }

    static clear() {
        Menu.render(null);
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