class CanvasWidget extends BaseWidget {
    $el;
    #cv;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: '',
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

        this.#cv = new Canvas(data.id, this.$el, data.width, data.height, data.active);

        this.$el.parentNode.addEventListener('resize', () => {
            this.#cv.resize();
        });

        wait2Frame().then(() => {
            this.#cv.show();
        });

        this.update(data.data);
        this.disable(this.$el, data.disable);
    }

    update(data) {
        super.update(data);
        
        if ('data' in data) {
            this.#cv.update(data.data);
            this.#cv.show(data.data);
        }
    }

    #click(e) {
        if (!this.#cv.active) return;
        let rect = this.$el.getBoundingClientRect();
        let x = Math.round((e.clientX - rect.left) / this.#cv.scale * ratio());
        if (x < 0) x = 0;
        let y = Math.round((e.clientY - rect.top) / this.#cv.scale * ratio());
        if (y < 0) y = 0;
        this.set((x << 16) | y);
        this.setSuffix('[' + x + ',' + y + ']');
    }
}

Renderer.register('canvas', CanvasWidget);


class Canvas {
    constructor(id, cv, w, h, active) {
        this.data = [];
        this.id = id;
        this.cv = cv;
        this.width = w;
        this.height = h;
        this.scale = 1;
        this.active = active;
        if (active) cv.style.cursor = 'pointer';
        this.resize();
    }

    clear() {
        this.data = [];
    }

    resize() {
        let rw = this.cv.parentNode.clientWidth;
        if (!rw) return;
        let scale = rw / this.width;
        this.scale = scale * ratio();
        let rh = Math.floor(this.height * scale);
        this.cv.style.width = rw + 'px';
        this.cv.style.height = rh + 'px';
        this.cv.width = Math.floor(rw * ratio());
        this.cv.height = Math.floor(rh * ratio());
        this.show(this.data);
    }

    update(data) {
        this.data = this.data.concat(data);
    }

    show(data = null) {
        if (!data) data = this.data;
        let cv = this.cv;
        let cx = cv.getContext("2d");
        let ev_str = '';
        const cmd_list = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin', 'globalCompositeOperation', 'globalAlpha', 'scale', 'rotate', 'rect', 'fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'arcTo', 'arc', 'fillText', 'strokeText', 'drawImage', 'roundRect', 'fill', 'stroke', 'beginPath', 'closePath', 'clip', 'save', 'restore'];
        const const_list = ['butt', 'round', 'square', 'square', 'bevel', 'miter', 'start', 'end', 'center', 'left', 'right', 'alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom', 'source-over', 'source-atop', 'source-in', 'source-out', 'destination-over', 'destination-atop', 'destination-in', 'destination-out', 'lighter', 'copy', 'xor', 'top', 'bottom', 'middle', 'alphabetic'];

        let cv_map = (v, h) => {
            v *= this.scale;
            return v >= 0 ? v : (h ? cv.height : cv.width) - v;
        }
        let scale = () => {
            return this.scale;
        }

        for (let d of data) {
            let div = d.indexOf(':');
            let cmd = parseInt(d, 10);

            if (!isNaN(cmd) && cmd <= 37) {
                if (div == 1 || div == 2) {
                    let val = d.slice(div + 1);
                    let vals = val.split(',').map(v => (v > 0) ? v = Number(v) : v);
                    if (cmd <= 2) ev_str += ('cx.' + cmd_list[cmd] + '=\'' + intToColA(val) + '\';');   // shadowColor
                    else if (cmd <= 7) ev_str += ('cx.' + cmd_list[cmd] + '=' + (val * scale()) + ';'); // miterLimit
                    else if (cmd <= 13) ev_str += ('cx.' + cmd_list[cmd] + '=\'' + const_list[val] + '\';');  // globalCompositeOperation
                    else if (cmd <= 14) ev_str += ('cx.' + cmd_list[cmd] + '=' + val + ';');  // globalAlpha
                    else if (cmd <= 16) ev_str += ('cx.' + cmd_list[cmd] + '(' + val + ');'); // rotate
                    else if (cmd <= 26) {   // arcTo
                        let str = 'cx.' + cmd_list[cmd] + '(';
                        for (let i in vals) {
                            if (i > 0) str += ',';
                            str += `cv_map(${vals[i]},${(i % 2)})`;
                        }
                        ev_str += (str + ');');
                    } else if (cmd == 27) { // arc
                        ev_str += (`cx.${cmd_list[cmd]}(cv_map(${vals[0]},0),cv_map(${vals[1]},1),cv_map(${vals[2]},0),${vals[3]},${vals[4]},${vals[5]});`);
                    } else if (cmd <= 29) { // strokeText
                        ev_str += (`cx.${cmd_list[cmd]}(${vals[0]},cv_map(${vals[1]},0),cv_map(${vals[2]},1),${vals[3]});`);
                    } else if (cmd == 30) { // drawImage
                        let img = new Image();
                        for (let i in vals) {
                            if (i > 0) vals[i] = cv_map(vals[i], !(i % 2));
                        }
                        if (vals[0].startsWith('http://') || vals[0].startsWith('https://')) {
                            img.src = vals[0];
                        } else {
                            hub.dev(focused).addFile(this.id, vals[0], (file) => {
                                Widget.setPlabel(this.id);
                                img.src = file;
                            });
                        }

                        img.onload = function () {
                            let ev = 'cx.drawImage(img';
                            for (let i in vals) {
                                if (i > 0) ev += ',' + vals[i];
                            }
                            if (vals.length - 1 == 3) {
                                ev += ',' + vals[3] * img.height / img.width;
                            }
                            ev += ')';
                            eval(ev);// TODO notify on fetch
                        }

                    } else if (cmd == 31) { // roundRect
                        let str = 'cx.' + cmd_list[cmd] + '(';
                        for (let i = 0; i < 4; i++) {
                            if (i > 0) str += ',';
                            str += `cv_map(${vals[i]},${(i % 2)})`;
                        }
                        if (vals.length == 5) str += `,${vals[4] * scale()}`;
                        else {
                            str += ',[';
                            for (let i = 4; i < vals.length; i++) {
                                if (i > 4) str += ',';
                                str += `cv_map(${vals[i]},${(i % 2)})`;
                            }
                            str += ']';
                        }
                        ev_str += (str + ');');
                    }
                } else {
                    if (cmd >= 32) ev_str += ('cx.' + cmd_list[cmd] + '();');
                }
            } else {
                ev_str += d + ';';
            }
        }
        eval(ev_str);
    }
};