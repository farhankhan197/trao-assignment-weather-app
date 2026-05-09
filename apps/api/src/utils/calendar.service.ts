import { google } from 'googleapis';
import axios from 'axios';
import { User, IUser } from '../models/User';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Build OAuth2 client
function getOAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth credentials are not configured');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// Generate the URL to redirect user to Google's consent screen
export function generateAuthUrl(state: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly', 'openid', 'email'],
    prompt: 'consent',
    state,
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh the access token using refresh_token
export async function refreshAccessToken(user: IUser): Promise<string | null> {
  if (!user.googleRefreshToken) return null;

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiry = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined;
      await user.save();
      return credentials.access_token;
    }
    return null;
  } catch (err: any) {
    const errorData = err.response?.data;
    const errorMessage = err.message || '';
    const isScopeError =
      errorData?.error === 'insufficient_permissions' ||
      errorData?.error === 'insufficient_authentication_scopes' ||
      errorMessage.includes('insufficient authentication scopes') ||
      errorMessage.includes('insufficient permissions');

    // Refresh token revoked, invalid, or scopes were removed
    if (errorData?.error === 'invalid_grant' || isScopeError) {
      user.calendarConnected = false;
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleTokenExpiry = undefined;
      await user.save();
    }
    return null;
  }
}

// Ensure we have a valid access token, refresh if needed
export async function getValidAccessToken(user: IUser): Promise<string | null> {
  if (!user.calendarConnected || !user.googleAccessToken) return null;

  // If token expires in next 5 minutes, refresh it
  const now = new Date();
  const expiry = user.googleTokenExpiry;
  if (!expiry || expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    return refreshAccessToken(user);
  }

  return user.googleAccessToken;
}

// Fetch upcoming events from Google Calendar (next 7 days)
export async function fetchUpcomingEvents(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: sevenDaysLater.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });

  const items = res.data.items || [];

  return items
    .filter((event: any) => !!event.location)
    .map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: event.start?.dateTime || event.start?.date,
      location: event.location,
    }));
}

// Geocode a raw location string using OpenWeatherMap Geocoding API
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lon: number; name: string } | null> {
  const OWM_KEY = process.env.OWM_API_KEY;
  if (!OWM_KEY) return null;

  try {
    const url = 'https://api.openweathermap.org/geo/1.0/direct';
    const { data } = await axios.get(url, {
      params: { q: location, limit: 1, appid: OWM_KEY },
    });

    if (!data || !data.length) return null;

    return {
      lat: data[0].lat,
      lon: data[0].lon,
      name: data[0].name,
    };
  } catch {
    return null;
  }
}
