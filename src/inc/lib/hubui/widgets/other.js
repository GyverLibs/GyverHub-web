class SpaceWidget extends BaseWidget {
    static name = 'space';
    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        data.nolabel = true;
        data.notab = true;
        super.update(data);
    }
}

// TODO: remove on new version
class JsWidget extends BaseWidget {
    static name = 'js';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}
class CssWidget extends BaseWidget {
    static name = 'css';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}
class DummyWidget extends BaseWidget {
    static name = 'dummy';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}
class FuncWidget extends BaseWidget {
    static name = 'func';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}
class HookWidget extends BaseWidget {
    static name = 'hook';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}