class UiJoy {
    constructor(cont, data) {
        cont.innerHTML = `<canvas data-type="${data.type}" id="${ID(data.id)}"></canvas>`;

        waitFrame().then(() => {
            let id = data.id;
            let cb = function (d) {
                post_set_prd(id, ((d.x + 255) << 16) | (d.y + 255));
                if (!UiJoy.joys[id].suffix) {
                    EL('wsuffix#' + id).innerHTML = '[' + d.x + ',' + d.y + ']';
                }
            }
            let joy = new Joy(CMP(id), data, cb);
            joy.redraw(false);
            UiJoy.joys[id] = joy;
        });
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
    }

    static reset() {
        for (let joy in UiJoy.joys) UiJoy.joys[joy].stop();
        UiJoy.joys = {};
    }

    static resize() {
        for (let joy in UiJoy.joys) {
            UiJoy.joys[joy].reset();
            UiJoy.joys[joy].redraw(false);
        }
    }

    static joys = {};
};

class Joy {
    keep = 0;
    exp = 0;
    color = 0;
    center = 0;
    posX = null;
    posY = null;
    pressed = 0;

    constructor(cv, data, cb) {
        this.color = intToCol(data.color) ?? getDefColor();
        this.keep = data.keep ?? 0;
        this.exp = data.exp ?? 0;
        this.cv = cv;
        this.cb = cb;

        if ("ontouchstart" in document.documentElement) {
            cv.addEventListener("touchstart", this._onTouchStart, { passive: false });
            document.addEventListener("touchmove", this._onTouchMove, { passive: false });
            document.addEventListener("touchend", this._onTouchEnd);
        } else {
            cv.addEventListener("mousedown", this._onMouseDown);
            document.addEventListener("mousemove", this._onMouseMove);
            document.addEventListener("mouseup", this._onMouseUp);
        }
    }

    stop() {
        if ("ontouchstart" in document.documentElement) {
            this.cv.removeEventListener("touchstart", this._onTouchStart);
            document.removeEventListener("touchmove", this._onTouchMove);
            document.removeEventListener("touchend", this._onTouchEnd);
        } else {
            this.cv.removeEventListener("mousedown", this._onMouseDown);
            document.removeEventListener("mousemove", this._onMouseMove);
            document.removeEventListener("mouseup", this._onMouseUp);
        }
    }

    reset() {
        this.posX = null;
        this.posY = null;
    }

    redraw(send = true) {
        let cv = this.cv;
        let size = cv.parentNode.clientWidth;
        if (!size) return;
        cv.style.width = size + 'px';
        cv.style.height = size + 'px';
        size *= ratio();
        cv.width = size;
        cv.height = size;
        cv.style.cursor = 'pointer';
        let r = size * 0.23;
        let R = size * 0.4;
        this.center = size / 2;
        if (this.posX === null) this.posX = this.center;
        if (this.posY === null) this.posY = this.center;

        this.posX = constrain(this.posX, r, size - r);
        this.posY = constrain(this.posY, r, size - r);
        let x = Math.round((this.posX - this.center) / (size / 2 - r) * 255);
        let y = -Math.round((this.posY - this.center) / (size / 2 - r) * 255);

        let cx = cv.getContext("2d");
        cx.clearRect(0, 0, size, size);

        cx.beginPath();
        cx.arc(this.center, this.center, R, 0, 2 * Math.PI, false);
        let grd = cx.createRadialGradient(this.center, this.center, R * 2 / 3, this.center, this.center, R);
        grd.addColorStop(0, '#00000005');
        grd.addColorStop(1, '#00000030');
        cx.fillStyle = grd;
        cx.fill();

        cx.beginPath();
        cx.arc(this.posX, this.posY, r, 0, 2 * Math.PI, false);
        grd = cx.createRadialGradient(this.posX, this.posY, 0, this.posX, this.posY, r);
        grd.addColorStop(0, adjustColor(this.color, 0.7));
        grd.addColorStop(1, adjustColor(this.color, this.pressed ? 1.3 : 1));
        cx.fillStyle = grd;
        cx.fill();

        if (this.exp) {
            x = ((x * x + 255) >> 8) * (x > 0 ? 1 : -1);
            y = ((y * y + 255) >> 8) * (y > 0 ? 1 : -1);
        }
        if (send) this.cb({ x: x, y: y });
    }

    _onTouchStart = (event) => {
        if (this.disabled()) return;
        event.preventDefault();
        this.pressed = 1;
    }

    _onTouchMove = (event) => {
        if (this.pressed) {
            event.preventDefault();
            let target = null;
            for (let t of event.changedTouches) {
                if (t.target === this.cv) target = t;
            }
            if (!target) return;

            this.posX = target.pageX;
            this.posY = target.pageY;

            if (this.cv.offsetParent.tagName.toUpperCase() === "BODY") {
                this.posX -= this.cv.offsetLeft;
                this.posY -= this.cv.offsetTop;
            } else {
                this.posX -= this.cv.offsetParent.offsetLeft;
                this.posY -= this.cv.offsetParent.offsetTop;
            }

            this.posX *= ratio();
            this.posY *= ratio();
            this.redraw();
        }
    }

    _onTouchEnd = (event) => {
        if (this.pressed) {
            let target = null;
            for (let t of event.changedTouches) {
                if (t.target === this.cv) target = t;
            }
            if (!target) return;

            this.pressed = 0;
            if (!this.keep) {
                this.posX = this.center;
                this.posY = this.center;
            }
            this.redraw();
        }
    }

    _onMouseDown = (event) => {
        if (this.disabled()) return;
        this.pressed = 1;
        document.body.style.userSelect = 'none';
    }

    _onMouseMove = (event) => {
        if (this.pressed) {
            this.posX = event.pageX;
            this.posY = event.pageY;
            if (this.cv.offsetParent.tagName.toUpperCase() === "BODY") {
                this.posX -= this.cv.offsetLeft;
                this.posY -= this.cv.offsetTop;
            } else {
                this.posX -= this.cv.offsetParent.offsetLeft;
                this.posY -= this.cv.offsetParent.offsetTop;
            }
            this.posX *= ratio();
            this.posY *= ratio();
            this.redraw();
        }
    }

    _onMouseUp = (event) => {
        if (this.pressed) {
            this.pressed = 0;
            if (!this.keep) {
                this.posX = this.center;
                this.posY = this.center;
            }
            this.redraw();
            document.body.style.userSelect = 'unset';
        }
    }

    disabled() {
        return this.cv.getAttribute('disabled');
    }
};