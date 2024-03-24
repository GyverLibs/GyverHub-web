const canvas_const = ['MITER', 'ROUND', 'BEVEL', 'SQUARE', 'PROJECT', 'CORNER', 'CORNERS', 'CENTER', 'RADIUS', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'BASELINE'];
const canvas_cmd = ['clear', 'background', 'fill', 'noFill', 'stroke', 'noStroke', 'strokeWeight', 'strokeJoin', 'strokeCap', 'rectMode', 'ellipseMode', 'imageMode', 'image', 'textFont', 'textSize', 'textAlign', 'text', 'point', 'line', 'rect', 'arc', 'ellipse', 'circle', 'bezier', 'beginShape', 'endShape', 'vertex', 'bezierVertex', 'pixelScale', 'rotate', 'translate', 'push', 'pop'];

function showCanvasAPI(cv, data, scale, mapxy, fileHandler) {
    function radians(deg) {
        return deg * 0.01745329251;
    }
    const cx = cv.getContext("2d");

    let _scale = scale;
    let _fillF = 1;
    let _strokeF = 1;
    let _shapeF = 0;
    let _elMode = 'CENTER';
    let _recMode = 'CORNER';
    let _imgMode = 'CORNER';

    function apply() {
        if (_fillF) cx.fill();
        if (_strokeF) cx.stroke();
    }
    function drawEllipse(args) {
        cx.beginPath();
        let xy = mapxy(args[0], args[1]);
        let wh = [args[2] * _scale / 2, args[3] * _scale / 2];
        switch (_elMode) {
            case 'CENTER':
                break;
            case 'RADIUS':
                wh = [wh[0] * 2, wh[1] * 2];
                break;
            case 'CORNER':
                xy = [xy[0] + wh[0], xy[1] + wh[1]];
                break;
            case 'CORNERS':
                let xy2 = mapxy(args[2], args[3]);
                wh = [(xy2[0] - xy[0]) / 2, (xy2[1] - xy[1]) / 2];
                xy = [xy[0] + wh[0], xy[1] + wh[1]];
                break;
        }
        cx.ellipse(xy[0], xy[1], wh[0], wh[1], 0, 0, 2 * Math.PI);
        apply();
    }

    for (const item of data) {
        if (item.match(/^\d+$/)) {  // cmd only
            let cmd = canvas_cmd[Number(item)];

            switch (cmd) {
                case 'clear': data = []; cx.clearRect(0, 0, cv.width, cv.height); break;
                case 'noFill': _fillF = 0; break;
                case 'noStroke': _strokeF = 0; break;
                case 'beginShape': _shapeF = 1; cx.beginPath(); break;
                case 'push': cx.save(); break;
                case 'pop': cx.restore(); break;
            }

        } else if (item.match(/^\d+:.+/)) { // cmd:...
            let colon = item.indexOf(':');
            let cmd = canvas_cmd[Number(item.slice(0, colon))];
            let args = item.slice(colon + 1, item.length).split(',').map(v => {
                if (v.match(/^[0-9a-f]+$/)) return parseInt(v, 16) | 0;     // int
                else if (v.match(/^#[0-9a-f]+$/)) return '#' + v.substring(1).padStart(8, '0'); // color
                else return v;
            });

            switch (cmd) {
                case 'pixelScale':
                    _scale = args[0] ? 1 : scale;
                    break;
                case 'background':
                    let b = cx.fillStyle;
                    cx.fillStyle = args[0];
                    cx.fillRect(0, 0, cv.width, cv.height);
                    cx.fillStyle = b;
                    break;
                case 'fill':
                    _fillF = 1;
                    cx.fillStyle = args[0];
                    break;
                case 'stroke':
                    _strokeF = 1;
                    cx.strokeStyle = args[0];
                    break;
                case 'strokeWeight':
                    cx.lineWidth = args[0] * _scale;
                    break;
                case 'strokeJoin':
                    switch (canvas_const[args[0]]) {
                        case 'MITER': cx.lineJoin = "miter"; break;
                        case 'BEVEL': cx.lineJoin = "bevel"; break;
                        case 'ROUND': cx.lineJoin = "round"; break;
                    }
                    break;
                case 'strokeCap':
                    switch (canvas_const[args[0]]) {
                        case 'ROUND': cx.lineCap = "round"; break;
                        case 'SQUARE': cx.lineCap = "butt"; break;
                        case 'PROJECT': cx.lineCap = "square"; break;
                    }
                    break;
                case 'rectMode':
                    _recMode = canvas_const[args[0]];
                    break;
                case 'ellipseMode':
                    _elMode = canvas_const[args[0]];
                    break;
                case 'imageMode':
                    _imgMode = canvas_const[args[0]];
                    break;
                case 'image':
                    let img = new Image();
                    let path = args.shift();

                    if (path.startsWith('http://') || path.startsWith('https://')) {
                        img.src = path;
                    } else {
                        if (fileHandler) fileHandler(path, img);
                    }

                    img.onload = () => {
                        let pos = [...args];
                        if (pos.length == 3) pos[3] = pos[2] * img.height / img.width;

                        if (pos.length == 2) { // x,y
                            switch (_imgMode) {
                                case 'CORNERS':
                                case 'CORNER':
                                    cx.drawImage(img, ...mapxy(pos[0], pos[1]));
                                    break;
                                case 'CENTER':
                                    cx.drawImage(img, mapxy(pos[0], pos[1])[0] - img.width / 2, mapxy(pos[0], pos[1])[1] - img.height / 2);
                                    break;
                            }
                        } else {    // x,y,w,h
                            switch (_imgMode) {
                                case 'CORNER':
                                    pos = [...mapxy(pos[0], pos[1]), pos[2] * _scale, pos[3] * _scale];
                                    break;
                                case 'CORNERS':
                                    let pos2 = mapxy(args[2], args[3]);
                                    pos = [mapxy(pos[0], pos[1])];
                                    pos.concat([pos2[0] - pos[0], pos2[1] - pos[1]]);
                                    break;
                                case 'CENTER':
                                    pos = [...mapxy(pos[0], pos[1]), pos[2] * _scale, pos[3] * _scale];
                                    pos[0] -= pos[2] / 2;
                                    pos[1] -= pos[3] / 2;
                                    break;
                            }
                            cx.drawImage(img, ...pos);
                        }
                    }
                    break;
                case 'textFont':
                    cx.font = cx.font.split('px ')[0] + 'px ' + args[0];
                    break;
                case 'textSize':
                    cx.font = args[0] * _scale + 'px ' + cx.font.split('px ')[1];
                    break;
                case 'textAlign':
                    switch (canvas_const[args[0]]) {
                        case 'LEFT': cx.textAlign = 'left'; break;
                        case 'CENTER': cx.textAlign = 'center'; break;
                        case 'RIGHT': cx.textAlign = 'right'; break;
                    }
                    switch (canvas_const[args[1]]) {
                        case 'BASELINE': cx.textBaseline = 'alphabetic'; break;
                        case 'TOP': cx.textBaseline = 'top'; break;
                        case 'BOTTOM': cx.textBaseline = 'bottom'; break;
                        case 'CENTER': cx.textBaseline = 'middle'; break;
                    }
                    break;
                case 'text':
                    if (_fillF) cx.fillText(args[0], ...mapxy(args[1], args[2]));
                    if (_strokeF) cx.strokeText(args[0], ...mapxy(args[1], args[2]));
                    break;
                case 'point':
                    cx.beginPath();
                    cx.fillRect(...mapxy(args[0], args[1]), _scale, _scale);
                    break;
                case 'line':
                    cx.beginPath();
                    cx.moveTo(...mapxy(args[0], args[1]));
                    cx.lineTo(...mapxy(args[2], args[3]));
                    if (_strokeF) cx.stroke();
                    break;
                case 'rect':
                    cx.beginPath();
                    let xy = mapxy(args[0], args[1]);
                    let wh = [args[2] * _scale, args[3] * _scale];
                    switch (_recMode) {
                        case 'CENTER':
                            xy = [xy[0] - wh[0] / 2, xy[1] - wh[1] / 2];
                            break;
                        case 'RADIUS':
                            xy = [xy[0] - wh[0], xy[1] - wh[1]];
                            wh = [wh[0] * 2, wh[1] * 2];
                            break;
                        case 'CORNER':
                            break;
                        case 'CORNERS':
                            let xy2 = mapxy(args[2], args[3]);
                            wh = [xy2[0] - xy[0], xy2[1] - xy[1]];
                            break;
                    }
                    if (args[4]) {
                        let r = [args[4] * _scale];
                        if (args[5]) r = r.concat([args[5] * _scale, args[6] * _scale, args[7] * _scale]);
                        cx.roundRect(xy[0], xy[1], wh[0], wh[1], r);
                        apply();
                    } else {
                        if (_fillF) cx.fillRect(xy[0], xy[1], wh[0], wh[1]);
                        if (_strokeF) cx.strokeRect(xy[0], xy[1], wh[0], wh[1]);
                    }
                    break;
                case 'arc':
                    cx.beginPath();
                    cx.ellipse(...mapxy(args[0], args[1]), args[2] * _scale, args[3] * _scale, 0, radians(args[4]), radians(args[5]));
                    apply();
                    break;
                case 'ellipse':
                    drawEllipse(args);
                    break;
                case 'circle':
                    drawEllipse([args[0], args[1], args[2], args[2]]);
                    break;
                case 'bezier':
                    if (_strokeF) {
                        args = [...mapxy(args[0], args[1]), ...mapxy(args[2], args[3]), ...mapxy(args[4], args[5]), ...mapxy(args[6], args[7])];
                        cx.beginPath();
                        cx.moveTo(args[0], args[1]);
                        cx.bezierCurveTo(args[2], args[3], args[4], args[5], args[6], args[7]);
                        cx.stroke();
                    }
                    break;
                case 'endShape':
                    if (args[0]) cx.closePath();
                    apply();
                    break;
                case 'vertex':
                    if (_shapeF) {
                        _shapeF = 0;
                        cx.moveTo(...mapxy(args[0], args[1]));
                    } else {
                        cx.lineTo(...mapxy(args[0], args[1]));
                    }
                    break;
                case 'bezierVertex':
                    if (_shapeF) {
                        _shapeF = 0;
                        cx.moveTo(...mapxy(args[4], args[5]));
                    }
                    cx.bezierCurveTo(...mapxy(args[0], args[1]), ...mapxy(args[2], args[3]), ...mapxy(args[4], args[5]));
                    break;
                case 'rotate':
                    cx.rotate(radians(args[0]));
                    break;
                case 'translate':
                    cx.translate(...mapxy(args[0], args[1]));
                    break;
            }

        } else {    // custom
            try {
                eval(item);
            } catch (e) {
                console.log(e);
            }
        }
    }
}