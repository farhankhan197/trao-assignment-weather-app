import cron from 'node-cron';
import { User } from '../models/User';
import { CalendarAlert } from '../models/CalendarAlert';
import { getValidAccessToken, fetchUpcomingEvents, geocodeLocation } from './calendar.service';
import { fetchCurrentWeather } from './weather.service';
import { checkWeatherForAlert } from './alertEngine';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

export async function runCalendarAlertScanForUser(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.calendarConnected) return;

  const accessToken = await getValidAccessToken(user);
  if (!accessToken) return;

  try {
    const events = await fetchUpcomingEvents(accessToken);

    for (const event of events) {
      try {
        // Geocode event location
        const geo = await geocodeLocation(event.location);
        if (!geo) continue;

        // Get weather forecast
        const weather = await fetchCurrentWeather(geo.lat, geo.lon);
        const eventDate = new Date(event.start).toISOString().split('T')[0];

        // Find matching forecast day
        const daily = weather.daily;
        if (!daily || !daily.time) continue;

        const dayIndex = daily.time.indexOf(eventDate);
        if (dayIndex === -1) continue;

        const forecastDay = {
          temperature_2m_max: daily.temperature_2m_max[dayIndex],
          temperature_2m_min: daily.temperature_2m_min[dayIndex],
          precipitation_sum: daily.precipitation_sum?.[dayIndex] ?? 0,
          weather_code: daily.weather_code[dayIndex],
        };

        const alertResult = checkWeatherForAlert(event.title, geo.name, eventDate, forecastDay);

        if (alertResult.shouldAlert) {
          await CalendarAlert.findOneAndUpdate(
            { userId: user._id, eventId: event.id, forecastDate: eventDate },
            {
              userId: user._id,
              eventId: event.id,
              eventTitle: event.title,
              eventStart: new Date(event.start),
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
            },
            { upsert: true, new: true }
          );
        } else {
          // Remove any old alert if weather is now fine
          await CalendarAlert.findOneAndDelete({
            userId: user._id,
            eventId: event.id,
            forecastDate: eventDate,
          });
        }
      } catch (err: unknown) {
        console.error(`[CalendarAlertJob] Event scan failed:`, getErrorMessage(err));
      }
    }

    // Clean up old alerts for passed events
    await CalendarAlert.deleteMany({
      userId: user._id,
      eventStart: { $lt: new Date() },
    });
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    const isScopeError =
      errorMessage.includes('insufficient authentication scopes') ||
      errorMessage.includes('insufficient permissions');

    if (isScopeError && user) {
      console.error(
        `[CalendarAlertJob] Insufficient scopes for user ${userId}. Disconnecting calendar.`
      );
      user.calendarConnected = false;
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleTokenExpiry = undefined;
      await user.save();
    }

    console.error(`[CalendarAlertJob] Scan failed for user ${userId}:`, errorMessage);
  }
}

export async function runCalendarAlertScanForAllUsers() {
  const users = await User.find({ calendarConnected: true });

  for (const user of users) {
    await runCalendarAlertScanForUser(user._id.toString());
  }
}

export function startCalendarAlertJob() {
  // Run daily at 6:00 AM UTC
  cron.schedule('0 6 * * *', async () => {
    await runCalendarAlertScanForAllUsers();
  });
}
