class GaugeWidget extends BaseWidget {
    static OUT_OF_RANGE_COLOR = '#8e1414';

    $el;
    #redraw;
    #cstyle;

    constructor(data, renderer) {
        super(data, renderer);
        this.perc = null;
        this.value = 0;
        this.min = 0;
        this.max = 100;
        this.dec = 0;
        this.unit = '';
        this.icon = '';
        this.tout = null;

        switch (this.type) {
            case 'gauge': this.#redraw = this.#redrawGauge; break;
            case 'gauge_l': this.#redraw = this.#redrawGaugeL; break;
            case 'gauge_r': this.#redraw = this.#redrawGaugeR; break;
        }

        this.makeLayout({
            type: 'canvas',
            name: 'el',
            events: {
                resize: () => this.#redraw()
            }
        });
        this.#cstyle = window.getComputedStyle(this.$el);
        
        this.update(data);
        wait2Frame().then(() => this.#redraw());
    }

    close() {
        if (this.tout) clearTimeout(this.tout);
        this.tout = null;
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.value = Number(data.value);
        if ('min' in data) this.min = Number(data.min);
        if ('max' in data) this.max = Number(data.max);
        if ('dec' in data) this.dec = Number(data.dec);
        if ('unit' in data) this.unit = data.unit;
        if ('icon' in data) this.icon = data.icon;
        this.#redraw();
    }

    #redrawGauge() {
        this.color = intToCol(this.data.color) ?? this.#cstyle.getPropertyValue('--prim');
        let cv = this.$el;
        let rw = cv.parentNode.clientWidth;
        if (!rw) return;

        const ratio = window.devicePixelRatio;
        let rh = Math.floor(rw * 0.47);
        cv.style.width = rw + 'px';
        cv.style.height = rh + 'px';
        cv.width = Math.floor(rw * ratio);
        cv.height = Math.floor(rh * ratio);

        let cx = cv.getContext("2d");
        let perc = (this.value - this.min) * 100 / (this.max - this.min);
        if (perc < 0) perc = 0;
        if (perc > 100) perc = 100;
        if (this.perc == null) this.perc = perc;
        else {
            if (Math.abs(this.perc - perc) <= 0.15) this.perc = perc;
            else this.perc += (perc - this.perc) * 0.15;
            if (this.perc != perc) setTimeout(() => this.#redraw(), 20);
        }

        cx.clearRect(0, 0, cv.width, cv.height);
        cx.lineWidth = cv.width / 8;
        cx.strokeStyle = this.#cstyle.getPropertyValue('--dark');
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height * 0.97, cv.width / 2 - cx.lineWidth, Math.PI * (1 + this.perc / 100), Math.PI * 2);
        cx.stroke();

        cx.strokeStyle = this.color;
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height * 0.97, cv.width / 2 - cx.lineWidth, Math.PI, Math.PI * (1 + this.perc / 100));
        cx.stroke();

        let font = cfg.font;
        /*@[if_not_target:esp]*/
        font = 'Condensed';
        /*@/[if_not_target:esp]*/

        cx.fillStyle = this.color;
        cx.font = '10px ' + font;
        cx.textAlign = "center";

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

        if (this.value > this.max || this.value < this.min) cx.fillStyle = GaugeWidget.OUT_OF_RANGE_COLOR;
        else cx.fillStyle = this.#cstyle.getPropertyValue('--font2');
        cx.font = cv.width * 0.43 * 10 / w + 'px ' + font;
        cx.fillText(this.value.toFixed(this.dec) + this.unit, cv.width / 2, cv.height * 0.93);

        cx.font = '10px ' + font;
        w = Math.max(
            cx.measureText(Math.round(this.min)).width,
            cx.measureText(Math.round(this.max)).width
        );
        cx.fillStyle = this.#cstyle.getPropertyValue('--font');
        cx.font = cx.lineWidth * 0.55 * 10 / w + 'px ' + font;
        cx.fillText(this.min, cx.lineWidth, cv.height * 0.92);
        cx.fillText(this.max, cv.width - cx.lineWidth, cv.height * 0.92);
    }

    #redrawGaugeR() {
        this.color = intToCol(this.data.color) ?? this.#cstyle.getPropertyValue('--prim');
        let cv = this.$el;
        let rw = cv.parentNode.clientWidth;
        if (!rw) return;

        const ratio = window.devicePixelRatio;
        cv.style.width = rw + 'px';
        cv.style.height = cv.style.width;
        cv.width = Math.floor(rw * ratio);
        cv.height = cv.width;

        let cx = cv.getContext("2d");
        let perc = (this.value - this.min) * 100 / (this.max - this.min);
        if (perc < 0) perc = 0;
        if (perc > 100) perc = 100;
        if (this.perc == null) this.perc = perc;
        else {
            if (Math.abs(this.perc - perc) <= 0.15) this.perc = perc;
            else this.perc += (perc - this.perc) * 0.15;
            if (this.perc != perc) setTimeout(() => this.#redraw(), 20);
        }

        let joint = Math.PI * (0.5 + 2 * (this.perc / 100));

        cx.clearRect(0, 0, cv.width, cv.height);
        cx.lineWidth = cv.width / 8;
        cx.strokeStyle = this.#cstyle.getPropertyValue('--dark');
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - cx.lineWidth, joint, Math.PI * 2.5);
        cx.stroke();
        
        cx.strokeStyle = this.color;
        cx.beginPath();
        cx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - cx.lineWidth, Math.PI / 2, joint);
        cx.stroke();

        let font = cfg.font;
        /*@[if_not_target:esp]*/
        font = 'Condensed';
        /*@[if_not_target:esp]*/

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

        if (this.value > this.max || this.value < this.min) cx.fillStyle = GaugeWidget.OUT_OF_RANGE_COLOR;
        else cx.fillStyle = this.#cstyle.getPropertyValue('--font2');
        cx.font = cv.width * 0.5 * 10 / w + 'px ' + font;
        cx.fillText(this.value.toFixed(this.dec) + this.unit, cv.width / 2, cv.height * 0.52);
    }

    #redrawGaugeL() {
        this.color = intToCol(this.data.color) ?? this.#cstyle.getPropertyValue('--prim');
        let cv = this.$el;
        let rw = cv.parentNode.clientWidth;
        if (!rw) return;

        const ratio = window.devicePixelRatio;
        let height = 30;
        let r = ratio;
        let sw = 2 * r;
        let off = 5 * r;

        cv.style.width = rw + 'px';
        cv.style.height = height + 'px';
        cv.width = Math.floor(rw * r);
        cv.height = Math.floor(height * r);

        const cx = cv.getContext("2d");
        let perc = (this.value - this.min) * 100 / (this.max - this.min);
        if (perc < 0) perc = 0;
        if (perc > 100) perc = 100;
        if (this.perc == null) this.perc = perc;
        else {
            if (Math.abs(this.perc - perc) <= 0.15) this.perc = perc;
            else this.perc += (perc - this.perc) * 0.15;
            if (this.perc != perc) setTimeout(() => this.#redraw(), 20);
        }

        let wid = cv.width - sw - off * 2;

        cx.clearRect(0, 0, cv.width, cv.height);
        cx.fillStyle = this.#cstyle.getPropertyValue('--back');
        cx.beginPath();
        cx.roundRect(off + sw / 2, sw / 2, wid, cv.height - sw, 5 * r);
        cx.fill();

        cx.fillStyle = this.color;
        cx.beginPath();
        cx.roundRect(off + sw / 2, sw / 2, wid * this.perc / 100, cv.height - sw, 5 * r);
        cx.fill();

        if (this.value > this.max || this.value < this.min) cx.fillStyle = GaugeWidget.OUT_OF_RANGE_COLOR;
        else cx.fillStyle = this.#cstyle.getPropertyValue('--font');

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

        cx.fillStyle = this.#cstyle.getPropertyValue('--font');
        cx.font = (12 * r) + 'px ' + cfg.font;
        cx.textAlign = "left";
        cx.fillText(this.min.toFixed(this.dec), off + sw / 2 + off, cv.height * 0.52);

        cx.textAlign = "right";
        cx.fillText(this.max.toFixed(this.dec), cv.width - (off + sw / 2 + off), cv.height * 0.52);
    }
}
Renderer.register('gauge', GaugeWidget);
Renderer.register('gauge_l', GaugeWidget);
Renderer.register('gauge_r', GaugeWidget);
