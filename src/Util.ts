import {TrainData} from './API';

export function getDelay(train: TrainData): number {
    const currStation = train.stops[train.stopIndex];

    return currStation
        ? train.isStopped
            ? currStation.departureDelay
            : currStation.arrivalDelay
        : 0;
}

export function getColor(train: TrainData): string {
    const delay = getDelay(train);
    return delay === 0
        ? 'green'
        : delay <= 360
            ? 'orange'
            : 'red';
}

/*
 * It may be a good idea to combine this into i18next:
 * https://www.i18next.com/translation-function/formatting
 */
export function formatDelay(delay: number): string {
    const delayMinutes = Math.floor(delay / 60);
    const delaySeconds = Math.round(delay % 60);

    let delayFormatted = `${delayMinutes}:`;
    if (delaySeconds < 10) {
        delayFormatted += `0${delaySeconds}`;
    } else {
        delayFormatted += `${delaySeconds}`;
    }

    delayFormatted += ' min';

    return delayFormatted;
}

