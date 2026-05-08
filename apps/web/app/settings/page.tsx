'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSession } from '@/context/SessionContext';
import api from '@/lib/api';

export default function SettingsPage() {
  const { loading: authLoading } = useRequireAuth();
  const { refreshAlertCount } = useSession();

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
        <p className="text-[var(--text-muted)]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(37,99,235,0.03) 0%, transparent 60%)' }} />
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
        <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your account and integrations</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="font-display text-xl mb-2">Google Calendar</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-md">
              Connect your Google Calendar to get weather alerts for upcoming events with locations.
              We only request read-only access.
            </p>
            {calendarConnected && googleEmail && (
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Currently connected as <span className="text-[var(--text-secondary)]">{googleEmail}</span>
              </p>
            )}
          </div>
          <div className="w-full sm:w-auto">
            {!calendarConnected ? (
              <button
                onClick={handleConnectCalendar}
                className="w-full sm:w-auto bg-gradient-to-r from-[var(--accent)] to-sky-400 hover:from-[var(--accent-hover)] hover:to-sky-300 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Connect Google Calendar
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="text-sm bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-input-hover)] text-[var(--text-secondary)] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                >
                  {checking ? 'Checking...' : 'Refresh Alerts'}
                </button>
                <button
                  onClick={handleDisconnectCalendar}
                  disabled={disconnecting}
                  className="text-sm bg-[var(--danger-light)] hover:bg-[var(--danger-muted)] text-[var(--danger)] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
