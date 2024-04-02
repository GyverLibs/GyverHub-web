class SpaceWidget extends BaseWidget {
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