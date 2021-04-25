export interface StopTime {
    name: string,
    arrivalDelay: number,
    departureDelay: number,
    arrivalTimestamp: number,
    departureTimestamp: number,
    lat?: number,
    lon?: number,
}

export interface FullStopTime extends StopTime {
    lat: number,
    lon: number
}

export interface TrainData {
    id: string,
    name: string,
    stops: StopTime[],
    stopIndex: number,
    isStopped: boolean,
    estimatedLat: number,
    estimatedLon: number,
}

export interface Stop {
    name: string,
    stopId: string,
    lat?: number,
    lon?: number,
}

export interface WorksURL {
    url: string,
    label: string,
}

export interface WorksData {
    id: string,
    name: string,
    message: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    urls: WorksURL[],
    impactedStation?: Stop,
}

export type APITrainData = TrainData[];
export type APIWorksData = WorksData[];
