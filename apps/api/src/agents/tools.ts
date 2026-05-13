import { DynamicTool } from '@langchain/core/tools';
import {
  fetchCurrentWeather,
  fetchHistoricalWeather,
  geocodeCity,
  reverseGeocode,
  getConditionFromCode,
} from '../utils/weather.service.js';
import { City } from '../models/City.js';
import { computeCalendarAlerts } from '../utils/computeCalendarAlerts.js';
import { calculateStreak } from '../utils/streak.js';

type ToolInput = string | string[] | Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Helper: extract string arg from either a raw string or { field: string }
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
      const alerts = await computeCalendarAlerts(userId);
      if (!alerts.length)
        return 'No upcoming calendar weather alerts. Connect your Google Calendar in Settings to get alerts.';

      return alerts
        .slice(0, 10)
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
// 10. get_local_weather
// ──────────────────────────────────────────────────────────────
const getLocalWeather = new DynamicTool({
  name: 'get_local_weather',
  description:
    'Fetches detailed local weather for specific coordinates (latitude, longitude). Returns current conditions, 7-day forecast, historical data, and weather streak. Input: latitude and longitude as numbers.',
  func: async (input: ToolInput) => {
    const isRecordInput = isRecord(input) ? input : { input };
    const rawLat = isRecordInput.lat ?? isRecordInput.latitude ?? input;
    const rawLon = isRecordInput.lon ?? isRecordInput.longitude ?? input;

    let lat: number, lon: number;
    if (typeof rawLat === 'number' && typeof rawLon === 'number') {
      lat = rawLat;
      lon = rawLon;
    } else {
      const str = typeof input === 'string' ? input : JSON.stringify(input);
      const parts = str
        .replace(/[^0-9.\-,\s]/g, '')
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1]))
        return 'Please provide latitude and longitude. Example: get_local_weather with lat=51.5, lon=-0.12';
      lat = parts[0];
      lon = parts[1];
    }

    try {
      const [city, weatherData, histData] = await Promise.all([
        reverseGeocode(lat, lon),
        fetchCurrentWeather(lat, lon),
        fetchHistoricalWeather(lat, lon, 14),
      ]);

      const current = weatherData.current;
      const daily = weatherData.daily;
      const condition = getConditionFromCode(current.weather_code);

      const history: { date: string; condition: string }[] = [];
      for (let i = 0; i < histData.daily.time.length; i++) {
        history.push({
          date: histData.daily.time[i],
          condition: getConditionFromCode(histData.daily.weather_code[i]),
        });
      }
      const streak = calculateStreak(history);

      const cityName = city?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const country = city?.country ?? '';

      const lines = [
        `📍 ${cityName}${country ? ', ' + country : ''}`,
        `Current: ${Math.round(current.temperature_2m)}°C — ${condition}`,
        `Feels like: ${Math.round(current.apparent_temperature)}°C`,
        `Humidity: ${current.relative_humidity_2m}% | Wind: ${Math.round(current.wind_speed_10m)} km/h`,
        `Precipitation: ${current.precipitation} mm`,
        '',
        `Today: H ${Math.round(daily.temperature_2m_max[0])}° / L ${Math.round(daily.temperature_2m_min[0])}° — ${getConditionFromCode(daily.weather_code[0])}`,
      ];

      for (let i = 1; i < Math.min(daily.time.length, 7); i++) {
        const d = new Date(daily.time[i]);
        const dayName = d.toLocaleDateString('en', { weekday: 'short' });
        lines.push(
          `${dayName}: ${getConditionFromCode(daily.weather_code[i])} — H ${Math.round(daily.temperature_2m_max[i])}° / L ${Math.round(daily.temperature_2m_min[i])}°`
        );
      }

      if (streak) lines.push('', `📊 Streak: ${streak.label}`);

      return lines.join('\n');
    } catch (err: unknown) {
      return `Failed to fetch weather data: ${getErrorMessage(err)}`;
    }
  },
});

// ──────────────────────────────────────────────────────────────
// 11. add_city
// ──────────────────────────────────────────────────────────────
const addCity = (userId: string) =>
  new DynamicTool({
    name: 'add_city',
    description:
      'Searches for a city worldwide by name and adds it to the user\'s weather dashboard. Input: city name or query (e.g., "Mumbai" or "New York, US").',
    func: async (input: ToolInput) => {
      const query = extractStringArg(input, 'query');
      try {
        const results = await geocodeCity(query);
        if (!results.length)
          return `No city found matching "${query}". Try a different spelling or add the country name.`;

        const top = results[0];
        await City.create({
          userId,
          name: top.name,
          country: top.country,
          countryCode: top.countryCode,
          lat: top.lat,
          lon: top.lon,
        });
        return `✅ Added **${top.name}**, ${top.country} to your dashboard.\nCoordinates: ${top.lat}, ${top.lon}`;
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as Record<string, unknown>).code === 11000
        ) {
          return `That city is already on your dashboard.`;
        }
        return `Failed to add city: ${getErrorMessage(err)}`;
      }
    },
  });

// ──────────────────────────────────────────────────────────────
// 12. add_favorite_city
// ──────────────────────────────────────────────────────────────
const addFavoriteCity = (userId: string) =>
  new DynamicTool({
    name: 'add_favorite_city',
    description:
      "Searches for a city worldwide by name, adds it to the user's dashboard, and marks it as a favorite. Input: city name or query.",
    func: async (input: ToolInput) => {
      const query = extractStringArg(input, 'query');
      try {
        const results = await geocodeCity(query);
        if (!results.length)
          return `No city found matching "${query}". Try a different spelling or add the country name.`;

        const top = results[0];

        // Check if already exists
        const existing = await City.findOne({ userId, lat: top.lat, lon: top.lon });
        if (existing) {
          if (!existing.isFavorite) {
            existing.isFavorite = true;
            await existing.save();
            return `⭐ **${existing.name}** is already on your dashboard — marked as favorite.`;
          }
          return `⭐ **${existing.name}** is already in your favorites.`;
        }

        const city = await City.create({
          userId,
          name: top.name,
          country: top.country,
          countryCode: top.countryCode,
          lat: top.lat,
          lon: top.lon,
          isFavorite: true,
        });
        return `⭐ Added **${city.name}**, ${city.country} to your favorites!`;
      } catch (err: unknown) {
        return `Failed to add favorite: ${getErrorMessage(err)}`;
      }
    },
  });

// ──────────────────────────────────────────────────────────────
// 13. generate_advisory
// ──────────────────────────────────────────────────────────────
const generateAdvisory = (userId: string) =>
  new DynamicTool({
    name: 'generate_advisory',
    description:
      "Generates a comprehensive weather advisory briefing across all of the user's saved cities. Highlights extreme conditions, active weather streaks, and anything noteworthy. Use this when the user asks for a weather briefing, summary, or if there's anything they should know about their cities.",
    func: async () => {
      const cities = await City.find({ userId }).sort({ isFavorite: -1 });
      if (!cities.length)
        return "You haven't added any cities yet. Use **add_city** to add cities to your dashboard, then I can generate a weather briefing.";

      const results = await Promise.allSettled(
        cities.map(async (city) => {
          const [weatherData, histData] = await Promise.all([
            fetchCurrentWeather(city.lat, city.lon),
            fetchHistoricalWeather(city.lat, city.lon, 14),
          ]);

          const current = weatherData.current;
          const daily = weatherData.daily;
          const condition = getConditionFromCode(current.weather_code);
          const tempMax = Math.round(daily.temperature_2m_max[0]);
          const tempMin = Math.round(daily.temperature_2m_min[0]);

          const days: { date: string; condition: string }[] = [];
          for (let i = 0; i < histData.daily.time.length; i++) {
            days.push({
              date: histData.daily.time[i],
              condition: getConditionFromCode(histData.daily.weather_code[i]),
            });
          }
          const streak = calculateStreak(days);

          const alerts: string[] = [];
          if (condition === 'stormy') alerts.push('⛈️ Stormy conditions');
          if (current.temperature_2m > 35) alerts.push('🔥 Extreme heat');
          if (current.temperature_2m < 0) alerts.push('🥶 Freezing');
          if (current.precipitation > 10) alerts.push('🌧️ Heavy rain');
          if (current.wind_speed_10m > 50) alerts.push('💨 High wind');

          return {
            name: city.name,
            country: city.country,
            isFavorite: city.isFavorite,
            temp: Math.round(current.temperature_2m),
            condition,
            tempMax,
            tempMin,
            humidity: current.relative_humidity_2m,
            wind: Math.round(current.wind_speed_10m),
            precipitation: current.precipitation,
            streak: streak?.label ?? null,
            alerts,
          };
        })
      );

      const dateStr = new Date().toLocaleDateString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const lines: string[] = [
        `📋 Weather Advisory — ${dateStr}`,
        `Covering ${cities.length} city${cities.length > 1 ? 'ies' : 'y'}`,
        '',
      ];

      for (const result of results) {
        if (result.status === 'rejected') continue;
        const c = result.value;

        const fav = c.isFavorite ? '⭐ ' : '';
        const icon =
          c.condition === 'sunny'
            ? '☀️'
            : c.condition === 'cloudy'
              ? '☁️'
              : c.condition === 'rainy'
                ? '🌧️'
                : c.condition === 'snowy'
                  ? '❄️'
                  : '⛈️';

        const alertBadge = c.alerts.length > 0 ? ` ⚠️` : '';
        lines.push(`${fav}${icon} **${c.name}**, ${c.country}${alertBadge}`);
        lines.push(`   ${c.temp}°C — ${c.condition}  |  H ${c.tempMax}° / L ${c.tempMin}°`);
        lines.push(
          `   Humidity: ${c.humidity}%  |  Wind: ${c.wind} km/h  |  Precip: ${c.precipitation}mm`
        );

        if (c.alerts.length > 0) {
          for (const alert of c.alerts) {
            lines.push(`   ⚠ ${alert}`);
          }
        }
        if (c.streak) {
          lines.push(`   📊 ${c.streak}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('_Ask me for details on any city or for recommendations._');
      return lines.join('\n');
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
  getLocalWeather,
  addCity(userId),
  addFavoriteCity(userId),
  generateAdvisory(userId),
];
