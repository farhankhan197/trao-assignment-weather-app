import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { runWeatherAgent } from '../agents/weatherAgent';
import { City } from '../models/City';

const router = Router();

// POST /api/ai/chat
// natural language interaction with weather agent
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  console.log('[AI Route] /chat hit, user:', req.user?.id);
  console.log('[AI Route] Request body:', req.body);
  try {
    const { message } = req.body;
    if (!message) {
      console.log('[AI Route] No message provided');
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    console.log('[AI Route] Calling runWeatherAgent...');
    const response = await runWeatherAgent(req.user!.id, message);
    console.log('[AI Route] runWeatherAgent succeeded, response preview:', String(response).slice(0, 200));
    res.json({ response });
  } catch (err: any) {
    console.error('[AI Route] ERROR:', err.message);
    console.error('[AI Route] ERROR stack:', err.stack);
    res.status(500).json({ error: err.message || 'AI agent failed' });
  }
});

// GET /api/ai/briefing
// generates briefing for favorite cities
router.get('/briefing', authenticate, async (req: Request, res: Response) => {
  console.log('[AI Route] /briefing hit, user:', req.user?.id);
  try {
    const favorites = await City.find({ userId: req.user!.id, isFavorite: true });
    console.log('[AI Route] Favorites found:', favorites.length);

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
  } catch (err: any) {
    console.error('[AI Route] Briefing ERROR:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

export default router;
