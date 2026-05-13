import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export interface GeneratedMessage {
  message: string;
  aiGenerated: boolean;
}

export async function generateAlertMessage(params: {
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  precipitation: number;
  severity: string;
}): Promise<GeneratedMessage> {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return { message: fallbackMessage(params), aiGenerated: false };
  }

  try {
    const llm = new ChatGroq({
      model: 'openai/gpt-oss-120b',
      apiKey: GROQ_KEY,
      temperature: 0.7,
    });

    const formattedDate = new Date(params.eventDate + 'T00:00:00').toLocaleDateString('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const systemPrompt = `You are a helpful weather advisor for a personal weather app called Mausam. Given an event and its weather forecast, write a concise, practical recommendation (2-3 sentences).

Guidelines:
- Be specific to the event — mention it by name.
- Mention the location, date, and key weather details.
- Give actionable advice.
- Use **bold markdown** for emphasis (condition name, temperature).
- Do NOT use emoji.
- Keep it 2-3 sentences.
- Tone: friendly, helpful, professional.`;

    const userPrompt = `Event: "${params.eventTitle}"
Location: ${params.eventLocation}
Date: ${formattedDate}
Forecast: ${params.condition}, ${Math.round(params.tempMax)}°C high / ${Math.round(params.tempMin)}°C low
Precipitation: ${params.precipitation}mm
Severity: ${params.severity}

Write a 2-3 sentence weather recommendation for this event.`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const text = String(response.content).trim();
    if (text) return { message: text, aiGenerated: true };
  } catch (err: unknown) {
    console.error(`[AlertMessageGenerator] LLM failed:`, getErrorMessage(err));
  }

  return { message: fallbackMessage(params), aiGenerated: false };
}

function fallbackMessage(params: {
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  precipitation: number;
  severity: string;
}): string {
  const formattedDate = new Date(params.eventDate + 'T00:00:00').toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const cond = params.condition.charAt(0).toUpperCase() + params.condition.slice(1);

  if (params.severity === 'high') {
    if (params.condition === 'stormy') {
      return `**Stormy weather** expected in ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Consider rescheduling or moving indoors.`;
    }
    if (params.tempMax > 35) {
      return `**Extreme heat** (${Math.round(params.tempMax)}°C) expected in ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Stay hydrated and avoid prolonged sun exposure.`;
    }
    if (params.tempMin < 0) {
      return `**Freezing conditions** (${Math.round(params.tempMin)}°C) forecast for ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Dress warmly and watch for ice.`;
    }
    return `**Severe weather** expected in ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Take precautions.`;
  }

  if (params.severity === 'medium') {
    if (params.condition === 'rainy' && params.precipitation > 10) {
      return `**Heavy rain** (${Math.round(params.precipitation)}mm) forecast for ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Bring an umbrella or consider indoor alternatives.`;
    }
    if (params.tempMax > 30) {
      return `**Very hot** (${Math.round(params.tempMax)}°C) expected in ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Stay cool and hydrated.`;
    }
    if (params.tempMin < 5) {
      return `**Chilly conditions** (${Math.round(params.tempMin)}°C) forecast for ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}. Dress in layers.`;
    }
    return `${cond} conditions worth noting for "${params.eventTitle}" in ${params.eventLocation} on ${formattedDate}. Plan accordingly.`;
  }

  return `${cond} conditions expected in ${params.eventLocation} during "${params.eventTitle}" on ${formattedDate}.`;
}
