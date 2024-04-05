class TabsWidget extends BaseWidget {
    static wtype = 'tabs';
    $el;
    $ul;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-tabs',
            name: 'el',
            children: [
                {
                    tag: 'ul',
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
                    const $i = makeDOM(null, {
                        tag: 'li',
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
            if (i == num) list[i].classList.add('w-tab-act');
            else list[i].classList.remove('w-tab-act');
        }
        if (move) this.$ul.scrollLeft = this.$ul.scrollWidth * num / list.length;
    }

    static style = `
        .w-tabs {
            width: 100%;
          }
          
          .w-tabs>ul {
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
          
          .w-tabs ul::-webkit-scrollbar {
            display: none;
          }
          
          .w-tabs>ul>li {
            display: flex;
            align-items: center;
            color: var(--font);
            border-radius: 5px;
            padding: 5px;
            margin: 2px;
          }
          
          .w-tabs:not(.widget-disable)>ul {
            cursor: pointer;
          }
          
          .w-tabs:not(.widget-disable)>ul>li:hover {
            /*filter: brightness(0.8);*/
            background: var(--back);
          }
          
          .w-tab-act {
            background: var(--active-item-color) !important;
            color: var(--tab) !important;
            font-weight: 600;
          }`;
}