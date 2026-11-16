/**
 * Pure weather-adapter functions. No secrets, network calls, or DOM dependencies.
 * Weather and location data: https://open-meteo.com
 */
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

export function buildGeocodingUrl(query) {
  if (typeof query !== "string" || query.trim().length < 2) {
    throw new Error("Enter at least two characters for a city.");
  }
  const params = new URLSearchParams({
    name: query.trim(),
    count: "1",
    language: "en",
    format: "json"
  });
  return GEOCODING_API + "?" + params.toString();
}

export function buildForecastUrl(location) {
  const lat = location?.latitude;
  const lon = location?.longitude;
  if (typeof lat !== "number" || !Number.isFinite(lat) ||
      typeof lon !== "number" || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("This location has invalid coordinates.");
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "1"
  });
  return WEATHER_API + "?" + params.toString();
}

export function formatLocation(location) {
  if (!location || typeof location.name !== "string") {
    throw new Error("Location data is missing.");
  }
  const parts = [location.name, location.admin1, location.country]
    .filter((part) => typeof part === "string" && part.trim().length > 0);
  return [...new Set(parts)].join(", ");
}

/**
 * WMO weather interpretation codes as exposed by Open-Meteo.
 * Emoji stand in for the missing original PNG assets. No external image hosting.
 */
export function describeWeather(code, isDay = true) {
  const daytime = Boolean(isDay);
  if (code === 0) return { description: "Clear sky", symbol: daytime ? "☀️" : "🌙" };
  if (code === 1) return { description: "Mainly clear", symbol: daytime ? "🌤️" : "🌙" };
  if (code === 2) return { description: "Partly cloudy", symbol: "⛅" };
  if (code === 3) return { description: "Overcast", symbol: "☁️" };
  if (code === 45 || code === 48) return { description: "Fog", symbol: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { description: "Drizzle", symbol: "🌦️" };
  if ([61, 63, 65, 66, 67].includes(code)) return { description: "Rain", symbol: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { description: "Snow", symbol: "❄️" };
  if ([80, 81, 82].includes(code)) return { description: "Rain showers", symbol: "🌦️" };
  if ([95, 96, 99].includes(code)) return { description: "Thunderstorm", symbol: "⛈️" };
  return { description: "Conditions unavailable", symbol: "🌡️" };
}

export function parseCurrentWeather(payload) {
  const current = payload?.current;
  const units = payload?.current_units;
  if (!current || typeof current !== "object") {
    throw new Error("Weather data is incomplete. Try again.");
  }
  const fields = ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"];
  if (!fields.every((field) => typeof current[field] === "number" &&
      Number.isFinite(current[field]))) {
    throw new Error("Weather measurements are missing. Try again.");
  }
  if (current.relative_humidity_2m < 0 || current.relative_humidity_2m > 100 ||
      current.wind_speed_10m < 0) {
    throw new Error("Weather measurements are invalid. Try again.");
  }
  if (units && (units.temperature_2m !== "°C" ||
      units.relative_humidity_2m !== "%" || units.wind_speed_10m !== "km/h")) {
    throw new Error("Weather service returned unexpected units.");
  }

  const condition = describeWeather(current.weather_code, current.is_day === 1);
  return {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    condition,
    localTime: typeof current.time === "string" ? current.time.slice(11, 16) : null
  };
}
