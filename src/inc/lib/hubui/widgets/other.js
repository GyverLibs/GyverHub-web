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

Renderer.register('space', BaseWidget);

Renderer.register('dummy', Widget, true);

// TODO: remove on new version
Renderer.register('css', Widget, true);
Renderer.register('js', Widget, true);
Renderer.register('hook', Widget, true);
Renderer.register('func', Widget, true);
