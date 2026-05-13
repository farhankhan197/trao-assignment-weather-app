import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { CalendarAlert } from '../models/CalendarAlert.js';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from '../utils/calendar.service.js';
import {
  runCalendarAlertScanForUser,
  runCalendarAlertScanForAllUsers,
} from '../utils/calendarAlertJob.js';

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

    // Run initial scan immediately
    runCalendarAlertScanForUser(user._id.toString()).catch(() => {
      /* ignore */
    });

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

    // Delete all calendar alerts for this user
    await CalendarAlert.deleteMany({ userId: user._id });

    res.json({ message: 'Calendar disconnected successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
};

// GET /api/calendar/alerts
// Runs a live scan of upcoming calendar events and returns current alerts
export const getCalendarAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Run live scan: fetches events, checks weather, upserts alerts, cleans up passed
    await runCalendarAlertScanForUser(req.user.id);

    const alerts = await CalendarAlert.find({ userId: req.user.id }).sort({
      read: 1,
      createdAt: -1,
    });

    const unreadCount = await CalendarAlert.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.json({ alerts, unreadCount });
  } catch {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// PATCH /api/calendar/alerts/:id/read
// Mark a specific alert as read
export const markAlertRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const alert = await CalendarAlert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json({ alert });
  } catch {
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};

// POST /api/calendar/alerts/check
// Manually trigger a calendar scan (for testing)
export const manualCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await runCalendarAlertScanForUser(req.user.id);
    res.json({ message: 'Calendar scan completed' });
  } catch {
    res.status(500).json({ error: 'Scan failed' });
  }
};

// GET /api/cron/scan-alerts?secret=xxx
// Triggered by Vercel Cron Jobs to scan all users
export const runCronScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.query.secret !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await runCalendarAlertScanForAllUsers();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Cron scan failed' });
  }
};
