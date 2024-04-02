class JoyWidget extends BaseWidget {
    static name = 'joy';
    $el;
    #center = 0;
    #posX = null;
    #posY = null;
    #pressed = 0;

    #_onTouchStart;
    #_onTouchMove;
    #_onTouchEnd;
    #_onMouseDown;
    #_onMouseMove;
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
            this.#_onTouchMove = this.#onTouchMove.bind(this);
            this.#_onTouchEnd = this.#onTouchEnd.bind(this);
            this.$el.addEventListener("touchstart", this.#_onTouchStart, { passive: false });
            document.addEventListener("touchmove", this.#_onTouchMove, { passive: false });
            document.addEventListener("touchend", this.#_onTouchEnd);
        } else {
            this.#_onMouseDown = this.#onMouseDown.bind(this);
            this.#_onMouseMove = this.#onMouseMove.bind(this);
            this.#_onMouseUp = this.#onMouseUp.bind(this);
            this.$el.addEventListener("mousedown", this.#_onMouseDown);
            document.addEventListener("mousemove", this.#_onMouseMove);
            document.addEventListener("mouseup", this.#_onMouseUp);
        }

        this.$el.parentNode.addEventListener('resize', () => {
            this.#reset();
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
            this.$el.removeEventListener("touchstart", this.#_onTouchStart, { passive: false });
            document.removeEventListener("touchmove", this.#_onTouchMove, { passive: false });
            document.removeEventListener("touchend", this.#_onTouchEnd);
        } else {
            this.$el.removeEventListener("mousedown", this.#_onMouseDown);
            document.removeEventListener("mousemove", this.#_onMouseMove);
            document.removeEventListener("mouseup", this.#_onMouseUp);
        }
    }

    #reset() {
        this.#posX = null;
        this.#posY = null;
    }

    #redraw(send = true) {
        const cv = this.$el;
        let size = cv.parentNode.clientWidth;
        if (!size) return;
        cv.style.width = size + 'px';
        cv.style.height = size + 'px';
        size *= window.devicePixelRatio;
        cv.width = size;
        cv.height = size;
        cv.style.cursor = 'pointer';
        const r = size * 0.23;
        const R = size * 0.4;
        this.#center = size / 2;
        if (this.#posX === null) this.#posX = this.#center;
        if (this.#posY === null) this.#posY = this.#center;

        this.#posX = constrain(this.#posX, r, size - r);
        this.#posY = constrain(this.#posY, r, size - r);
        let x = Math.round((this.#posX - this.#center) / (size / 2 - r) * 255);
        let y = -Math.round((this.#posY - this.#center) / (size / 2 - r) * 255);

        const cx = cv.getContext("2d");
        cx.clearRect(0, 0, size, size);

        cx.beginPath();
        cx.arc(this.#center, this.#center, R, 0, 2 * Math.PI, false);
        let grd = cx.createRadialGradient(this.#center, this.#center, R * 2 / 3, this.#center, this.#center, R);
        grd.addColorStop(0, '#00000005');
        grd.addColorStop(1, '#00000030');
        cx.fillStyle = grd;
        cx.fill();

        cx.beginPath();
        cx.arc(this.#posX, this.#posY, r, 0, 2 * Math.PI, false);
        grd = cx.createRadialGradient(this.#posX, this.#posY, 0, this.#posX, this.#posY, r);
        grd.addColorStop(0, intToCol(adjustColor(this.data.color, 0.7)));
        grd.addColorStop(1, intToCol(adjustColor(this.data.color, this.#pressed ? 1.3 : 1)));
        cx.fillStyle = grd;
        cx.fill();

        if (this.data.exp) {
            x = ((x * x + 255) >> 8) * (x > 0 ? 1 : -1);
            y = ((y * y + 255) >> 8) * (y > 0 ? 1 : -1);
        }
        if (send) {
            this.set(x + ';' + y);
            this.setSuffix('[' + x + ',' + y + ']');
        }
    }

    #onTouchStart(event) {
        if (this.data.disabled) return;
        event.preventDefault();
        this.#pressed = true;
    }

    #onTouchMove(event) {
        if (!this.#pressed) return;

        event.preventDefault();
        let target = null;
        for (const t of event.changedTouches) {
            if (t.target === this.$el) target = t;
        }
        if (!target) return;

        this.#posX = target.pageX;
        this.#posY = target.pageY;

        if (this.$el.offsetParent.tagName.toUpperCase() === "BODY") {
            this.#posX -= this.$el.offsetLeft;
            this.#posY -= this.$el.offsetTop;
        } else {
            this.#posX -= this.$el.offsetParent.offsetLeft;
            this.#posY -= this.$el.offsetParent.offsetTop;
        }

        const ratio = window.devicePixelRatio;
        this.#posX *= ratio;
        this.#posY *= ratio;
        this.#redraw();
    }

    #onTouchEnd(event) {
        if (!this.#pressed) return;

        let target = null;
        for (const t of event.changedTouches) {
            if (t.target === this.$el) target = t;
        }
        if (!target) return;

        this.#pressed = false;
        if (!this.data.keep) {
            this.#posX = this.#center;
            this.#posY = this.#center;
        }
        this.#redraw();
    }

    #onMouseDown() {
        if (this.data.disabled) return;
        this.#pressed = true;
        document.body.style.userSelect = 'none';
    }

    #onMouseMove(event) {
        if (!this.#pressed) return;

        this.#posX = event.pageX;
        this.#posY = event.pageY;
        if (this.$el.offsetParent.tagName.toUpperCase() === "BODY") {
            this.#posX -= this.$el.offsetLeft;
            this.#posY -= this.$el.offsetTop;
        } else {
            this.#posX -= this.$el.offsetParent.offsetLeft;
            this.#posY -= this.$el.offsetParent.offsetTop;
        }
        const ratio = window.devicePixelRatio;
        this.#posX *= ratio;
        this.#posY *= ratio;
        this.#redraw();
    }

    #onMouseUp() {
        if (!this.#pressed) return;

        this.#pressed = false;
        if (!this.data.keep) {
            this.#posX = this.#center;
            this.#posY = this.#center;
        }
        this.#redraw();
        document.body.style.userSelect = '';
    }
}

function constrain(val, min, max) {
    return val < min ? min : (val > max ? max : val);
}
