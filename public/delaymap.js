let map;
let interval;
let markers;

function onLoad() {
  map = L.map('leafletMap').setView([50.502, 4.335], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  markers = L.layerGroup().addTo(map);

  getTrains();
  interval = setInterval(getTrains, 5000);
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
    iconSize: [40, 40],
    className: 'myDivIcon'
  })
  L.marker([train.lat, train.lon], {icon: trainMarker}).addTo(markers);
  console.log(color);
}
