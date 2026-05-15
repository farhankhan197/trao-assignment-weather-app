import { Request, Response } from 'express';
import { City } from '../models/City.js';
import {
  fetchCurrentWeather,
  fetchHistoricalWeather,
  getConditionFromCode,
} from '../utils/weather.service.js';
import { calculateStreak } from '../utils/streak.js';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const cities = await City.find({ userId: req.user!.id })
      .sort({ isFavorite: -1, addedAt: -1 })
      .lean();

    const results = await Promise.all(
      cities.map(async (city) => {
        try {
          const [weatherData, histData] = await Promise.all([
            fetchCurrentWeather(city.lat, city.lon),
            fetchHistoricalWeather(city.lat, city.lon, 14),
          ]);

          const current = weatherData.current;
          const daily = weatherData.daily;
          const days = histData.daily.time.map((date: string, i: number) => ({
            date,
            condition: getConditionFromCode(histData.daily.weather_code[i]),
          }));
          const streak = calculateStreak(days);

          return {
            _id: city._id,
            name: city.name,
            country: city.country,
            lat: city.lat,
            lon: city.lon,
            isFavorite: city.isFavorite,
            currentWeather: {
              temperature: current.temperature_2m,
              condition: getConditionFromCode(current.weather_code),
              tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m,
              tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m,
              humidity: current.relative_humidity_2m,
              windSpeed: current.wind_speed_10m,
              precipitation: current.precipitation,
            },
            streak: streak ? { label: streak.label } : null,
          };
        } catch (err) {
          console.error(`[Dashboard] Failed to fetch weather for ${city.name}:`, err);
          return {
            _id: city._id,
            name: city.name,
            country: city.country,
            lat: city.lat,
            lon: city.lon,
            isFavorite: city.isFavorite,
            currentWeather: {
              temperature: 0,
              condition: 'sunny',
              tempMax: 0,
              tempMin: 0,
              humidity: 0,
              windSpeed: 0,
              precipitation: 0,
            },
            streak: null,
          };
        }
      })
    );

    res.json({ cities: results });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};
