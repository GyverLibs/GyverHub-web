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
  
function getErrColor() {
    return '#8e1414';
}

function getDefColor() {
    // return document.querySelector(':root').style.getPropertyValue('--prim');
    return intToCol(colors[cfg.maincolor]);
}
const theme_cols = [
  // back/tab/font/font2/dark/thumb/black/scheme/font4/shad/font3
  ['#1b1c20', '#26272c', '#eee', '#ccc', '#141516', '#444', '#0e0e0e', 'dark', '#222', '#000'],
  ['#eee', '#fff', '#111', '#333', '#ddd', '#999', '#bdbdbd', 'light', '#fff', '#000000a3']
];
function getCurrentColorScheme() {
  if (cfg.theme === 'dark') return theme_cols[0];
  if (cfg.theme === 'light') return theme_cols[1];
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return theme_cols[0];
  return theme_cols[1];
}
function adjustColor(col, ratio) {
  let intcol = 0;
  col = col.toString();
  if (col.startsWith('#')) {
    col = col.slice(1);
    if (col.length == 3) {
      col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
    }
    intcol = parseInt(col, 16);
  } else if (col.startsWith("rgb(")) {
    col.replace("rgb(", "").replace(")", "").replace(" ", "").split(',').forEach(v => intcol = (intcol << 8) | v);
  } else {
    intcol = Number(col);
  }
  let newcol = '#';
  for (let i = 0; i < 3; i++) {
    let comp = (intcol & 0xff0000) >> 16;
    comp = Math.min(255, Math.floor((comp + 1) * ratio));
    newcol += comp.toString(16).padStart(2, '0');
    intcol <<= 8;
  }
  return newcol;
}

function showPopup(text, color = '#37a93c') {
  const $e = document.createElement('div');
  $e.className = 'notice';
  $e.textContent = text;
  $e.style.background = color;
  document.body.append($e);
  setTimeout(() => { $e.remove(); }, 3500);
}
function showPopupError(text) {
  showPopup(text, /*getErrColor()*/'#a93737');
}