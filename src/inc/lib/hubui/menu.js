class MenuWidget extends Widget {
    $el = document.getElementById('menu_user');

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
        this.$el.replaceChildren();
    }
}

Renderer.register('menu', MenuWidget);
