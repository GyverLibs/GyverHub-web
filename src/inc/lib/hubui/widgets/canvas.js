class CanvasWidget extends BaseWidget {
    static wtype = 'canvas';
    $el;
    #scale = 1;
    #resize_h;
    cfg = new CanvasConfig();

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            class: 'w-canvas',
            children: [
                {
                    tag: 'canvas',
                    name: 'el',
                    events: {
                        click: e => this.#click(e)
                    }
                }
            ]
        });

        this.#resize();
        this.#resize_h = this.#resize.bind(this);
        window.addEventListener('resize', () => {
            let cv = this.$el;
            let cx = cv.getContext("2d");
            let img = new Image();
            img.src = cv.toDataURL();
            img.crossorigin = 'anonymous';
            let params = {};
            ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'textBaseline', 'textAlign', 'font'].forEach(param => {
                params[param] = cx[param];
            });

            img.onload = () => {
                let bufw = cv.width;
                this.#resize_h();
                cx.drawImage(img, 0, 0, cv.width, cv.width * img.height / img.width);
                for (let param in params) cx[param] = params[param];
                let scale = cv.width / bufw;
                let size_name = canvasGetFont(cx);
                canvasSetFont(cx, [size_name[0] * scale, size_name[1]]);
                cx.lineWidth *= scale;
            }
        });

        waitRender(this.$el).then(() => {
            this.#resize();
            canvasDefault(this.$el.getContext("2d"), this.#scale);
            this.update(data);
        });

        this.disable(this.$el, data.disable);
    }

    update(data) {
        super.update(data);

        if ('active' in data) this.$el.style.cursor = data.active ? 'pointer' : '';
        if ('data' in data) this.#show(data.data);
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
    }

    #show(data) {
        if (!this.$el.parentNode.clientWidth) return;
        const cv = this.$el;
        this.cfg.scale = this.#scale;

        showCanvasAPI(
            cv,
            this.cfg,
            [],
            data,
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

    static style = `
        .w-canvas {
            border-radius: 4px;
            width: 100%;
            height: 100%;
            overflow: hidden;
            margin-bottom: -5px;
          }`;
}