class DateWidget extends BaseWidget {
    static wtype = 'date';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'input',
            class: 'w-date',
            name: 'el',
            type: 'date',
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
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class TimeWidget extends BaseWidget {
    static wtype = 'time';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'input',
            class: 'w-date',
            name: 'el',
            type: 'time',
            step: 1,
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
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('T')[1].split('.')[0];
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
        if ('disable' in data) this.disable(this.$el, data.disable);
    }
}

class DateTimeWidget extends BaseWidget {
    static wtype = 'datetime';
    $el;

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            tag: 'input',
            class: 'w-date',
            name: 'el',
            type: 'datetime-local',
            step: 1,
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
        if ('value' in data) this.$el.value = new Date(data.value * 1000).toISOString().split('.')[0];
        if ('color' in data) this.$el.style.color = hexToCol(data.color);
        if ('disable' in data) this.disable(this.$el, data.disable);
    }

    static style = `
        .w-date {
            border: none;
            outline: none;
            font-family: var(--font_f);
            cursor: pointer;
            background: none;
            font-size: 20px;
            padding: 0;
          }
          
          .w-date::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }`;
}

function getUnix(arg) {
    return Math.floor(arg.valueAsNumber / 1000);
}