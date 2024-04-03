class DateWidget extends BaseWidget {
    static wtype = 'date';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            inputType: 'date',
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
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('T')[0];
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
    }
}

class TimeWidget extends BaseWidget {
    static wtype = 'time';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            inputType: 'time',
            style: {
                color: 'var(--prim)'
            },
            params: {
                step: 1
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
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('T')[1].split('.')[0];
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
    }
}

class DateTimeWidget extends BaseWidget {
    static wtype = 'datetime';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'input',
            class: 'w_date',
            name: 'el',
            inputType: 'datetime-local',
            style: {
                color: 'var(--prim)'
            },
            params: {
                step: 1
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
        
        this.update(data);
    }

    update(data) {
        super.update(data);
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('.')[0];
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
    }

    static style = `
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

function getUnix(arg) {
    return Math.floor(arg.valueAsNumber / 1000);
}