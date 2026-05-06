'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function SettingsPage() {
  const { loading: authLoading } = useRequireAuth();
  const { refreshAlertCount } = useAuth();

  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/auth/calendar/status');
      setCalendarConnected(res.data.connected);
      setGoogleEmail(res.data.googleEmail || null);
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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
      await refreshAlertCount();
      alert('Calendar scan completed');
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
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-1">Settings</h1>
        <p className="text-slate-400">Manage your account and integrations</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl mb-2">Google Calendar</h2>
            <p className="text-slate-400 text-sm max-w-md">
              Connect your Google Calendar to get weather alerts for upcoming events with locations.
              We only request read-only access.
            </p>
            {calendarConnected && googleEmail && (
              <p className="text-slate-500 text-sm mt-2">
                Currently connected as <span className="text-slate-300">{googleEmail}</span>
              </p>
            )}
          </div>
          <div>
            {!calendarConnected ? (
              <button
                onClick={handleConnectCalendar}
                className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Connect Google Calendar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {checking ? 'Checking...' : 'Refresh Alerts'}
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
      </div>
    </div>
  );
}
