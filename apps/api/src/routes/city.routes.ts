import { Router, Request, Response } from 'express';
import { getCities, addCity, toggleFavorite, deleteCity } from '../controllers/city.controller';
import { authenticate } from '../middleware/authenticate';
import { City } from '../models/City';
import { calculateStreak } from '../utils/streak';
import { fetchHistoricalWeather, getConditionFromCode } from '../utils/weather.service';

const router = Router();

// All city routes require authentication
router.use(authenticate);

router.get('/', getCities);
router.post('/', addCity);
router.patch('/:id', toggleFavorite);
router.delete('/:id', deleteCity);

// GET /api/cities/:id/streak — weather memory streak for a city (live data)
router.get('/:id/streak', async (req: Request, res: Response) => {
  const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!city) { res.status(404).json({ error: 'City not found' }); return; }

  try {
    const data = await fetchHistoricalWeather(city.lat, city.lon, 14); // 14 past + today = 15 days
    const daily = data.daily;

    const days = [];
    for (let i = 0; i < daily.time.length; i++) {
      days.push({
        date: daily.time[i],
        condition: getConditionFromCode(daily.weather_code[i]),
      });
    }

    const streak = calculateStreak(days);
    res.json({ streak });
  } catch {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// GET /api/cities/:id/history — last 15 days of weather for a city (live data)
router.get('/:id/history', async (req: Request, res: Response) => {
  const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!city) { res.status(404).json({ error: 'City not found' }); return; }

  try {
    const data = await fetchHistoricalWeather(city.lat, city.lon, 14); // 14 past + today = 15 days
    const daily = data.daily;

    const history = [];
    for (let i = 0; i < daily.time.length; i++) {
      history.push({
        date: daily.time[i],
        condition: getConditionFromCode(daily.weather_code[i]),
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        precipitation: daily.precipitation_sum[i],
      });
    }

    res.json({ history });
  } catch {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
