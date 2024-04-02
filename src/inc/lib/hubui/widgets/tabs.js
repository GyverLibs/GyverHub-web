class TabsWidget  extends BaseWidget {
    $el;
    $ul;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_tabs',
            name: 'el',
            children: [
                {
                    type: 'ul',
                    name: 'ul',
                    events: {
                        wheel: e => {
                            e.preventDefault();
                            this.$ul.scrollLeft += e.deltaY;
                        },
                        click: e => {
                            if (this.$el.getAttribute("disabled")) return;
                            const tabId = e.target.dataset.tabId;
                            if (tabId === undefined) return;
                            this.set(tabId);
                            this.#change(tabId, false);
                        }
                    }
                }
            ]
        });
        

        this.disable(this.$el, data.disable);
        this.update(data);
        waitFrame().then(() => this.#change(data.value ?? 0));
    }

    update(data) {
        super.update(data);

        if ('text' in data) {
            const tabs = [];
            if (data.text) {
                const labels = data.text.split(/[,;]/);
                for (const i in labels) {
                    const $i = createElement(null, {
                        type: 'li',
                        text: labels[i].trim(),
                    });
                    $i.dataset.tabId = i;
                    tabs.push($i);
                }
            }
            this.$ul.replaceChildren(...tabs);
        }
        if ('value' in data) this.#change(Number(data.value));
        if ('color' in data) this.$ul.style.setProperty('--active-item-color', hexToCol(data.color));
    }

    #change(num, move = true) {
        const list = this.$ul.children;
        for (let i = 0; i < list.length; i++) {
            if (i == num) list[i].classList.add('w_tab_act');
            else list[i].classList.remove('w_tab_act');
        }
        if (move) this.$ul.scrollLeft = this.$ul.scrollWidth * num / list.length;
    }

    static style() {
        return `
        .w_tabs {
            width: 100%;
          }
          
          .w_tabs>ul {
            --active-item-color: var(--prim);
            padding: 0;
            display: flex;
            list-style-type: none;
            font-size: 19px;
            flex-direction: row;
            overflow-x: scroll;
            white-space: nowrap;
            scrollbar-width: none;
            user-select: none;
            margin: 0;
          }
          
          .w_tabs ul::-webkit-scrollbar {
            display: none;
          }
          
          .w_tabs>ul>li {
            display: flex;
            align-items: center;
            color: var(--font);
            border-radius: 5px;
            padding: 5px;
            margin: 2px;
          }
          
          .w_tabs:not(.disable)>ul {
            cursor: pointer;
          }
          
          .w_tabs:not(.disable)>ul>li:hover {
            /*filter: brightness(0.8);*/
            background: var(--back);
          }
          
          .w_tab_act {
            background: var(--active-item-color) !important;
            color: var(--tab) !important;
            font-weight: 600;
          }`;
    }
}