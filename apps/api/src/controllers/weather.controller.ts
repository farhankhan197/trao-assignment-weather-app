import { Request, Response } from 'express';
import {
  geocodeCity,
  reverseGeocode,
  fetchCurrentWeather,
  fetchHistoricalWeather,
  getConditionFromCode,
} from '../utils/weather.service';
import { calculateStreak } from '../utils/streak';
import type { WeatherDay } from '../utils/streak';

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
    const city = await reverseGeocode(Number(lat), Number(lon));
    if (!city) {
      res.status(404).json({ error: 'No city found for the given coordinates' });
      return;
    }
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
