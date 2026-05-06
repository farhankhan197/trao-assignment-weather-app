import { DynamicTool } from '@langchain/core/tools';
import { fetchCurrentWeather, getConditionFromCode } from '../utils/weather.service';
import { City } from '../models/City';

// Factory: create tools scoped to the authenticated userId
export const createWeatherTools = (userId: string) => [

  new DynamicTool({
    name: 'get_user_cities',
    description: 'Returns all cities the user has saved on their dashboard',
    func: async () => {
      const cities = await City.find({ userId });
      if (!cities.length) return 'User has no cities saved.';
      return cities.map(c => `${c.name}, ${c.country} (lat: ${c.lat}, lon: ${c.lon}, favorite: ${c.isFavorite})`).join('\n');
    },
  }),

  new DynamicTool({
    name: 'get_weather_for_city',
    description: 'Fetches current weather for a city by name. Input: city name as saved in user dashboard.',
    func: async (cityName: string) => {
      const city = await City.findOne({ userId, name: { $regex: new RegExp(cityName, 'i') } });
      if (!city) return `City "${cityName}" not found in user's dashboard.`;

      const data = await fetchCurrentWeather(city.lat, city.lon);
      const current = data.current;
      const condition = getConditionFromCode(current.weather_code);

      return JSON.stringify({
        city: city.name,
        country: city.country,
        condition,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
      });
    },
  }),

  new DynamicTool({
    name: 'compare_cities_weather',
    description: 'Compares weather between two cities. Input: "City1 vs City2".',
    func: async (input: string) => {
      const parts = input.split(/\s+vs\s+/i);
      if (parts.length !== 2) return 'Input must be in format: "City1 vs City2"';

      const results = await Promise.all(parts.map(async (name) => {
        const city = await City.findOne({ userId, name: { $regex: new RegExp(name.trim(), 'i') } });
        if (!city) return `${name}: not found`;
        const data = await fetchCurrentWeather(city.lat, city.lon);
        return `${city.name}: ${data.current.temperature_2m}°C, ${getConditionFromCode(data.current.weather_code)}`;
      }));

      return results.join('\n');
    },
  }),
];
