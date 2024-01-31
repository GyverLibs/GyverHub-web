class UiHook {

    static clear() {
        UiHook.hooks = {};
    }

    static bind(id, value) {
        UiHook.hooks[id] = { value: value };
    }

    static update() {
        for (let id in UiHook.hooks) applyUpdate(id, UiHook.hooks[id]);
    }

    static hooks;
};