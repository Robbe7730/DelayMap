let map;
let interval;
let markers;
let stats_control;
let paths;

const API_URL = "http://localhost:8000/trains";

/**
 * Setup the page
 */
function onLoad() {
  map = L.map('leafletMap').setView([50.502, 4.335], 8);

  // Add background layer
  L.tileLayer('https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=RnGNHRQeMSeyIoQKPB99', {
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  }).addTo(map);

  // Add OpenRailwayMap layer
  const openrailwaymap = new L.TileLayer('http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
  {
    attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a>',
    minZoom: 2,
    maxZoom: 19,
    tileSize: 256
  });

  // Add empty layers for the routes and markers
  paths = L.layerGroup().addTo(map);
  markers = L.layerGroup().addTo(map);

  // Add the legend
  const legend = L.control({position: 'topright'});
  legend.onAdd = addLegend;
  legend.addTo(map);

  // Add an (empty) box for the stats
  stats_control = L.control({position: 'bottomleft'});

  // Add the layer control box
  L.control.layers({}, {
    "OpenRailwayMap": openrailwaymap,
    "Routes": paths,
  }, {
    "collapsed": false,
    "position": 'topleft',
  }).addTo(map);

  // Load (and draw) the trains every 5 seconds
  getTrains();
  interval = setInterval(getTrains, 5000);
}

/**
 * Add the legend to the map
 *
 * @param {L.map} map The map to add the legend to
 */
function addLegend(map) {
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = "<strong>Legend</strong><br>" +
                  'Green: No delay <br>' +
                  'Orange: 6 minutes or less <br>' +
                  'Red: More than 6 minutes <br>';

  return div;
}

/**
 * Get the trains and call drawData with the parsed JSON
 */
function getTrains() {
  return fetch(API_URL).then((res) => res.json())
                       .then(drawData);
}

/**
 * Draw the requested data, both the trains and the statistics
 *
 * @param {[TrainData]} data The data to draw
 */
function drawData(data) {
  drawTrains(data);
  drawStats(data);
}

/**
 * Remove the old stats_control field and add a new one
 *
 * @param {[TrainData]} trains The data to draw
 */
function drawStats(trains) {
  stats_control.remove()
  stats_control = L.control({position: 'bottomleft'});
  stats_control.onAdd = (map) => addStats(map,trains);
  stats_control.addTo(map);
}

/**
 * Fill in the statistics field
 *
 * @param {L.map} map The map to draw on
 * @param {[TrainData]} trains The train data
 */
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

/**
 * Draw the trains on the map
 *
 * @param {[TrainData]} trains The data to draw
 */
function drawTrains(trains) {
  markers.clearLayers();

  trains.forEach(drawTrain);
}


/**
 * Draw a line between the stops given
 *
 * @param {[Stop]} stops The stops to draw
 */
function drawStops(stops) {
  paths.clearLayers();
  L.polyline(
    stops.map((x) => [x.lat, x.lon])
  ).addTo(paths);
}

/**
 * Draw one train on the map in the right color and with the right position
 *
 * @param {TrainData} train The train to draw
 */
function drawTrain(train) {
  // Get the current station
  const curr_station = train.stops[train.stop_index];

  // Get the current delay
  const curr_delay = train.is_stopped ? curr_station.departure_delay : curr_station.arrival_delay;

  // Calculate the color of the marker
  const color = curr_delay == 0 ? "green" : (curr_delay <= 360 ? "orange" : "red")

  // Create the marker
  const trainMarker = L.divIcon({
    html: `<i class="fa fa-train" style="color: ${color}"></i>`,
    iconSize: [20, 20],
    className: 'myDivIcon',
    popupAnchor: [-15,-15]
  })
  const marker = L.marker([train.estimated_lat, train.estimated_lon], {icon: trainMarker, train: train}).addTo(markers);

  // Create the popup for the train
  marker.bindPopup(`<strong>${train.name}</strong>: +${curr_delay/60} min<br>Next stop: ${curr_station.name}`);

  // Show the popup on hover
  marker.on('mouseover', (e) => {
    marker.openPopup();
  });
  marker.on('mouseout', (e) => {
    marker.closePopup();
  });
  
  // Show the route on click
  marker.on('click', (e) => {
    drawStops(e.target.options.train.stops);
  });
}
