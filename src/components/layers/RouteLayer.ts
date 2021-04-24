import {FullStopTime, StopTime} from '../../API';
import {LayerGroup, Polyline} from 'leaflet';
import {DelayMap} from '../DelayMap';

export class RouteLayer extends LayerGroup {
    delaymap: DelayMap;
    lastRoute?: Polyline;

    constructor(delaymap: DelayMap) {
        super();
        this.delaymap = delaymap;
    }

    drawStops(stops: StopTime[]): void {
        this.clearRoutes();
        this.lastRoute = new Polyline(stops
            .filter((stop: StopTime):stop is FullStopTime =>
                typeof stop.lat !== 'undefined' &&
                typeof stop.lon !== 'undefined')
            .map((stop: FullStopTime) => [
                stop.lat,
                stop.lon
            ]))
            .addTo(this);
    }

    clearRoutes(): void {
        if (this.lastRoute) {
            this.lastRoute.remove();
        }
    }
}
