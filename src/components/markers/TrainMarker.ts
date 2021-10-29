import {
    LatLng,
    LatLngExpression,
    Point,
    Popup
} from 'leaflet';
import {StopTime, TrainData} from '../../API';
import {formatDelay, getColor, getDelay} from '../../Util';
import {DelayMap} from '../DelayMap';
import {DelayMapMarker} from './DelayMapMarker';
import i18next from 'i18next';

export class TrainMarker extends DelayMapMarker<TrainData> {
    extraOnClick: (stops: StopTime[]) => void;

    constructor(
        train: TrainData,
        delaymap: DelayMap,
        drawStops: (stops: StopTime[]) => void
    ) {
        super(train, delaymap, getColor(train), 'train');
        this.extraOnClick = drawStops.bind(this);
    }

    createPopup(): Popup {
        const currStation = this.data.stops[this.data.stopIndex];
        const name = currStation?.name;

        return new Popup({
            'offset': new Point(0, -3)
        })
            .setLatLng(this.getLatLon(this.data))
            .setContent(`<strong>${this.data.name}</strong>: ` +
                `+${formatDelay(getDelay(this.data))}<br>` +
                `${i18next.t('trainMarker.nextStop')}: ${name}`);
    }


    getLatLon(data: TrainData): LatLngExpression {
        return new LatLng(
            data.estimatedLat,
            data.estimatedLon
        );
    }

    onClick(): void {
        super.onClick();
        this.extraOnClick(this.data.stops);
    }
}

