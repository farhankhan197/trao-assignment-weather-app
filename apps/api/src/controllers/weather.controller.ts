import { Request, Response } from 'express';
import { geocodeCity, fetchCurrentWeather } from '../utils/weather.service';

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
