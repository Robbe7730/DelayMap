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
    clicked: boolean;

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

        this.clicked = false;
        this.popup = this.createPopup();

        this.on(
            'mouseover',
            () => this.showPopup(false)
        );
        this.on(
            'mouseout',
            () => this.hidePopup(false)
        );

        this.on(
            'click',
            () => this.onClick()
        );
    }

    onLanguageChanged(): void {
        this.popup = this.createPopup();
    }


    hidePopup(force: boolean): void {
        if (!this.clicked || force) {
            this.delaymap.closePopup();
        }
    }

    showPopup(clicked: boolean): void {
        this.clicked = clicked;
        this.popup.openOn(this.delaymap);
    }

    onClick(): void {
        this.showPopup(true);
    }

    abstract createPopup(): Popup;
    abstract getLatLon(data: D): LatLngExpression;
}
