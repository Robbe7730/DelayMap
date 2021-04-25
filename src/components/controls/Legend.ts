import {Control, DomUtil} from 'leaflet';
import {Translatable} from '../Translatable';
import i18next from 'i18next';

export class Legend extends Control implements Translatable {
    div: HTMLElement;

    constructor() {
        super({'position': 'topright'});

        this.div = this.onAdd();
    }

    onAdd(): HTMLElement {
        this.div = DomUtil.create(
            'div',
            'info legend'
        );

        this.updateContent();

        return this.div;
    }

    updateContent(): void {
        this.div.innerHTML =
            `<strong>${i18next.t('legend.title')}</strong><br>` +
            `${i18next.t('legend.green')} <br>` +
            `${i18next.t('legend.orange')} <br>` +
            `${i18next.t('legend.red')}`;
    }

    onLanguageChanged(): void {
        this.updateContent();
    }
}
