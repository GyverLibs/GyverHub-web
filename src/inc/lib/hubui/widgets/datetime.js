class DateWidget extends BaseWidget {
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            style: {
                color: 'var(--prim)'
            },
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
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
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
            style: {
                color: 'var(--prim)'
            },
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
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
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
            style: {
                color: 'var(--prim)'
            },
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
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
    }

    static style() {
        return `
        .w_date {
            border: none;
            outline: none;
            font-family: var(--font_f);
            cursor: pointer;
            background: none;
            font-size: 20px;
            padding: 0;
          }
          
          .w_date::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }`;
    }
}

function getUnix(arg) {
    return Math.floor(arg.valueAsNumber / 1000);
}