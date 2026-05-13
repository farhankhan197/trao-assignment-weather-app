import { getConditionFromCode } from './weather.service.js';

interface AlertCheckResult {
  shouldAlert: boolean;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface ForecastDay {
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum?: number;
  weather_code: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function checkWeatherForAlert(
  eventTitle: string,
  eventLocation: string,
  eventDate: string,
  forecastDay: ForecastDay
): AlertCheckResult {
  const tempMax = forecastDay.temperature_2m_max;
  const tempMin = forecastDay.temperature_2m_min;
  const precipitation = forecastDay.precipitation_sum ?? 0;
  const conditionCode = forecastDay.weather_code;
  const condition = getConditionFromCode(conditionCode);

  let severity: 'low' | 'medium' | 'high' = 'low';
  let message = '';

  // High severity rules
  if (condition === 'stormy') {
    severity = 'high';
    message = `**Stormy weather** expected in ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Consider rescheduling or moving indoors.`;
  } else if (tempMax > 35) {
    severity = 'high';
    message = `**Extreme heat** (${Math.round(tempMax)}°C) expected in ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Stay hydrated and avoid prolonged sun exposure.`;
  } else if (tempMin < 0) {
    severity = 'high';
    message = `**Freezing conditions** (${Math.round(tempMin)}°C) forecast for ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Dress warmly and watch for ice.`;
  }
  // Medium severity rules
  else if (condition === 'rainy' && precipitation > 10) {
    severity = 'medium';
    message = `**Heavy rain** (${Math.round(precipitation)}mm) forecast for ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Bring an umbrella or consider indoor alternatives.`;
  } else if (tempMax > 30) {
    severity = 'medium';
    message = `**Very hot** (${Math.round(tempMax)}°C) expected in ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Stay cool and hydrated.`;
  } else if (tempMin < 5) {
    severity = 'medium';
    message = `**Chilly conditions** (${Math.round(tempMin)}°C) forecast for ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}. Dress in layers.`;
  } else {
    // Low severity / no alert
    severity = 'low';
    message = `${condition.charAt(0).toUpperCase() + condition.slice(1)} conditions expected in ${eventLocation} during "${eventTitle}" on ${formatDate(eventDate)}.`;
  }

  const shouldAlert = severity !== 'low';

  return {
    shouldAlert,
    condition,
    tempMax,
    tempMin,
    precipitation,
    severity,
    message,
  };
}
