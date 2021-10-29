interface Config {
    API_URL: string,
    DEFAULT_CENTER_X: number,
    DEFAULT_CENTER_Y: number,
    DEFAULT_ZOOM: number,
    MT_KEY: string
}

const configKeyList = [
    'API_URL',
    'DEFAULT_CENTER_X',
    'DEFAULT_CENTER_Y',
    'DEFAULT_ZOOM',
    'MT_KEY'
];

function isValid(config: unknown): config is Config {
    const foundKeys = new Set();

    Object.keys(config as object).forEach((key) => {
        if (configKeyList.includes(key)) {
            foundKeys.add(key);
        }
    });

    return foundKeys.size === configKeyList.length;
}

class InvalidConfigError extends Error {
    constructor() {
        super('Invalid config');
    }
}

let _config: Config | undefined;

export async function getConfig(): Promise<Config> {
    if (!_config) {
        const configRequest = await fetch('/config.json');
        const config: unknown = await configRequest.json();

        if (!isValid(config)) {
            throw new InvalidConfigError();
        }

        _config = config; // eslint-disable-line require-atomic-updates
    }

    return _config;
}
