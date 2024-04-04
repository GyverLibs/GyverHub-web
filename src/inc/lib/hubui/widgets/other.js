class SpaceWidget extends BaseWidget {
    static wtype = 'space';
    constructor(data, renderer) {
        super(data, renderer);
        this.nolabel = true;
        this.notab = true;
        this.update(data);
    }

    update(data) {
        super.update(data);
    }
}

class DummyWidget extends Widget {
    static wtype = 'dummy';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}