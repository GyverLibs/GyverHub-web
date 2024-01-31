class UiGaugeR {
    static render(cont, data) {
        cont.innerHTML = `<canvas data-type="${data.type}" id="${ID(data.id)}"></canvas>`;

        wait2Frame()
            .then(() => {
                let gauge = new GaugeR(CMP(data.id), data);
                gauge.redraw();
                UiGaugeR.gauges[data.id] = gauge;
            });
    }

    static update(id, data) {
        let gauge = UiGaugeR.gauges[id];
        if (gauge) gauge.update(data);
    }

    static resize() {
        for (let gag in UiGaugeR.gauges) {
            UiGaugeR.gauges[gag].redraw();
        }
    }

    static clear() {
        UiGaugeR.gauges = {};
    }

    static gauges = {};
};

class GaugeR {
    constructor(cv, data) {
        this.perc = null;
        this.value = Number(data.value ?? 0);
        this.min = Number(data.min ?? 0);
        this.max = Number(data.max ?? 100);
        this.dec = Number(data.dec ?? 0);
        this.unit = data.unit ?? '';
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

        cv.style.width = rw + 'px';
        cv.style.height = cv.style.width;
        cv.width = Math.floor(rw * ratio());
        cv.height = cv.width;

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

        let joint = Math.PI * (0.5 + 2 * (this.perc / 100));

        cx.clearRect(0, 0, cv.width, cv.height);
        cx.lineWidth = cv.width / 8;
        cx.strokeStyle = theme_cols[v][4];
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - cx.lineWidth, joint, Math.PI * 2.5);
        cx.stroke();
        
        cx.strokeStyle = this.color;
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - cx.lineWidth, Math.PI / 2, joint);
        cx.stroke();

        let font = cfg.font;
        /*NON-ESP*/
        font = 'Condensed';
        /*/NON-ESP*/

        cx.fillStyle = this.color;
        cx.font = '10px ' + font;
        cx.textAlign = "center";
        cx.textBaseline = "middle";

        let text = this.unit;
        let len = Math.max(
            (this.value.toFixed(this.dec) + text).length,
            (this.min.toFixed(this.dec) + text).length,
            (this.max.toFixed(this.dec) + text).length
        );
        if (len == 1) text += '  ';
        else if (len == 2) text += ' ';

        let w = Math.max(
            cx.measureText(this.value.toFixed(this.dec) + text).width,
            cx.measureText(this.min.toFixed(this.dec) + text).width,
            cx.measureText(this.max.toFixed(this.dec) + text).width
        );

        if (this.value > this.max || this.value < this.min) cx.fillStyle = getErrColor();
        else cx.fillStyle = theme_cols[v][3];
        cx.font = cv.width * 0.5 * 10 / w + 'px ' + font;
        cx.fillText(this.value.toFixed(this.dec) + this.unit, cv.width / 2, cv.height * 0.52);
    }

    update(data) {
        if ('value' in data) this.value = Number(data.value);
        if ('min' in data) this.min = Number(data.min);
        if ('max' in data) this.max = Number(data.max);
        if ('dec' in data) this.dec = Number(data.dec);
        if ('unit' in data) this.unit = data.unit;
        if ('color' in data) this.color = intToCol(data.color);
        this.redraw();
    }
};