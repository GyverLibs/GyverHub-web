
// ===================== RENDER =====================
function makeDOM(self, obj) {
  if (!obj || typeof obj === 'string' || obj instanceof Node || !obj.tag) return obj;
  const $el = document.createElement(obj.tag);

  for (let [key, value] of Object.entries(obj)) {
    switch (key) {
      case 'tag': continue;
      case 'content': $el.replaceChildren(value); break;
      case 'text': $el.textContent = value; break;
      case 'html': $el.innerHTML = value; break;
      case 'class': $el.className = value; break;
      case 'also': value.call(self, $el); break;
      case 'name': self['$' + value] = $el; break;
      case 'style': for (const [skey, sval] of Object.entries(value)) $el.style[skey] = sval; break;
      case 'events': for (const [ev, handler] of Object.entries(value)) $el.addEventListener(ev, handler.bind(self)); break;
      case 'children': for (const i of value) if (i) $el.append(makeDOM(self, i)); break;
      default: $el[key] = value; break;
    }
  }
  return $el;
}

function checkGitLink(link) {
  if (link.startsWith('https://github.com/')) {
    link = 'https://raw.githubusercontent.com/' + link.split('https://github.com/')[1].replace('/blob/', '/');
  }
  return link;
}

function downloadFile(url) {
  return new Promise((res, rej) => {
    fetch(url, { cache: "no-store" })
      .then(r => res(r))
      .catch(e => rej());
  });
}

function EL(id) {
  return document.getElementById(id);
}

function display(id, value) {
  EL(id).style.display = value;
}

function addDOM(el_id, tag, text, target) {
  if (EL(el_id)) EL(el_id).remove();
  const el = document.createElement(tag);
  el.textContent = text;
  el.id = el_id;
  target.appendChild(el);
  return el;
}

function waitFrame() {
  return new Promise(requestAnimationFrame);
}

async function wait2Frame() {
  await waitFrame();
  await waitFrame();
}

async function waitRender(el) {
  while (el === undefined) await waitFrame();
}

function getIcon(icon) {
  if (!icon) return '';
  return icon.length == 1 ? icon : String.fromCharCode(Number('0x' + icon));
}

function hexToCol(val, def = null) {
  if (val === null || val === undefined || val == "ffffffff") return def ? def : getPrimColor();
  return "#" + val.padStart(6, '0');
}

function intToCol(val) {
  if (val === null || val === undefined) return null;
  return "#" + Number(val).toString(16).padStart(6, '0');
}

function getPrimColor() {
  return window.getComputedStyle(document.body).getPropertyValue('--prim');
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

function waiter(size = 45, col = 'var(--prim)', block = true) {
  return `<div class="waiter ${block ? 'waiter-block' : ''}"><span style="font-size:${size}px;color:${col}" class="icon spinning"></span></div>`;
}
function noTrust() {
  return `<div class="blocked-cont"><a href="javascript:void(0)" onclick="notrust_h()" class="blocked">${lang.blocked}</a></div>`;
}
async function notrust_h() {
  if (await asyncConfirm(lang.unblock)) {
    hub.dev(focused).info.trust = 1;
    refresh_h();
  }
}

function getPlugins(deviceID = null) {
  if (deviceID) {
    if (localStorage.hasOwnProperty('device_plugins')) {
      let devplugins = JSON.parse(localStorage.getItem('device_plugins'));
      if (deviceID in devplugins) return devplugins[deviceID];
    }
  } else {
    if (localStorage.hasOwnProperty('plugins')) {
      return JSON.parse(localStorage.getItem('plugins'));
    }
  }
  return {};
}

function savePlugins(plugins, deviceID = null) {
  if (deviceID) {
    let devplugins = {};
    if (localStorage.hasOwnProperty('device_plugins')) {
      devplugins = JSON.parse(localStorage.getItem('device_plugins'));
    }
    devplugins[deviceID] = plugins;
    localStorage.setItem('device_plugins', JSON.stringify(devplugins));
  } else {
    localStorage.setItem('plugins', JSON.stringify(plugins));
  }
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


function startsIcon(str) {
  return str.charCodeAt(0) >= 50000;
}

function makeIconLabel(label) {
  let ilabel = [];
  if (startsIcon(label)) {
    ilabel.push(makeDOM(null, {
      tag: 'span',
      class: 'icon icon-pad',
      style: { pointerEvents: 'none' },
      text: label.slice(0, 1),
    }));
    label = label.slice(1);
  }
  ilabel.push(makeDOM(null, {
    tag: 'span',
    text: label,
    style: { pointerEvents: 'none' },
  }));
  return ilabel;
}