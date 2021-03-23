/**
 * @file The script that runs the DelayMap frontend.
 * @author Robbe Van Herck
 */

let map;
let markers;
let statsControl;
let paths;

const L = window.L;

// This value will be set at buildtime
const API_URL = '{API_URL}';

/**
 * @typedef Stop
 * @type {object}
 * @property {string} name - The name of the stop.
 * @property {number} lat - The latitude of the stop.
 * @property {number} lon - The longitude of the stop.
 * @property {number} arrival_delay - With how much delay the train will arrive
 * at the next station.
 * @property {number} departure_delay - With how much delay the train will
 * depart at the next station.
 * @property {number} arrival_timestamp - The timestamp in minutes after
 * midnight when the train will arrive at the next station.
 * @property {number} departure_timestamp - The timestamp in minutes after
 * midnight when the train will depart at the next station.
 */

/**
 * @typedef TrainData
 * @type {object}
 * @property {string} name - The name of the train.
 * @property {Stop[]} stops - The stops of the train.
 * @property {number} stop_index - The index of the current stops in stops.
 * @property {boolean} is_stopped - True if the train is currently in a station.
 * @property {number} estimated_lat - The estimated latitude of the train.
 * @property {number} estimated_lon - The estimated longitude of the train.
 */

/**
 * @typedef APIData
 * @type {TrainData[]}
 */

/**
 * Setup the page.
 */
function onLoad() { // eslint-disable-line no-unused-vars
    map = L.map('leafletMap').setView([50.502, 4.335], 8);

    // Add background layer
    L.tileLayer(
        'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=RnGNHRQeMSeyIoQKPB99',
        {
            attribution:
                '<a href="https://www.maptiler.com/copyright/"' +
                'target="_blank">&copy; MapTiler</a> <a ' +
                'href="https://www.openstreetmap.org/copyright"' +
                'target="_blank">&copy; OpenStreetMap contributors</a>',
        }
    ).addTo(map);

    // Add OpenRailwayMap layer
    const openrailwaymap = new L.TileLayer(
        'http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        {
            attribution:
                '<a href="https://www.openstreetmap.org/copyright">&copy;' +
                'OpenStreetMap contributors</a>, Style: <a ' +
                'href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA' +
                '2.0</a> <a ' +
                'href="http://www.openrailwaymap.org/">OpenRailwayMap</a>',
            minZoom: 2,
            maxZoom: 19,
            tileSize: 256,
        }
    );

    // Add empty layers for the routes and markers
    paths = L.layerGroup().addTo(map);
    markers = L.layerGroup().addTo(map);

    // Add the legend
    const legend = L.control({ position: 'topright' });
    legend.onAdd = addLegend;
    legend.addTo(map);

    // Add an (empty) box for the stats
    statsControl = L.control({ position: 'bottomleft' });

    // Add the layer control box
    L.control
        .layers(
            {},
            {
                OpenRailwayMap: openrailwaymap,
                Routes: paths,
            },
            {
                collapsed: false,
                position: 'topleft',
            }
        )
        .addTo(map);

    // Load (and draw) the trains every 5 seconds
    getTrains();
    setInterval(getTrains, 5000);
}

/**
 * Add the legend to the map.
 *
 * @returns {HTMLElement} The div that was created.
 */
function addLegend() {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML =
        '<strong>Legend</strong><br>' +
        'Green: No delay <br>' +
        'Orange: 6 minutes or less <br>' +
        'Red: More than 6 minutes <br>';

    return div;
}

/**
 * Get the trains and call drawData with the parsed JSON.
 */
function getTrains() {
    fetch(API_URL)
        .then((res) => res.json())
        .then(drawData)
        .catch(handleError);
}

/**
 * Handle a fetch error.
 *
 * @param {Error} error - The error that occured.
 */
function handleError(error) {
    console.error(error);
    
    statsControl.remove();
    statsControl = L.control({ position: 'bottomleft' });
    statsControl.onAdd = (map) => addError(map, error);
    statsControl.addTo(map);
}

/**
 * Add the error data to the error bar.
 *
 * @param {L.Map} map - The Leaflet map.
 * @param {Error} error - The error to show.
 * @returns {HTMLElement} The div to display.
 */
function addError(map, error) {
    const div = L.DomUtil.create('div', 'info error');
    div.innerHTML = '<b> Could not load data, if this issue persists please ' + 
                    '<a href="https://github.com/Robbe7730/DelayMap/issues/new">' +
                    'file an issue on GitHub</a></b><br>'+ 
                    'Error message: ' + error.message;
    div.style.backgroundColor = '#cc0000';
    return div;
}

/**
 * Draw the requested data, both the trains and the statistics.
 *
 * @param {APIData} data - The data to draw.
 */
function drawData(data) {
    drawTrains(data);
    drawStats(data);
}

/**
 * Remove the old statsControl field and add a new one.
 *
 * @param {APIData} data - The data to draw.
 */
function drawStats(data) {
    statsControl.remove();
    statsControl = L.control({ position: 'bottomleft' });
    statsControl.onAdd = (map) => addStats(map, data);
    statsControl.addTo(map);
}

/**
 * Fill in the statistics field.
 *
 * @param {L.Map} map - The map to draw on.
 * @param {APIData} trains - The train data.
 * @returns {HTMLElement} The div to display.
 */
function addStats(map, trains) {
    let green = 0;
    let orange = 0;
    let red = 0;
    let total_delay = 0;
    let max_delay = 0;

    // Process each train
    trains.forEach((train) => {
        // Find the current station of the train
        const curr_station = train.stops[train.stop_index];

        // Calculate the delay, the departure delay if the train is stopped or
        // the arrival delay if it is en route
        const delay = train.is_stopped
            ? curr_station.departure_delay
            : curr_station.arrival_delay;

        // Categorize it
        if (delay == 0) {
            green++;
        } else if (delay <= 360) {
            orange++;
        } else {
            red++;
        }

        // Keep global stats
        total_delay += delay;
        if (delay > max_delay) {
            max_delay = delay;
        }
    });

    // Calculate the average delay
    const avg_delay = total_delay / trains.length;

    // Create the stats div
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML =
      '<strong>Stats</strong><br>' +
      `Average delay: ${Math.round(avg_delay / 0.6) / 100} minutes <br>` +
      `Maximum delay: ${max_delay / 60} minutes <br>` +
      `'Green' trains: ${green} <br>` +
      `'Orange' trains: ${orange} <br>` +
      `'Red' trains: ${red} <br>` +
      `Total trains: ${green + red + orange} <br>`;

    return div;
}

/**
 * Draw the trains on the map.
 *
 * @param {APIData} trains - The data to draw.
 */
function drawTrains(trains) {
    markers.clearLayers();

    trains.forEach(drawTrain);
}

/**
 * Draw a line between the stops given.
 *
 * @param {Stop[]} stops - The stops to draw.
 */
function drawStops(stops) {
    paths.clearLayers();
    L.polyline(stops.map((x) => [x.lat, x.lon])).addTo(paths);
}

/**
 * Draw one train on the map in the right color and with the right position.
 *
 * @param {TrainData} train - The train to draw.
 */
function drawTrain(train) {
    // Get the current station
    const curr_station = train.stops[train.stop_index];

    // Get the current delay
    const curr_delay = train.is_stopped
        ? curr_station.departure_delay
        : curr_station.arrival_delay;

    // Calculate the color of the marker
    const color =
      curr_delay == 0 ? 'green' : curr_delay <= 360 ? 'orange' : 'red';

    // Create the marker
    const trainMarker = L.divIcon({
        html: `<i class='fa fa-train' style='color: ${color}'></i>`,
        iconSize: [20, 20],
        className: 'myDivIcon',
        popupAnchor: [-15, -15],
    });
    const marker = L.marker([train.estimated_lat, train.estimated_lon], {
        icon: trainMarker,
        train: train,
    }).addTo(markers);

    // Create the popup for the train
    marker.bindPopup(
        `<strong>${train.name}</strong>: +${curr_delay / 60} min<br>Next stop: ${
            curr_station.name
        }`
    );

    // Show the popup on hover
    marker.on('mouseover', () => {
        marker.openPopup();
    });
    marker.on('mouseout', () => {
        marker.closePopup();
    });

    // Show the route on click
    marker.on('click', (e) => {
        drawStops(e.target.options.train.stops);
    });
}
