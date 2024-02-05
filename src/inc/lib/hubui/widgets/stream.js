class StreamWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'img',
            name: 'el',
            style: {
                width: '100%',
            }
        });
        const info = this.renderer.device.info;
        this.$el.src = `http://${info.ip}:${data.port}/${data.path ?? ''}`;
        
        this.update(data);
    }
}

Renderer.register('stream', StreamWidget);
