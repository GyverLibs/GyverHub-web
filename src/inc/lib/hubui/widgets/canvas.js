class CanvasWidget extends BaseWidget {
    $el;
    #cv;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            class: 'w_canvas',
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

        this.#cv = new Canvas(data.id, this.$el, this.renderer.device, data.width, data.height, data.active);

        this.$el.parentNode.addEventListener('resize', () => {
            this.#cv.resize();
        });

        wait2Frame().then(() => {
            this.#cv.resize();
        });

        this.update(data);
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
        const ratio = window.devicePixelRatio;
        let x = Math.round((e.clientX - rect.left) / this.#cv.scale * ratio);
        if (x < 0) x = 0;
        let y = Math.round((e.clientY - rect.top) / this.#cv.scale * ratio);
        if (y < 0) y = 0;
        this.set((x << 16) | y);
        this.setSuffix('[' + x + ',' + y + ']');
    }
}

Renderer.register('canvas', CanvasWidget);


class Canvas {
    constructor(id, cv, device, w, h, active) {
        this.data = [];
        this.id = id;
        this.cv = cv;
        this.device = device;
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
        const ratio = window.devicePixelRatio;
        this.scale = scale * ratio;
        let rh = Math.floor(this.height * scale);
        this.cv.style.width = rw + 'px';
        this.cv.style.height = rh + 'px';
        this.cv.width = Math.floor(rw * ratio);
        this.cv.height = Math.floor(rh * ratio);
        this.show(this.data);
    }

    update(data) {
        this.data = this.data.concat(data);
    }

    show(data = null) {
        if (!data) data = this.data;
        const cv = this.cv;
        const cx = cv.getContext("2d");
        const cmd_list = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin', 'globalCompositeOperation', 'globalAlpha', 'scale', 'rotate', 'rect', 'fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'arcTo', 'arc', 'fillText', 'strokeText', 'drawImage', 'roundRect', 'fill', 'stroke', 'beginPath', 'closePath', 'clip', 'save', 'restore'];
        const const_list = ['butt', 'round', 'square', 'square', 'bevel', 'miter', 'start', 'end', 'center', 'left', 'right', 'alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom', 'source-over', 'source-atop', 'source-in', 'source-out', 'destination-over', 'destination-atop', 'destination-in', 'destination-out', 'lighter', 'copy', 'xor', 'top', 'bottom', 'middle', 'alphabetic'];

        const cv_map = (v, h) => {
            v *= this.scale;
            return v >= 0 ? v : (h ? cv.height : cv.width) - v;
        }

        for (const item of data) {
            let [cmdName, ...args] = ("" + item).split(':');
            if (args.length === 1) args.push(...args.pop().split(','));
            const cmd = parseInt(cmdName, 10);

            args = args.map(v => {
                const i = parseFloat(v);
                return isNaN(i) ? v : i;
            })

            if (!isNaN(cmd) && cmd <= cmd_list.length) {
                cmdName = cmd_list[cmd];
                
                if (cmd <= 2) args[0] = intToColA(args[0]);   // shadowColor
                else if (cmd <= 7) args[0] *= this.scale; // miterLimit
                else if (cmd <= 13) args[0] = const_list[args[0]];  // globalCompositeOperation
                else if (cmd <= 14) ;  // globalAlpha
                else if (cmd <= 16) ; // rotate
                else if (cmd <= 26) {   // arcTo
                    args = args.map((v, i) => cv_map(v, i % 2))
                } else if (cmd == 27) { // arc
                    args = [cv_map(args[0],0),cv_map(args[1],1),cv_map(args[2],0),args[3],args[4],args[5]];
                } else if (cmd <= 29) { // strokeText
                    args = [args[0],cv_map(args[1],0),cv_map(args[2],1),args[3]];
                } else if (cmd == 30) { // drawImage
                    let img = new Image();
                    for (let i in args) {
                        if (i > 0) args[i] = cv_map(args[i], !(i % 2));
                    }
                    if (args[0].startsWith('http://') || args[0].startsWith('https://')) {
                        img.src = args[0];
                    } else {
                        this.device.addFile(this.id, args[0], (file) => {
                            Widget.setPlabel(this.id);
                            img.src = file;
                        });
                    }

                    img.onload = function () {
                        args[0] = img;
                        cx.drawImage(...args);
                    }
                    continue;

                } else if (cmd == 31) { // roundRect
                    for (let i = 0; i < 4; i++) {
                        args[i] = cv_map(args[i], i % 2);
                    }
                    if (args.length == 5) args[4] *= this.scale;
                    else args.push(args.slice());
                }
            }

            try {
                if (!args.length) {
                    cx[cmdName].call(cx);
                } else {
                    const fn = cx[cmdName];
                    if (typeof fn === 'function')
                        fn.apply(cx, args);
                    else cx[cmdName] = args[0];
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}

function intToColA(val) {
    if (val === null || val === undefined) return null;
    return "#" + Number(val).toString(16).padStart(8, '0');
}
