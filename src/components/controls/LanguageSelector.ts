import {DelayMapControl} from './DelayMapControl';
import {Translatable} from '../Translatable';
import i18next from 'i18next';

export class LanguageSelector extends DelayMapControl implements Translatable {
    setLanguage: (newLang: string) => void;
    language: string;
    select: HTMLSelectElement;
    optionMap: Map<string, HTMLOptionElement>;

    constructor(setLanguage: (newLang: string) => void) {
        super({'position': 'bottomright'});
        this.setLanguage = setLanguage;
        this.language = i18next.language;
        this.optionMap = new Map();
        this.select = document.createElement('select');
    }

    onLanguageChanged(): void {
        this.language = i18next.language;

        const option = this.optionMap.get(this.language);

        if (option) {
            this.select.selectedIndex = option.index;
        }
    }

    onAdd(): HTMLElement {
        const nlOption = document.createElement('option');
        nlOption.text = 'Nederlands';
        nlOption.value = 'nl';
        this.optionMap.set('nl', nlOption);

        const enOption = document.createElement('option');
        enOption.text = 'English';
        enOption.value = 'en';
        this.optionMap.set('en', enOption);

        const frOption = document.createElement('option');
        frOption.text = 'Français';
        frOption.value = 'fr';
        this.optionMap.set('fr', frOption);

        const deOption = document.createElement('option');
        deOption.text = 'Deutsch';
        deOption.value = 'de';
        this.optionMap.set('de', deOption);

        this.select.add(nlOption);
        this.select.add(enOption);
        this.select.add(frOption);
        this.select.add(deOption);

        this.select.oninput = () => {
            const newLang = this.select.options[
                this.select.selectedIndex
            ]?.value;

            if (newLang) {
                this.setLanguage(newLang);
            }
        };

        this.onLanguageChanged();

        return this.select;
    }
}
