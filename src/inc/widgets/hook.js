class UiHook {

    static reset() {
        UiHook.hooks = {};
    }

    static add(id, value) {
        UiHook.hooks[id] = { value: value };
    }

    static update() {
        for (let id in UiHook.hooks) applyUpdate(id, UiHook.hooks[id]);
    }

    static hooks;
};