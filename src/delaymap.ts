/**
 * @file The script that runs the DelayMap frontend.
 * @author Robbe Van Herck
 */

import * as config from './config.json';
import {
    Control,
    DivIcon,
    DomUtil,
    LatLngExpression,
    LayerGroup,
    Map,
    Marker,
    MarkerOptions,
    Point,
    Polyline,
    Popup,
    TileLayer,
    markerClusterGroup
} from 'leaflet';
// eslint-disable-next-line sort-imports
import 'leaflet.markercluster';

declare global {
    interface Window {
        onLoad: () => void;
    }
}

interface StopTime {
    name: string,
    arrivalDelay: number,
    departureDelay: number,
    arrivalTimestamp: number,
    departureTimestamp: number,
    lat?: number,
    lon?: number,
}

interface FullStopTime extends StopTime {
    lat: number,
    lon: number
}

interface TrainData {
    id: string,
    name: string,
    stops: StopTime[],
    stopIndex: number,
    isStopped: boolean,
    estimatedLat: number,
    estimatedLon: number,
}

interface Stop {
    name: string,
    stopId: string,
    lat?: number,
    lon?: number,
}

interface WorksURL {
    url: string,
    label: string,
}

interface WorksData {
    id: string,
    name: string,
    message: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    urls: WorksURL[],
    impactedStation?: Stop,
}

class TrainMarker extends Marker {
    data: TrainData;

    constructor(
        data: TrainData,
        latlng: LatLngExpression,
        options?: MarkerOptions | undefined
    ) {
        super(latlng, options);

        this.data = data;
    }
}

type APITrainData = TrainData[];
type APIWorksData = WorksData[];

const DEFAULT_CENTER_X = 50.502;
const DEFAULT_CENTER_Y = 4.335;
const DEFAULT_ZOOM = 8;

let map: Map;
let trainMarkerLayer: LayerGroup;
let worksMarkerLayer: LayerGroup;
let paths: LayerGroup;
let statsControl: Control;
let selected: string;
let currentPopup: Popup;
let selectedClicked = false;

function formatDelay(delay: number): string {
    const delayMinutes = Math.floor(delay / 60);
    const delaySeconds = Math.round(delay % 60);

    let delayFormatted = `${delayMinutes}:`;
    if (delaySeconds < 10) {
        delayFormatted += `0${delaySeconds}`;
    } else {
        delayFormatted += `${delaySeconds}`;
    }

    return delayFormatted;
}

function addStats(trains: APITrainData): HTMLElement {
    let green = 0;
    let maxDelay = 0;
    let orange = 0;
    let red = 0;
    let totalDelay = 0;

    // Process each train
    trains.forEach((train) => {
        // Find the current station of the train
        const currStation = train.stops[train.stopIndex];

        // Calculate the delay
        const delay = (train.isStopped
            ? currStation?.departureDelay
            : currStation?.arrivalDelay) || 0;

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
    const div = DomUtil.create('div', 'info legend');
    div.innerHTML =
      '<strong>Stats</strong><br>' +
      `Average delay: ${formatDelay(avgDelay)}<br>` +
      `Maximum delay: ${formatDelay(maxDelay)}<br>` +
      `'Green' trains: ${green} <br>` +
      `'Orange' trains: ${orange} <br>` +
      `'Red' trains: ${red} <br>` +
      `Total trains: ${green + red + orange} <br>`;

    return div;
}

function drawStops(stops: StopTime[]) {
    paths.clearLayers();
    new Polyline(stops
        .filter((stop: StopTime):stop is FullStopTime =>
            typeof stop.lat !== 'undefined' && typeof stop.lon !== 'undefined')
        .map((stop: FullStopTime) => [
            stop.lat,
            stop.lon
        ]))
        .addTo(paths);
}

function createTrainMarker(color: string, train: TrainData): Marker {
    const trainIcon = new DivIcon({
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
    return new TrainMarker(
        train,
        [
            train.estimatedLat,
            train.estimatedLon
        ],
        {
            'icon': trainIcon
        }
    );
}

function getColor(delay: number): string {
    return delay === 0
        ? 'green'
        : delay <= 360
            ? 'orange'
            : 'red';
}

function getDelay(train: TrainData): number {
    const currStation = train.stops[train.stopIndex];

    return currStation
        ? train.isStopped
            ? currStation.departureDelay
            : currStation.arrivalDelay
        : 0;
}

function removePopup(force: boolean) {
    if (currentPopup && (!selectedClicked || force)) {
        currentPopup.remove();
    }

    selected = '';
}

function createTrainPopup(train: TrainData, isClicked: boolean) {
    removePopup(true);

    selected = train.id;
    selectedClicked = isClicked;

    const currStation = train.stops[train.stopIndex];
    const name = currStation?.name;

    currentPopup = new Popup({
        'offset': new Point(0, -3)
    })
        .setLatLng([
            train.estimatedLat,
            train.estimatedLon
        ])
        .setContent(`<strong>${train.name}</strong>: ` +
                `+${formatDelay(getDelay(train))} min<br>Next stop: ${name}`)
        .openOn(map);
    currentPopup.on('remove', () => removePopup(true));
}

function drawTrain(train: TrainData) {
    // Calculate the color of the marker
    const color = getColor(getDelay(train));

    // Create the marker
    const marker = createTrainMarker(color, train).addTo(trainMarkerLayer);

    // Show the popup on hover
    marker.on(
        'mouseover',
        () => {
            createTrainPopup(train, false);
        }
    );
    marker.on(
        'mouseout',
        () => {
            removePopup(false);
        }
    );

    // Show the route on click
    marker.on(
        'click',
        () => {
            drawStops(train.stops);
            createTrainPopup(train, true);
        }
    );

    // Show the popup already if it was selected before it was redrawn
    if (selected === train.id) {
        createTrainPopup(train, selectedClicked);
    }
}

function createWorksMarker(works: WorksData): Marker {
    const trainIcon = new DivIcon({
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
    return new Marker(
        [
            works.impactedStation?.lat || 0,
            works.impactedStation?.lon || 0
        ],
        {
            'icon': trainIcon
        }
    );
}

function drawTrains(trains: APITrainData) {
    trainMarkerLayer.clearLayers();

    trains.forEach(drawTrain);
}

function makeLink(url: string, text: string) {
    return `<a href="${url}">${text}</a>`;
}

function createWorksPopup(works: WorksData, isClicked: boolean) {
    removePopup(true);

    selected = works.id;
    selectedClicked = isClicked;

    const urls = works.urls.map((url) => makeLink(url.url, url.label));

    let urlText = '';
    if (urls.length !== 0) {
        urlText = `Info: ${urls.join(', ')}`;
    }

    currentPopup = new Popup({
        'offset': new Point(0, -3)
    })
        .setLatLng([
            works.impactedStation?.lat || 0,
            works.impactedStation?.lon || 0
        ])
        .setContent(`<strong>${works.name}</strong><br />` +
                    `Ending ${works.endDate} ${works.endTime}<br />` +
                    `${works.message}<br />` +
                    `${urlText}`)
        .openOn(map);
    currentPopup.on('remove', () => removePopup(true));
}

function drawWorks(works: WorksData) {
    // Create the marker
    const marker = createWorksMarker(works).addTo(worksMarkerLayer);

    // Show the popup on hover
    marker.on(
        'mouseover',
        () => {
            createWorksPopup(works, false);
        }
    );
    marker.on(
        'mouseout',
        () => {
            removePopup(false);
        }
    );

    // Show the works on click
    marker.on(
        'click',
        () => {
            createWorksPopup(works, true);
        }
    );

    // Show the popup already if it was selected before it was redrawn
    if (selected === works.id) {
        createWorksPopup(works, selectedClicked);
    }
}


function drawWorksData(works: APIWorksData) {
    worksMarkerLayer.clearLayers();

    works.forEach(drawWorks);
}

function drawStats(data: APITrainData) {
    statsControl.remove();
    statsControl = new Control({'position': 'bottomleft'});
    statsControl.onAdd = () => addStats(data);
    statsControl.addTo(map);
}

function addError(error: Error): HTMLElement {
    const div = DomUtil.create(
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

function drawTrainData(data: APITrainData) {
    drawTrains(data);
    drawStats(data);
}

function handleError(error: Error) {
    // eslint-disable-next-line no-console
    console.error(error);

    statsControl.remove();
    statsControl = new Control({'position': 'bottomleft'});
    statsControl.onAdd = () => addError(error);
    statsControl.addTo(map);
}

function addLegend(): HTMLElement {
    const div = DomUtil.create(
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

function getTrains() {
    fetch(`${config.API_URL}/trains`)
        .then((res) => res.json())
        .then(drawTrainData)
        .catch(handleError);
}

function getWorks() {
    fetch(`${config.API_URL}/works`)
        .then((res) => res.json())
        .then(drawWorksData)
        .catch(handleError);
}

function addLayers() {
    // Add background layer
    new TileLayer(
        `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${
            config.MT_KEY
        }`,
        {
            'attribution':
                '<a href="https://www.maptiler.com/copyright/"' +
                'target="_blank">&copy; MapTiler</a> <a ' +
                'href="https://www.openstreetmap.org/copyright"' +
                'target="_blank">&copy; OpenStreetMap contributors</a>'
        }
    ).addTo(map);

    // Add OpenRailwayMap layer
    const openrailwaymap = new TileLayer(
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

    // Create the layers
    paths = new LayerGroup();
    trainMarkerLayer = markerClusterGroup({
        'maxClusterRadius': 50,
        'iconCreateFunction': (cluster) => {
            const totalDelay = cluster.getAllChildMarkers()
                .filter((marker: Marker): marker is TrainMarker => {
                    const trainMarker = marker as TrainMarker;
                    return typeof trainMarker.data !== 'undefined';
                })
                .map((marker) => getDelay(marker.data))
                .reduce((acc, val) => acc + val, 0);
            const childCount = cluster.getChildCount();
            const avgDelay = totalDelay / childCount;


            let className = 'marker-cluster-';
            if (avgDelay < 60) {
                className += 'small';
            } else if (avgDelay < 360) {
                className += 'medium';
            } else {
                className += 'large';
            }

            return new DivIcon({
                'className': `marker-cluster ${className}`,
                'html': `<div><span>${childCount}</span></div>`,
                'iconSize': new Point(40, 40)
            });
        }
    });
    worksMarkerLayer = new LayerGroup();

    // Add them to the map
    paths.addTo(map);
    trainMarkerLayer.addTo(map);
    worksMarkerLayer.addTo(map);

    // Add the layer control box
    new Control.Layers(
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

function update() {
    getTrains();
    getWorks();
}

function onLoad() {
    map = new Map('leafletMap').setView(
        [
            DEFAULT_CENTER_X,
            DEFAULT_CENTER_Y
        ],
        DEFAULT_ZOOM
    );

    addLayers();

    // Add the legend
    const legend = new Control({'position': 'topright'});
    legend.onAdd = addLegend;
    legend.addTo(map);

    // Add an (empty) box for the stats
    statsControl = new Control({'position': 'bottomleft'});

    // Clear the routes when just the map is clicked
    map.on(
        'click',
        () => {
            drawStops([]);
            selected = '';
        }
    );

    // Update every 5 seconds
    update();
    setInterval(
        update,
        5000
    );
}

window.onLoad = onLoad;
