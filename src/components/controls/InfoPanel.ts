import {DelayMapControl} from './DelayMapControl';
import {DomUtil} from 'leaflet';
import {Translatable} from '../Translatable';
import i18next from 'i18next';

export class InfoPanel extends DelayMapControl implements Translatable {
    content: HTMLElement;
    visible: boolean;

    constructor() {
        super({'position': 'center'});
        this.content = DomUtil.create('div', 'info delaymap-info');
        this.updateContent();
        this.visible = false;
    }

    updateContent(): void {
        DomUtil.empty(this.content);

        const title = DomUtil.create('h1', '', this.content);
        title.innerText = i18next.t('info.title');

        const description = DomUtil.create('div', '', this.content);
        description.innerText = i18next.t('info.description');

        const warningDiv = DomUtil.create('div', '', this.content);
        const warning = DomUtil.create('b', '', warningDiv);
        warning.innerText = i18next.t('info.warning-unofficial');

        const github = DomUtil.create(
            'a',
            '',
            this.content
        ) as HTMLAnchorElement;
        DomUtil.create('span', 'fab fa-github', github);
        const githubText = DomUtil.create('span', '', github);
        githubText.innerText = ` ${i18next.t('info.github')}`;
        github.href = 'https://github.com/Robbe7730/DelayMap/';
        github.target = '_blank';

        const closeIcon = DomUtil.create(
            'a',
            'leaflet-popup-close-button',
            this.content
        ) as HTMLAnchorElement;
        closeIcon.onclick = (event) => this.onCloseClick(event);
        closeIcon.innerText = '×';
        closeIcon.href = '#close';
    }

    onCloseClick(event: Event): void {
        event.preventDefault();
        this.visible = false;
        this.updateVisibility();
    }

    onLanguageChanged(): void {
        this.updateContent();
    }

    onAdd(): HTMLElement {
        return this.content;
    }

    updateVisibility(): void {
        if (this.visible) {
            this.content.classList.remove('hidden');
        } else {
            this.content.classList.add('hidden');
        }
    }

    toggleVisible(): void {
        this.visible = !this.visible;
        this.updateVisibility();
    }
}
