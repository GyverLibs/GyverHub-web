// ====================== CONST ======================

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


function getError(code) {
  return lang.errors[code];
}

// ====================== CHECK ======================
function isSSL() {
  return window.location.protocol == 'https:';
}
function userLang() {
  switch (navigator.language || navigator.userLanguage) {
    case 'ru-RU': case 'ru': return 'Russian';
  }
  return 'English';
}

// ====================== FUNC ======================
async function switch_ssl(ssl) {
  if (ssl && !isSSL()) {
    if (await asyncConfirm(lang.redirect + " HTTPS?")) window.location.href = window.location.href.replace('http:', 'https:');
  }
  if (!ssl && isSSL()) {
    if (await asyncConfirm(lang.redirect + " HTTP?")) window.location.href = window.location.href.replace('https:', 'http:');
  }
}

function addDOM(el_id, tag, text, target) {
  if (EL(el_id)) EL(el_id).remove();
  const el = document.createElement(tag);
  el.textContent = text;
  el.id = el_id;
  target.appendChild(el);
  return el;
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

function checkIP(ip) {
  return Boolean(ip && ip.match(/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/));
}
