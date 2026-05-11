import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { runWeatherAgent } from '../agents/weatherAgent';
import { City } from '../models/City';

const router = Router();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error('[AI Agent Error]', message);
    res.status(500).json({ error: message || 'AI agent failed' });
  }
});

// GET /api/ai/insights
// auto-generates personalized weather insights for favorite cities
router.get('/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const favorites = await City.find({
      userId: req.user!.id,
      isFavorite: true,
    });

    if (!favorites.length) {
      res.json({
        insights:
          'No favorite cities set. Mark some cities as favorites to get personalized insights.',
      });
      return;
    }

    const cityList = favorites.map((c) => c.name).join(', ');
    const prompt = `Generate a concise, friendly weather overview for my favorite cities: ${cityList}.
    For each city, get the current weather, then provide actionable insights:
    what to wear, whether to carry an umbrella, best time to go outside.
    Keep the total response under 300 words. Be warm and conversational.`;

    const insights = await runWeatherAgent(req.user!.id, prompt);
    res.json({ insights });
  } catch (err: unknown) {
    console.error('[AI Agent Error]', getErrorMessage(err));
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
