const Modules = {
  UI: (1 << 0),
  INFO: (1 << 1),
  SET: (1 << 2),
  READ: (1 << 3),
  GET: (1 << 4),
  DATA: (1 << 5),

  REBOOT: (1 << 6),
  FILES: (1 << 7),
  FORMAT: (1 << 8),
  DELETE: (1 << 9),
  RENAME: (1 << 10),
  CREATE: (1 << 11),
  FETCH: (1 << 12),
  UPLOAD: (1 << 13),
  OTA: (1 << 14),
  OTA_URL: (1 << 15),
  MQTT: (1 << 16),
};

// http
function http_get(url, tout) {
  return new Promise((res, rej) => {
    try {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) res(xhr.responseText);
          else rej("Error");
        }
      }
      xhr.ontimeout = () => rej("Timeout");
      xhr.onerror = () => rej("Error");
      xhr.timeout = tout;
      xhr.open('GET', url, true);
      xhr.send();
    } catch (e) {
      rej(e);
    }
  });
}

function http_fetch(url, onprogress, tout) {
  return new Promise((res, rej) => {
    onprogress(0);
    let xhr = new XMLHttpRequest();
    xhr.onprogress = (e) => {
      onprogress(Math.round(e.loaded * 100 / e.total));
    };
    xhr.onloadend = (e) => {
      if (e.loaded && e.loaded == e.total) res(xhr.responseText);
      else rej(xhr.responseText);
    }
    xhr.timeout = tout;
    xhr.ontimeout = (e) => rej(HubErrors.Timeout);
    xhr.open('GET', url, true);
    xhr.send();
  });
}

function http_fetch_blob(url, onprogress, tout) {
  return new Promise((res, rej) => {
    onprogress(0);
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onprogress = (e) => {
      onprogress(Math.round(e.loaded * 100 / e.total));
    };
    xhr.onloadend = (e) => {
      if (e.loaded == e.total && xhr.status == 200) {
        let reader = new FileReader();
        reader.readAsDataURL(xhr.response);
        reader.onloadend = () => res(reader.result.split('base64,')[1]);
      } else {
        if (xhr.response) {
          xhr.response.text()
            .then(res => rej(res))
            .catch(e => rej(e))
        } else {
          rej();
        }
      }
    }
    xhr.timeout = tout;
    xhr.ontimeout = (e) => rej(HubErrors.Timeout);
    xhr.open('GET', url, true);
    xhr.send();
  });
}

function http_post(url, data) {//TODO tout
  return new Promise((res, rej) => {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) res(xhr.responseText);
        else rej(xhr.responseText);
      }
    }
    xhr.open('POST', url, true);
    xhr.send(data);
  });
}

// ip
function checkIP(ip) {
  return Boolean(ip && ip.match(/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/));
}
function getIPs(ip, netmask) {
  if (!checkIP(ip)) {
    asyncAlert(lang.wrong_ip);
    return null;
  }
  let ip_a = ip.split('.');
  let sum_ip = (ip_a[0] << 24) | (ip_a[1] << 16) | (ip_a[2] << 8) | ip_a[3];
  let cidr = Number(netmask);
  let mask = ~(0xffffffff >>> cidr);
  let network = 0, broadcast = 0, start_ip = 0, end_ip = 0;
  if (cidr === 32) {
    network = sum_ip;
    broadcast = network;
    start_ip = network;
    end_ip = network;
  } else {
    network = sum_ip & mask;
    broadcast = network + (~mask);
    if (cidr === 31) {
      start_ip = network;
      end_ip = broadcast;
    } else {
      start_ip = network + 1;
      end_ip = broadcast - 1;
    }
  }
  let ips = ['192.168.4.1'];  // for esp
  for (let ip = start_ip; ip <= end_ip; ip++) {
    ips.push(`${(ip >>> 24) & 0xff}.${(ip >>> 16) & 0xff}.${(ip >>> 8) & 0xff}.${ip & 0xff}`);
  }
  return ips;
}

// fetch + timeout
/*async function fetchT(url, options = {}, tout = 5000) {
  const controller = new AbortController();
  const t_id = setTimeout(() => controller.abort(), tout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(t_id);
  return response;
}*/

function sleep(time) {
  return new Promise(res => setTimeout(res, time));
}

function readFileAsArrayBuffer(file) {
  return new Promise((res, rej) => {
    let reader = new FileReader();
    reader.addEventListener('load', e => {
      res(reader.result);
    });
    reader.addEventListener('error', e => {
      rej(reader.error);
    });
    reader.readAsArrayBuffer(file);
  });
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

function getMime(name) {
  const mime_table = {
    'avi': 'video/x-msvideo',
    'bin': 'application/octet-stream',
    'bmp': 'image/bmp',
    'css': 'text/css;charset=utf-8',
    'csv': 'text/csv;charset=utf-8',
    'gz': 'application/gzip',
    'gif': 'image/gif',
    'html': 'text/html;charset=utf-8',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript;charset=utf-8',
    'json': 'application/json',
    'png': 'image/png',
    'svg': 'image/svg+xml;charset=utf-8',
    'txt': 'text/plain;charset=utf-8',
    'wav': 'audio/wav',
    'xml': 'application/xml;charset=utf-8',
  };
  let ext = name.split('.').pop();
  if (ext in mime_table) return mime_table[ext];
  else return 'text/plain';
}

const ENCODINGS = new TextEncoder().encode('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');
const EQ = '='.charCodeAt(0);

function b64EncodeAB(arrayBuffer) {
  const bytes         = new Uint8Array(arrayBuffer);
  const byteLength    = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength    = byteLength - byteRemainder;
  const base64        = new Uint8Array((mainLength + !!byteRemainder) * 4);

  let a, b, c, d, ii = 0;
  let chunk;

  for (let i = 0; i < mainLength; i += 3) {
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    base64[ii] = ENCODINGS[a];
    base64[ii+1] = ENCODINGS[b];
    base64[ii+2] = ENCODINGS[c];
    base64[ii+3] = ENCODINGS[d];
    ii += 4;
  }

  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64[ii] = ENCODINGS[a];
    base64[ii+1] = ENCODINGS[b];
    base64[ii+2] = EQ;
    base64[ii+3] = EQ;
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64[ii] = ENCODINGS[a];
    base64[ii+1] = ENCODINGS[b];
    base64[ii+2] = ENCODINGS[c];
    base64[ii+3] = EQ;
  }
  
  return base64;
}

// the only difference between minBy and maxBy is the ordering
// function, so abstract that out
Object.defineProperties(Array.prototype, {
  minBy: {
    enumerable: false,
    writable: false,
    value(fn) {
      return this.extremumBy(fn, Math.min);
    }
  },
  maxBy: {
    enumerable: false,
    writable: false,
    value(fn) {
      return this.extremumBy(fn, Math.max);
    }
  },
  maxBy: {
    enumerable: false,
    writable: false,
    value(fn) {
      return this.extremumBy(fn, Math.max);
    }
  },
  extremumBy: {
    enumerable: false,
    writable: false,
    value(pluck, extremum) {
      return this.reduce(function(best, next) {
        var pair = [ pluck(next), next ];
        if (!best) {
           return pair;
        } else if (extremum.apply(null, [ best[0], pair[0] ]) == best[0]) {
           return best;
        } else {
           return pair;
        }
      }, null)[1];
    }
  },
  remove: {
    enumerable: false,
    writable: false,
    value(element) {
      var index = this.indexOf(element);
      if (index !== -1) {
        this.splice(index, 1);
        return true;
      }
      return false;
    }
  },
});
