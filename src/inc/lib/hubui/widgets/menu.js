class MenuOpenEvent extends Event {
    constructor(name) {
        super('menuopen');
        this.name = name;
    }
}

class MenuWidget extends Widget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = document.getElementById('menu');
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if (!data.text || !this.$el) return;

        this.$el.replaceChildren();
        const labels = data.text.split(';');
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
        this.renderer.dispatchEvent(new Event('menuchanged'));
    }

    #openMenu(i) {
        this.renderer.dispatchEvent(new MenuOpenEvent(i));
        this.set(i);
    }

    close() {
        if (this.$el) this.$el.replaceChildren();
    }
}

Renderer.register('menu', MenuWidget);
