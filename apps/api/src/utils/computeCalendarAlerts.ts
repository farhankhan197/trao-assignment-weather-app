import { User } from '../models/User.js';
import { getValidAccessToken, fetchUpcomingEvents, geocodeLocation } from './calendar.service.js';
import { fetchCurrentWeather } from './weather.service.js';
import { checkWeatherForAlert } from './alertEngine.js';
import { generateAlertMessage } from './alertMessageGenerator.js';
import { getCachedData, setCachedData } from './cache.js';

export interface ComputedAlert {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStart: string;
  eventLocation: string;
  lat: number;
  lon: number;
  forecastDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  aiGenerated: boolean;
}

interface GroupItem {
  event: { id: string; title: string; start: string; location: string };
  geo: { lat: number; lon: number; name: string };
}

const CACHE_TTL = 5 * 60;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

export async function computeCalendarAlerts(userId: string): Promise<ComputedAlert[]> {
  const cacheKey = `alerts:${userId}`;
  const cached = await getCachedData<ComputedAlert[]>(cacheKey);
  if (cached) return cached;

  const user = await User.findById(userId);
  if (!user || !user.calendarConnected) return [];

  const accessToken = await getValidAccessToken(user);
  if (!accessToken) return [];

  try {
    const events = await fetchUpcomingEvents(accessToken);
    if (!events.length) return [];

    // 1. Geocode all unique locations in parallel
    const uniqueLocations = [...new Set(events.map((e) => e.location))];
    const geoEntries = await Promise.all(
      uniqueLocations.map(async (loc) => {
        const geo = await geocodeLocation(loc);
        return { location: loc, geo };
      })
    );
    const locationGeo = new Map(
      geoEntries.filter((e) => e.geo).map((e) => [e.location, e.geo as NonNullable<typeof e.geo>])
    );

    // 2. Group events by coordinates, fetch weather for unique coords in parallel
    const coordMap = new Map<string, GroupItem[]>();
    for (const event of events) {
      const geo = locationGeo.get(event.location);
      if (!geo) continue;
      const key = `${geo.lat}_${geo.lon}`;
      if (!coordMap.has(key)) coordMap.set(key, []);
      coordMap.get(key)!.push({ event, geo });
    }

    const weatherEntries = await Promise.all(
      [...coordMap.keys()].map(async (key) => {
        const [lat, lon] = key.split('_').map(Number);
        const weather = await fetchCurrentWeather(lat, lon);
        return { key, weather };
      })
    );

    // 3. Assemble results (no API calls)
    const results: ComputedAlert[] = [];
    for (const [key, items] of coordMap) {
      const weather = weatherEntries.find((w) => w.key === key)?.weather;
      if (!weather?.daily?.time) continue;
      const daily = weather.daily;

      for (const { event, geo } of items) {
        try {
          const eventDate = new Date(event.start).toISOString().split('T')[0];
          const dayIndex = daily.time.indexOf(eventDate);
          if (dayIndex === -1) continue;

          const forecastDay = {
            temperature_2m_max: daily.temperature_2m_max[dayIndex],
            temperature_2m_min: daily.temperature_2m_min[dayIndex],
            precipitation_sum: daily.precipitation_sum?.[dayIndex] ?? 0,
            weather_code: daily.weather_code[dayIndex],
          };

          const alertResult = checkWeatherForAlert(event.title, geo.name, eventDate, forecastDay);

          results.push({
            id: `${event.id}_${eventDate}`,
            eventId: event.id,
            eventTitle: event.title,
            eventStart: event.start,
            eventLocation: event.location,
            lat: geo.lat,
            lon: geo.lon,
            forecastDate: eventDate,
            condition: alertResult.condition,
            tempMax: alertResult.tempMax,
            tempMin: alertResult.tempMin,
            precipitation: alertResult.precipitation,
            severity: alertResult.severity,
            message: alertResult.message,
            aiGenerated: false,
          });
        } catch (err: unknown) {
          console.error(`[CalendarAlerts] Event scan failed:`, getErrorMessage(err));
        }
      }
    }

    // Generate AI recommendations for all alerts in parallel
    if (results.length > 0) {
      const groqMessages = await Promise.allSettled(
        results.map((r) =>
          generateAlertMessage({
            eventTitle: r.eventTitle,
            eventLocation: r.eventLocation,
            eventDate: r.forecastDate,
            tempMax: r.tempMax,
            tempMin: r.tempMin,
            condition: r.condition,
            precipitation: r.precipitation,
            severity: r.severity,
          })
        )
      );
      for (let i = 0; i < results.length; i++) {
        const result = groqMessages[i];
        if (result.status === 'fulfilled' && result.value) {
          results[i].message = result.value.message;
          results[i].aiGenerated = result.value.aiGenerated;
        }
      }
    }

    await setCachedData(cacheKey, results, CACHE_TTL);
    return results;
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    const isScopeError =
      errorMessage.includes('insufficient authentication scopes') ||
      errorMessage.includes('insufficient permissions');

    if (isScopeError && user) {
      console.error(
        `[CalendarAlerts] Insufficient scopes for user ${userId}. Disconnecting calendar.`
      );
      user.calendarConnected = false;
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleTokenExpiry = undefined;
      await user.save();
    }

    console.error(`[CalendarAlerts] Scan failed for user ${userId}:`, errorMessage);
    return [];
  }
}
