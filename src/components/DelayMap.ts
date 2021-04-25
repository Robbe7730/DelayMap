import {APITrainData, APIWorksData} from '../API';

import {
    API_URL,
    DEFAULT_CENTER_X,
    DEFAULT_CENTER_Y,
    DEFAULT_ZOOM,
    MT_KEY
} from '../config.json';

import {
    Control,
    Map,
    TileLayer
} from 'leaflet';

import {LanguageSelector} from './controls/LanguageSelector';
import {Legend} from './controls/Legend';
import {RouteLayer} from './layers/RouteLayer';
import {Stats} from './controls/Stats';
import {TrainMarkerLayer} from './layers/TrainMarkerLayer';
import {WorksLayer} from './layers/WorksLayer';
import {WorksMarker} from './markers/WorksMarker';
import i18next from 'i18next';

export class DelayMap extends Map {
    openrailwaymap: TileLayer;

    trainMarkerLayer: TrainMarkerLayer;
    routeLayer: RouteLayer;
    worksLayer: WorksLayer;

    legend: Legend;
    stats: Stats;
    languageSelect: LanguageSelector;

    constructor() {
        super('leafletMap');

        this.setView(
            [
                DEFAULT_CENTER_X,
                DEFAULT_CENTER_Y
            ],
            DEFAULT_ZOOM
        );

        // Add background layer
        this.addLayer(new TileLayer(
            `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${
                MT_KEY
            }`,
            {
                'attribution':
                '<a href="https://www.maptiler.com/copyright/"' +
                'target="_blank">&copy; MapTiler</a> <a ' +
                'href="https://www.openstreetmap.org/copyright"' +
                'target="_blank">&copy; OpenStreetMap contributors</a>'
            }
        ));


        // Add OpenRailwayMap layer
        this.openrailwaymap = new TileLayer(
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

        // Add layer for markers
        this.trainMarkerLayer = new TrainMarkerLayer();
        this.addLayer(this.trainMarkerLayer);

        // Add layer for routes
        this.routeLayer = new RouteLayer(this);
        this.addLayer(this.routeLayer);

        // Add layer for works
        this.worksLayer = new WorksLayer();
        this.addLayer(this.worksLayer);

        // TODO: translate this control

        // Add the layer control box
        this.addControl(new Control.Layers(
            {},
            {
                'OpenRailwayMap': this.openrailwaymap,
                'Routes': this.routeLayer,
                'Works': this.worksLayer
            },
            {
                'collapsed': false,
                'position': 'topleft'
            }
        ));

        // Add a language selector
        this.languageSelect = new LanguageSelector((lang) =>
            this.setLanguage(lang));
        this.addControl(this.languageSelect);

        // Add the legend
        this.legend = new Legend();
        this.addControl(this.legend);

        // Add the stats
        this.stats = new Stats();
        this.addControl(this.stats);

        // Clear the routes when just the map is clicked
        this.on(
            'click',
            () => this.routeLayer.clear()
        );
    }

    setLanguage(lang: string): void {
        i18next.changeLanguage(lang);

        this.legend.onLanguageChanged();
        this.stats.onLanguageChanged();
        this.languageSelect.onLanguageChanged();

        this.update();
    }

    update(): void {
        this.getTrains();
        this.getWorks();
    }

    getWorks(): void {
        fetch(`${API_URL}/works?language=${i18next.language}`)
            .then((res) => res.json())
            .then((data) => this.drawWorksData(data))
            .catch((err) => this.handleError(err));
    }

    handleError(error: Error): void {
        // eslint-disable-next-line no-console
        console.error(error);
        this.stats.setError(error);
        this.routeLayer.clear();
        this.trainMarkerLayer.clear();
        this.worksLayer.clear();
    }

    getTrains(): void {
        fetch(`${API_URL}/trains?language=${i18next.language}`)
            .then((res) => res.json())
            .then((data) => this.drawTrainsData(data))
            .catch((err) => this.handleError(err));
    }

    drawWorksData(works: APIWorksData): void {
        this.worksLayer.clear();

        works.forEach((work) => {
            new WorksMarker(work, this).addTo(this.worksLayer);
        });
    }

    drawTrainsData(trains: APITrainData): void {
        this.trainMarkerLayer.clear();
        this.stats.setData(trains);
        this.trainMarkerLayer.drawTrains(
            trains,
            this,
            (stops) => this.routeLayer.drawStops(stops)
        );
    }
}
