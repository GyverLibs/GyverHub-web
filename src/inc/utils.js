// ====================== CONST ======================
const app_title = 'GyverHub';
const app_version = '/*@![:version]*/';
const hub = new GyverHub();

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
const themes = {
  DARK: 0,
  LIGHT: 1
};
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
  theme: isDark() ? 'DARK' : 'LIGHT',
  maincolor: 'GREEN',
  font: 'monospace',
  check_upd: true,
  ui_width: 450,
  lang: userLang(),
  app_plugin_css: '',
  app_plugin_js: '',
  api_ver: 1,
};

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

function isDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function isSSL() {
  return window.location.protocol == 'https:';
}
function isTouch() {
  return navigator.maxTouchPoints || 'ontouchstart' in document.documentElement;
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
function constrain(val, min, max) {
  return val < min ? min : (val > max ? max : val);
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
function notSupported() {
  asyncAlert(lang.p_not_support);
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
function EL(id) {
  return document.getElementById(id);
}
function display(id, value) {
  EL(id).style.display = value;
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

// ====================== NET ======================
function window_ip() {
  let ip = window.location.hostname;
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
/*@[if_not_target:esp]*/
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
/*@/[if_not_target:esp]*/
