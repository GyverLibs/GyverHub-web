const markIcon = L.divIcon({
    html: '',
    iconSize: [26, 36],
    iconAnchor: [26 / 2, 43],
    className: 'icon icon_map',
});

const mapZeroPos = [55.754994, 37.623288];

const mapLayers = [
    {
        attribution: "OpenStreetMap",
        tiles: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",    // osm street
        subdomains: 'abc'
    },
    {
        attribution: "Google",
        tiles: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",    // google street
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    },
    {
        attribution: "Google",
        tiles: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",    // google satellite
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    },
    {
        attribution: "Google",
        tiles: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",  // google hybrid
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }
];

class MapWidget extends BaseWidget {
    $el;
    map;
    marker;
    data = [];

    constructor(data, renderer) {
        super(data, renderer);

        this.makeLayout({
            type: 'div',
            name: 'el',
            style: {
                width: '100%',
                height: '100%',
            },
        });

        waitRender(this.$el).then(() => {
            this.map = L.map(this.$el);
            // L.control.scale().addTo(this.map);
            let layer = mapLayers[data.layer ?? 0];

            L.tileLayer(layer.tiles, {
                minZoom: 3,
                maxZoom: 20,
                attribution: layer.attribution,
                subdomains: layer.subdomains,
            }).addTo(this.map);

            this.map.on('click', async (e) => {
                if (this.disabled() || !data.active) return;
                this._send(e.latlng);
            });

            L_canvasLayer().delegate(this).addTo(this.map);
            this.map.setView(('latlon' in data) ? data.latlon : mapZeroPos, 10);
            this.update(data);
        });
    }

    update(data) {
        super.update(data);
        if ('latlon' in data) {
            this.map.panTo(data.latlon);
            this._setMarker(data.latlon);
        }
        if ('data' in data) this.data = this.data.concat(data.data); console.log(data);
    }

    onDrawLayer(info) {
        let cx = info.canvas.getContext('2d');
        cx.clearRect(0, 0, info.canvas.width, info.canvas.height);
        showCanvasAPI(
            info.canvas,
            this.data,
            L_scale(info),
            (x, y) => {
                let point = L_toPoint(info, [x / 1000000.0, y / 1000000.0]);
                return [point.x, point.y];
            }
        );
    }

    _setMarker(latlon) {
        if (this.marker) {
            this.marker.setLatLng(latlon);
        } else {
            this.marker = L.marker(latlon, { icon: markIcon, draggable: 'true' })
                .addTo(this.map)
                .on('dragend', (e) => this._send(e.target.getLatLng()));
        }
    }

    _send(pos) {
        this.set(pos.lat.toFixed(6) + ',' + pos.lng.toFixed(6)).then(() => this._setMarker(pos));
        // this.setSuffix('[' + e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3) + ']');
    }

    static style() {
        return `
        .icon_map {
            font-size: 35px;
            color: #e70017;
          }`;
    }
}