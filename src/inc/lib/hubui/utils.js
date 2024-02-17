function createElement(self, obj) {
    if (typeof obj === 'string' || obj instanceof Node)
        return obj;

    const $el = document.createElement(obj.type);
    if (obj.class) $el.className = obj.class;
    if (obj.id) $el.id = obj.id;
    if (obj.text) $el.textContent = obj.text;
    if (obj.html) $el.innerHTML = obj.html;
    if (obj.style)
        for (const [prop, value] of Object.entries(obj.style))
            $el.style[prop] = value;
    if (obj.also) obj.also.call(self, $el);
    if (obj.name) self['$' + obj.name] = $el;
    if (obj.events)
        for (const [ev, handler] of Object.entries(obj.events))
            $el.addEventListener(ev, handler.bind(self));
    if (obj.children)
        for (const i of obj.children)
            $el.append(createElement(self, i));
    return $el;
}


// ===================== RENDER =====================

function waitFrame() {
    return new Promise(requestAnimationFrame);
}

async function wait2Frame() {
    await waitFrame();
    await waitFrame();
}

function getIcon(icon) {
    if (!icon) return '';
    return icon.length == 1 ? icon : String.fromCharCode(Number('0x' + icon));
}

function intToCol(val) {
  if (val === null || val === undefined) return null;
  return "#" + Number(val).toString(16).padStart(6, '0');
}

function colToInt(val) {
  if (val === null || val === undefined) return null;
  if (val.startsWith('#')) {
    val = val.slice(1);
    if (val.length == 3) {
      val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }
    return parseInt(val, 16);
  }
  if (val.startsWith("rgb(")) {
    let intcol = 0;
    for (const i of val.replace("rgb(", "").replace(")", "").replace(" ", "").split(','))
      intcol = (intcol << 8) | i;
    return intcol;
  }
  return Number(val);
}

function dataTotext(data) {
    return b64ToText(data.split('base64,')[1]);
}
function b64ToText(base64) {
    const binString = atob(base64);
    return new TextDecoder().decode(Uint8Array.from(binString, (m) => m.codePointAt(0)));
}

function waiter(size = 50, col = 'var(--prim)', block = true) {
    return `<div class="waiter ${block ? 'waiter_b' : ''}"><span style="font-size:${size}px;color:${col}" class="icon spinning"></span></div>`;
}

function adjustColor(col, ratio) {
  let newcol = 0;
  for (let i = 0; i < 3; i++) {
    let comp = (col & 0xff0000) >> 16;
    comp = Math.min(255, Math.floor((comp + 1) * ratio));
    newcol <<= 8;
    newcol |= comp;
    col <<= 8;
  }
  return newcol;
}
