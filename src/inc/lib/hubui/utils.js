function createElement(self, obj) {
    const $el = document.createElement(obj.type);
    if (obj.class) $el.className = obj.class;
    if (obj.id) $el.id = obj.id;
    if (obj.style)
        for (const [prop, value] of Object.entries(obj.style))
            $el.style[prop] = value;
    if (obj.also) obj.also.call(self, $el);
    if (obj.name) self['$' + obj.name] = $el;
    if (obj.children)
        for (const i of obj.children)
            $el.append(createElement(self, i));
    return $el;
}

