import { Router, Request, Response } from 'express';
import { getCities, addCity, toggleFavorite, deleteCity } from '../controllers/city.controller';
import { authenticate } from '../middleware/authenticate';
import { City } from '../models/City';
import { WeatherSnapshot } from '../models/WeatherSnapshot';
import { calculateStreak } from '../utils/streak';

const router = Router();

// All city routes require authentication
router.use(authenticate);

router.get('/', getCities);
router.post('/', addCity);
router.patch('/:id', toggleFavorite);
router.delete('/:id', deleteCity);

// GET /api/cities/:id/streak — weather memory streak for a city
router.get('/:id/streak', async (req: Request, res: Response) => {
  // ISOLATION: verify city belongs to user
  const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!city) { res.status(404).json({ error: 'City not found' }); return; }

  const streak = await calculateStreak(city._id.toString());
  res.json({ streak });
});

// GET /api/cities/:id/history — last 7 weather snapshots for a city
router.get('/:id/history', async (req: Request, res: Response) => {
  const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!city) { res.status(404).json({ error: 'City not found' }); return; }

  const history = await WeatherSnapshot
    .find({ cityId: city._id })
    .sort({ date: -1 })
    .limit(7);

  res.json({ history: history.reverse() });
});

export default router;
