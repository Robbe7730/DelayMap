/**
 * @file The script that runs the DelayMap frontend.
 * @author Robbe Van Herck
 */

/**
 * @typedef StopTime
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
 * @property {string} stop_id - The unique id of this stop.
 */

/**
 * @typedef TrainData
 * @type {object}
 * @property {string} id - The id of this train.
 * @property {string} name - The name of the train.
 * @property {StopTime[]} stops - The stops of the train.
 * @property {number} stop_index - The index of the current stops in stops.
 * @property {boolean} is_stopped - True if the train is currently in a station.
 * @property {number} estimated_lat - The estimated latitude of the train.
 * @property {number} estimated_lon - The estimated longitude of the train.
 */

/**
 * @typedef Stop
 * @type {object}
 * @property {string} name - The name of this stop.
 * @property {number} lat - The latitude of the stop.
 * @property {number} lon - The longitude of the stop.
 * @property {string} stop_id - The unique id of this stop.
 */

/**
 * @typedef WorksData
 * @type {object}
 * @property {string} id - The id of this stop.
 * @property {string} name - The readable name of this stop.
 * @property {string} message - The reason for the works, as a HTML string.
 * @property {string} start_date - The date the works started (DD.MM.YY).
 * @property {string} end_date - The date the works will end (DD.MM.YY).
 * @property {string} start_time - The time the works started (HH:MM).
 * @property {string} end_time - The time the works will end (HH:MM).
 * @property {Stop} impacted_station - The station impacted by the works.
 */

/**
 * @typedef APITrainData
 * @type {TrainData[]}
 */

/**
 * @typedef APIWorksData
 * @type {WorksData[]}
 */

// API_URL will be set at buildtime
const API_URL = '{{API_URL}}';
const DEFAULT_CENTER_X = 50.502;
const DEFAULT_CENTER_Y = 4.335;
const DEFAULT_ZOOM = 8;
const Leaflet = window.L;
const MT_KEY = 'RnGNHRQeMSeyIoQKPB99';

let map = null;
let trainMarkerLayer = null;
let worksMarkerLayer = null;
let paths = null;
let statsControl = null;
let selected = null;
let currentPopup = null;


/**
 * Fill in the statistics field.
 *
 * @param {APITrainData} trains - The train data.
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
 * @param {StopTime[]} stops - The stops to draw.
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
        'iconAnchor': [
            5,
            10
        ],
        'iconSize': [
            20,
            20
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
 * Get the color corresponding to the delay.
 *
 * @param {number} delay - The delay in seconds.
 * @returns {string} The color as a string.
 */
function getColor(delay) {
    return delay === 0
        ? 'green'
        : delay <= 360
            ? 'orange'
            : 'red';
}

/**
 * Calculate the delay of a train (either arrival or departure delay).
 *
 * @param {TrainData} train - The train to calculate the delay for.
 * @returns {number} The delay that should be used.
 */
function getDelay(train) {
    const currStation = train.stops[train.stop_index];

    return train.is_stopped
        ? currStation.departure_delay
        : currStation.arrival_delay;
}

/**
 * Remove the current popup.
 */
function removePopup() {
    if (currentPopup) {
        currentPopup.remove();
    }

    selected = null;
}

/**
 * Create the popup for a train.
 *
 * @param {TrainData} train - The train to draw the popup for.
 */
function createTrainPopup(train) {
    removePopup();

    selected = train.id;

    const currStation = train.stops[train.stop_index];

    currentPopup = Leaflet.popup({
        'offset': new Leaflet.Point(0, -3)
    })
        .setLatLng([
            train.estimated_lat,
            train.estimated_lon
        ])
        .setContent(`<strong>${train.name}</strong>: ` +
      `+${getDelay(train) / 60} min<br>Next stop: ${currStation.name}`)
        .openOn(map);
    currentPopup.on('remove', removePopup);
}

/**
 * Draw one train on the map in the right color and with the right position.
 *
 * @param {TrainData} train - The train to draw.
 */
function drawTrain(train) {
    // Calculate the color of the marker
    const color = getColor(getDelay(train));

    // Create the marker
    const marker = createTrainMarker(color, train).addTo(trainMarkerLayer);

    // Show the popup on hover
    marker.on(
        'mouseover',
        () => {
            createTrainPopup(train);
        }
    );
    marker.on(
        'mouseout',
        () => {
            removePopup();
        }
    );

    // Show the route on click
    marker.on(
        'click',
        () => {
            drawStops(train.stops);
            createTrainPopup(train);
        }
    );

    // Show the popup already if it was selected before it was redrawn
    if (selected === train.id) {
        createTrainPopup(train);
    }
}

/**
 * Create a marker for one works.
 *
 * @param {WorksData} works - The works to display.
 * @returns {Leaflet.divIcon} The icon.
 */
function createWorksMarker(works) {
    const trainIcon = Leaflet.divIcon({
        'className': 'myDivIcon',
        'html': '<i class="fa fa-exclamation-triangle" style="color: red"></i>',
        'iconAnchor': [
            5,
            10
        ],
        'iconSize': [
            20,
            20
        ]
    });
    return Leaflet.marker(
        [
            works.impacted_station.lat,
            works.impacted_station.lon
        ],
        {
            'icon': trainIcon,
            works
        }
    );
}

/**
 * Draw the trains on the map.
 *
 * @param {APITrainData} trains - The data to draw.
 */
function drawTrains(trains) {
    trainMarkerLayer.clearLayers();

    trains.forEach(drawTrain);
}

/**
 * Create the popup for works.
 *
 * @param {WorksData} works - The works to draw the popup for.
 */
function createWorksPopup(works) {
    removePopup();

    selected = works.id;

    currentPopup = Leaflet.popup({
        'offset': new Leaflet.Point(0, -3)
    })
        .setLatLng([
            works.impacted_station.lat,
            works.impacted_station.lon
        ])
        .setContent(`<strong>${works.name}</strong><br />` +
                    `Ending ${works.end_date} ${works.end_time}<br />` +
                    `${works.message}`)
        .openOn(map);
    currentPopup.on('remove', removePopup);
}

/**
 * Draw one works on the map with the right position.
 *
 * @param {WorksData} works - The works to draw.
 */
function drawWorks(works) {
    // Create the marker
    const marker = createWorksMarker(works).addTo(worksMarkerLayer);

    // Show the popup on hover
    marker.on(
        'mouseover',
        () => {
            createWorksPopup(works);
        }
    );
    marker.on(
        'mouseout',
        () => {
            removePopup();
        }
    );

    // Show the popup already if it was selected before it was redrawn
    if (selected === works.id) {
        createWorksPopup(works);
    }
}


/**
 * Draw the works on the map.
 *
 * @param {APIWorksData} works - The data to draw.
 */
function drawWorksData(works) {
    worksMarkerLayer.clearLayers();

    works.forEach(drawWorks);
}

/**
 * Remove the old statsControl field and add a new one.
 *
 * @param {APITrainData} data - The data to draw.
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
    div.innerHTML = '<b> Could not load data, if this issue persists please ' +
                    '<a href="https://github.com/Robbe7730/DelayMap/issues">' +
                    'file an issue on GitHub</a></b><br>' +
                    `Error message: ${error.message}`;
    div.style.backgroundColor = '#cc0000';
    return div;
}

/**
 * Draw the requested data, both the trains and the statistics.
 *
 * @param {APITrainData} data - The data to draw.
 */
function drawTrainData(data) {
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
 * Get the trains and call drawTrainData with the parsed JSON.
 */
function getTrains() {
    fetch(`${API_URL}/trains`)
        .then((res) => res.json())
        .then(drawTrainData)
        .catch(handleError);
}

/**
 * Get the works and call drawWorks with the parsed JSON.
 */
function getWorks() {
    fetch(`${API_URL}/works`)
        .then((res) => res.json())
        .then(drawWorksData)
        .catch(handleError);
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

    // Add empty layers for the routes and markers
    paths = Leaflet.layerGroup().addTo(map);
    trainMarkerLayer = Leaflet.layerGroup().addTo(map);
    worksMarkerLayer = Leaflet.layerGroup().addTo(map);

    // Add the layer control box
    Leaflet.control.layers(
        {},
        {
            'OpenRailwayMap': openrailwaymap,
            'Routes': paths
        },
        {
            'collapsed': false,
            'position': 'topleft'
        }
    ).addTo(map);
}

/**
 * Update the data shown by DelayMap.
 */
function update() {
    getTrains();
    getWorks();
}

/**
 * Setup the page.
 */
function onLoad() { // eslint-disable-line no-unused-vars
    map = Leaflet.map('leafletMap').setView(
        [
            DEFAULT_CENTER_X,
            DEFAULT_CENTER_Y
        ],
        DEFAULT_ZOOM
    );

    addLayers();

    // Add the legend
    const legend = Leaflet.control({'position': 'topright'});
    legend.onAdd = addLegend;
    legend.addTo(map);

    // Add an (empty) box for the stats
    statsControl = Leaflet.control({'position': 'bottomleft'});

    // Clear the routes when just the map is clicked
    map.on(
        'click',
        () => {
            drawStops([]);
            selected = null;
        }
    );

    // Update every 5 seconds
    update();
    setInterval(
        update,
        5000
    );
}


