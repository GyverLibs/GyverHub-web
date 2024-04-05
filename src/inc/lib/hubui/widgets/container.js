class BaseContainer extends Widget {
    #children;

    constructor(data, renderer) {
        super(data, renderer);
        this.#children = [];
        this.renderer._makeWidgets(this.#children, data.rowcol, data.data);
    }

    build($cont, $root) {
        $cont.style.width = this.data.wwidth_perc + '%';
        for (const w of this.#children) {
            const $w = w.build();
            if ($w) $root.append($w);
        }
        return $cont;
    }
}

class ContainerWidget extends BaseContainer {
    static wtype = 'container';

    constructor(data, renderer) {
        super(data, renderer);
    }

    build() {
        let obj = {};
        let children = [];

        if (this.data.label) children.push({
            tag: 'div',
            class: 'cont-title',
            text: this.data.label,
        });

        children.push({
            tag: 'div',
            name: 'root',
            class: this.data.rowcol == 'col' ? 'container-col' : 'container-row',
        });

        makeDOM(obj, {
            tag: 'div',
            name: 'cont',
            children: children,
        });
        return super.build(obj.$cont, obj.$root);
    }

    static style = `
    .cont-title {
        text-align: center;
        font-size: 28px;
        padding-top: 6px;
        padding-bottom: 3px;
      }`;
}

class SpoilerWidget extends BaseContainer {
    static wtype = 'spoiler';
    $arrow;
    $cont;
    $root;

    constructor(data, renderer) {
        super(data, renderer);
    }

    build() {
        let children = [];
        let right = '';
        let down = '';
console.log(this.data);
        children.push({
            tag: 'div',
            class: 'spoiler-inner',
            style: {
                background: hexToCol(this.data.color),
            },
            events: {
                click: () => {
                    this.$root.classList.toggle('spoiler-hidden');
                    this.$arrow.innerText = this.$root.classList.contains('spoiler-hidden') ? right : down;
                }
            },
            children: [
                {
                    tag: 'div',
                    name: 'arrow',
                    class: 'icon spoiler-icon',
                    text: right,
                },
                {
                    tag: 'div',
                    text: this.data.label ?? 'Spoiler',
                }
            ]
        });

        children.push({
            tag: 'div',
            name: 'root',
            class: (this.data.rowcol == 'col' ? 'container-col' : 'container-row') + ' spoiler-hidden',
        });

        makeDOM(this, {
            tag: 'div',
            name: 'cont',
            children: children,
        });

        return super.build(this.$cont, this.$root);
    }

    static style = `
    .spoiler-hidden {
        display: none;
    }
    .spoiler-icon {
        padding-right: 4px;
        padding-left: 14px;
        width: 20px;
        text-align: center;
        display: flex;
        align-items: center;
    }
    .spoiler-inner {
        display: flex;
        padding: 7px 0px;
        background: var(--prim);
        color: white;
        box-shadow: 0px 3px 0px 0px inset #ffffff05, 0 0 10px 0px #00000021, 0px -3px 1px 0px inset #00000010;
        border-radius: 8px;
        margin: 2px;
        margin-top: 6px;
        cursor: pointer;
        font-size: 26px;
        user-select: none;
      }
      .spoiler-inner:hover {
        filter: brightness(1.05);
      }
      .spoiler-inner:active {
        filter: brightness(0.95);
      }`;
}