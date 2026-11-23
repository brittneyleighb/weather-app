import {
  buildGeocodingUrl,
  buildForecastUrl,
  formatLocation,
  parseCurrentWeather
} from "./weather-utils.mjs";

const form = document.querySelector("#weather-search");
const cityInput = document.querySelector("#city-input");
const submitButton = document.querySelector("#search-button");
const message = document.querySelector("#message");
const weatherPanel = document.querySelector("#weather");
const cityName = document.querySelector("#city-name");
const temperature = document.querySelector("#temperature");
const condition = document.querySelector("#condition");
const conditionIcon = document.querySelector("#condition-icon");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const observationTime = document.querySelector("#observation-time");

let activeController = null;
let requestVersion = 0;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.dataset.kind = isError ? "error" : "info";
  message.hidden = !text;
}

function setBusy(busy) {
  form.setAttribute("aria-busy", String(busy));
  submitButton.disabled = busy;
  submitButton.textContent = busy ? "Searching…" : "See weather";
}

async function getJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("The weather service is unavailable. Please try again.");
  }
  const result = await response.json();
  if (result?.error === true) {
    throw new Error("The weather service could not process the request.");
  }
  return result;
}

function displayWeather(location, weather) {
  cityName.textContent = formatLocation(location);
  temperature.textContent = String(weather.temperature) + "°";
  condition.textContent = weather.condition.description;
  conditionIcon.textContent = weather.condition.symbol;
  conditionIcon.setAttribute("aria-label", weather.condition.description);
  humidity.textContent = String(weather.humidity) + "%";
  wind.textContent = String(weather.windSpeed) + " km/h";
  observationTime.textContent = weather.localTime
    ? "Modeled conditions at " + weather.localTime + " local time"
    : "Current modeled conditions";
  weatherPanel.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  activeController?.abort();
  activeController = null;
  const thisRequest = ++requestVersion;
  if (query.length < 2) {
    setBusy(false);
    showMessage("Enter a city name with at least two characters.", true);
    cityInput.focus();
    return;
  }

  const controller = new AbortController();
  activeController = controller;
  setBusy(true);
  weatherPanel.hidden = true;
  showMessage("Looking up " + query + "…");

  try {
    const geo = await getJson(buildGeocodingUrl(query), controller.signal);
    if (thisRequest !== requestVersion) return;
    const match = Array.isArray(geo.results) ? geo.results[0] : undefined;
    if (!match) {
      throw new Error("No matching city found. Try adding a country or state.");
    }

    const data = await getJson(buildForecastUrl(match), controller.signal);
    const current = parseCurrentWeather(data);
    if (thisRequest !== requestVersion) return;

    displayWeather(match, current);
    showMessage("");
  } catch (error) {
    if (error.name === "AbortError" || thisRequest !== requestVersion) return;
    showMessage(error.message || "Could not load the weather. Try again.", true);
  } finally {
    if (thisRequest === requestVersion) {
      activeController = null;
      setBusy(false);
    }
  }
});
