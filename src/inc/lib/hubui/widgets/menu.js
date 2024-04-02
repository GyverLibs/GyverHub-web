class MenuOpenEvent extends Event {
    constructor(name) {
        super('menuopen');
        this.name = name;
    }
}

class MenuWidget extends Widget {
    static name = 'menu';
    $el;

    constructor(data, renderer) {
        super(data, renderer);
        this.$el = EL('menu');
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
        this.$el.append(createElement(null, { type: 'hr' }));
        this.renderer.dispatchEvent(new Event('menuchanged'));
    }

    #openMenu(i) {
        this.renderer.dispatchEvent(new MenuOpenEvent(i));
        this.set(i);
    }

    close() {
        if (this.$el) this.$el.replaceChildren();
    }

    static style = `
        #menu_overlay {
            cursor: pointer;
            position: fixed;
            left: 0;
            top: 0;
            display: none;
            width: 100%;
            height: 100%;
            background-color: #0008;
            z-index: 2;
            animation: opac .1s;
            backdrop-filter: blur(4px);
          }
          
          .menu {
            display: block;
            max-height: 0;
            transition: max-height .1s ease-out;
            overflow: hidden;
            position: fixed;
            top: 50px;
            background: var(--tab);
            z-index: 3;
            border-radius: 0px 0px 4px 4px;
            max-width: var(--ui_width);
            left: 50%;
            transform: translateX(-50%);
          }
          
          .menu_show {
            max-height: 100%;
            transition: max-height .1s ease-in;
          }
          
          .menu_item {
            cursor: pointer;
            height: 35px;
            line-height: 35px;
            font-size: 20px;
            padding-left: 10px;
            border: 5px solid transparent;
            border-width: 0 0 0 5px;
          }
          
          .menu_item:first-child {
            margin-top: 8px;
          }
          
          .menu_item:last-child {
            margin-bottom: 8px;
          }
          
          .menu_item:hover {
            background: var(--back);
          }
          
          .menu_act {
            border-color: var(--prim);
          }`;
}