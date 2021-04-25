import {LayerGroup} from 'leaflet';

export class WorksLayer extends LayerGroup {
    clear(): void {
        this.getLayers().forEach((layer) => this.removeLayer(layer));
    }
}
