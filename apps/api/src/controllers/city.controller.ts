import { Request, Response } from 'express';
import { City } from '../models/City';

// GET /api/cities — all cities for the authenticated user
export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const cities = await City.find({ userId: req.user!.id }).sort({ isFavorite: -1, addedAt: -1 });
    res.json({ cities });
  } catch {
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
      name, country, countryCode, lat, lon,
    });

    res.status(201).json({ city });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'City already added to your dashboard' });
      return;
    }
    res.status(500).json({ error: 'Failed to add city' });
  }
};

// PATCH /api/cities/:id — toggle favorite
export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    city.isFavorite = !city.isFavorite;
    await city.save();

    res.json({ city });
  } catch {
    res.status(500).json({ error: 'Failed to update city' });
  }
};

// DELETE /api/cities/:id — remove city
export const deleteCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await City.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });

    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    res.json({ message: 'City removed' });
  } catch {
    res.status(500).json({ error: 'Failed to delete city' });
  }
};
