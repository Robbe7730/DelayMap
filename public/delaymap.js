let map;
let interval;
let markers;

function onLoad() {
  map = L.map('leafletMap').setView([50.502, 4.335], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  markers = L.layerGroup().addTo(map);

  const legend = L.control({position: 'topright'});
  legend.onAdd = addLegend;
  legend.addTo(map);
  getTrains();
  interval = setInterval(getTrains, 5000);
}

function addLegend(map) {
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = "<strong>Legend</strong><br>" +
                  'Green: No delay <br>' + 
                  'Orange: 6 minutes or less <br>' +
                  'Red: More than 6 minutes <br>';

  return div;
}

function getTrains() {
  return fetch("/trains.json").then((res) => res.json())
                              .then(drawTrains);
}

function drawTrains(trains) {
  markers.clearLayers();

  trains.forEach(drawTrain);
}

function drawTrain(train) {
  const color = train.delay == 0 ? "green" : (train.delay < 360 ? "orange" : "red")
  const trainMarker = L.divIcon({
    html: `<i class="fa fa-train" style="color: ${color}"></i>`,
    iconSize: [20, 20],
    className: 'myDivIcon',
    popupAnchor: [-15,-15]
  })
  const marker = L.marker([train.lat, train.lon], {icon: trainMarker}).addTo(markers);
  marker.bindPopup(`<strong>${train.name}</strong>: +${train.delay/60} min<br>Next stop: ${train.nextStopName}`);
  marker.on('mouseover', (e) => {
    marker.openPopup();
  });
  marker.on('mouseout', (e) => {
    marker.closePopup();
  });
}
