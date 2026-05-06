'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { AlertCard } from '@/components/AlertCard';
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
  const { user, loading: authLoading } = useRequireAuth();
  const { refreshAlertCount } = useAuth();
  const router = useRouter();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, statusRes] = await Promise.all([
        api.get('/api/calendar/alerts'),
        api.get('/auth/calendar/status'),
      ]);
      setAlerts(alertsRes.data.alerts);
      setCalendarConnected(statusRes.data.connected);
      setGoogleEmail(statusRes.data.googleEmail || null);
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

  const handleConnectCalendar = async () => {
    try {
      const res = await api.get('/auth/calendar/connect');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch {
      alert('Failed to start Google OAuth flow');
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await api.post('/api/calendar/alerts/check');
      await fetchAlerts();
      await refreshAlertCount();
    } catch {
      alert('Check failed. Make sure calendar is connected.');
    } finally {
      setChecking(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) return;
    setDisconnecting(true);
    try {
      await api.post('/auth/calendar/disconnect');
      setCalendarConnected(false);
      setGoogleEmail(null);
      setAlerts([]);
      await refreshAlertCount();
    } catch {
      alert('Failed to disconnect calendar.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-1">Weather Alerts</h1>
          <p className="text-slate-400">Calendar events with unusual weather forecasts</p>
          {calendarConnected && googleEmail && (
            <p className="text-slate-500 text-sm mt-1">Connected as {googleEmail}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {calendarConnected && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualCheck}
                disabled={checking}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Refresh'}
              </button>
              <button
                onClick={handleDisconnectCalendar}
                disabled={disconnecting}
                className="text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>
      </div>

      {!calendarConnected && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mb-8">
          <p className="text-4xl mb-4">📅</p>
          <h2 className="font-display text-xl mb-2">Connect Google Calendar</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Link your Google Calendar to get weather alerts for upcoming events. We only request read-only access.
          </p>
          <button
            onClick={handleConnectCalendar}
            className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Connect Google Calendar
          </button>
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
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
              <p className="text-slate-400">
                {filter === 'all'
                  ? 'No weather alerts for upcoming events. Looking good!'
                  : filter === 'unread'
                  ? 'No unread alerts.'
                  : 'No high-severity alerts.'}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Alerts are generated daily at 6 AM UTC for events in the next 7 days.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert._id} alert={alert} onMarkRead={handleMarkRead} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
