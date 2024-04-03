class DpadWidget extends BaseWidget {
    static wtype = 'dpad';
    $el;
    #posX = 0;
    #posY = 0;
    #pressed = false;

    #_onTouchStart;
    #_onTouchEnd;
    #_onMouseDown;
    #_onMouseUp;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'canvas',
            name: 'el'
        });

        this.data.color = colToInt(hexToCol(this.data.color));

        if ("ontouchstart" in document.documentElement) {
            this.#_onTouchStart = this.#onTouchStart.bind(this);
            this.#_onTouchEnd = this.#onTouchEnd.bind(this);
            this.$el.addEventListener("touchstart", this.#_onTouchStart);
            document.addEventListener("touchend", this.#_onTouchEnd);
        } else {
            this.#_onMouseDown = this.#onMouseDown.bind(this);
            this.#_onMouseUp = this.#onMouseUp.bind(this);
            this.$el.addEventListener("mousedown", this.#_onMouseDown);
            document.addEventListener("mouseup", this.#_onMouseUp);
        }

        this.$el.parentNode.addEventListener('resize', () => {
            this.#redraw();
        })

        this.update(data);
        this.disable(this.$el, data.disable);
        waitFrame().then(() => {
            this.#redraw(false);
        });
    }

    close() {
        if ("ontouchstart" in document.documentElement) {
            this.$el.removeEventListener("touchstart", this.#_onTouchStart);
            document.removeEventListener("touchend", this.#_onTouchEnd);
        } else {
            this.$el.removeEventListener("mousedown", this.#_onMouseDown);
            document.removeEventListener("mouseup", this.#_onMouseUp);
        }
    }

    #redraw(send = true) {
        const cv = this.$el;
        let size = cv.parentNode.clientWidth;
        if (!size) return;
        cv.style.width = size + 'px';
        cv.style.height = size + 'px';
        size *= window.devicePixelRatio;
        const center = size / 2;
        cv.width = size;
        cv.height = size;
        cv.style.cursor = 'pointer';

        let x = 0;
        let y = 0;

        if (this.#pressed) {
            x = Math.round((this.#posX - center) / center * 255);
            y = -Math.round((this.#posY - center) / center * 255);

            if (Math.abs(x) < 50 && Math.abs(y) < 50) {
                x = 0;
                y = 0;
            } else {
                if (Math.abs(x) > Math.abs(y)) {
                    x = Math.sign(x);
                    y = 0;
                } else {
                    x = 0;
                    y = Math.sign(y);
                }
            }
        }

        const cx = cv.getContext("2d");
        cx.clearRect(0, 0, size, size);

        cx.beginPath();
        cx.arc(center, center, size * 0.44, 0, 2 * Math.PI, false);
        cx.lineWidth = size * 0.02;
        cx.strokeStyle = intToCol(this.#pressed ? adjustColor(this.data.color, 1.3) : this.data.color);
        cx.stroke();

        cx.lineWidth = size * 0.045;
        const rr = size * 0.36;
        const cw = size * 0.1;
        const ch = rr - cw;
        const sh = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let i = 0; i < 4; i++) {
            cx.beginPath();
            cx.strokeStyle = intToCol((x == sh[i][0] && y == -sh[i][1]) ? adjustColor(this.data.color, 1.3) : this.data.color);
            cx.moveTo(center + ch * sh[i][0] - cw * sh[i][1], center + ch * sh[i][1] - cw * sh[i][0]);
            cx.lineTo(center + rr * sh[i][0], center + rr * sh[i][1]);
            cx.lineTo(center + ch * sh[i][0] + cw * sh[i][1], center + ch * sh[i][1] + cw * sh[i][0]);
            cx.stroke();
        }

        if (send) this.set(x + ';' +  y);
    }

    #onTouchStart(event) {
        if (this.data.disable) return;
        event.preventDefault();
        this.#pressed = true;
        const ratio = window.devicePixelRatio;
        this.#posX = (event.targetTouches[0].pageX - this.$el.offsetLeft) * ratio;
        this.#posY = (event.targetTouches[0].pageY - this.$el.offsetTop) * ratio;
        this.#redraw();
    }

    #onMouseDown(event) {
        if (this.data.disable) return;
        this.#pressed = true;
        const ratio = window.devicePixelRatio;
        this.#posX = (event.pageX - this.$el.offsetLeft) * ratio;
        this.#posY = (event.pageY - this.$el.offsetTop) * ratio;
        this.#redraw();
    }

    #onTouchEnd() {
        if (this.#pressed) {
            this.#pressed = false;
            this.#redraw();
        }
    }

    #onMouseUp() {
        if (this.#pressed) {
            this.#pressed = false;
            this.#redraw();
        }
    }
}
