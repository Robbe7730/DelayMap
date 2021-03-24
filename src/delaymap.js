/**
 * @file The script that runs the DelayMap frontend.
 * @author Robbe Van Herck
 */

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

// API_URL will be set at buildtime
const API_URL = '{API_URL}';
const DEFAULT_CENTER_X = 50.502;
const DEFAULT_CENTER_Y = 4.335;
const DEFAULT_ZOOM = 8;
const Leaflet = window.L;
const MT_KEY = 'RnGNHRQeMSeyIoQKPB99';

const map = Leaflet.map('leafletMap').setView(
    [
        DEFAULT_CENTER_X,
        DEFAULT_CENTER_Y
    ],
    DEFAULT_ZOOM
);

let markers = null;
let paths = null;
let statsControl = null;


/**
 * Fill in the statistics field.
 *
 * @param {APIData} trains - The train data.
 * @returns {HTMLElement} The div to display.
 */
function addStats(trains) {
    let green = 0;
    let maxDelay = 0;
    let orange = 0;
    let red = 0;
    let totalDelay = 0;

    // Process each train
    trains.forEach((train) => {
        // Find the current station of the train
        const currStation = train.stops[train.stop_index];

        // Calculate the delay
        const delay = train.is_stopped
            ? currStation.departure_delay
            : currStation.arrival_delay;

        // Categorize it
        if (delay === 0) {
            green++;
        } else if (delay <= 360) {
            orange++;
        } else {
            red++;
        }

        // Keep global stats
        totalDelay += delay;
        if (delay > maxDelay) {
            maxDelay = delay;
        }
    });

    // Calculate the average delay
    const avgDelay = totalDelay / trains.length;

    // Create the stats div
    const div = Leaflet.DomUtil.create('div', 'info legend');
    div.innerHTML =
      '<strong>Stats</strong><br>' +
      `Average delay: ${Math.round(avgDelay / 0.6) / 100} minutes <br>` +
      `Maximum delay: ${maxDelay / 60} minutes <br>` +
      `'Green' trains: ${green} <br>` +
      `'Orange' trains: ${orange} <br>` +
      `'Red' trains: ${red} <br>` +
      `Total trains: ${green + red + orange} <br>`;

    return div;
}


/**
 * Draw a line between the stops given.
 *
 * @param {Stop[]} stops - The stops to draw.
 */
function drawStops(stops) {
    paths.clearLayers();
    Leaflet.polyline(stops.map((stop) => [
        stop.lat,
        stop.lon
    ])).addTo(paths);
}

/**
 * Create a marker for one single train.
 *
 * @param {string} color - The color of the marker.
 * @param {TrainData} train - The train to display.
 * @returns {Leaflet.divIcon} The icon.
 */
function createTrainMarker(color, train) {
    const trainIcon = Leaflet.divIcon({
        'className': 'myDivIcon',
        'html': `<i class='fa fa-train' style='color: ${color}'></i>`,
        'iconSize': [
            20,
            20
        ],
        'popupAnchor': [
            -15,
            -15
        ]
    });
    return Leaflet.marker(
        [
            train.estimated_lat,
            train.estimated_lon
        ],
        {
            'icon': trainIcon,
            train
        }
    );
}

/**
 * Draw one train on the map in the right color and with the right position.
 *
 * @param {TrainData} train - The train to draw.
 */
function drawTrain(train) {
    // Get the current station
    const currStation = train.stops[train.stop_index];

    // Get the current delay
    const currDelay = train.is_stopped
        ? currStation.departure_delay
        : currStation.arrival_delay;

    // Calculate the color of the marker
    const color = currDelay === 0
        ? 'green'
        : currDelay <= 360
            ? 'orange'
            : 'red';

    // Create the marker
    const marker = createTrainMarker(color, train).addTo(markers);

    // Create the popup for the train
    marker.bindPopup(`<strong>${
        train.name
    }</strong>: +${currDelay / 60} min<br>Next stop: ${
        currStation.name
    }`);

    // Show the popup on hover
    marker.on(
        'mouseover',
        () => {
            marker.openPopup();
        }
    );
    marker.on(
        'mouseout',
        () => {
            marker.closePopup();
        }
    );

    // Show the route on click
    marker.on(
        'click',
        () => {
            drawStops(train.target.options.train.stops);
        }
    );
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
 * Remove the old statsControl field and add a new one.
 *
 * @param {APIData} data - The data to draw.
 */
function drawStats(data) {
    statsControl.remove();
    statsControl = Leaflet.control({'position': 'bottomleft'});
    statsControl.onAdd = () => addStats(data);
    statsControl.addTo(map);
}

/**
 * Add the error data to the error bar.
 *
 * @param {Error} error - The error to show.
 * @returns {HTMLElement} The div to display.
 */
function addError(error) {
    const div = Leaflet.DomUtil.create(
        'div',
        'info error'
    );
    div.innerHTML = '<b> Could not load data, if this issue persistsplease ' +
                    '<a href="https://github.com/Robbe7730/DelayMap/issues">' +
                    'file an issue on GitHub</a></b><br>' +
                    `Error message: ${error.message}`;
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
 * Handle a fetch error.
 *
 * @param {Error} error - The error that occured.
 */
function handleError(error) {
    console.error(error);

    statsControl.remove();
    statsControl = Leaflet.control({'position': 'bottomleft'});
    statsControl.onAdd = () => addError(
        map,
        error
    );
    statsControl.addTo(map);
}

/**
 * Add the legend to the map.
 *
 * @returns {HTMLElement} The div that was created.
 */
function addLegend() {
    const div = Leaflet.DomUtil.create(
        'div',
        'info legend'
    );
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
    fetch(API_URL).
        then((res) => res.json()).
        then(drawData).
        catch(handleError);
}

/**
 * Add the MapTiler and OpenRailwayMap layers to the map.
 */
function addLayers() {
    // Add background layer
    Leaflet.tileLayer(
        `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${MT_KEY}`,
        {
            'attribution':
                '<a href="https://www.maptiler.com/copyright/"' +
                'target="_blank">&copy; MapTiler</a> <a ' +
                'href="https://www.openstreetmap.org/copyright"' +
                'target="_blank">&copy; OpenStreetMap contributors</a>'
        }
    ).addTo(map);

    // Add OpenRailwayMap layer
    const openrailwaymap = new Leaflet.TileLayer(
        'http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        {
            'attribution':
                '<a href="https://www.openstreetmap.org/copyright">&copy;' +
                'OpenStreetMap contributors</a>, Style: <a ' +
                'href="http://creativecommons.org/licenses/by-sa/2.0/">' +
                'CC-BY-SA 2.0</a> <a ' +
                'href="http://www.openrailwaymap.org/">OpenRailwayMap</a>',
            'maxZoom': 19,
            'minZoom': 2,
            'tileSize': 256
        }
    );

    // Add the layer control box
    Leaflet.control.
        layers(
            {},
            {
                'OpenRailwayMap': openrailwaymap,
                'Routes': paths
            },
            {
                'collapsed': false,
                'position': 'topleft'
            }
        ).
        addTo(map);
}

/**
 * Setup the page.
 */
function onLoad() { // eslint-disable-line no-unused-vars
    addLayers();

    // Add empty layers for the routes and markers
    paths = Leaflet.layerGroup().addTo(map);
    markers = Leaflet.layerGroup().addTo(map);

    // Add the legend
    const legend = Leaflet.control({'position': 'topright'});
    legend.onAdd = addLegend;
    legend.addTo(map);

    // Add an (empty) box for the stats
    statsControl = Leaflet.control({'position': 'bottomleft'});

    // Clear the routes when just the map is clicked
    map.on(
        'click',
        () => drawStops([])
    );

    // Load (and draw) the trains every 5 seconds
    getTrains();
    setInterval(
        getTrains,
        5000
    );
}


