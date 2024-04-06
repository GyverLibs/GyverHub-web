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
            style: {
                color: this.data.color ? hexToCol(this.data.color) : 'var(--font)',
            },
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
      }

      .container-row {
        display: flex;
        min-height: 50px;
        box-sizing: border-box;
      }
      
      .container-col {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
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

        children.push({
            tag: 'div',
            class: 'spoiler-inner',
            style: {
                background: hexToCol(this.data.color),
            },
            events: {
                click: () => {
                    this.$root.classList.toggle('spoiler-hidden');
                    this.$arrow.classList.toggle('spoiler-icon-rot');
                }
            },
            children: [
                {
                    tag: 'div',
                    name: 'arrow',
                    class: 'icon spoiler-icon',
                    text: '',
                },
                {
                    tag: 'div',
                    text: this.data.label ?? 'Spoiler',
                    style: { paddingLeft: '2px', },
                }
            ]
        });

        children.push({
            tag: 'div',
            name: 'root',
            class: (this.data.rowcol == 'col' ? 'container-col' : 'container-row') + ' spoiler-cont spoiler-hidden',
        });

        makeDOM(this, {
            tag: 'div',
            name: 'cont',
            children: children,
        });

        return super.build(this.$cont, this.$root);
    }

    static style = `
    .spoiler-cont {
        transform: scaleY(1);    
        transform-origin: top;
        transition: transform 0.12s ease;
    }
    .spoiler-hidden {
        transform: scaleY(0);
    }
    .spoiler-icon {
        width: 23px;
        height: 23px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.12s ease;
    }
    .spoiler-icon-rot {
        transform: rotate(90deg);
    }
    .spoiler-inner {
        display: flex;
        align-items: center;
        padding: 7px 0px;
        background: var(--prim);
        color: white;
        box-shadow: 0px 3px 0px 0px inset #ffffff05, 0 0 10px 0px #00000021, 0px -3px 1px 0px inset #00000010;
        border-radius: 8px;
        margin: 3px;
        margin-top: 6px;
        cursor: pointer;
        font-size: 26px;
        user-select: none;
        padding-left: 5px;
      }
      .spoiler-inner:hover {
        filter: brightness(1.05);
      }
      .spoiler-inner:active {
        filter: brightness(0.95);
      }`;
}