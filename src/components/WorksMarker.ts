import {
    DivIcon,
    Marker,
    MarkerOptions,
    Point,
    Popup
} from 'leaflet';
import {DelayMap} from './DelayMap';
import {Translatable} from './Translatable';
import {WorksData} from '../API';
import i18next from 'i18next';

// TODO: combine this with TrainMarker
export class WorksMarker extends Marker implements Translatable {
    works: WorksData;
    popup: Popup;
    delaymap: DelayMap;

    constructor(
        works: WorksData,
        map: DelayMap,
        options?: MarkerOptions | undefined
    ) {
        super([
            works.impactedStation?.lat || 0,
            works.impactedStation?.lon || 0
        ], options);

        this.delaymap = map;
        this.works = works;
        this.popup = this.createPopup();

        this.setIcon(new DivIcon({
            'className': 'myDivIcon',
            'html':
                '<i class="fa fa-exclamation-triangle" style="color: red"></i>',
            'iconAnchor': [
                5,
                10
            ],
            'iconSize': [
                20,
                20
            ]
        }));

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
            () => this.showPopup()
        );
    }

    onLanguageChanged(): void {
        this.popup = this.createPopup();
    }

    createPopup(): Popup {
        const urls = this.works.urls.map((url) =>
            `<a href="${url.url}" target="_blank">${url.label}</a>`);

        let urlText = '';
        if (urls.length !== 0) {
            urlText = `Info: ${urls.join(', ')}`;
        }

        return new Popup({
            'offset': new Point(0, -3)
        })
            .setLatLng([
                this.works.impactedStation?.lat || 0,
                this.works.impactedStation?.lon || 0
            ])
            .setContent(`<strong>${this.works.name}</strong><br />` +
                        `${i18next.t('works.ending')} ${this.works.endDate} ` +
                        `${this.works.endTime}<br />` +
                        `${this.works.message}<br />` +
                        `${urlText}`);
    }

    hidePopup(): void {
        this.delaymap.closePopup();
    }

    showPopup(): void {
        this.popup.openOn(this.delaymap);
    }
}

