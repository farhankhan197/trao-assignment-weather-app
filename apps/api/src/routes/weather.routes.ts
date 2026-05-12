import { Router } from 'express';
import {
  searchCity,
  getCurrentCity,
  getWeatherHistory,
  getWeatherStreak,
  getCurrentWeather,
} from '../controllers/weather.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/search', authenticate, searchCity);
router.get('/reverse', authenticate, getCurrentCity);
router.get('/history', authenticate, getWeatherHistory);
router.get('/streak', authenticate, getWeatherStreak);
router.get('/current', authenticate, getCurrentWeather);

export default router;
