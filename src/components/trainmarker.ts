import {
    DivIcon,
    Marker,
    MarkerOptions,
    Point,
    Polyline,
    Popup
} from 'leaflet';
import {FullStopTime, StopTime, TrainData} from '../api';
import {formatDelay, getColor, getDelay} from '../util';
import {DelayMap} from './delaymap';
import {Translatable} from './translatable';

// TODO: combine this with WorksMarker
export class TrainMarker extends Marker implements Translatable {
    data: TrainData;
    trainIcon: DivIcon;
    popup: Popup;
    delaymap: DelayMap;

    constructor(
        train: TrainData,
        delaymap: DelayMap,
        options?: MarkerOptions | undefined
    ) {
        super([
            train.estimatedLat,
            train.estimatedLon
        ], options);

        this.delaymap = delaymap;

        const color = getColor(train);

        this.trainIcon = new DivIcon({
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

        this.setIcon(this.trainIcon);

        this.data = train;

        this.on(
            'mouseover',
            () => this.showPopup()
        );
        this.on(
            'mouseout',
            () => this.hidePopup()
        );

        this.on(
            'click',
            () => {
                this.drawStops();
                this.showPopup();
            }
        );

        this.popup = this.createPopup();
    }

    onLanguageChanged(): void {
        this.popup = this.createPopup();
    }

    createPopup(): Popup {
        const currStation = this.data.stops[this.data.stopIndex];
        const name = currStation?.name;

        return new Popup({
            'offset': new Point(0, -3)
        })
            .setLatLng([
                this.data.estimatedLat,
                this.data.estimatedLon
            ])
            .setContent(`<strong>${this.data.name}</strong>: ` +
                `+${formatDelay(getDelay(this.data))} min<br>` +
                `Next stop: ${name}`);
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

    hidePopup(): void {
        this.delaymap.closePopup();
    }

    showPopup(): void {
        this.popup.openOn(this.delaymap);
    }
}

