// ====================== CONST ======================
const app_title = 'GyverHub';
const non_esp = '__ESP__';
const non_app = '__APP__';
const non_host = '__HOST__';
const app_version = '__VER__';
const hub = new GyverHub();

const langs = {
  English: 0,
  Russian: 1,
};
const colors = {
  ORANGE: 0xd55f30,
  YELLOW: 0xd69d27,
  GREEN: 0x37A93C,
  MINT: 0x25b18f,
  AQUA: 0x2ba1cd,
  BLUE: 0x297bcd,
  VIOLET: 0x825ae7,
  PINK: 0xc8589a,
};
const fonts = [
  'monospace',
  'system-ui',
  'cursive',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Georgia',
  'Garamond',
];
const themes = {
  DARK: 0,
  LIGHT: 1
};
const baudrates = [
  4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000
];
const theme_cols = [
  // back/tab/font/font2/dark/thumb/black/scheme/font4/shad/font3
  ['#1b1c20', '#26272c', '#eee', '#ccc', '#141516', '#444', '#0e0e0e', 'dark', '#222', '#000'],
  ['#eee', '#fff', '#111', '#333', '#ddd', '#999', '#bdbdbd', 'light', '#fff', '#000000a3']
];

function getError(code) {
  return lang.errors[code];
}

// ====================== VARS ======================
let deferredPrompt = null;
let screen = 'main';
let focused = null;
let cfg_changed = false;

let cfg = {
  serial_offset: 2000,
  use_pin: false,
  pin: '',
  theme: 'DARK',
  maincolor: 'GREEN',
  font: 'monospace',
  check_upd: true,
  ui_width: 450,
  lang: 'English',
  app_plugin_css: '',
  app_plugin_js: '',
  api_ver: 1,
};

// ====================== CHECK ======================
function isSSL() {
  return window.location.protocol == 'https:';
}
function isLocal() {
  return !isDesktop() && window_ip() != '127.0.0.1' && (window.location.href.startsWith('file') || checkIP(window_ip()) || window_ip() == 'localhost');
}
function isHost() {
  return !non_host;
}
function isApp() {
  return !non_app;
}
function isDesktop() {
  return 'GyverHubDesktop' in window;
}
function isMobApp() {
  return isApp() && !isDesktop();
}
function isPWA() {
  return (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');
}
function isESP() {
  return !non_esp;
}
function isTouch() {
  return navigator.maxTouchPoints || 'ontouchstart' in document.documentElement;
}
function hasSerial() {
  return ("serial" in navigator) || isApp();
}
function hasBT() {
  return ("bluetooth" in navigator) || isApp();
}

// ====================== FUNC ======================
async function pwa_install(ssl) {
  if (ssl && !isSSL()) {
    if (await asyncConfirm("Redirect to HTTPS?")) window.location.href = window.location.href.replace('http:', 'https:');
    else return;
  }
  if (!ssl && isSSL()) {
    if (await asyncConfirm("Redirect to HTTP")) window.location.href = window.location.href.replace('https:', 'http:');
    else return;
  }
  if (!('serviceWorker' in navigator)) {
    alert('Error');
    return;
  }
  if (deferredPrompt !== null) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') deferredPrompt = null;
  }
}
function addIdRecursive(node, add) {
  for (let i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];
    addIdRecursive(child, add);
    if (child.id) child.id += add;
  }
}
function truncIdRecursive(node, trunc) {
  for (let i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];
    truncIdRecursive(child, trunc);
    if (child.id && child.id.endsWith(trunc)) child.id = child.id.split(trunc)[0];
  }
}

function addDOM(el_id, tag, text, target) {
  if (EL(el_id)) EL(el_id).remove();
  let el = document.createElement(tag);
  el.textContent = text;
  el.id = el_id;
  target.appendChild(el);
  return el;
}
function getErrColor() {
  return '#8e1414';
}
function getDefColor() {
  // return document.querySelector(':root').style.getPropertyValue('--prim');
  return intToCol(colors[cfg.maincolor]);
}
function dataTotext(data) {
  return b64ToText(data.split('base64,')[1]);
}
function b64ToText(base64) {
  const binString = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binString, (m) => m.codePointAt(0)));
}
function asyncConfirm(msg) {
  return new Promise((resolve, reject) => {
     const res = confirm(msg); 
     resolve(res);
  });
}
function asyncPrompt(msg, placeh) {
  return new Promise((resolve, reject) => {
     const res = prompt(msg, placeh); 
     resolve(res);
  });
}
String.prototype.hashCode = function () {
  if (!this.length) return 0;
  let hash = new Uint32Array(1);
  for (let i = 0; i < this.length; i++) {
    hash[0] = ((hash[0] << 5) - hash[0]) + this.charCodeAt(i);
  }
  return hash[0];
}
function getMime(name) {
  const mime_table = {
    'avi': 'video/x-msvideo',
    'bin': 'application/octet-stream',
    'bmp': 'image/bmp',
    'css': 'text/css',
    'csv': 'text/csv',
    'gz': 'application/gzip',
    'gif': 'image/gif',
    'html': 'text/html',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'wav': 'audio/wav',
    'xml': 'application/xml',
  };
  let ext = name.split('.').pop();
  if (ext in mime_table) return mime_table[ext];
  else return 'text/plain';
}
function openURL(url) {
  window.open(url, '_blank').focus();
}
function intToCol(val) {
  if (val === null || val === undefined) return null;
  return "#" + Number(val).toString(16).padStart(6, '0');
}
function intToColA(val) {
  if (val === null || val === undefined) return null;
  return "#" + Number(val).toString(16).padStart(8, '0');
}
function constrain(val, min, max) {
  return val < min ? min : (val > max ? max : val);
}
function colToInt(str) {
  return parseInt(str.substr(1), 16);
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
function crc32(data) {
  let crc = new Uint32Array(1);
  crc[0] = 0;
  crc[0] = ~crc[0];
  let str = (typeof (data) == 'string');
  for (let i = 0; i < data.length; i++) {
    crc[0] ^= str ? data[i].charCodeAt(0) : data[i];
    for (let i = 0; i < 8; i++) crc[0] = (crc[0] & 1) ? ((crc[0] / 2) ^ 0x4C11DB7) : (crc[0] / 2);
  }
  crc[0] = ~crc[0];
  return crc[0];
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
function parseCSV(str) {
  // https://stackoverflow.com/a/14991797
  const arr = [];
  let quote = false;
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ';' && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
}
function openFile(src) {
  let w = window.open();
  src = w.document.write('<iframe src="' + src + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}
async function copyClip(text) {
  try {
    await navigator.clipboard.writeText(text);
    showPopup(lang.clip_copy);
  } catch (e) {
    showPopupError(lang.error);
  }
}
function getIcon(icon) {
  if (!icon) return '';
  return icon.length == 1 ? icon : String.fromCharCode(Number('0x' + icon));
}

// ====================== BROWSER ======================
function notSupported() {
  alert(lang.p_not_support);
}
function browser() {
  if (navigator.userAgent.includes("Opera") || navigator.userAgent.includes('OPR')) return 'opera';
  else if (navigator.userAgent.includes("Edg")) return 'edge';
  else if (navigator.userAgent.includes("Chrome")) return 'chrome';
  else if (navigator.userAgent.includes("Safari")) return 'safari';
  else if (navigator.userAgent.includes("Firefox")) return 'firefox';
  else if ((navigator.userAgent.includes("MSIE")) || (!!document.documentMode == true)) return 'IE';
  else return 'unknown';
}
function ratio() {
  return window.devicePixelRatio;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function EL(id) {
  return document.getElementById(id);
}
function ID(id) {
  return '__' + id;
}
function CMP(id) {
  return EL(ID(id));
}
function display(id, value) {
  EL(id).style.display = value;
}
function getUnix(arg) {
  return Math.floor(arg.valueAsNumber / 1000);
}
function showNotif(name, text) {
  if (!("Notification" in window) || Notification.permission != 'granted') return;
  let descr = name + ' (' + new Date(Date.now()).toLocaleString() + ')';
  navigator.serviceWorker.getRegistration().then(function (reg) {
    reg.showNotification(text, { body: descr, vibrate: true });
  }).catch(e => console.log(e));
  //new Notification(text, {body: descr});
  //self.registration.showNotification(text, {body: descr});
}

// ===================== RENDER =====================
function waitFrame() {
  return new Promise(requestAnimationFrame);
}
async function wait2Frame() {
  await waitFrame();
  await waitFrame();
}
async function waitRender(id) {
  while (true) {
    if (EL(id)) return Promise.resolve(1);
    await waitFrame();
  }
}

// ====================== NET ======================
function window_ip() {
  let ip = window.location.href.split('/')[2].split(':')[0];
  return checkIP(ip) ? ip : null;
}
function getMaskList() {
  let list = [];
  for (let i = 0; i < 33; i++) {
    let imask;
    if (i == 32) imask = 0xffffffff;
    else imask = ~(0xffffffff >>> i);
    list.push(`${(imask >>> 24) & 0xff}.${(imask >>> 16) & 0xff}.${(imask >>> 8) & 0xff}.${imask & 0xff}`);
  }
  return list;
}
/*NON-ESP*/
function getLocalIP() {
  return new Promise(function (resolve, reject) {
    var RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    if (!RTCPeerConnection) reject('Auto local IP not supported');

    var rtc = new RTCPeerConnection({ iceServers: [] });
    var addrs = {};
    addrs["0.0.0.0"] = false;

    function grepSDP(sdp) {
      var hosts = [];
      var finalIP = '';
      sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
        if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
          var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
            addr = parts[4],
            type = parts[7];
          if (type === 'host') {
            finalIP = addr;
          }
        } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
          var parts = line.split(' '),
            addr = parts[2];
          finalIP = addr;
        }
      });
      return finalIP;
    }

    if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
      rtc.createDataChannel('', { reliable: false });
    };

    rtc.onicecandidate = function (evt) {
      // convert the candidate to SDP so we can run it through our general parser
      // see https://twitter.com/lancestout/status/525796175425720320 for details
      if (evt.candidate) {
        var addr = grepSDP("a=" + evt.candidate.candidate);
        resolve(addr);
      }
    };
    rtc.createOffer(function (offerDesc) {
      rtc.setLocalDescription(offerDesc);
    }, function (e) { return; });
  });
}
/*/NON-ESP*/