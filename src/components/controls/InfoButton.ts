import i18next from "i18next";
import { DelayMap } from "../DelayMap";
import { Translatable } from "../Translatable";
import { DelayMapControl } from "./DelayMapControl";
import { InfoPanel } from "./InfoPanel";

export class InfoButton extends DelayMapControl implements Translatable {
    button: HTMLButtonElement;
    map?: DelayMap;
    infoPanel?: InfoPanel;

    constructor() {
        super({'position': 'bottomleft'});

        this.button = document.createElement('button');
        this.updateButton();
    }

    onLanguageChanged(): void {
        this.updateButton();

        if (this.infoPanel) {
            this.infoPanel.onLanguageChanged();
        }
    }

    updateButton() {
        this.button.innerHTML = `<span class="far fa-question-circle"></span> ${i18next.t('info.about')}`;
        this.button.onclick = () => this.onClick();
    }

    onClick() {
        if (!this.infoPanel) {
            this.infoPanel = new InfoPanel();
            if (this.map) {
                this.infoPanel.addTo(this.map);
            }
        }

        this.infoPanel.toggleVisible();
    }

    onAdd(map: DelayMap): HTMLElement {
        this.map = map;
        return this.button;
    }

}
