import {APITrainData} from '../api';
import {Control, DomUtil} from 'leaflet';
import {Translatable} from './translatable';
import i18next from 'i18next';
import {formatDelay, getDelay} from '../util';

enum DataType {
    StatsData,
    ErrorData,
    LoadingData,
}

interface StatsData {
    type: DataType.StatsData;
    numGreen: number;
    numOrange: number;
    numRed: number;
    maxDelay: number;
    avgDelay: number;
}

interface ErrorData {
    type: DataType.ErrorData;
    error: Error;
}

interface LoadingData {
    type: DataType.LoadingData;
}

export class Stats extends Control implements Translatable {
    data: StatsData | ErrorData | LoadingData;
    div: HTMLElement;

    constructor() {
        super({'position': 'bottomleft'});

        this.data = {
            type: DataType.LoadingData,
        };

        this.div = this.updateContent();
    }

    setData(data: APITrainData) {
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
        let avgDelay = totalDelay / data.length;

        this.data = {
            type: DataType.StatsData,
            numGreen,
            numOrange,
            numRed,
            avgDelay,
            maxDelay,
        }

        this.updateContent();
    }

    setError(error: Error) {
        this.data = {
            type: DataType.ErrorData,
            error
        };

        this.updateContent();
    }

    updateContent(): HTMLElement {
        this.div ??= DomUtil.create('div', 'info legend');

        switch (this.data.type) {
            case DataType.StatsData: {
                this.div.classList.remove('error');
                this.div.innerHTML =
                  `<strong>${i18next.t('stats.title')}</strong><br>` +
                  `${i18next.t('stats.average-delay')}: ${formatDelay(this.data.avgDelay)}<br>` +
                  `${i18next.t('stats.maximum-delay')}: ${formatDelay(this.data.maxDelay)}<br>` +
                  `${i18next.t('stats.green-trains')}: ${this.data.numGreen} <br>` +
                  `${i18next.t('stats.orange-trains')}: ${this.data.numOrange} <br>` +
                  `${i18next.t('stats.red-trains')}: ${this.data.numRed} <br>` +
                  `${i18next.t('stats.total-trains')}: ${
                        this.data.numRed + this.data.numOrange + this.data.numGreen
                    } <br>`;
                break;
            }
            case DataType.LoadingData: {
                this.div.classList.remove('error');
                // TODO: why does this overflow?
                this.div.innerHTML = `<i>${i18next.t('stats.loading')}</i><br>`
                break;
            }
            case DataType.ErrorData: {
                this.div.classList.add('error');
                this.div.innerHTML = `<b> ${i18next.t('error.pre')} ` +
                                '<a href="https://github.com/Robbe7730/DelayMap/issues">' +
                                `${i18next.t('error.file-issue')}</a></b><br>` +
                                `${i18next.t('error.message')}: ${this.data.error.message}`;
                break;
            }
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
