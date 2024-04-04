class ImageWidget extends BaseWidget {
    static wtype = 'image';
    $el;
    #path;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'div',
            name: 'el',
            html: waiter(),
        });
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.#path = data.value;
        if ('action' in data || 'value' in data) {
            this.addFile(this.#path, 'url', file => {
                this.$el.innerHTML = `<img style="width:100%" src="${file}">`;
            });
        }
    }
}