import { Router } from 'express';
import {
  connectCalendar,
  calendarCallback,
  getCalendarStatus,
  disconnectCalendar,
  getCalendarAlerts,
} from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Calendar OAuth routes
router.get('/auth/calendar/connect', authenticate, connectCalendar);
router.get('/auth/calendar/callback', calendarCallback);
router.get('/auth/calendar/status', authenticate, getCalendarStatus);
router.post('/auth/calendar/disconnect', authenticate, disconnectCalendar);

// Calendar alert routes
router.get('/api/calendar/alerts', authenticate, getCalendarAlerts);

export default router;
