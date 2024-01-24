
function Enum(enum_name, ...values) {
    const obj = Object.create(null);
    for (const i of values)
        obj[i] = Symbol(`${enum_name}.${i}`);
    return Object.freeze(obj);
}
