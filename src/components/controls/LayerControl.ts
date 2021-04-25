import {Control, TileLayer} from 'leaflet';
import {RouteLayer} from '../layers/RouteLayer';
import {Translatable} from '../Translatable';
import {WorksLayer} from '../layers/WorksLayer';
import i18next from 'i18next';

export class LayerControl extends Control.Layers implements Translatable {
    openrailwaymap: TileLayer;
    routes: RouteLayer;
    works: WorksLayer;

    constructor(
        openrailwaymap: TileLayer,
        routes: RouteLayer,
        works: WorksLayer
    ) {
        super(
            {}, {},
            {
                'collapsed': false,
                'position': 'topleft'
            }
        );

        this.openrailwaymap = openrailwaymap;
        this.routes = routes;
        this.works = works;

        this.updateLayers();
    }

    updateLayers(): void {
        this.removeLayer(this.openrailwaymap);
        this.removeLayer(this.routes);
        this.removeLayer(this.works);

        this.addOverlay(
            this.openrailwaymap,
            i18next.t('layerControl.openrailwaymap')
        );
        this.addOverlay(
            this.routes,
            i18next.t('layerControl.routes')
        );
        this.addOverlay(
            this.works,
            i18next.t('layerControl.works')
        );
    }

    onLanguageChanged(): void {
        this.updateLayers();
    }
}
