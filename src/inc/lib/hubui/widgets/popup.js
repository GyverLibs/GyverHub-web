class ConfirmWidget extends Widget {
    #text = '';

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if ('text' in data) this.#text = data.text;
        if ('action' in data) asyncConfirm(this.#text).then(res => this.set(res ? 1 : 0));
    }
}

Renderer.register('confirm', ConfirmWidget);


class PromptWidget extends Widget {
    #text = '';
    #value = '';

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if ('text' in data) this.#text = data.text;
        if ('value' in data) this.#value = data.value;
        if ('action' in data) asyncPrompt(this.#text, this.#value).then(res => {
            if (res !== null){
                this.#value = res;
                this.set(res);
            }
        });
    }
}

Renderer.register('prompt', PromptWidget);


class DummyWidget extends Widget {}

Renderer.register('dummy', DummyWidget);
