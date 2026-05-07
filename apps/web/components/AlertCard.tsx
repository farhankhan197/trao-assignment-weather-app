'use client';

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

interface Props {
  alert: Alert;
  onMarkRead: (id: string) => void;
}

const SEVERITY_STYLES = {
  high: 'border-[var(--danger)] bg-[var(--danger-light)] shadow-[var(--shadow-sm)]',
  medium: 'border-[var(--warning)] bg-[var(--warning-light)] shadow-[var(--shadow-sm)]',
  low: 'border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]',
};

const SEVERITY_BADGE = {
  high: 'bg-[var(--danger-muted)] text-[var(--danger)]',
  medium: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  low: 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]',
};

const CONDITION_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️',
};

export function AlertCard({ alert, onMarkRead }: Props) {
  const date = new Date(alert.eventStart);
  const dateStr = date.toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`border rounded-xl p-5 transition-all ${SEVERITY_STYLES[alert.severity]} ${!alert.read ? 'ring-1 ring-[var(--accent)]/30' : 'opacity-75'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{CONDITION_ICONS[alert.condition] || '🌡️'}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${SEVERITY_BADGE[alert.severity]}`}>
              {alert.severity}
            </span>
            {!alert.read && (
              <span className="w-2 h-2 bg-[var(--accent)] rounded-full" />
            )}
          </div>

          <h3 className="font-display text-lg mb-1 truncate">{alert.eventTitle}</h3>
          <p className="text-[var(--text-muted)] text-sm mb-2">{dateStr} · {alert.eventLocation}</p>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{alert.message}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
            <span>{Math.round(alert.tempMax)}° / {Math.round(alert.tempMin)}°C</span>
          </div>
        </div>

        {!alert.read && (
          <button
            onClick={() => onMarkRead(alert._id)}
            className="shrink-0 text-xs bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-input-hover)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}
