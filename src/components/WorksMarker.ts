import {
    LatLng,
    LatLngExpression,
    Point,
    Popup
} from 'leaflet';
import {DelayMap} from './DelayMap';
import {DelayMapMarker} from './DelayMapMarker';
import {WorksData} from '../API';
import i18next from 'i18next';

export class WorksMarker extends DelayMapMarker<WorksData> {
    constructor(
        data: WorksData,
        map: DelayMap
    ) {
        super(data, map, 'red', 'exclamation-triangle');
    }

    createPopup(): Popup {
        const urls = this.data.urls.map((url) =>
            `<a href="${url.url}" target="_blank">${url.label}</a>`);

        let urlText = '';
        if (urls.length !== 0) {
            urlText = `Info: ${urls.join(', ')}`;
        }

        return new Popup({
            'offset': new Point(0, -3)
        })
            .setLatLng(this.getLatLon(this.data))
            .setContent(`<strong>${this.data.name}</strong><br />` +
                        `${i18next.t('works.ending')} ${this.data.endDate} ` +
                        `${this.data.endTime}<br />` +
                        `${this.data.message}<br />` +
                        `${urlText}`);
    }

    getLatLon(data: WorksData): LatLngExpression {
        return new LatLng(
            data.impactedStation?.lat || 0,
            data.impactedStation?.lon || 0
        );
    }
}

