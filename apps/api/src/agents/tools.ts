import { DynamicTool } from '@langchain/core/tools';
import {
  fetchCurrentWeather,
  fetchHistoricalWeather,
  geocodeCity,
  getConditionFromCode,
} from '../utils/weather.service';
import { City } from '../models/City';
import { CalendarAlert } from '../models/CalendarAlert';
import { calculateStreak } from '../utils/streak';

type ToolInput = string | string[] | Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Helper: extract string arg from either a raw string or { field: string }
function extractStringArg(input: unknown, fieldName = 'input'): string {
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) return input.map(String).join(', ');
  if (isRecord(input)) {
    const value = input[fieldName] ?? input.query ?? input.city_name ?? input.city;
    return typeof value === 'string' ? value : JSON.stringify(input);
  }
  return String(input);
}

function extractCityNames(input: ToolInput): string[] {
  if (Array.isArray(input))
    return input
      .map(String)
      .map((name) => name.trim())
      .filter(Boolean);

  if (isRecord(input)) {
    const value = input.city_names;
    if (Array.isArray(value))
      return value
        .map(String)
        .map((name) => name.trim())
        .filter(Boolean);
  }

  return extractStringArg(input, 'city_names')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

// ──────────────────────────────────────────────────────────────
// 1. list_agent_capabilities
// ──────────────────────────────────────────────────────────────
const listAgentCapabilities = new DynamicTool({
  name: 'list_agent_capabilities',
  description:
    'Returns a complete list of all weather tools available to this agent and what each one does. Use this when the user asks "what can you do?" or wants to know your capabilities.',
  func: async () => {
    return `You are Mausam, a personal weather analyst. Here are the tools available to you:

1. **get_user_cities** — Returns all cities the user has saved on their dashboard.
2. **get_favorite_cities** — Returns only the cities marked as favorites.
3. **get_weather_current** — Fetches current weather (temperature, condition, humidity, wind, precipitation) for any saved city by name.
4. **get_weather_forecast** — Fetches a 7-day daily forecast (highs, lows, conditions, precipitation) for any saved city.
5. **get_weather_streak** — Analyzes the last 15 days of weather for a saved city and reports any consecutive-day streaks (e.g., "Rainy for 5 days").
6. **search_city_weather** — Searches for any city worldwide by name, geocodes it, and returns current weather. Use this when the user asks about a city they haven't saved.
7. **get_calendar_weather_alerts** — Returns upcoming calendar events that have weather alerts attached (events where the forecast looks unusual).
8. **compare_cities** — Compares current weather across multiple saved cities at once. Accepts an array of city names.

When responding, be concise, friendly, and actionable. Use emoji where appropriate. Always verify data with tools rather than guessing.`;
  },
});

// ──────────────────────────────────────────────────────────────
// 2. get_user_cities
// ──────────────────────────────────────────────────────────────
const getUserCities = (userId: string) =>
  new DynamicTool({
    name: 'get_user_cities',
    description:
      'Returns all cities the user has saved on their dashboard, including their favorite status.',
    func: async () => {
      const cities = await City.find({ userId }).sort({ createdAt: -1 });
      if (!cities.length)
        return 'The user has no cities saved yet. Suggest they add some from the dashboard.';
      return cities.map((c) => `- ${c.name}, ${c.country} ${c.isFavorite ? '⭐' : ''}`).join('\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// 3. get_favorite_cities
// ──────────────────────────────────────────────────────────────
const getFavoriteCities = (userId: string) =>
  new DynamicTool({
    name: 'get_favorite_cities',
    description: 'Returns only the cities the user has marked as favorites.',
    func: async () => {
      const cities = await City.find({ userId, isFavorite: true });
      if (!cities.length) return 'The user has no favorite cities yet.';
      return cities.map((c) => `- ${c.name}, ${c.country}`).join('\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// 4. get_weather_current
// ──────────────────────────────────────────────────────────────
const getWeatherCurrent = (userId: string) =>
  new DynamicTool({
    name: 'get_weather_current',
    description:
      'Fetches current weather for a saved city by name. Returns temperature, condition, humidity, wind speed, and precipitation. Input: city name.',
    func: async (input: ToolInput) => {
      const city_name = extractStringArg(input, 'city_name');
      const city = await City.findOne({
        userId,
        name: { $regex: new RegExp(city_name.trim(), 'i') },
      });
      if (!city)
        return `City "${city_name}" not found in the user's dashboard. Use search_city_weather to look up any city worldwide.`;

      const data = await fetchCurrentWeather(city.lat, city.lon);
      const current = data.current;
      const condition = getConditionFromCode(current.weather_code);

      return [
        `${city.name}, ${city.country}`,
        `Temperature: ${Math.round(current.temperature_2m)}°C (feels like ${Math.round(current.apparent_temperature)}°C)`,
        `Condition: ${condition}`,
        `Humidity: ${current.relative_humidity_2m}%`,
        `Wind: ${Math.round(current.wind_speed_10m)} km/h`,
        `Precipitation: ${current.precipitation} mm`,
      ].join('\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// 5. get_weather_forecast
// ──────────────────────────────────────────────────────────────
const getWeatherForecast = (userId: string) =>
  new DynamicTool({
    name: 'get_weather_forecast',
    description:
      'Fetches a 7-day daily weather forecast for a saved city. Returns day-by-day highs, lows, conditions, and precipitation. Input: city name.',
    func: async (input: ToolInput) => {
      const city_name = extractStringArg(input, 'city_name');
      const city = await City.findOne({
        userId,
        name: { $regex: new RegExp(city_name.trim(), 'i') },
      });
      if (!city)
        return `City "${city_name}" not found in the user's dashboard. Use search_city_weather to look up any city worldwide.`;

      const data = await fetchCurrentWeather(city.lat, city.lon);
      const daily = data.daily;
      const days: string[] = [];

      for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        days.push(
          `${dayName}: ${getConditionFromCode(daily.weather_code[i])} — H ${Math.round(daily.temperature_2m_max[i])}° / L ${Math.round(daily.temperature_2m_min[i])}° | Rain: ${daily.precipitation_sum?.[i] ?? 0}mm`
        );
      }

      return [`📍 7-day forecast for ${city.name}:`, ...days].join('\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// 6. get_weather_streak
// ──────────────────────────────────────────────────────────────
const getWeatherStreak = (userId: string) =>
  new DynamicTool({
    name: 'get_weather_streak',
    description:
      'Analyzes the last 15 days of weather for a saved city and reports any consecutive-day streak (e.g., "Rainy for 5 days", "Sunny streak"). Input: city name.',
    func: async (input: ToolInput) => {
      const city_name = extractStringArg(input, 'city_name');
      const city = await City.findOne({
        userId,
        name: { $regex: new RegExp(city_name.trim(), 'i') },
      });
      if (!city) return `City "${city_name}" not found in the user's dashboard.`;

      const data = await fetchHistoricalWeather(city.lat, city.lon, 14);
      const daily = data.daily;
      const days = [];
      for (let i = 0; i < daily.time.length; i++) {
        days.push({
          date: daily.time[i],
          condition: getConditionFromCode(daily.weather_code[i]),
        });
      }

      const streak = calculateStreak(days);
      if (!streak)
        return `No notable weather streak for ${city.name} right now. Conditions have been mixed over the past two weeks.`;
      return `${city.name}: ${streak.label}`;
    },
  });

// ──────────────────────────────────────────────────────────────
// 7. search_city_weather
// ──────────────────────────────────────────────────────────────
const searchCityWeather = new DynamicTool({
  name: 'search_city_weather',
  description:
    'Searches for any city worldwide by name, geocodes it, and returns current weather. Use this when the user asks about a city they have NOT saved in their dashboard. Input: city name or query.',
  func: async (input: ToolInput) => {
    const query = extractStringArg(input, 'query');
    const results = await geocodeCity(query);
    if (!results.length) return `No city found matching "${query}".`;

    const top = results[0];
    const data = await fetchCurrentWeather(top.lat, top.lon);
    const current = data.current;
    const condition = getConditionFromCode(current.weather_code);

    return [
      `${top.name}${top.state ? ', ' + top.state : ''}, ${top.country}`,
      `Temperature: ${Math.round(current.temperature_2m)}°C (feels like ${Math.round(current.apparent_temperature)}°C)`,
      `Condition: ${condition}`,
      `Humidity: ${current.relative_humidity_2m}%`,
      `Wind: ${Math.round(current.wind_speed_10m)} km/h`,
    ].join('\n');
  },
});

// ──────────────────────────────────────────────────────────────
// 8. get_calendar_weather_alerts
// ──────────────────────────────────────────────────────────────
const getCalendarWeatherAlerts = (userId: string) =>
  new DynamicTool({
    name: 'get_calendar_weather_alerts',
    description:
      'Returns upcoming calendar events that have weather alerts attached. Shows event title, date, location, and the weather warning message.',
    func: async () => {
      const alerts = await CalendarAlert.find({ userId }).sort({ eventStart: 1 }).limit(10);
      if (!alerts.length)
        return 'No upcoming calendar weather alerts. Connect your Google Calendar in Settings to get alerts.';

      return alerts
        .map((a) => {
          const date = new Date(a.eventStart);
          const dateStr = date.toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          return `${a.eventTitle} — ${dateStr} in ${a.eventLocation}\n   ${a.severity.toUpperCase()}: ${a.message}`;
        })
        .join('\n\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// 9. compare_cities
// ──────────────────────────────────────────────────────────────
const compareCities = (userId: string) =>
  new DynamicTool({
    name: 'compare_cities',
    description:
      'Compares current weather across multiple saved cities at once. Input: array of city names (e.g., ["Mumbai", "Delhi", "Shimla"]).',
    func: async (input: ToolInput) => {
      const cityNames = extractCityNames(input);
      if (cityNames.length < 2) return 'Please provide at least 2 city names separated by commas.';

      const results = await Promise.all(
        cityNames.map(async (name: string) => {
          const city = await City.findOne({
            userId,
            name: { $regex: new RegExp(name.trim(), 'i') },
          });
          if (!city) return `❌ ${name}: not found in dashboard`;

          const data = await fetchCurrentWeather(city.lat, city.lon);
          const current = data.current;
          return [
            `${city.name}, ${city.country}`,
            `   Temperature: ${Math.round(current.temperature_2m)}°C — ${getConditionFromCode(current.weather_code)}`,
            `   Humidity: ${current.relative_humidity_2m}% | Wind: ${Math.round(current.wind_speed_10m)} km/h`,
          ].join('\n');
        })
      );

      return results.join('\n\n');
    },
  });

// ──────────────────────────────────────────────────────────────
// Factory: assemble all tools scoped to a user
// ──────────────────────────────────────────────────────────────
export const createWeatherTools = (userId: string) => [
  listAgentCapabilities,
  getUserCities(userId),
  getFavoriteCities(userId),
  getWeatherCurrent(userId),
  getWeatherForecast(userId),
  getWeatherStreak(userId),
  searchCityWeather,
  getCalendarWeatherAlerts(userId),
  compareCities(userId),
];
