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

function leaveSystemMenu() {
    for (const $i of document.getElementById('menu_system').children)
        $i.classList.remove('menu_act');
}

function enterMenu(sel = null) {
    menu_show(false);
    leaveSystemMenu();
    for (const $i of document.getElementById('menu_user').children)
        $i.classList.remove('menu_act');
    if (sel !== null)
        document.querySelector('.menu_item' + sel).classList.add('menu_act');
}

class MenuWidget extends Widget {
    $el = EL('menu_user');

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if (!data.text) return;

        this.$el.replaceChildren();
        const labels = data.text.split(/[.;]/);
        for (const i in labels) {
            this.$el.append(createElement(null, {
                type: 'div',
                class: i == data.value ? "menu_item menu_act" : "menu_item",
                text: labels[i].trim(),
                events: {
                    click: () => this.#openMenu(i)
                }
            }));
        }
    }

    #openMenu(i) {
        try {
            this.renderer.device.fsStop();
        } catch (e) { }
        enterMenu();
        if (screen != 'ui') show_screen('ui');
        this.set(i);
    }

    close() {
        console.log('close')
        this.$el.replaceChildren();
    }
}

Renderer.register('menu', MenuWidget);
