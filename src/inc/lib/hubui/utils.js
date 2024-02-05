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

