import axios from 'axios';

const OWM_KEY = process.env.OWM_API_KEY;

// Search for cities using OWM Geocoding API
export const geocodeCity = async (query: string) => {
  const url = `https://api.openweathermap.org/geo/1.0/direct`;
  const { data } = await axios.get(url, {
    params: { q: query, limit: 5, appid: OWM_KEY },
  });
  return data.map((r: any) => ({
    name: r.name,
    country: r.country,
    countryCode: r.country,
    lat: r.lat,
    lon: r.lon,
    state: r.state || null,
  }));
};

// Fetch current weather from Open-Meteo (no API key needed)
export const fetchCurrentWeather = async (lat: number, lon: number) => {
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
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'weather_code',
      ].join(','),
      forecast_days: 7,
      timezone: 'auto',
    },
  });
  return data;
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
