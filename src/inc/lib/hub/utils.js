// const
const Conn = {
  SERIAL: 0,
  BT: 1,
  HTTP: 2,
  MQTT: 3,
  NONE: 4,
  names: [
    'Serial', 'BT', 'HTTP', 'MQTT', 'TG', 'None'
  ],
};
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
    alert('Wrong local IP!');
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