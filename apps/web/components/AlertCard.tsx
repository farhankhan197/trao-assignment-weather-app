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
  high: 'border-red-500/30 bg-red-500/10',
  medium: 'border-amber-500/30 bg-amber-500/10',
  low: 'border-slate-700 bg-slate-900',
};

const SEVERITY_BADGE = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-slate-700 text-slate-400',
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
    <div className={`border rounded-xl p-5 transition-all ${SEVERITY_STYLES[alert.severity]} ${!alert.read ? 'ring-1 ring-sky-500/30' : 'opacity-75'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{CONDITION_ICONS[alert.condition] || '🌡️'}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${SEVERITY_BADGE[alert.severity]}`}>
              {alert.severity}
            </span>
            {!alert.read && (
              <span className="w-2 h-2 bg-sky-500 rounded-full" />
            )}
          </div>

          <h3 className="font-display text-lg mb-1 truncate">{alert.eventTitle}</h3>
          <p className="text-slate-400 text-sm mb-2">{dateStr} · {alert.eventLocation}</p>
          <p className="text-slate-300 text-sm leading-relaxed">{alert.message}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>{Math.round(alert.tempMax)}° / {Math.round(alert.tempMin)}°C</span>
          </div>
        </div>

        {!alert.read && (
          <button
            onClick={() => onMarkRead(alert._id)}
            className="shrink-0 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}
