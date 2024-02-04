/**
 * Abstract widget.
 */
class Widget {
    /** @type {string} */
    id;
    /** @type {string} */
    type;
    /** @type {Renderer} */
    renderer;

    /**
     * @param {object} data 
     * @param {Renderer} renderer 
     */
    constructor(data, renderer) {
        this.id = data.id;
        this.type = data.type;
        this.renderer = renderer;
    }

    /**
     * Build HTML tree from widget.
     * 
     * Should be overriden.
     * @returns {HTMLElement | null}
     */
    build() {
        return null;
    }

    /**
     * Handle update.
     * 
     * Should be overriden.
     * @param {object} data 
     */
    update(data) {

    }

    /**
     * Handle previous set (with ack) was timed out.
     * 
     * Should be overriden.
     */
    handleSetTimeout() {}

    /**
     * Handle ack for previous set.
     * 
     * Should be overriden.
     */
    handleAck() {}

    /**
     * Handle renderer closing. 
     * 
     * Should be overriden to stop timers (if any).
     */
    close() {}

    /**
     * Set widget value.
     * 
     * Should be called from subclass.
     * @param {any} value 
     * @param {boolean} ack 
     * @returns {Promise<undefined>}
     */
    set(value, ack = true) {
        this.renderer._set(this, value, ack);
    }
}

/**
 * Widget with container.
 */
class BaseWidget extends Widget {
    /** @type {HTMLDivElement} */
    #root;
    /** @type {HTMLDivElement} */
    #inner;

    /** @type {HTMLDivElement} */
    #cont;

    /** @type {HTMLSpanElement} */
    #hint;
    /** @type {HTMLSpanElement} */
    #label;
    /** @type {HTMLSpanElement} */
    #plabel;
    /** @type {HTMLSpanElement} */
    #suffix;

    /** @type {HTMLDivElement} */
    #container;

    _origData;

    /**
     * @param {object} data 
     * @param {Renderer} renderer 
     */
    constructor(data, renderer) {
        super(data, renderer);
        this._origData = data;

        this.#root = createElement(this, {
            type: 'div',
            class: 'widget_main',
            style: {
                width: data.wwidth_t + '%',
            }
        });

        this.#inner = createElement(this, {
            type: 'div',
            class: 'widget_inner'
        });
        this.#root.append(this.#inner);

        this.#cont = createElement(this, {
            type: 'div',
            class: 'widget_label'
        });
        this.#inner.append(this.#cont);

        this.#hint = createElement(this, {
            type: 'span',
            class: 'whint',
            text: '?',
            style: {
                display: 'none',
            },
            also($hint) {
                $hint.addEventListener('click', () => asyncAlert($hint.title));
            }
        });
        this.#cont.append(this.#hint);

        this.#label = createElement(this, {
            type: 'span',
            text: data.type.toUpperCase(),
        });
        this.#cont.append(this.#label);

        this.#plabel = createElement(this, {
            type: 'span',
        });
        this.#cont.append(this.#plabel);

        this.#suffix = createElement(this, {
            type: 'span',
            class: 'wsuffix',
        });
        this.#cont.append(this.#suffix);


        this.#container = createElement(this, {
            type: 'div',
            class: 'widget_body',
            style: {
                minHeight: data.wheight && data.wheight > 25 ? data.wheight + 'px' : '',
            }
        });
        this.#inner.append(this.#container);
    }

    build() {
        return this.#root;
    }

    /**
     * Initialize widget layout.
     * 
     * Should be called from subclass constructor.
     * @param {object[]} obj 
     */
    makeLayout(...obj) {
        this.#container.replaceChildren(...obj.map(o => createElement(this, o)));
    }

    /**
     * Handle update.
     * 
     * Subclass should override this method and call super.update(data) from it.
     * @param {object} data 
     */
    update(data) {
        if ('label' in data) {
            this.#label.innerHTML = data.label.length ? data.label : this.type.toUpperCase();
        }
        if ('suffix' in data) {
            this.#suffix.innerHTML = data.suffix;
        }
        if ('nolabel' in data) {
            if (data.nolabel) this.#cont.classList.add('wnolabel');
            else this.#cont.classList.remove('wnolabel');
        }
        if ('square' in data) {
            if (data.square) this.#root.classList.add('wsquare');
            else this.#root.classList.remove('wsquare');
        }
        if ('notab' in data) {
            if (data.notab) this.#inner.classList.add('widget_notab');
            else this.#inner.classList.remove('widget_notab');
        }
        if ('disable' in data) {
            if (data.disable) this.#container.classList.add('widget_dsbl');
            else this.#container.classList.remove('widget_dsbl');
        }
        if ('hint' in data) {
            const htext = 'name: ' + this.id + '\n' + (data.hint ?? '');
            this.#label.title = htext;
            this.#hint.title = htext;
            this.#hint.style.display = (data.hint && data.hint.length) ? 'inline-block' : 'none';
        }
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
        this.#container.style.justifyContent = ["flex-start", "center", "flex-end"][Number(align ?? 1)];
    }

    setPlabel(text = null) {
        this.#plabel.innerHTML = text ?? '';
    }

    /**
     * Internal method.
     */
    handleSetTimeout(){
        this.setPlabel('[ERROR]');
    }

    /**
     * Internal method.
     */
    handleAck() {
        this.setPlabel();
    }
}
