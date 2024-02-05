function createElement(self, obj) {
    if (typeof obj === 'string' || obj instanceof Node)
        return obj;

    const $el = document.createElement(obj.type);
    if (obj.class) $el.className = obj.class;
    if (obj.id) $el.id = obj.id;
    if (obj.text) $el.innerText = obj.text;
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
