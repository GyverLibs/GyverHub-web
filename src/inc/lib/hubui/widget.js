class Widget {
    id;
    renderer;

    constructor(data, renderer) {
        this.id = data.id;
        this.renderer = renderer;
    }

    build() {
        return null;
    }

    update(data) {

    }

    set(value, ack = true) {
        if (ack) Ack.set(this.id);
        return this.renderer.device.set(this.id, value);
    }
}

class BaseWidget extends Widget {
    $root;
    $label;
    $suffix;
    $hint;
    $inner;
    $cont;
    $plabel;
    $container;
    _origData;

    constructor(data, renderer) {
        super(data, renderer);
        this._origData = data;

        createElement(this, {
            type: 'div',
            name: 'root',
            class: 'widget_main',
            style: {
                width: data.wwidth_t + '%',
            },
            children: [
                {
                    type: 'div',
                    name: 'inner',
                    class: 'widget_inner',
                },
                {
                    type: 'div',
                    name: 'cont',
                    class: 'widget_label',
                    children: [
                        {
                            type: 'span',
                            class: 'whint',
                            name: 'hint',
                            text: '?',
                            style: {
                                display: 'none',
                            },
                            also($hint) {
                                $hint.addEventListener('click', () => alert($hint.title));
                            }
                        },
                        {
                            type: 'span',
                            name: 'label',
                            text: data.type.toUpperCase(),
                        },
                        {
                            type: 'span',
                            name: 'plabel',
                        },
                        {
                            type: 'span',
                            name: 'suffix',
                            class: 'wsuffix',
                        },
                    ]
                },
                {
                    type: 'div',
                    name: 'container',
                    class: 'widget_body',
                    style: {
                        minHeight: data.wheight && data.wheight > 25 ? data.wheight + 'px' : '',
                    }
                }
            ]
        });
    }

    build() {
        return this.$root;
    }

    update(data) {
        if ('label' in data) {
            this.$label.innerHTML = data.label.length ? data.label : this._origData.type.toUpperCase();
        }
        if ('suffix' in data) {
            this.$suffix.innerHTML = data.suffix;
        }
        if ('nolabel' in data) {
            if (data.nolabel) this.$cont.classList.add('wnolabel');
            else this.$cont.classList.remove('wnolabel');
        }
        if ('square' in data) {
            if (data.square) this.$root.classList.add('wsquare');
            else this.$root.classList.remove('wsquare');
        }
        if ('notab' in data) {
            if (data.notab) this.$inner.classList.add('widget_notab');
            else this.$inner.classList.remove('widget_notab');
        }
        if ('disable' in data) {
            if (data.disable) this.$container.classList.add('widget_dsbl');
            else this.$container.classList.remove('widget_dsbl');
        }
        if ('hint' in data) {
            this.hint(data.hint)
        }
    }

    hint(text) {
        let htext = 'name: ' + id + '\n' + (text ?? '');
        this.$label.title = htext;
        this.$hint.title = htext;
        this.$hint.style.display = (text && text.length) ? 'inline-block' : 'none';
    }

    disable(el, disable) {
        if (disable) {
            el.setAttribute('disabled', '1');
            el.classList.add('disable');
        } else {  // null/undefined/0/false
            el.removeAttribute('disabled');
            el.classList.remove('disable');
        }
    }

    align(align) {
        this.$container.style.justifyContent = ["flex-start", "center", "flex-end"][Number(align ?? 1)];
    }

    setPlabel(text = null) {
        this.$plabel.innerHTML = text ?? '';
    }
}
