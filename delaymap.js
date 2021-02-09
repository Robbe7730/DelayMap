let map;
let interval;
let markers;
let stats_control;

const API_URL = "http://localhost:8000/trains";

function onLoad() {
  map = L.map('leafletMap').setView([50.502, 4.335], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  markers = L.layerGroup().addTo(map);

  const legend = L.control({position: 'topright'});
  legend.onAdd = addLegend;
  legend.addTo(map);
  stats_control = L.control({position: 'bottomleft'});
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
  return fetch(API_URL).then((res) => res.json())
                       .then(drawData);
}

function drawData(data) {
  drawTrains(data);
  drawStats(data);
}

function drawStats(trains) {
  stats_control.remove()
  stats_control = L.control({position: 'bottomleft'});
  stats_control.onAdd = (map) => addStats(map,trains);
  stats_control.addTo(map);
}

function addStats(map, trains) {
  let green = 0;
  let orange = 0;
  let red = 0;
  let total_delay = 0
  let max_delay = 0;
  trains.forEach((train) => {
    const curr_station = train.stops[train.stop_index];
    const delay = train.is_stopped ? curr_station.departure_delay : curr_station.arrival_delay;
    total_delay += delay;
    if (delay == 0) {
      green++;
    } else if (delay <= 360) {
      orange++;
    } else { 
      red++;
    }
    if (delay > max_delay) {
      max_delay = delay;
    }
  });
  const avg_delay = total_delay / trains.length;
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = "<strong>Stats</strong><br>" +
                  `Average delay: ${Math.round(avg_delay / 0.60) / 100} minutes <br>` + 
                  `Maximum delay: ${max_delay / 60} minutes <br>` +
                  `"Green" trains: ${green} <br>` +
                  `"Orange" trains: ${orange} <br>` +
                  `"Red" trains: ${red} <br>` +
                  `Total trains: ${green+red+orange} <br>`;

  return div;
}

function drawTrains(trains) {
  markers.clearLayers();

  trains.forEach(drawTrain);
}

function drawTrain(train) {
  const curr_station = train.stops[train.stop_index];
  const curr_delay = train.is_stopped ? curr_station.departure_delay : curr_station.arrival_delay;
  const color = curr_delay == 0 ? "green" : (curr_delay <= 360 ? "orange" : "red")
  const trainMarker = L.divIcon({
    html: `<i class="fa fa-train" style="color: ${color}"></i>`,
    iconSize: [20, 20],
    className: 'myDivIcon',
    popupAnchor: [-15,-15]
  })
  const marker = L.marker([train.estimated_lat, train.estimated_lon], {icon: trainMarker}).addTo(markers);
  marker.bindPopup(`<strong>${train.name}</strong>: +${curr_delay/60} min<br>Next stop: ${curr_station.name}`);
  marker.on('mouseover', (e) => {
    marker.openPopup();
  });
  marker.on('mouseout', (e) => {
    marker.closePopup();
  });
}
