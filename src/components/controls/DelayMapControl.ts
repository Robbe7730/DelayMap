import { Control, ControlOptions, ControlPosition } from "leaflet";
import { DelayMap } from "../DelayMap";

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
        this.originalPosition = options ? options["position"] : undefined;
    }

    addTo(map: DelayMap): this {
        if (this.getPosition() === undefined) {
            this.remove();
            this._map = map;

            const container = this._container = this.onAdd ? this.onAdd(map) : undefined;
            const corner = map._controlCorners[this.originalPosition || 'topright'];

            if (corner && container) {
                corner.appendChild(container);
            }

            return this;
        } else {
            return super.addTo(map);
        }
    }
}
