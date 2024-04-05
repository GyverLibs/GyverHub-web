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
            class: 'cont_title',
            text: this.data.label,
        });

        children.push({
            tag: 'div',
            name: 'root',
            class: 'widget_' + this.data.rowcol,
        });

        makeDOM(obj, {
            tag: 'div',
            name: 'cont',
            children: children,
        });
        return super.build(obj.$cont, obj.$root);
    }
}

class SpoilerWidget extends BaseContainer {
    static wtype = 'spoiler';

    constructor(data, renderer) {
        super(data, renderer);
    }

    build() {
        let obj = {};
        let children = [];

        children.push({
            tag: 'div',
            class: 'spoiler_title',
            text: this.data.label ?? 'Spoiler',
        });

        children.push({
            tag: 'div',
            name: 'root',
            class: 'widget_' + this.data.rowcol,
        });

        makeDOM(obj, {
            tag: 'div',
            name: 'cont',
            children: children,
        });
        return super.build(obj.$cont, obj.$root);
    }
}