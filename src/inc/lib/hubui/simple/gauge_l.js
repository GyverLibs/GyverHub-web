class UiGaugeL {
    constructor(cont, data) {
        cont.innerHTML = `<canvas data-type="${data.type}" id="${ID(data.id)}"></canvas>`;

        wait2Frame()
            .then(() => {
                let gauge = new GaugeL(CMP(data.id), data);
                gauge.redraw();
                UiGaugeL.gauges[data.id] = gauge;
            });
    }

    static update(id, data) {
        let gauge = UiGaugeL.gauges[id];
        if (gauge) gauge.update(data);
    }

    static resize() {
        for (let gag in UiGaugeL.gauges) {
            UiGaugeL.gauges[gag].redraw();
        }
    }

    static reset() {
        UiGaugeL.gauges = {};
    }

    static gauges = {};
};

class GaugeL {

    constructor(cv, data) {
        this.perc = null;
        this.value = Number(data.value ?? 0);
        this.min = Number(data.min ?? 0);
        this.max = Number(data.max ?? 100);
        this.dec = Number(data.dec ?? 0);
        this.unit = data.unit ?? '';
        this.icon = data.icon ?? '';
        this.color = intToCol(data.color) ?? getDefColor();
        this.cv = cv;
        this.tout = null;
        this.redraw();
    }

    stop() {
        if (this.tout) clearTimeout(this.tout);
    }

    redraw() {
        let cv = this.cv;
        let rw = cv.parentNode.clientWidth;
        if (!rw) return;

        let height = 30;
        let r = ratio();
        let sw = 2 * r;
        let off = 5 * r;

        cv.style.width = rw + 'px';
        cv.style.height = height + 'px';
        cv.width = Math.floor(rw * r);
        cv.height = Math.floor(height * r);

        let cx = cv.getContext("2d");
        let v = themes[cfg.theme];
        let perc = (this.value - this.min) * 100 / (this.max - this.min);
        if (perc < 0) perc = 0;
        if (perc > 100) perc = 100;
        if (this.perc == null) this.perc = perc;
        else {
            if (Math.abs(this.perc - perc) <= 0.15) this.perc = perc;
            else this.perc += (perc - this.perc) * 0.15;
            if (this.perc != perc) setTimeout(() => this.redraw(), 20);
        }

        let wid = cv.width - sw - off * 2;

        cx.clearRect(0, 0, cv.width, cv.height);
        cx.fillStyle = theme_cols[v][0];
        cx.beginPath();
        cx.roundRect(off + sw / 2, sw / 2, wid, cv.height - sw, 5 * r);
        cx.fill();

        // cx.strokeStyle = this.color;
        // cx.lineWidth = sw;
        // cx.beginPath();
        // cx.roundRect(off + sw / 2, sw / 2, wid, cv.height - sw, 5);
        // cx.stroke();

        cx.fillStyle = this.color;
        cx.beginPath();
        cx.roundRect(off + sw / 2, sw / 2, wid * this.perc / 100, cv.height - sw, 5 * r);
        cx.fill();

        if (this.value > this.max || this.value < this.min) cx.fillStyle = getErrColor();
        else cx.fillStyle = theme_cols[v][2];

        cx.font = (19 * r) + 'px ' + cfg.font;
        cx.textAlign = "center";
        cx.textBaseline = "middle";

        let txt = this.value.toFixed(this.dec) + this.unit;
        cx.fillText(txt, cv.width / 2, cv.height * 0.52);

        if (this.icon) {
            let tw = cx.measureText(txt).width;
            cx.font = (20 * r) + 'px FA5';
            cx.textAlign = "right";
            cx.fillText(getIcon(this.icon), cv.width / 2 - tw / 2 - off, cv.height * 0.52);
        }

        cx.fillStyle = theme_cols[v][2];
        cx.font = (12 * r) + 'px ' + cfg.font;
        cx.textAlign = "left";
        cx.fillText(this.min.toFixed(this.dec), off + sw / 2 + off, cv.height * 0.52);

        cx.textAlign = "right";
        cx.fillText(this.max.toFixed(this.dec), cv.width - (off + sw / 2 + off), cv.height * 0.52);
    }

    update(data) {
        if ('value' in data) this.value = Number(data.value);
        if ('min' in data) this.min = Number(data.min);
        if ('max' in data) this.max = Number(data.max);
        if ('dec' in data) this.dec = Number(data.dec);
        if ('unit' in data) this.unit = data.unit;
        if ('icon' in data) this.icon = data.icon;
        if ('color' in data) this.color = intToCol(data.color);
        this.redraw();
    }
};