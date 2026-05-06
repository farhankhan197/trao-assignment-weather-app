import { Router } from 'express';
import { searchCity, getCurrentWeather } from '../controllers/weather.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/search', authenticate, searchCity);
router.get('/current', authenticate, getCurrentWeather);

export default router;
