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
    LayerGroup,
    Map,
    TileLayer
} from 'leaflet';

import {LanguageSelector} from './LanguageSelector';
import {Legend} from './Legend';
import {Stats} from './Stats';
import {TrainMarker} from './TrainMarker';
import {TrainMarkerLayer} from './TrainMarkerLayer';
import {WorksMarker} from './WorksMarker';
import i18next from 'i18next';

export class DelayMap extends Map {
    openrailwaymap: TileLayer;

    trainMarkerLayer: TrainMarkerLayer;

    routesLayer: LayerGroup;
    worksLayer: LayerGroup;

    legend: Legend;
    stats: Stats;

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
        this.routesLayer = new LayerGroup();
        this.addLayer(this.routesLayer);

        // Add layer for works
        this.worksLayer = new LayerGroup();
        this.addLayer(this.worksLayer);

        // TODO: translate this control

        // Add the layer control box
        this.addControl(new Control.Layers(
            {},
            {
                'OpenRailwayMap': this.openrailwaymap,
                'Routes': this.routesLayer,
                'Works': this.worksLayer
            },
            {
                'collapsed': false,
                'position': 'topleft'
            }
        ));

        // Add a language selector
        const languageSelect = new LanguageSelector((lang) =>
            this.setLanguage(lang));

        this.addControl(languageSelect);

        // Add the legend
        this.legend = new Legend();
        this.addControl(this.legend);

        // Add the stats
        this.stats = new Stats();
        this.addControl(this.stats);
    }

    setLanguage(lang: string): void {
        i18next.changeLanguage(lang);

        this.legend.onLanguageChanged();
        this.stats.onLanguageChanged();

        this.getTrains();
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
        this.clearRoutes();
        this.clearTrainMarkerLayer();
        this.clearWorksLayer();
    }

    getTrains(): void {
        fetch(`${API_URL}/trains?language=${i18next.language}`)
            .then((res) => res.json())
            .then((data) => this.drawTrainsData(data))
            .catch((err) => this.handleError(err));
    }

    drawWorksData(works: APIWorksData): void {
        this.clearWorksLayer();

        works.forEach((work) => {
            new WorksMarker(work, this).addTo(this.worksLayer);
        });
    }

    drawTrainsData(trains: APITrainData): void {
        this.clearTrainMarkerLayer();
        this.stats.setData(trains);

        trains.forEach((train) => {
            new TrainMarker(train, this).addTo(this.trainMarkerLayer);
        });
    }

    clearRoutes(): void {
        this.routesLayer.remove();
        this.routesLayer = new LayerGroup();
        this.addLayer(this.routesLayer);
    }

    clearTrainMarkerLayer(): void {
        this.trainMarkerLayer.remove();
        this.trainMarkerLayer = new TrainMarkerLayer();
        this.addLayer(this.trainMarkerLayer);
    }

    clearWorksLayer(): void {
        this.worksLayer.remove();
        this.worksLayer = new LayerGroup();
        this.addLayer(this.worksLayer);
    }
}
