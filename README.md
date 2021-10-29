# DelayMap

[![Frontend](https://github.com/Robbe7730/DelayMap/actions/workflows/node.js.yml/badge.svg)](https://github.com/Robbe7730/DelayMap/actions/workflows/node.js.yml)
[![Backend](https://github.com/Robbe7730/DelayMapI/actions/workflows/rust.yml/badge.svg)](https://github.com/Robbe7730/DelayMapI/actions/workflows/rust.yml)

A map that shows the delays and position of Belgian trains.

Currently running at <https://delaymap.robbevanherck.be/>.

The API can be found at <https://github.com/Robbe7730/DelayMapI>

## Running the frontend

1. Make sure [the API](https://github.com/Robbe7730/DelayMapI) is running
2. Create a config file in `config/config.json` as follows:

```json
{
    "API_URL": "http://localhost:8000",
    "DEFAULT_CENTER_X": 50.502,
    "DEFAULT_CENTER_Y": 4.335,
    "DEFAULT_ZOOM": 8
    "MT_KEY": "Your_Maptiler_Key",
}
```

3. Start the frontend by running `npm run dev`
4. Go to https://localhost:8080/
