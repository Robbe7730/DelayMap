/* eslint-disable sort-imports */
/**
 * @file The script that runs the DelayMap frontend.
 * @author Robbe Van Herck
 */

import * as i18n from './i18n.json';

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import 'leaflet';
// eslint-disable-next-line sort-imports
import 'leaflet.markercluster';
import {DelayMap} from './components/DelayMap';

declare global {
    interface Window {
        onLoad: () => void;
    }
}

function onLoad() {
    i18next.use(LanguageDetector)
        .init({
            'debug': false,
            'supportedLngs': [
                'en',
                'nl',
                'fr',
                'de',
                'dev'
            ],
            'detection': {
                'caches': []
            },
            'resources': i18n
        })
        .then(() => {
            const map = new DelayMap();

            // Update every 5 seconds
            map.update();
            setInterval(
                () => map.update(),
                5000
            );
        });
}

window.onLoad = onLoad;
