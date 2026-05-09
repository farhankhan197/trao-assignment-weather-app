import { Router } from 'express';
import {
  getCities,
  addCity,
  toggleFavorite,
  deleteCity,
  getCityById,
  getCityStreak,
  getCityHistory,
} from '../controllers/city.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All city routes require authentication
router.use(authenticate);

router.get('/', getCities);
router.get('/:id', getCityById);
router.post('/', addCity);
router.patch('/:id', toggleFavorite);
router.delete('/:id', deleteCity);
router.get('/:id/streak', getCityStreak);
router.get('/:id/history', getCityHistory);

export default router;
