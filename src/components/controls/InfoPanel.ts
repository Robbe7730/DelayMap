import i18next from "i18next";
import { DomUtil } from "leaflet";
import { Translatable } from "../Translatable";
import { DelayMapControl } from "./DelayMapControl";

export class InfoPanel extends DelayMapControl implements Translatable {
    content: HTMLElement;
    visible: boolean;

    constructor() {
        super({'position': 'center'});
        this.content = DomUtil.create('div', 'info delaymap-info');
        this.updateContent();
        this.visible = false;
    }

    updateContent() {
        this.content = DomUtil.create('div', 'info delaymap-info');

        let title = DomUtil.create('h1', '', this.content);
        title.innerText = i18next.t('info.title');

        let description = DomUtil.create('div', '', this.content);
        description.innerText = i18next.t('info.description');

        let warningDiv = DomUtil.create('div', '', this.content);
        let warning = DomUtil.create('b', '', warningDiv);
        warning.innerText = i18next.t('info.warning-unofficial');

        let github = DomUtil.create('a', '', this.content) as HTMLAnchorElement;
        DomUtil.create('span', 'fab fa-github', github);
        let githubText = DomUtil.create('span', '', github);
        githubText.innerText = ` ${i18next.t('info.github')}`;
        github.href = "https://github.com/Robbe7730/DelayMap/"
        github.target = "_blank";

        let closeIcon = DomUtil.create('a', 'leaflet-popup-close-button', this.content) as HTMLAnchorElement;
        closeIcon.onclick = (e) => this.onCloseClick(e);
        closeIcon.innerText = "×";
        closeIcon.href = "#close";
    }

    onCloseClick(e: Event) {
        e.preventDefault();
        this.visible = false;
        this.updateVisibility();
    }

    onLanguageChanged(): void {
        this.updateContent();
    }

    onAdd(): HTMLElement {
        return this.content;
    }

    updateVisibility() {
        if (this.visible) {
            this.content.classList.remove('hidden');
        } else {
            this.content.classList.add('hidden');
        }
    }

    toggleVisible() {
        this.visible = !this.visible;
        this.updateVisibility();
    }
}
