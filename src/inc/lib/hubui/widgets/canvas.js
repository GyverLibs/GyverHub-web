class CanvasWidget extends BaseWidget {
    $el;
    #data = [];
    #scale = 1;
    #resize_h;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_canvas',
            children: [
                {
                    type: 'canvas',
                    name: 'el',
                    events: {
                        click: e => this.#click(e)
                    }
                }
            ]
        });

        this.#resize();
        this.#resize_h = this.#resize.bind(this);
        window.addEventListener('resize', this.#resize_h);

        wait2Frame().then(() => {
            this.#resize();
        });

        this.update(data);
        this.disable(this.$el, data.disable);
    }

    update(data) {
        super.update(data);

        if ('active' in data) this.$el.style.cursor = data.active ? 'pointer' : '';
        if ('data' in data) {
            this.#data = this.#data.concat(data.data);
            this.#show(data.data);
        }
    }

    close() {
        window.removeEventListener('resize', this.#resize_h);
    }

    #click(e) {
        if (!this.data.active) return;
        const rect = this.$el.getBoundingClientRect();
        const ratio = window.devicePixelRatio;
        let x = Math.round((e.clientX - rect.left) / this.#scale * ratio);
        if (x < 0) x = 0;
        let y = Math.round((e.clientY - rect.top) / this.#scale * ratio);
        if (y < 0) y = 0;
        this.set(x + ';' + y);
        this.setSuffix('[' + x + ',' + y + ']');
    }

    #resize() {
        const rw = this.$el.parentNode.clientWidth;
        if (!rw) return;
        const scale = rw / this.data.width;
        const ratio = window.devicePixelRatio;
        this.#scale = scale * ratio;
        const rh = Math.floor(this.data.height * scale);
        this.$el.style.width = rw + 'px';
        this.$el.style.height = rh + 'px';
        this.$el.width = Math.floor(rw * ratio);
        this.$el.height = Math.floor(rh * ratio);
        this.#show(this.#data);
    }

    #show(data) {
        if (!this.$el.parentNode.clientWidth) return;
        const cv = this.$el;

        showCanvasAPI(
            cv,
            data,
            this.#scale,
            (x, y) => {
                x *= this.#scale;
                y *= this.#scale;
                if (x < 0) x = cv.width - x;
                if (y < 0) y = cv.height - y;
                return [x, y];
            },
            (path, img) => {
                this.addFile(path, 'url', (file) => {
                    img.src = file;
                });
            }
        );
    }

    static style() {
        return `
        .w_canvas {
            border-radius: 4px;
            width: 100%;
            height: 100%;
            overflow: hidden;
            margin-bottom: -5px;
          }`
    }
}