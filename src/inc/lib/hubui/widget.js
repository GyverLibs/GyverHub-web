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
    /** @type {object} */
    data;

    set_delay = 50;
    set_buf = null;
    set_timer = null;
    wcontainer = null;

    /**
     * @param {object} data 
     * @param {Renderer} renderer 
     */
    constructor(data, renderer) {
        this.id = data.id;
        this.type = data.type;
        this.data = data;
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
        for (const [k, v] of Object.entries(data))
            this.data[k] = v;
    }

    /**
     * Handle previous set (with ack) was timed out.
     * 
     * Should be overriden.
     */
    _handleSetError(err) { }

    /**
     * Handle ack for previous set.
     * 
     * Should be overriden.
     */
    _handleAck() { }

    /**
     * Handle renderer closing. 
     * 
     * Should be overriden to stop timers (if any).
     */
    close() { }

    /**
     * Set widget value.
     * 
     * Should be called from subclass.
     * @param {any} value 
     * @param {boolean} ack 
     * @returns {Promise<undefined>}
     */
    async set(value, ack = true) {
        if (!this.id) return;
        value = value.toString();
        if (this.set_timer) {
            this.set_buf = value;
        } else {
            this.set_timer = setTimeout(() => {
                this.set_timer = null;
                if (this.set_buf !== null) return this.renderer._set(this, this.set_buf, ack);
                this.set_buf = null;
            }, this.set_delay);

            return this.renderer._set(this, value, ack);
        }
    }

    /**
     * Register an UI file to load.
     * 
     * Should be called from subclass.
     * @param {string} path
     * @param {string} type
     * @param {(string) => undefined} callback 
     */
    addFile(path, type, callback) {
        this.renderer._addFile(this, path, type, callback);
    }

    _handleFileProgress(perc) { }
    _handleFileError(err) { }
    _handleFileLoaded(res) { }
}

/**
 * Widget with container.
 */
class BaseWidget extends Widget {
    nolabel = false;
    notab = false;

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

    /**
     * @param {object} data 
     * @param {Renderer} renderer 
     */
    constructor(data, renderer) {
        super(data, renderer);

        this.#root = makeDOM(this, {
            tag: 'div',
            class: 'widget-main',
            style: {
                width: data.wwidth_perc + '%',
            }
        });

        this.#inner = makeDOM(this, {
            tag: 'div',
            class: 'widget-inner'
        });
        this.#root.append(this.#inner);

        this.#cont = makeDOM(this, {
            tag: 'div',
            class: 'widget-label'
        });
        this.#inner.append(this.#cont);

        this.#hint = makeDOM(this, {
            tag: 'span',
            class: 'widget-hint',
            text: '?',
            style: {
                display: 'none',
            },
            also($hint) {
                $hint.addEventListener('click', () => asyncAlert($hint.title));
            }
        });
        this.#cont.append(this.#hint);

        this.#label = makeDOM(this, {
            tag: 'span',
            text: data.type.toUpperCase(),
            title: this.id,
        });
        this.#cont.append(this.#label);

        this.#plabel = makeDOM(this, {
            tag: 'span',
            class: 'widget-plabel',
        });
        this.#cont.append(this.#plabel);

        this.#suffix = makeDOM(this, {
            tag: 'span',
            class: 'widget-suffix',
        });
        this.#cont.append(this.#suffix);

        this.#container = makeDOM(this, {
            tag: 'div',
            class: 'widget-body',
            style: {
                minHeight: (data.wheight ?? 25) + 'px',
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
        this.#container.replaceChildren(...obj.map(o => makeDOM(this, o)));
    }

    /**
     * Handle update.
     * 
     * Subclass should override this method and call super.update(data) from it.
     * @param {object} data 
     */
    update(data) {
        super.update(data);
        if ('label' in data) {
            this.#label.textContent = data.label.length ? data.label : this.type.toUpperCase();
        }
        if ('suffix' in data) {
            this.#suffix.textContent = data.suffix;
        }
        if ('nolabel' in data) {
            if (data.nolabel) this.#cont.classList.add('widget-nolabel');
            else this.#cont.classList.remove('widget-nolabel');
        }
        if ('square' in data) {
            if (data.square) this.#root.classList.add('widget-square');
            else this.#root.classList.remove('widget-square');
        }
        if ('notab' in data) {
            if (data.notab) this.#inner.classList.add('widget-notab');
            else this.#inner.classList.remove('widget-notab');
        }
        if ('disable' in data) {
            if (data.disable) this.#container.classList.add('widget-disabled');
            else this.#container.classList.remove('widget-disabled');
        }
        if ('hint' in data) {
            const htext = 'name: ' + this.id + '\n' + (data.hint ?? '');
            this.#label.title = htext;
            this.#hint.title = htext;
            this.#hint.style.display = (data.hint && data.hint.length) ? 'inline-block' : 'none';
        }
        
        if (this.nolabel) this.#cont.classList.add('widget-nolabel');
        if (this.notab) this.#inner.classList.add('widget-notab');
    }

    disable(el, disable) {
        if (disable) {
            el.setAttribute('disabled', '1');
            el.classList.add('widget-disable');
        } else {  // null/undefined/0/false
            el.removeAttribute('disabled');
            el.classList.remove('widget-disable');
        }
    }

    disabled() {
        return this.#container.classList.contains('widget-disabled');
    }

    align(align) {
        this.#container.style.justifyContent = ["flex-start", "center", "flex-end"][Number(align ?? 1)];
    }

    setPlabel(text = null) {
        this.#plabel.textContent = ' ' + (text ?? '');
    }

    setSuffix(text = null) {
        this.#suffix.textContent = text ?? '';
    }

    _handleSetError(err) {
        this.setPlabel("[ERR]");
        showPopupError(`Widget ${this.id}: ` + getError(err));
    }

    _handleAck() {
        this.setPlabel();
    }

    _handleFileProgress(perc) {
        this.setPlabel(`[${perc}%]`);
    }

    _handleFileError(err) {
        this.setPlabel("[ERR]");
        showPopupError(`Widget ${this.id}: ` + getError(err));
    }

    _handleFileLoaded() {
        this.setPlabel();
    }
}
