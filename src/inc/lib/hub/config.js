class ConfigChangeEvent extends Event {
    constructor(type, name, value) {
        super(type);
        this.name = name;
        this.value = value;
    }
}

class Config extends EventEmitter {
    #data;

    constructor() {
        super();
        this.#data = {};
    }

    get(...name) {
        const lastName = name.pop();
        let obj = this.#data;
        for (const i of name) {
            obj = (i in obj) ? obj[i] :  {};
            if (typeof obj !== 'object' || !obj)
                return;
        }
        return obj[lastName];
    }

    set(...name) {
        const value = name.pop();
        const lastName = name.pop();

        let obj = this.#data;
        for (const i of name) {
            if (!(i in obj) || obj[i] === null)
                obj[i] = {}
            obj = obj[i];

            if (typeof obj !== 'object')
                return;
        }

        obj[lastName] = value;
        name.push(lastName);
        let path = 'changed';
        this.dispatchEvent(new ConfigChangeEvent(path, name, value));
        for (const i of name) {
            path += '.' + i;
            this.dispatchEvent(new ConfigChangeEvent(path, name, value));
        }
    }

    delete(...name) {
        const lastName = name.pop();

        let obj = this.#data;
        for (const i of name) {
            if (!(i in obj) || obj[i] === null)
                obj[i] = {}
            obj = obj[i];

            if (typeof obj !== 'object')
                return;
        }

        delete obj[lastName];
        let path = 'changed';
        this.dispatchEvent(new ConfigChangeEvent(path, name, undefined));
        for (const i of name) {
            path += '.' + i;
            this.dispatchEvent(new ConfigChangeEvent(path, name, undefined));
        }
    }

    toJson() {
        return JSON.stringify(this.#data);
    }

    fromJson(data) {
        this.#data = JSON.parse(data);
        this.#dispatchRecurse(this.#data, 'changed');
    }

    #dispatchRecurse(obj, path) {
        this.dispatchEvent(new ConfigChangeEvent(path, [], this.#data));
        if (typeof obj !== 'object' || !obj) return;

        for (const i in obj) if (obj.hasOwnProperty(i)) {
            this.#dispatchRecurse(obj[i], path + '.' + i);    
        }
    }

    getConnection(connName) {
        const self = this;
        return new Proxy(Object.create(null), {
            get(t, name, r) {
                return self.get('connections', connName, name);
            },
            set(t, name, value, r) {
                self.set('connections', connName, name, value);
                return true;
            }
        });
    }

    getDevice(devId) {
        const self = this;
        return new Proxy(Object.create(null), {
            get(t, name, r) {
                return self.get('devices', devId, name);
            },
            set(t, name, value, r) {
                self.set('devices', devId, name, value);
                return true;
            }
        });
    }

    get global() {
        const self = this;
        return new Proxy(Object.create(null), {
            get(t, name, r) {
                return self.get('hub', name);
            },
            set(t, name, value, r) {
                self.set('hub', name, value);
                return true;
            }
        });
    }
}
