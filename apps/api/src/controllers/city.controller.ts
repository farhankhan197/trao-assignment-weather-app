import { Request, Response } from 'express';
import { City } from '../models/City.js';
import { calculateStreak } from '../utils/streak.js';
import {
  fetchCurrentWeather,
  fetchHistoricalWeather,
  getConditionFromCode,
} from '../utils/weather.service.js';

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

// GET /api/cities — all cities for the authenticated user
export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const cities = await City.find({ userId: req.user!.id }).sort({
      isFavorite: -1,
      addedAt: -1,
    });
    res.json({ cities });
  } catch (err) {
    console.error('[City List Error]', err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

// POST /api/cities — add a city
export const addCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, country, countryCode, lat, lon } = req.body;

    if (!name || !lat || !lon) {
      res.status(400).json({ error: 'name, lat, and lon are required' });
      return;
    }

    const city = await City.create({
      userId: req.user!.id,
      name,
      country,
      countryCode,
      lat,
      lon,
    });

    res.status(201).json({ city });
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ error: 'City already added to your dashboard' });
      return;
    }
    console.error('[City Add Error]', err);
    res.status(500).json({ error: 'Failed to add city' });
  }
};

// PATCH /api/cities/:id — toggle favorite
export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    city.isFavorite = !city.isFavorite;
    await city.save();

    res.json({ city });
  } catch (err) {
    console.error('[City ToggleFavorite Error]', err);
    res.status(500).json({ error: 'Failed to update city' });
  }
};

// DELETE /api/cities/:id — remove city
export const deleteCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id,
    });

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    res.json({ message: 'City removed' });
  } catch (err) {
    console.error('[City Delete Error]', err);
    res.status(500).json({ error: 'Failed to delete city' });
  }
};

// GET /api/cities/:id — single city detail
export const getCityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }
    res.json({ city });
  } catch (err) {
    console.error('[City GetById Error]', err);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
};

// GET /api/cities/:id/streak — weather memory streak
export const getCityStreak = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const data = await fetchHistoricalWeather(city.lat, city.lon, 14);
    const days = data.daily.time.map((date: string, i: number) => ({
      date,
      condition: getConditionFromCode(data.daily.weather_code[i]),
    }));

    const streak = calculateStreak(days);
    res.json({ streak });
  } catch (err) {
    console.error('[City Streak Error]', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

// GET /api/cities/:id/details — aggregated city detail
export const getCityDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const [weatherData, histData] = await Promise.all([
      fetchCurrentWeather(city.lat, city.lon),
      fetchHistoricalWeather(city.lat, city.lon, 14),
    ]);

    const current = weatherData.current;
    const daily = weatherData.daily;

    const forecast = (daily?.time || []).slice(0, 7).map((date: string, i: number) => {
      const d = new Date(date + 'T00:00:00');
      return {
        date,
        dayName: d.toLocaleDateString('en', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        condition: getConditionFromCode(daily.weather_code[i]),
        precipitation: daily.precipitation_sum[i],
      };
    });

    const historyDays = histData.daily.time.map((date: string, i: number) => {
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

    res.json({
      city: {
        _id: city._id,
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon,
        isFavorite: city.isFavorite,
      },
      currentWeather: {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        condition: getConditionFromCode(current.weather_code),
        tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m,
        tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
      },
      forecast,
      history: historyDays,
      streak: streak ? { label: streak.label } : null,
    });
  } catch (err) {
    console.error('[City Details Error]', err);
    res.status(500).json({ error: 'Failed to fetch city details' });
  }
};

// GET /api/cities/:id/history — last 15 days of weather
export const getCityHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const data = await fetchHistoricalWeather(city.lat, city.lon, 14);
    const history = data.daily.time.map((date: string, i: number) => ({
      date,
      condition: getConditionFromCode(data.daily.weather_code[i]),
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
    }));

    res.json({ history });
  } catch (err) {
    console.error('[City History Error]', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};
