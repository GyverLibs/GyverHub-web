class DateWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            events: {
                click: () => {
                    this.$el.showPicker();
                },
                change: () => {
                    this.set(getUnix(this.$el));
                },
            },
        });
        this.$el.type = 'date';
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('T')[0];
        if ('color' in data) this.$el.style.color = intToCol(data.color);
    }
}

class TimeWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            events: {
                click: () => {
                    this.$el.showPicker();
                },
                change: () => {
                    this.set(getUnix(this.$el));
                },
            },
        });
        this.$el.type = 'time';
        this.$el.step = 1;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('T')[1].split('.')[0];
        if ('color' in data) this.$el.style.color = intToCol(data.color);
    }
}

class DateTimeWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            events: {
                click: () => {
                    this.$el.showPicker();
                },
                change: () => {
                    this.set(getUnix(this.$el));
                },
            },
        });
        this.$el.type = 'datetime-local';
        this.$el.step = 1;
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('.')[0];
        if ('color' in data) this.$el.style.color = intToCol(data.color);
    }
}

function getUnix(arg) {
    return Math.floor(arg.valueAsNumber / 1000);
}

Renderer.register('date', DateWidget);
Renderer.register('time', TimeWidget);
Renderer.register('datetime', DateTimeWidget);
