class CanvasWidget extends BaseWidget {
    $el;
    #data = [];
    #scale = 1;
    #resize_h;

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

        this.#resize();
        this.#resize_h = this.#resize.bind(this);
        window.addEventListener('resize', this.#resize_h);

        wait2Frame().then(() => {
            this.#resize();
        });

        this.update(data);
        this.disable(this.$el, data.disable);
    }

    update(data) {
        super.update(data);
        
        if ('active' in data) this.$el.style.cursor = data.active ? 'pointer' : '';
        if ('data' in data) {
            this.#data = this.#data.concat(data.data);
            this.#show(data.data);
        }
    }

    close() {
        window.removeEventListener('resize', this.#resize_h);
    }

    #click(e) {
        if (!this.data.active) return;
        const rect = this.$el.getBoundingClientRect();
        const ratio = window.devicePixelRatio;
        let x = Math.round((e.clientX - rect.left) / this.#scale * ratio);
        if (x < 0) x = 0;
        let y = Math.round((e.clientY - rect.top) / this.#scale * ratio);
        if (y < 0) y = 0;
        this.set((x << 16) | y);
        this.setSuffix('[' + x + ',' + y + ']');
    }

    #resize() {
        const rw = this.$el.parentNode.clientWidth;
        if (!rw) return;
        const scale = rw / this.data.width;
        const ratio = window.devicePixelRatio;
        this.#scale = scale * ratio;
        const rh = Math.floor(this.data.height * scale);
        this.$el.style.width = rw + 'px';
        this.$el.style.height = rh + 'px';
        this.$el.width = Math.floor(rw * ratio);
        this.$el.height = Math.floor(rh * ratio);
        this.#show(this.#data);
    }

    #show(data = null) {
        if (!this.$el.parentNode.clientWidth) return;

        if (!data) data = this.#data;
        const cv = this.$el;
        const cx = cv.getContext("2d");
        const cmd_list = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin', 'globalCompositeOperation', 'globalAlpha', 'scale', 'rotate', 'rect', 'fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'arcTo', 'arc', 'fillText', 'strokeText', 'drawImage', 'roundRect', 'fill', 'stroke', 'beginPath', 'closePath', 'clip', 'save', 'restore'];
        const const_list = ['butt', 'round', 'square', 'square', 'bevel', 'miter', 'start', 'end', 'center', 'left', 'right', 'alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom', 'source-over', 'source-atop', 'source-in', 'source-out', 'destination-over', 'destination-atop', 'destination-in', 'destination-out', 'lighter', 'copy', 'xor', 'top', 'bottom', 'middle', 'alphabetic'];

        const cv_map = (v, h) => {
            v *= this.#scale;
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
                else if (cmd <= 7) args[0] *= this.#scale; // miterLimit
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
                        this.addFile(args[0], 'url', (file) => {
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
                    if (args.length == 5) args[4] *= this.#scale;
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

Renderer.register('canvas', CanvasWidget);

function intToColA(val) {
    if (val === null || val === undefined) return null;
    return "#" + Number(val).toString(16).padStart(8, '0');
}
