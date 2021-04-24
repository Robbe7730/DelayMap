import {DivIcon, LatLngExpression, Marker, Popup} from 'leaflet';

import {DelayMap} from '../DelayMap';
import {Translatable} from '../Translatable';

export interface LatLonAble {
    getLatLon: () => LatLngExpression;
}

export abstract class DelayMapMarker<D> extends Marker implements Translatable {
    data: D;
    delaymap: DelayMap;
    popup: Popup;

    constructor(
        data: D,
        delaymap: DelayMap,
        color: string,
        icon: string
    ) {
        super([
            0,
            0
        ]);

        this.setLatLng(this.getLatLon(data));

        this.data = data;
        this.delaymap = delaymap;

        this.setIcon(new DivIcon({
            'className': 'myDivIcon',
            'html':
                `<i class="fa fa-${icon}" style="color: ${color}"></i>`,
            'iconAnchor': [
                5,
                10
            ],
            'iconSize': [
                20,
                20
            ]
        }));

        this.popup = this.createPopup();

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
            () => this.onClick()
        );
    }

    onLanguageChanged(): void {
        this.popup = this.createPopup();
    }


    hidePopup(): void {
        this.delaymap.closePopup();
    }

    showPopup(): void {
        this.popup.openOn(this.delaymap);
    }

    onClick(): void {
        this.showPopup();
    }

    abstract createPopup(): Popup;
    abstract getLatLon(data: D): LatLngExpression;
}
