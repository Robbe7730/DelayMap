import {Control} from 'leaflet';

export class LanguageSelector extends Control {
    setLanguage: (newLang: string) => void;

    constructor(setLanguage: (newLang: string) => void) {
        super({'position': 'bottomright'});
        this.setLanguage = setLanguage;
    }

    onAdd(): HTMLElement {
        const select = document.createElement('select');

        const nlOption = document.createElement('option');
        nlOption.text = 'Nederlands';
        nlOption.value = 'nl';

        const enOption = document.createElement('option');
        enOption.text = 'English';
        enOption.value = 'en';

        select.add(nlOption);
        select.add(enOption);

        select.oninput = () => {
            const newLang = select.options[select.selectedIndex]?.value;

            if (newLang) {
                this.setLanguage(newLang);
            }
        };

        return select;
    }
}
