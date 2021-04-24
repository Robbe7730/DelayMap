import {FullStopTime, StopTime, TrainData} from '../API';
import {
    LatLng,
    LatLngExpression,
    Point,
    Polyline,
    Popup
} from 'leaflet';
import {formatDelay, getColor, getDelay} from '../Util';

import {DelayMap} from './DelayMap';
import {DelayMapMarker} from './DelayMapMarker';
import i18next from 'i18next';

export class TrainMarker extends DelayMapMarker<TrainData> {
    constructor(
        train: TrainData,
        delaymap: DelayMap
    ) {
        super(train, delaymap, getColor(train), 'train');
    }

    createPopup(): Popup {
        const currStation = this.data.stops[this.data.stopIndex];
        const name = currStation?.name;

        return new Popup({
            'offset': new Point(0, -3)
        })
            .setLatLng(this.getLatLon(this.data))
            .setContent(`<strong>${this.data.name}</strong>: ` +
                `+${formatDelay(getDelay(this.data))} min<br>` +
                `${i18next.t('trainMarker.nextStop')}: ${name}`);
    }

    drawStops(): void {
        this.delaymap.clearRoutes();
        new Polyline(this.data.stops
            .filter((stop: StopTime):stop is FullStopTime =>
                typeof stop.lat !== 'undefined' &&
                typeof stop.lon !== 'undefined')
            .map((stop: FullStopTime) => [
                stop.lat,
                stop.lon
            ]))
            .addTo(this.delaymap.routesLayer);
    }

    getLatLon(data: TrainData): LatLngExpression {
        return new LatLng(
            data.estimatedLat,
            data.estimatedLon
        );
    }
}

