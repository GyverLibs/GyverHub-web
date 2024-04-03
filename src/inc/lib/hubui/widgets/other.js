class SpaceWidget extends BaseWidget {
    static wtype = 'space';
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

class DummyWidget extends Widget {
    static wtype = 'dummy';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
    }
}