// ====================== CONST ======================
const hub = new GyverHub();

if (localStorage.hasOwnProperty('hub_config')) {
  hub.config.fromJson(localStorage.getItem('hub_config'));
}

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
  theme: 'auto',
  maincolor: 'GREEN',
  font: 'monospace',
  check_upd: true,
  ui_width: 450,
  lang: userLang(),
  app_plugin_css: '',
  app_plugin_js: '',
  api_ver: 1,
};

if (localStorage.hasOwnProperty('app_config')) {
  let cfg_r = JSON.parse(localStorage.getItem('app_config'));
  if (cfg.api_ver === cfg_r.api_ver) {
    cfg = cfg_r;
  }
}
localStorage.setItem('app_config', JSON.stringify(cfg));

let lang = langBase[cfg.lang];

/*@[if_target:esp]*/
  if (window_ip()) {
    EL('local_ip').value = window_ip();
    hub.config.set('connections', 'HTTP', 'local_ip', window_ip());
  }
/*@/[if_target:esp]*/


/*@[if_not_target:esp]*/
  getLocalIP();
/*@/[if_not_target:esp]*/

// ====================== CHECK ======================
function platform() {
/*@[if_target:host]*/
  return 'host';
/*@/[if_target:host]*/
/*@[if_target:esp]*/
  return 'esp';
/*@/[if_target:esp]*/
/*@[if_target:desktop]*/
  return 'desktop';
/*@/[if_target:desktop]*/
/*@[if_target:mobile]*/
  return 'mobile';
/*@/[if_target:mobile]*/
/*@[if_target:local]*/
  return 'local';
/*@/[if_target:local]*/
}

function isSSL() {
  return window.location.protocol == 'https:';
}
function hasSerial() {
  return "serial" in navigator;
}
function hasBT() {
  return "bluetooth" in navigator;
}
function userLang() {
  switch (navigator.language || navigator.userLanguage) {
    case 'ru-RU': case 'ru': return 'Russian';
  }
  return 'English';
}

// ====================== FUNC ======================
async function pwa_install(ssl) {
  if (ssl && !isSSL()) {
    if (await asyncConfirm(lang.redirect + " HTTPS?")) window.location.href = window.location.href.replace('http:', 'https:');
    else return;
  }
  if (!ssl && isSSL()) {
    if (await asyncConfirm(lang.redirect + " HTTP?")) window.location.href = window.location.href.replace('https:', 'http:');
    else return;
  }
  if (!('serviceWorker' in navigator)) {
    asyncAlert(lang.error);
    return;
  }
  if (deferredPrompt !== null) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') deferredPrompt = null;
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
String.prototype.hashCode = function () {
  if (!this.length) return 0;
  let hash = new Uint32Array(1);
  for (let i = 0; i < this.length; i++) {
    hash[0] = ((hash[0] << 5) - hash[0]) + this.charCodeAt(i);
  }
  return hash[0];
}
function openURL(url) {
  window.open(url, '_blank').focus();
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

// ====================== BROWSER ======================
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
function EL(id) {
  return document.getElementById(id);
}
function display(id, value) {
  EL(id).style.display = value;
}
function showNotif(name, text) {
  if (!("Notification" in window) || Notification.permission != 'granted') return;
  const descr = name + ' (' + new Date(Date.now()).toLocaleString() + ')';
  navigator.serviceWorker.getRegistration().then(function (reg) {
    reg.showNotification(text, { body: descr, vibrate: true });
  }).catch(e => console.log(e));
}

// ====================== NET ======================
/*@[if_target:esp]*/
function window_ip() {
  const ip = window.location.hostname;
  return checkIP(ip) ? ip : null;
}
/*@/[if_target:esp]*/
function getMaskList() {
  const list = [];
  for (let i = 0; i < 33; i++) {
    let imask;
    if (i == 32) imask = 0xffffffff;
    else imask = ~(0xffffffff >>> i);
    list.push(`${(imask >>> 24) & 0xff}.${(imask >>> 16) & 0xff}.${(imask >>> 8) & 0xff}.${imask & 0xff}`);
  }
  return list;
}
/*@[if_not_target:esp]*/
function getLocalIP(silent = true) {
  const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  if (!RTCPeerConnection) {
    if (!silent)
      asyncAlert(lang.p_not_support);
    return;
  }

  const rtc = new RTCPeerConnection({ iceServers: [] });
  rtc.createDataChannel('', { reliable: false });

  rtc.addEventListener("icecandidate", evt => {
    if (!evt.candidate) return;

    const ip = evt.candidate.address;
    if (!ip) return;

    if (ip.endsWith('.local')) {
      if (!silent)
        asyncAlert(`Disable WEB RTC anonymizer: ${browser()}:/`+`/flags/#enable-webrtc-hide-local-ips-with-mdns`);
      return;
    }

    EL('local_ip').value = ip;
    hub.config.set('connections', 'HTTP', 'local_ip', ip);
  });

  rtc.createOffer().then(offerDesc => rtc.setLocalDescription(offerDesc));
}
/*@/[if_not_target:esp]*/
