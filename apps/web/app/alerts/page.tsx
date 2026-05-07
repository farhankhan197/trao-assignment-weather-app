'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { AlertCard } from '@/components/AlertCard';
import Link from 'next/link';
import api from '@/lib/api';

interface Alert {
  _id: string;
  eventTitle: string;
  eventStart: string;
  eventLocation: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  read: boolean;
}

type FilterType = 'all' | 'unread' | 'high';

export default function AlertsPage() {
  const { loading: authLoading } = useRequireAuth();
  const { refreshAlertCount } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, statusRes] = await Promise.all([
        api.get('/api/calendar/alerts'),
        api.get('/auth/calendar/status'),
      ]);
      setAlerts(alertsRes.data.alerts);
      setCalendarConnected(statusRes.data.connected);
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    let filtered = alerts;
    if (filter === 'unread') filtered = alerts.filter((a) => !a.read);
    if (filter === 'high') filtered = alerts.filter((a) => a.severity === 'high');
    setFilteredAlerts(filtered);
  }, [alerts, filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/api/calendar/alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
      refreshAlertCount();
    } catch {
      // ignore
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">Weather Alerts</h1>
          <p className="text-sm text-[var(--text-muted)]">Calendar events with unusual weather forecasts</p>
        </div>
      </div>

      {!calendarConnected && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 text-center mb-8 shadow-[var(--shadow-sm)]">
          <p className="text-4xl mb-4">📅</p>
          <h2 className="font-display text-xl mb-2">No Calendar Connected</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6 max-w-md mx-auto">
            Link your Google Calendar in Settings to get weather alerts for upcoming events.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {calendarConnected && (
        <>
          <div className="flex items-center gap-2 mb-6">
            {(['all', 'unread', 'high'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-input-hover)]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'unread' && (
                  <span className="ml-1.5 text-xs">
                    ({alerts.filter((a) => !a.read).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">☀️</p>
              <p className="text-[var(--text-muted)]">
                {filter === 'all'
                  ? 'No weather alerts for upcoming events. Looking good!'
                  : filter === 'unread'
                  ? 'No unread alerts.'
                  : 'No high-severity alerts.'}
              </p>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Alerts are generated daily at 6 AM UTC for events in the next 7 days.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="space-y-4"
            >
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert._id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                  }}
                >
                  <AlertCard alert={alert} onMarkRead={handleMarkRead} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
