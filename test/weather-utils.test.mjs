import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGeocodingUrl,
  buildForecastUrl,
  formatLocation,
  describeWeather,
  parseCurrentWeather
} from "../weather-utils.mjs";

test("geocoding encodes accented, comma-qualified city names safely", () => {
  const url = new URL(buildGeocodingUrl(" Querétaro, Mexico "));
  assert.equal(url.hostname, "geocoding-api.open-meteo.com");
  assert.equal(url.searchParams.get("name"), "Querétaro, Mexico");
  assert.equal(url.searchParams.get("count"), "1");
});

test("requires a meaningful city name", () => {
  assert.throws(() => buildGeocodingUrl(" "), /two characters/);
  assert.throws(() => buildGeocodingUrl("a"), /two characters/);
});

test("forecast explicitly requests Celsius and km/h", () => {
  const url = new URL(buildForecastUrl({ latitude: 20.5888, longitude: -100.3899 }));
  assert.equal(url.hostname, "api.open-meteo.com");
  assert.equal(url.searchParams.get("wind_speed_unit"), "kmh");
  assert.equal(url.searchParams.get("temperature_unit"), "celsius");
  assert.equal(url.searchParams.get("timezone"), "auto");
  assert.match(url.searchParams.get("current"), /relative_humidity_2m/);
});

test("invalid location coordinates are rejected before a network request", () => {
  assert.throws(() => buildForecastUrl({ latitude: 999, longitude: 50 }), /invalid coordinates/);
  assert.throws(() => buildForecastUrl({ latitude: 20, longitude: null }), /invalid coordinates/);
});

test("location display includes state and country when present", () => {
  assert.equal(formatLocation({ name: "Paris", admin1: "Texas", country: "United States" }),
    "Paris, Texas, United States");
  assert.equal(formatLocation({ name: "Berlin", admin1: "Berlin", country: "Germany" }),
    "Berlin, Germany");
});

test("WMO codes cover clear, cloudy, precipitation and unknown states", () => {
  assert.equal(describeWeather(0, true).description, "Clear sky");
  assert.equal(describeWeather(3).description, "Overcast");
  assert.equal(describeWeather(61).description, "Rain");
  assert.equal(describeWeather(95).description, "Thunderstorm");
  assert.equal(describeWeather(999).description, "Conditions unavailable");
  assert.notEqual(describeWeather(0, true).symbol, describeWeather(0, false).symbol);
});

const valid = {
  current: {
    temperature_2m: 19.6,
    relative_humidity_2m: 63.6,
    wind_speed_10m: 13.8,
    weather_code: 2,
    is_day: 1,
    time: "2026-11-16T15:45"
  },
  current_units: {
    temperature_2m: "°C",
    relative_humidity_2m: "%",
    wind_speed_10m: "km/h"
  }
};

test("normalizes current modeled conditions without changing requested units", () => {
  assert.deepEqual(parseCurrentWeather(valid), {
    temperature: 20,
    humidity: 64,
    windSpeed: 14,
    condition: { description: "Partly cloudy", symbol: "⛅" },
    localTime: "15:45"
  });
});

test("rejects malformed measurements and unexpected units", () => {
  assert.throws(() => parseCurrentWeather({}), /incomplete/);
  assert.throws(() => parseCurrentWeather({current:{...valid.current, wind_speed_10m: null}}), /missing/);
  assert.throws(() => parseCurrentWeather({current:{...valid.current, relative_humidity_2m: 500}}), /invalid/);
  assert.throws(() => parseCurrentWeather({
    ...valid, current_units: {...valid.current_units, wind_speed_10m: "m/s"}
  }), /unexpected units/);
});
