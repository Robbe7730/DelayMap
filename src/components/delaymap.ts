import {APITrainData, APIWorksData} from '../api';

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

import {Legend} from './legend';
import {Stats} from './stats';
import {TrainMarker} from './trainmarker';
import {TrainMarkerLayer} from './trainmarkerlayer';
import {WorksMarker} from './worksmarker';
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
        const languageSelect = new Control({'position': 'bottomright'});
        languageSelect.onAdd = () => this.addLanguageSelect();
        this.addControl(languageSelect);

        // Add the legend
        this.legend = new Legend();
        this.addControl(this.legend);

        // Add the stats
        this.stats = new Stats();
        this.addControl(this.stats);
    }

    addLanguageSelect(): HTMLSelectElement {
        const select = document.createElement('select');

        const nlOption = document.createElement('option');
        nlOption.text = 'Nederlands';
        nlOption.value = 'nl';

        const enOption = document.createElement('option');
        enOption.text = 'English';
        enOption.value = 'en';

        select.add(nlOption);
        select.add(enOption);

        select.oninput = () => {
            const newLang = select.options[select.selectedIndex]?.value;

            if (newLang) {
                this.setLanguage(newLang);
            }
        };

        return select;
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
    }

    getTrains(): void {
        fetch(`${API_URL}/trains?language=${i18next.language}`)
            .then((res) => res.json())
            .then((data) => this.drawTrainsData(data))
            .catch((err) => this.handleError(err));
    }

    drawWorksData(works: APIWorksData): void {
        this.worksLayer.remove();
        this.worksLayer = new LayerGroup();
        this.addLayer(this.worksLayer);

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
}
