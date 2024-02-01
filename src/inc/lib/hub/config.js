/**
 * Событие изменения конфигурации.
 */
class ConfigChangeEvent extends Event {
    constructor(type, name, value) {
        super(type);
        this.name = name;
        this.value = value;
    }
}

/**
 * Конфигурация.
 * 
 * При любом изменении конфигурации вызывается событие {@link ConfigChangeEvent}
 * с типом changed, а так же changed.путь.
 */
class Config extends EventEmitter {
    #data;

    constructor() {
        super();
        this.#data = {};
    }

    /**
     * Получить значение из конфигурации.
     * 
     * @example config.get('group', 'subgroup', 'name')
     */
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

    /**
     * Записать значение в конфигурацию. Последний аргумент - значение.
     * 
     * @example config.set('group', 'subgroup', 'name', value)
     */
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

    /**
     * Удалить значение из конфигурации
     */
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

    /**
     * Зкспорт конфигурации в json строку.
     * @returns {string}
     */
    toJson() {
        return JSON.stringify(this.#data);
    }

    /**
     * Импорт конфигурации из json строки
     * @param {string} data 
     */
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

    /**
     * Создает прокси-объект для указанной группы.
     * 
     * @example const proxy = config.createProxy('group', 'subgroup');
     *     proxy.name = value;  // то же, что и config.set('group', 'subgroup', 'name', value);
     */
    createProxy(...names) {
        const self = this;
        return new Proxy(Object.create(null), {
            get(t, name, r) {
                return self.get(...names, name);
            },
            set(t, name, value, r) {
                self.set(...names, name, value);
                return true;
            }
        });
    }

    /**
     * Создает прокси для настроек соединения.
     * @see {@link Config.createProxy}
     * @param {string} connName Имя соединения
     */
    getConnection(connName) {
        return this.createProxy('connections', connName);
    }

    /**
     * Создает прокси для настроек устройства.
     * @see {@link Config.createProxy}
     * @param {string} devId ID устройства
     */
    getDevice(devId) {
        return this.createProxy('devices', devId);
    }

    /**
     * Глобальные настройки хаба.
     * @see {@link Config.createProxy}
     */
    get global() {
        return this.createProxy('hub');
    }
}
