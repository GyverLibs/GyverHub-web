class Button extends BaseWidget {
    $btn;
    pressID = null;
    touch = 0;

    constructor(data, renderer) {
        super(data, renderer);

        this.$container.append(createElement(this, {
            type: 'button',
            class: 'icon w_btn',
            name: 'btn',
            also($btn) {
                $btn.addEventListener('click', () => {
                    this.set(2);
                });
                $btn.addEventListener('mousedown', () => {
                    if(!this.touch) this.set(1);
                });
                $btn.addEventListener('mouseup', () => {
                    if(!this.touch&&this.pressID) this.set(0);
                });
                $btn.addEventListener('mouseleave', () => {
                    if(!this.touch&&this.pressID) this.set(0);
                });
        
                $btn.addEventListener('touchstart', () => {
                    this.touch=1;
                    this.pressID = data.id;
                    this.set(1, false);
                });
                $btn.addEventListener('touchend', () => {
                    this.pressID = null;
                    this.set(0, false);
                });
            }
        }));
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
