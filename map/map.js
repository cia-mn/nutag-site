// The city poster as a slippy map: general/carto_poster.py --tiles cut it into 512-px tiles on the
// world grid (z9–z15, borders baked in), so Leaflet addresses them like any tile server and the
// district names ride on top as markers. The tiles' z15 is Leaflet's 16 (tileSize 512, zoomOffset -1).
const el = document.getElementById('map');
const bounds = L.latLngBounds([47.82, 106.62], [48.04, 107.16]); // the frame carto_poster.py was given
const map = L.map(el, { minZoom: 10, maxZoom: 18, maxBounds: bounds.pad(0.15), maxBoundsViscosity: 0.7, zoomSnap: 0.5 });
L.tileLayer(el.dataset.tiles + '/{z}/{x}/{y}.jpg', {
  tileSize: 512, zoomOffset: -1, minZoom: 10, maxNativeZoom: 16, maxZoom: 18, bounds,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);
map.fitBounds(bounds);
fetch(el.dataset.districts).then((r) => r.json()).then((districts) => {
  for (const d of districts) {
    L.marker([d.lat, d.lng], { icon: L.divIcon({ className: 'district', html: d.name }), interactive: false, keyboard: false }).addTo(map);
  }
});
