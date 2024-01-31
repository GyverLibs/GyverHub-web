class UiPlot {
    constructor(cont, data) {
        cont.innerHTML = `<div class="w_canvas"><canvas data-type="${data.type}" id="${ID(data.id)}"></canvas></div>`;

        wait2Frame().then(() => {
            // TODO !themes[cfg.theme] DARK: 0, LIGHT: 1
            let p = new Plot(data.id, CMP(data.id), data.height ?? 150, data.text, data.type, true);
            p.update(data.data);
            p.redraw();
            UiPlot.plots[data.id] = p;
        });
    }

    static update(id, data) {
        let p = UiPlot.plots[id];
        if (!p) return;
        if ('value' in data) {
            // p.update(data.value);
            // p.redraw(data.value);
        }
    }

    static reset() {
        for (let plot in UiPlot.plots) UiPlot.plots[plot].stop();
        UiPlot.plots = {};
    }

    static resize() {
        for (let p in UiPlot.plots) {
            UiPlot.plots[p].resize();
        }
    }

    static plots = {};
};

class Plot {
    constructor(id, cv, height, labels, type, dark) {
        this.id = id;
        this.cv = cv;
        this.height = height;
        this.labels = labels ? labels.split(';') : null;
        this.type = type;
        this.dark = dark;
        this.data = [];
        this.resize();
        cv.onclick = (event) => this._click(event);

        if ("ontouchstart" in document.documentElement) {
            document.addEventListener("touchmove", this._onTouchMove, { passive: false });
        } else {
            document.addEventListener("mousemove", this._onMouseMove);
        }
    }

    stop() {
        if ("ontouchstart" in document.documentElement) {
            document.removeEventListener("touchmove", this._onTouchMove);
        } else {
            document.removeEventListener("mousemove", this._onMouseMove);
        }
    }

    clear() {
        this.data = [];
    }

    resize() {
        let cv = this.cv;
        let rw = cv.parentNode.clientWidth;
        if (!rw) return;
        let r = window.devicePixelRatio;
        cv.style.width = rw + 'px';
        cv.style.height = this.height + 'px';
        cv.width = Math.floor(rw * r);
        cv.height = Math.floor(this.height * r);
        this.redraw(this.data);
    }

    update(data) {
        this.data = this.data.concat(data);
    }

    redraw(data = null) {
        if (!data) data = this.data;
        let cv = this.cv;
        let cx = cv.getContext("2d");
        let r = window.devicePixelRatio;

        cx.fillRect(0, 0, cv.width, cv.height);
    }

    // PRIVATE
    _click(e) {
        let rect = this.cv.getBoundingClientRect();
        let x = Math.round(e.clientX - rect.left);
        if (x < 0) x = 0;
        let y = Math.round(e.clientY - rect.top);
        if (y < 0) y = 0;
    }

    _onTouchMove = (event) => {
        event.preventDefault();
        for (let t of event.changedTouches) {
            if (t.target === this.cv) this._move(t);
        }
    }

    _onMouseMove = (event) => {
        if (event.target == this.cv) this._move(event);
    }

    _move(rect) {
        let x = rect.pageX;
        let y = rect.pageY;
        if (this.cv.offsetParent.tagName.toUpperCase() === "BODY") {
            x -= this.cv.offsetLeft;
            y -= this.cv.offsetTop;
        } else {
            x -= this.cv.offsetParent.offsetLeft;
            y -= this.cv.offsetParent.offsetTop;
        }
        x = this._constrain(x, 0, this.cv.width / window.devicePixelRatio);
        y = this._constrain(y, 0, this.cv.height / window.devicePixelRatio);
        this.redraw();
    }

    _constrain(x, min, max) {
        if (x < min) return min;
        if (x > max) return max;
        return x;
    }
};