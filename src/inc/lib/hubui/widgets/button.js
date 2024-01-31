class Button extends BaseWidget {
    $btn;
    pressID = null;
    touch = 0;

    constructor(data, renderer) {
        super(data, renderer);

        const $btn = document.createElement('button');
        $btn.id = ID(data.id);
        $btn.className = 'icon w_btn';
        $btn.addEventListener('click', () => {
            post_set(data.id, 2);
        });
        $btn.addEventListener('mousedown', () => {
            if(!this.touch) post_set(data.id, 1);
        });
        $btn.addEventListener('mouseup', () => {
            if(!this.touch&&this.pressID) post_set(data.id, 0);
        });
        $btn.addEventListener('mouseleave', () => {
            if(!this.touch&&this.pressID) post_set(data.id, 0);
        });

        $btn.addEventListener('touchstart', () => {
            this.touch=1;
            post_click(data.id, 1);
        });
        $btn.addEventListener('touchend', () => {
            post_click(data.id,0)
        });

        this.$container.append($btn);
        this.$btn = $btn;
        this.update(data);
    }

    update(data) {
        super.update(data);

        if ('icon' in data) {
            this.#setIcon(data.icon);
        }
        if ('color' in data) {
            let col = intToCol(data.color);
            this.$btn.style.color = col;
            this.$btn.style.fill = col;
            this.$btn.setAttribute("data-color", col);
        }
        if ('fsize' in data) {
            let size = data.fsize + 'px';
            this.$btn.style.fontSize = size;
            if (!this.$btn.getAttribute("data-inline")) el.style.width = size;
            else this.$btn.style.width = 'unset';
            this.$btn.setAttribute("data-size", size);
        }
        if ('disable' in data) {
            this.disable(this.$btn, data.disable);
        }
    }

    #setIcon(text) {
        let icon = "";
        this.$btn.style.width = 'unset';
        if (text) {
            if (text.includes(".svg")) {
                hub.dev(focused).addFile(this.id, text, (data) => {
                    this.setPlabel();
                    this.$btn.innerHTML = dataTotext(data);
                    this.$btn.style.width = this.$btn.getAttribute("data-size");
                    this.$btn.style.fill = this.$btn.getAttribute("data-color");
                });
                this.$btn.removeAttribute("data-inline");
                return;
            } else {
                icon = getIcon(text);
            }
        }
        this.$btn.innerHTML = icon;
        this.$btn.setAttribute("data-inline", true);
    }
}
Renderer.register('button', Button);
