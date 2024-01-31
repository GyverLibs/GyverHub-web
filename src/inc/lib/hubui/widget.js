class Widget {
    id;

    constructor(data, renderer) {
        this.id = data.id;
    }

    build() {
        return null;
    }

    update(data) {

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
        super(data, renderer)
        this._origData = data;
    
        const htext = 'name: ' + id + '\n' + (data.hint ?? '');

        const $root = document.createElement('div');
        $root.id = 'widget_main#' + data.id;
        $root.classList.add('widget_main');
        if (data.square) 
            $root.classList.add('wsquare');
        $root.style.width = data.wwidth_t + '%';
        this.$root = $root;

        const $inner = document.createElement('div');
        $inner.id = 'widget_inner#' + data.id;
        $inner.classList.add('widget_inner');
        if (data.notab && data.notab == 1) 
            $inner.classList.add('widget_notab');
        $root.append($inner);
        this.$inner = $inner;

        const $cont = document.createElement('div');
        $cont.id = 'wlabel_cont#' + data.id;
        $cont.classList.add('widget_label');
        if (data.nolabel) 
            $cont.classList.add('wnolabel');
        $root.append($cont);
        this.$cont = $cont;

        const $hint = document.createElement('span');
        $hint.id = 'whint#' + data.id;
        $hint.classList.add('whint');
        $hint.innerText = '?';
        $hint.title = htext;
        $hint.style.display = (data.hint && data.hint.length) ? 'inline-block' : 'none';
        $hint.addEventListener('click', function() {
            alert(this.title);
        });
        $cont.append($hint);
        this.$hint = $hint;

        const $label = document.createElement('span');
        $label.id = 'wlabel#' + data.id;
        $label.title = htext;
        $label.innerText = (data.label && data.label.length) ? data.label : data.type.toUpperCase();
        $cont.append($label);
        this.$label = $label;

        const $plabel = document.createElement('span');
        $plabel.id = 'plabel#' + data.id;
        $cont.append($plabel);
        this.$plabel = $plabel;

        const $suffix = document.createElement('span');
        $suffix.id = 'wsuffix#' + data.id;
        $hint.classList.add('wsuffix');
        $suffix.innerText = data.suffix ?? '';
        $cont.append($suffix);
        this.$suffix = $suffix;
        
        const $container = document.createElement('div');
        $container.id = 'widget#' + data.id;
        $hint.classList.add('widget_body');
        if (data.disable) 
            $cont.classList.add('widget_dsbl');
        if (data.wheight && data.wheight > 25) 
            $cont.style.minHeight = data.wheight + 'px';
        $root.append($container);
        this.$container = $container;
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
