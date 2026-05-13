import { Request, Response } from 'express';
import {
  geocodeCity,
  reverseGeocode,
  fetchCurrentWeather,
  fetchHistoricalWeather,
  fetchAirQuality,
  getConditionFromCode,
} from '../utils/weather.service.js';
import { calculateStreak } from '../utils/streak.js';
import type { WeatherDay } from '../utils/streak.js';

// GET /api/weather/search?q={city}
export const searchCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }
    const results = await geocodeCity(q);
    res.json({ results });
  } catch (err) {
    console.error('[Weather Search Error]', err);
    res.status(500).json({ error: 'City search failed' });
  }
};

// GET /api/weather/reverse?lat=X&lon=Y
export const getCurrentCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: 'Valid lat and lon are required' });
      return;
    }
    const latitude = Number(lat);
    const longitude = Number(lon);
    const city = (await reverseGeocode(latitude, longitude)) ?? {
      name: 'Current Location',
      country: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    };
    res.json({ city });
  } catch (err) {
    console.error('[Reverse Geocode Error]', err);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
};

// GET /api/weather/history?lat=X&lon=Y
export const getWeatherHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: 'Valid lat and lon are required' });
      return;
    }
    const data = await fetchHistoricalWeather(Number(lat), Number(lon), 14);
    const history = data.daily.time.map((date: string, i: number) => ({
      date,
      condition: getConditionFromCode(data.daily.weather_code[i]),
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
    }));
    res.json({ history });
  } catch (err) {
    console.error('[Weather History Error]', err);
    res.status(500).json({ error: 'Failed to fetch weather history' });
  }
};

// GET /api/weather/streak?lat=X&lon=Y
export const getWeatherStreak = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: 'Valid lat and lon are required' });
      return;
    }
    const data = await fetchHistoricalWeather(Number(lat), Number(lon), 14);
    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      condition: getConditionFromCode(data.daily.weather_code[i]),
    }));
    const streak = calculateStreak(days);
    res.json({ streak });
  } catch (err) {
    console.error('[Weather Streak Error]', err);
    res.status(500).json({ error: 'Failed to fetch streak data' });
  }
};

// GET /api/weather/local?lat=X&lon=Y — aggregated local weather
export const getLocalWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: 'Valid lat and lon are required' });
      return;
    }
    const latitude = Number(lat);
    const longitude = Number(lon);

    const [city, weatherData, histData, airQuality] = await Promise.all([
      reverseGeocode(latitude, longitude),
      fetchCurrentWeather(latitude, longitude),
      fetchHistoricalWeather(latitude, longitude, 14),
      fetchAirQuality(latitude, longitude),
    ]);

    const current = weatherData.current;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const sunEvents = new Map<string, 'sunrise' | 'sunset'>();
    (daily?.sunrise || []).forEach((time: string) => sunEvents.set(time.slice(0, 13), 'sunrise'));
    (daily?.sunset || []).forEach((time: string) => sunEvents.set(time.slice(0, 13), 'sunset'));

    const currentHour = typeof current?.time === 'string' ? current.time.slice(0, 13) : null;
    const hourlyForecast = (hourly?.time || [])
      .map((time: string, i: number) => ({
        time,
        temperature: hourly.temperature_2m[i],
        precipitationProbability: hourly.precipitation_probability?.[i] ?? 0,
        condition: getConditionFromCode(hourly.weather_code[i]),
        windSpeed: hourly.wind_speed_10m?.[i] ?? 0,
        uvIndex: hourly.uv_index?.[i] ?? 0,
        sunEvent: sunEvents.get(time.slice(0, 13)) ?? null,
      }))
      .filter((point: { time: string }) => !currentHour || point.time.slice(0, 13) >= currentHour);

    const history = histData.daily.time.map((date: string, i: number) => {
      const d = new Date(date + 'T00:00:00');
      return {
        date,
        formattedDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        condition: getConditionFromCode(histData.daily.weather_code[i]),
        tempMax: histData.daily.temperature_2m_max[i],
        tempMin: histData.daily.temperature_2m_min[i],
      };
    });

    const days = histData.daily.time.map((date: string, i: number) => ({
      date,
      condition: getConditionFromCode(histData.daily.weather_code[i]),
    }));
    const streak = calculateStreak(days);

    const aqCurrent = airQuality?.current;

    res.json({
      city: city ?? {
        name: 'Current Location',
        country: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      },
      currentWeather: {
        temperature: current.temperature_2m,
        condition: getConditionFromCode(current.weather_code),
        tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m,
        tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        sunrise: daily?.sunrise?.[0] ?? null,
        sunset: daily?.sunset?.[0] ?? null,
        uvIndexMax: daily?.uv_index_max?.[0] ?? null,
      },
      hourly: hourlyForecast,
      airQuality: aqCurrent
        ? {
            europeanAqi: aqCurrent.european_aqi ?? null,
            usAqi: aqCurrent.us_aqi ?? null,
            pm25: aqCurrent.pm2_5 ?? null,
            pm10: aqCurrent.pm10 ?? null,
          }
        : null,
      history,
      streak: streak ? { label: streak.label } : null,
    });
  } catch (err) {
    console.error('[Local Weather Error]', err);
    res.status(500).json({ error: 'Failed to fetch local weather' });
  }
};

// GET /api/weather/current?lat=X&lon=Y
export const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      res.status(400).json({ error: 'Valid lat and lon are required' });
      return;
    }
    const data = await fetchCurrentWeather(Number(lat), Number(lon));
    res.json(data);
  } catch (err) {
    console.error('[Weather Current Error]', err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
};
