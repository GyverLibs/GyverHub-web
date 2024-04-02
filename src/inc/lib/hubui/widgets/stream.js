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
        
        this.update(data);
    }

    update(data){
        super.update(data);

        if ('port' in data || 'path' in data)
            this.$el.src = `http://${this.renderer.device.info.ip}:${data.port}/${data.path ?? ''}`;
    }
}
