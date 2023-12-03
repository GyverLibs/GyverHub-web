class UiDpad {
    constructor(cont, data) {
        cont.innerHTML = `<canvas data-type="${data.type}" id="${ID(data.id)}"></canvas>`;
        
        waitFrame().then(() => {
            let id = data.id;
            let cb = function (d) {
                post_set_prd(id, ((d.x + 255) << 16) | (d.y + 255));
            }
            let pad = new Dpad(CMP(id), data, cb);
            pad.redraw(false);
            UiDpad.pads[id] = pad;
        });
        Widget.disable(data.id, data.dsbl);
    }

    static update(id, data) {
    }

    static resize() {
        for (let pad in UiDpad.pads) {
            UiDpad.pads[pad].redraw(false);
        }
    }

    static reset() {
        for (let pad in UiDpad.pads) UiDpad.pads[pad].stop();
        UiDpad.pads = {};
    }

    static pads = {};
};

class Dpad {
    color = 0;
    posX = 0;
    posY = 0;
    pressed = 0;

    constructor(cv, data, cb) {
        this.color = intToCol(data.color) ?? getDefColor();
        this.cv = cv;
        this.cb = cb;

        if ("ontouchstart" in document.documentElement) {
            cv.addEventListener("touchstart", this._onTouchStart);
            document.addEventListener("touchend", this._onTouchEnd);
        } else {
            cv.addEventListener("mousedown", this._onMouseDown);
            document.addEventListener("mouseup", this._onMouseUp);
        }
    }

    stop() {
        if ("ontouchstart" in document.documentElement) {
            this.cv.removeEventListener("touchstart", this._onTouchStart);
            document.removeEventListener("touchend", this._onTouchEnd);
        } else {
            this.cv.removeEventListener("mousedown", this._onMouseDown);
            document.removeEventListener("mouseup", this._onMouseUp);
        }
    }

    redraw(send = true) {
        let cv = this.cv;
        let size = cv.parentNode.clientWidth;
        if (!size) return;
        cv.style.width = size + 'px';
        cv.style.height = size + 'px';
        size *= ratio();
        let center = size / 2;
        cv.width = size;
        cv.height = size;
        cv.style.cursor = 'pointer';

        let x = 0;
        let y = 0;

        if (this.pressed) {
            x = Math.round((this.posX - center) / (size / 2) * 255);
            y = -Math.round((this.posY - center) / (size / 2) * 255);

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

        let cx = cv.getContext("2d");
        cx.clearRect(0, 0, size, size);

        cx.beginPath();
        cx.arc(center, center, size * 0.44, 0, 2 * Math.PI, false);
        cx.lineWidth = size * 0.02;
        cx.strokeStyle = adjustColor(this.color, this.pressed ? 1.3 : 1);
        cx.stroke();

        cx.lineWidth = size * 0.045;
        let rr = size * 0.36;
        let cw = size * 0.1;
        let ch = rr - cw;
        let sh = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let i = 0; i < 4; i++) {
            cx.beginPath();
            cx.strokeStyle = (x == sh[i][0] && y == -sh[i][1]) ? adjustColor(this.color, 1.3) : this.color;
            cx.moveTo(center + ch * sh[i][0] - cw * sh[i][1], center + ch * sh[i][1] - cw * sh[i][0]);
            cx.lineTo(center + rr * sh[i][0], center + rr * sh[i][1]);
            cx.lineTo(center + ch * sh[i][0] + cw * sh[i][1], center + ch * sh[i][1] + cw * sh[i][0]);
            cx.stroke();
        }
        if (send) this.cb({ x: x, y: y });
    }

    _onTouchStart = (event) => {
        if (this.disabled()) return;
        event.preventDefault();
        this.pressed = 1;
        this.posX = (event.targetTouches[0].pageX - this.cv.offsetLeft) * ratio();
        this.posY = (event.targetTouches[0].pageY - this.cv.offsetTop) * ratio();
        this.redraw();
    }

    _onTouchEnd = (event) => {
        if (this.pressed) {
            this.pressed = 0;
            this.redraw();
        }
    }

    _onMouseDown = (event) => {
        if (this.disabled()) return;
        this.pressed = 1;
        this.posX = (event.pageX - this.cv.offsetLeft) * ratio();
        this.posY = (event.pageY - this.cv.offsetTop) * ratio();
        this.redraw();
    }

    _onMouseUp = (event) => {
        if (this.pressed) {
            this.pressed = 0;
            this.redraw();
        }
    }

    disabled() {
        return this.cv.getAttribute('disabled');
    }
};