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
async function http_get(url, tout) {
    const res = await fetch(url, {
        signal: AbortSignal.timeout(tout)
    })
    if (!res.ok)
        throw new DOMException(res.statusText);
    return await res.text();
}

function http_fetch_blob(url, type, onprogress, tout) {
    return new Promise((res, rej) => {
        async function handle(e) {
            if (xhr.response === null) throw new HubError("Network error");

            if (e.loaded !== e.total || xhr.status !== 200) {
                const ab = type === 'url' ? await readFileAsArrayBuffer(xhr.response) : xhr.response;
                const text = new TextDecoder().decode(ab);
                throw new HubError(text);
            }

            if (type === 'url') return await readFileAsDataUrl(xhr.response);
            if (type === 'text') return new TextDecoder().decode(xhr.response);
        }

        onprogress(0);
        const xhr = new XMLHttpRequest();
        xhr.onprogress = (e) => onprogress(Math.round(e.loaded * 100 / e.total));
        xhr.onloadend = (e) => handle(e).then(res).catch(rej);
        xhr.ontimeout = () => rej(new DeviceError(HubErrors.Timeout));
        xhr.timeout = tout;
        xhr.responseType = type === 'url' ? 'blob' : 'arraybuffer';
        xhr.open('GET', url, true);
        xhr.send();
    });
}

async function http_post(url, data) {//TODO tout
    const res = await fetch(url, {
        method: 'POST',
        body: data
    });
    if (!res.ok)
        throw await res.text();
    return await res.text();
}

// ip
function getIPs(ip, netmask) {
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

function readFileAsDataUrl(file) {
    return new Promise((res, rej) => {
        let reader = new FileReader();
        reader.addEventListener('load', e => {
            res(reader.result);
        });
        reader.addEventListener('error', e => {
            rej(reader.error);
        });
        reader.readAsDataURL(file);
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

function Array_maxBy(arr, fn) {
    return arr.reduce((best, next) => {
        const value = fn(next);
        if (best && Math.max(best[0], value) == best[0]) return best;
        return [value, next];
    }, null)[1];
}

function Array_remove(arr, value) {
    let index;
    while ((index = arr.indexOf(value)) !== -1) arr.splice(index, 1);
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}