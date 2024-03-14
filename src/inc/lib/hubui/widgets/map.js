/*@[if_not_target:esp]*/
const markIcon = L.divIcon({
    html: '',
    iconSize: [26, 36],
    iconAnchor: [26 / 2, 43],
    className: 'icon icon_map',
});

class MapWidget extends BaseWidget {
    $el;
    map;
    marker;

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

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: 3,
                maxZoom: 18
            }).addTo(this.map);

            this.map.on('click', (e) => {
                if (this.disabled()) return;
                this.marker.setLatLng(e.latlng, { draggable: 'true' });
                this.map.panTo(e.latlng);
                this.set(e.latlng.lat.toFixed(6) + ',' + e.latlng.lng.toFixed(6));
            });

            this.update(data);
        });
    }

    update(data) {
        super.update(data);
        let latlon = [0, 0];
        if ('lat' in data) latlon[0] = data.lat;
        if ('lon' in data) latlon[1] = data.lon;

        if (this.marker) {
            this.marker.setLatLng(latlon, { draggable: 'true' });
            this.map.panTo(latlon);
        } else {
            this.map.setView(latlon, 5);
            this.marker = L.marker(latlon, { icon: markIcon, draggable: 'true' })
                .addTo(this.map)
                .on('dragend', (e) => {
                    let pos = e.target.getLatLng();
                    e.target.setLatLng(pos, { draggable: 'true' });
                    this.map.panTo(pos);
                });
        }
    }
}

Renderer.register('map', MapWidget);
/*@/[if_not_target:esp]*/