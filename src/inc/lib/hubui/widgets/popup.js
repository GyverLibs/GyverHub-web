class ConfirmWidget extends Widget {
    static name = 'confirm';
    static virtual = true;

    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if ('action' in data) asyncConfirm(this.data.text).then(res => this.set(res ? 1 : 0));
    }
}

class PromptWidget extends Widget {
    static name = 'prompt';
    static virtual = true;
    
    constructor(data, renderer) {
        super(data, renderer);
        this.update(data);
    }

    update(data) {
        super.update(data);
    
        if ('action' in data) asyncPrompt(this.data.text, this.data.value).then(res => {
            if (res !== null){
                this.data.value = res;
                this.set(res);
            }
        });
    }
}