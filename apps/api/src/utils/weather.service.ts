import axios from 'axios';
import { getCachedData, setCachedData } from './cache.js';

const OWM_KEY = process.env.OWM_API_KEY;

interface GeocodeResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
}

interface CitySearchResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  state: string | null;
}

// Search for cities using OWM Geocoding API (cached 24h)
export const geocodeCity = async (query: string): Promise<CitySearchResult[]> => {
  const cacheKey = `geo:${query.toLowerCase().trim()}`;
  const cached = await getCachedData<CitySearchResult[]>(cacheKey);
  if (cached) {
    console.log(`[geocodeCity] Returning cached result for "${query}"`);
    return cached;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct`;
  const { data } = await axios.get<GeocodeResult[]>(url, {
    params: { q: query, limit: 5, appid: OWM_KEY },
  });
  const results = data.map((r) => ({
    name: r.name,
    country: r.country,
    countryCode: r.country,
    lat: r.lat,
    lon: r.lon,
    state: r.state || null,
  }));

  await setCachedData(cacheKey, results, 60 * 60 * 24);
  return results;
};

// Reverse geocode coordinates to city name using OWM Geocoding API (cached 24h)
export const reverseGeocode = async (
  lat: number,
  lon: number
): Promise<{ name: string; country: string } | null> => {
  const cacheKey = `geo:reverse:${lat}:${lon}`;
  const cached = await getCachedData<{ name: string; country: string }>(cacheKey);
  if (cached) {
    console.log(`[reverseGeocode] Returning cached result for lat=${lat}, lon=${lon}`);
    return cached;
  }

  const url = `https://api.openweathermap.org/geo/1.0/reverse`;
  try {
    const { data } = await axios.get<{ name: string; country: string }[]>(url, {
      params: { lat, lon, limit: 1, appid: OWM_KEY },
    });
    if (!data || data.length === 0) return null;
    const result = { name: data[0].name, country: data[0].country };
    await setCachedData(cacheKey, result, 60 * 60 * 24);
    return result;
  } catch {
    return null;
  }
};

// Fetch current weather from Open-Meteo (no API key needed) — cached 15 min
export const fetchCurrentWeather = async (lat: number, lon: number) => {
  const cacheKey = `weather:current:${lat}:${lon}`;
  const cached = await getCachedData<unknown>(cacheKey);
  if (cached) {
    console.log(`[fetchCurrentWeather] Returning cached result for lat=${lat}, lon=${lon}`);
    return cached;
  }

  const url = `https://api.open-meteo.com/v1/forecast`;
  const { data } = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
        'precipitation',
      ].join(','),
      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m',
        'uv_index',
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'weather_code',
        'sunrise',
        'sunset',
        'uv_index_max',
      ].join(','),
      forecast_days: 7,
      timezone: 'auto',
    },
  });

  await setCachedData(cacheKey, data, 15 * 60);
  return data;
};

// Fetch historical weather from Open-Meteo using past_days — cached 6h
export const fetchHistoricalWeather = async (lat: number, lon: number, pastDays: number = 14) => {
  const cacheKey = `weather:hist:${lat}:${lon}:${pastDays}`;
  const cached = await getCachedData<unknown>(cacheKey);
  if (cached) {
    console.log(
      `[fetchHistoricalWeather] Returning cached result for lat=${lat}, lon=${lon}, pastDays=${pastDays}`
    );
    return cached;
  }

  const url = `https://api.open-meteo.com/v1/forecast`;
  const { data } = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weather_code'].join(
        ','
      ),
      past_days: pastDays,
      forecast_days: 1,
      timezone: 'auto',
    },
  });

  await setCachedData(cacheKey, data, 6 * 60 * 60);
  return data;
};

// Fetch air quality data from Open-Meteo Air Quality API — cached 1h
export const fetchAirQuality = async (lat: number, lon: number) => {
  const cacheKey = `aq:${lat}:${lon}`;
  const cached = await getCachedData<unknown>(cacheKey);
  if (cached) {
    console.log(`[fetchAirQuality] Returning cached result for lat=${lat}, lon=${lon}`);
    return cached;
  }

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality`;
  try {
    const { data } = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        current: ['european_aqi', 'us_aqi', 'pm2_5', 'pm10'].join(','),
        forecast_days: 1,
      },
    });
    await setCachedData(cacheKey, data, 60 * 60);
    return data;
  } catch {
    return null;
  }
};

// Map WMO weather code to human-readable condition
export const getConditionFromCode = (code: number): string => {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 57) return 'rainy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'rainy';
  return 'stormy';
};
