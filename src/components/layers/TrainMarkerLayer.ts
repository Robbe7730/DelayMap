import {APITrainData, StopTime} from '../../API';
import {DivIcon, Marker, MarkerClusterGroup, Point} from 'leaflet';
import {DelayMap} from '../DelayMap';
import {TrainMarker} from '../markers/TrainMarker';
import {getDelay} from '../../Util';

export class TrainMarkerLayer extends MarkerClusterGroup {
    constructor() {
        super({
            'maxClusterRadius': 50,
            'iconCreateFunction': (cluster) => {
                const totalDelay = cluster.getAllChildMarkers()
                    .filter((marker: Marker): marker is TrainMarker => {
                        const trainMarker = marker as TrainMarker;
                        return typeof trainMarker.data !== 'undefined';
                    })
                    .map((marker) => getDelay(marker.data))
                    .reduce((acc, val) => acc + val, 0);
                const childCount = cluster.getChildCount();
                const avgDelay = totalDelay / childCount;


                let className = 'marker-cluster-';
                if (avgDelay < 60) {
                    className += 'small';
                } else if (avgDelay < 360) {
                    className += 'medium';
                } else {
                    className += 'large';
                }

                return new DivIcon({
                    'className': `marker-cluster ${className}`,
                    'html': `<div><span>${childCount}</span></div>`,
                    'iconSize': new Point(40, 40)
                });
            }
        });
    }

    drawTrains(
        trains: APITrainData,
        delaymap: DelayMap,
        drawRoute: (stops: StopTime[]) => void
    ): void {
        this.clear();

        trains.map((train) =>
            new TrainMarker(train, delaymap, drawRoute).addTo(this));
    }

    clear(): void {
        this.removeLayers(this.getLayers());
    }
}
