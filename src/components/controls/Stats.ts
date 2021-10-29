import {DomUtil} from 'leaflet';
import {formatDelay, getDelay} from '../../Util';

import {APITrainData} from '../../API';
import {Translatable} from '../Translatable';
import i18next from 'i18next';
import { DelayMapControl } from './DelayMapControl';

enum StatsDataType {
    StatsData,
    ErrorData,
    LoadingData
}

interface StatsData {
    type: StatsDataType.StatsData;
    numGreen: number;
    numOrange: number;
    numRed: number;
    maxDelay: number;
    avgDelay: number;
}

interface ErrorData {
    type: StatsDataType.ErrorData;
    error: Error;
}

interface LoadingData {
    type: StatsDataType.LoadingData;
}

export class Stats extends DelayMapControl implements Translatable {
    data: StatsData | ErrorData | LoadingData;
    div: HTMLElement;

    constructor() {
        super({'position': 'bottomleft'});

        this.data = {
            'type': StatsDataType.LoadingData
        };

        this.div = this.updateContent();
    }

    setData(data: APITrainData): void {
        let numGreen = 0;
        let numOrange = 0;
        let numRed = 0;
        let maxDelay = 0;

        let totalDelay = 0;

        // Process each train
        data.forEach((train) => {
            // Calculate the delay
            const delay = getDelay(train);

            // Categorize it
            if (delay === 0) {
                numGreen++;
            } else if (delay <= 360) {
                numOrange++;
            } else {
                numRed++;
            }

            // Keep global stats
            totalDelay += delay;
            if (delay > maxDelay) {
                maxDelay = delay;
            }
        });

        // Calculate the average delay
        const avgDelay = totalDelay / data.length;

        this.data = {
            'type': StatsDataType.StatsData,
            numGreen,
            numOrange,
            numRed,
            avgDelay,
            maxDelay
        };

        this.updateContent();
    }

    setError(error: Error): void {
        this.data = {
            'type': StatsDataType.ErrorData,
            error
        };

        this.updateContent();
    }

    updateContent(): HTMLElement {
        this.div = this.div || DomUtil.create('div', 'info');

        switch (this.data.type) {
        case StatsDataType.StatsData:
            this.div.classList.remove('error');
            this.div.innerHTML =
                  `<strong>${i18next.t('stats.title')}</strong><br>` +
                  `${i18next.t('stats.average-delay')}: ` +
                  `${formatDelay(this.data.avgDelay)}<br>` +
                  `${i18next.t('stats.maximum-delay')}: ` +
                  `${formatDelay(this.data.maxDelay)}<br>` +
                  `${i18next.t('stats.green-trains')}: ` +
                  `${this.data.numGreen} <br>` +
                  `${i18next.t('stats.orange-trains')}: ` +
                  `${this.data.numOrange} <br>` +
                  `${i18next.t('stats.red-trains')}: ${this.data.numRed} <br>` +
                  `${i18next.t('stats.total-trains')}: ${
                      this.data.numRed +
                      this.data.numOrange +
                      this.data.numGreen
                  } <br>`;
            break;
        case StatsDataType.LoadingData:
            this.div.classList.remove('error');
            this.div.innerHTML = `<i>${i18next.t('stats.loading')}</i><br>`;
            break;
        case StatsDataType.ErrorData:
            this.div.classList.add('error');
            this.div.innerHTML = `<b> ${i18next.t('error.pre')} ` +
                    '<a href="https://github.com/Robbe7730/DelayMap/issues">' +
                    `${i18next.t('error.file-issue')}</a></b><br>` +
                    `${i18next.t('error.message')}: ${this.data.error.message}`;
            break;
        default:
            this.data = {
                'type': StatsDataType.ErrorData,
                'error': new Error('Invalid data type')
            };
            this.updateContent();
        }


        return this.div;
    }

    onAdd(): HTMLElement {
        return this.updateContent();
    }

    onLanguageChanged(): void {
        this.updateContent();
    }
}
