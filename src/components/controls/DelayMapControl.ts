import {Control, ControlOptions, ControlPosition} from 'leaflet';
import {DelayMap} from '../DelayMap';

export type DelayMapControlPosition = ControlPosition | 'center';

interface DelayMapControlOptions extends Omit<ControlOptions, 'position'> {
    position?: DelayMapControlPosition,
}

export class DelayMapControl extends Control {
    declare _map?: DelayMap;
    declare _container?: HTMLElement;

    originalPosition?: DelayMapControlPosition;

    constructor(options?: DelayMapControlOptions) {
        super(options as ControlOptions);
        if (options) {
            this.originalPosition = options.position;
        }
    }

    addTo(map: DelayMap): this {
        if (this.getPosition()) {
            return super.addTo(map);
        }
        this.remove();
        this._map = map;

        let container;
        if (this.onAdd) {
            container = this.onAdd(map);
            this._container = container;
        }

        const corner = map._controlCorners[
            this.originalPosition || 'topright'
        ];

        if (corner && container) {
            corner.appendChild(container);
        }

        return this;
    }
}
