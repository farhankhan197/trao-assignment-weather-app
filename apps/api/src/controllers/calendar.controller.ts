import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from '../utils/calendar.service.js';
import { computeCalendarAlerts } from '../utils/computeCalendarAlerts.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

interface CalendarStatePayload {
  userId: string;
}

interface GoogleIdTokenPayload {
  email?: string;
}

// GET /auth/calendar/connect
// Redirects user to Google's OAuth consent screen
export const connectCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Create a signed JWT state parameter to prevent CSRF
    const state = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '10m',
    });

    const url = generateAuthUrl(state);
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
};

// GET /auth/calendar/callback
// Google's OAuth callback — exchanges code for tokens, saves to user
export const calendarCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
      res.redirect(`${CLIENT_URL}/dashboard?calendar=error&message=Missing OAuth parameters`);
      return;
    }

    // Verify state JWT
    let payload: CalendarStatePayload;
    try {
      const verifiedState = jwt.verify(state, process.env.JWT_SECRET as string);
      if (typeof verifiedState === 'string' || !('userId' in verifiedState)) {
        throw new Error('Invalid state payload');
      }
      payload = verifiedState as CalendarStatePayload;
    } catch {
      res.redirect(`${CLIENT_URL}/dashboard?calendar=error&message=Invalid or expired state`);
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.redirect(`${CLIENT_URL}/dashboard?calendar=error&message=User not found`);
      return;
    }

    const tokens = await exchangeCodeForTokens(code);

    // Decode Google ID token to capture the connected Google account email
    let googleEmail: string | undefined;
    if (tokens.id_token) {
      const idPayload = jwt.decode(tokens.id_token) as GoogleIdTokenPayload | null;
      googleEmail = idPayload?.email;
    }

    user.googleAccessToken = tokens.access_token || undefined;
    user.googleRefreshToken = tokens.refresh_token || undefined;
    user.googleTokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    user.googleEmail = googleEmail;
    user.calendarConnected = true;
    await user.save();

    res.redirect(`${CLIENT_URL}/dashboard?calendar=connected`);
  } catch {
    res.redirect(`${CLIENT_URL}/dashboard?calendar=error&message=OAuth failed`);
  }
};

// GET /auth/calendar/status
// Returns whether the user has connected their calendar
export const getCalendarStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.id).select('calendarConnected googleEmail');
    res.json({
      connected: user?.calendarConnected ?? false,
      googleEmail: user?.googleEmail || null,
    });
  } catch {
    res.status(500).json({ error: 'Failed to check calendar status' });
  }
};

// POST /auth/calendar/disconnect
// Revokes calendar access and clears tokens
export const disconnectCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Try to revoke the refresh token with Google (best effort)
    if (user.googleRefreshToken) {
      try {
        await refreshAccessToken(user);
      } catch {
        // Ignore revoke errors
      }
    }

    // Clear all calendar tokens
    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;
    user.googleTokenExpiry = undefined;
    user.googleEmail = undefined;
    user.calendarConnected = false;
    await user.save();

    res.json({ message: 'Calendar disconnected successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
};

// GET /api/calendar/alerts
// Computes up-to-date alerts from Google Calendar events + weather data
export const getCalendarAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const alerts = await computeCalendarAlerts(req.user.id);

    // Map computed alerts to response format (id → _id for client compatibility)
    const mapped = alerts.map((a) => ({
      _id: a.id,
      eventId: a.eventId,
      eventTitle: a.eventTitle,
      eventStart: a.eventStart,
      eventLocation: a.eventLocation,
      condition: a.condition,
      tempMax: a.tempMax,
      tempMin: a.tempMin,
      severity: a.severity,
      message: a.message,
      aiGenerated: a.aiGenerated,
    }));

    res.json({ alerts: mapped });
  } catch {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};
