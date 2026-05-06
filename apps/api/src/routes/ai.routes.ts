import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { runWeatherAgent } from '../agents/weatherAgent';
import { City } from '../models/City';

const router = Router();

// POST /api/ai/chat
// natural language interaction with weather agent
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const response = await runWeatherAgent(req.user!.id, message);
    res.json({ response });
  } catch (err) {
    console.error('[AI Agent Error]', err);
    res.status(500).json({ error: 'AI agent failed' });
  }
});

// GET /api/ai/briefing
// generates briefing for favorite cities
router.get('/briefing', authenticate, async (req: Request, res: Response) => {
  try {
    const favorites = await City.find({ userId: req.user!.id, isFavorite: true });

    if (!favorites.length) {
      res.json({ briefing: 'No favorite cities set. Mark some cities as favorites to get a personalized briefing.' });
      return;
    }

    const cityList = favorites.map(c => c.name).join(', ');
    const prompt = `Generate a concise, friendly weather briefing for my favorite cities: ${cityList}. 
    For each city, get the current weather, then provide actionable insights: 
    what to wear, whether to carry an umbrella, best time to go outside. 
    Keep the total response under 300 words. Be warm and conversational.`;

    const briefing = await runWeatherAgent(req.user!.id, prompt);
    res.json({ briefing });
  } catch {
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

export default router;
