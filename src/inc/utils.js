// ====================== CONST ======================

const colors = {
  ORANGE: "d55f30",
  YELLOW: "d69d27",
  GREEN: "37A93C",
  MINT: "25b18f",
  AQUA: "2ba1cd",
  BLUE: "297bcd",
  VIOLET: "825ae7",
  PINK: "c8589a",
};

function getError(err) {
  if (err instanceof DeviceError)
    return lang.errors[err.code];
  if (err instanceof TimeoutError)
    return lang.errors[HubErrors.Timeout];
  if (err instanceof DOMException)
    return `${err.name}: ${err.message}`
  console.log(err);
  return `${err}`;
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

function showNotif(name, text) {
  if (!("Notification" in window) || Notification.permission != 'granted') return;
  const descr = name + ' (' + new Date(Date.now()).toLocaleString() + ')';
  navigator.serviceWorker.getRegistration().then(function (reg) {
    reg.showNotification(text, { body: descr, vibrate: true });
  }).catch(e => console.log(e));
}

function platform() {
  //if ((window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://')) return 'pwa';
  // if (!non_host) return 'host';
  // if (!non_esp) return 'esp';
  if ('GyverHubDesktop' in window) return 'desktop';
  if ('flutter_inappwebview' in window) return 'mobile';
  return 'local';
}

// ====================== NET ======================
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
function getLocalIP(silent = true) {
  /*@[if_target:esp]*/
  const ip = window.location.hostname;
  if (checkIP(ip)) {
    EL('local_ip').value = ip;
    hub.config.set('connections', 'HTTP', 'local_ip', ip);

  } else if (!silent) {
    asyncAlert(lang.p_not_support);
  }
  /*@/[if_target:esp]*/

  /*@[if_not_target:esp]*/
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
        asyncAlert(`Disable WEB RTC anonymizer: ${browser()}:/` + `/flags/#enable-webrtc-hide-local-ips-with-mdns`);
      return;
    }

    EL('local_ip').value = ip;
    hub.config.set('connections', 'HTTP', 'local_ip', ip);
  });

  rtc.createOffer().then(offerDesc => rtc.setLocalDescription(offerDesc));
  /*@/[if_not_target:esp]*/
}

function checkIP(ip) {
  return Boolean(ip && ip.match(/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/));
}
