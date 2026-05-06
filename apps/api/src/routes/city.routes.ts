import { Router } from 'express';
import { getCities, addCity, toggleFavorite, deleteCity } from '../controllers/city.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All city routes require authentication
router.use(authenticate);

router.get('/', getCities);
router.post('/', addCity);
router.patch('/:id', toggleFavorite);
router.delete('/:id', deleteCity);

export default router;
