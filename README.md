# Weather App

A small, static, city-search weather application. It began as a [GreatStack](https://www.youtube.com/@GreatStackDev) tutorial exercise, then was repaired as part of a GitHub accuracy and repository-quality audit (November 2026).

## What changed

The original commit used an empty OpenWeather API key, referenced images not included in the repository, displayed a wind-speed value in the wrong units, and included malformed CSS declarations. The repaired app now:

- Resolves city names through [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api), with optional country/state qualifiers such as "Paris, Texas".
- Requests current **modeled** weather conditions from [Open-Meteo](https://open-meteo.com/en/docs), explicitly using Celsius and kilometers per hour. Open-Meteo's current data are weather-model data, not a guaranteed measurement from a station on your street.
- Displays humidity, wind, temperature, condition, and the local model timestamp without depending on missing PNG files.
- Uses readable errors, a real search form with Enter-key submission, responsive design, visible keyboard focus and status announcements.
- Keeps the page static and dependency-free, with no keys embedded in client code.

## Run locally

No app build step or backend is required. Use any local static server, for example:

§§§bash
python3 -m http.server 8000
§§§

Open http://localhost:8000 in a browser, then search for a location. Alternatively deploy the repository directly to GitHub Pages or another static host. **Use an HTTP server, not a file:// URL**, because JavaScript module loading can be blocked by browser local-file security rules.

## Tests

Requires Node.js 22+ (no npm install needed):

§§§bash
node --test test/*.test.mjs
§§§

GitHub Actions runs the pure weather adapter checks on Node 22 and 24. These tests verify URL construction, metric units, weather-code descriptions, location formatting, and invalid response handling. They **do not** replace an in-browser end-to-end test of the live APIs.

## Data usage and attribution

Weather data: [Open-Meteo](https://open-meteo.com/) · Location data: [GeoNames](https://www.geonames.org/), via Open-Meteo geocoding.

Open-Meteo permits free API access **for non-commercial use**, subject to its terms, request limits, and attribution requirements. Its terms require an appropriate commercial plan for commercial use. Check the [official pricing and licensing terms](https://open-meteo.com/en/pricing) before monetizing or embedding this weather service in a paid product. This demo does not store location searches.

## Scope

- Simple first-match city selection; if the result is ambiguous, include the state or country.
- Requires network connectivity and Open-Meteo availability. Forecast-model values can differ from actual local sensor readings.
- This is an educational demo rather than a severe-weather warning system or a guaranteed real-time observation service.
