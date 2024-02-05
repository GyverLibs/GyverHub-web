class ImageWidget extends BaseWidget {
    $el;
    #path;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            name: 'el',
            html: waiter(),
        });
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.#path = data.value;
        if ('action' in data || 'value' in data) {
            this.renderer.device.addFile(this.id, this.#path, file => {
                this.setPlabel();
                this.$el.innerHTML = `<img style="width:100%" src="${file}">`;
            }, perc => this.setPlabel(`[${perc}%]`));
        }
    }
}

Renderer.register('image', ImageWidget);
