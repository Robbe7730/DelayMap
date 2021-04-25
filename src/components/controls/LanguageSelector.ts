import {Control} from 'leaflet';
import {Translatable} from '../Translatable';
import i18next from 'i18next';

export class LanguageSelector extends Control implements Translatable {
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

        this.select.add(nlOption);
        this.select.add(enOption);

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
