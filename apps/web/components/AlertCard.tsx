'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

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
  aiGenerated?: boolean;
}

interface Props {
  alert: Alert;
  onMarkRead: (id: string) => void;
}

const SEVERITY_STYLES = {
  high: 'bg-[#0f172a]',
  medium: 'bg-[#0f172a]',
  low: 'bg-[var(--bg-surface)]',
};

const SEVERITY_BADGE = {
  high: 'bg-[var(--danger)] text-white border-[var(--danger)]',
  medium: 'bg-[var(--warning)] text-white border-[var(--warning)]',
  low: 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border-[var(--border)]',
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
  });
  const timeStr = date.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-xl overflow-hidden shadow-[var(--shadow-sm)] ${SEVERITY_STYLES[alert.severity]} ${!alert.read ? 'ring-1 ring-[var(--accent)]/20' : 'opacity-90'}`}
    >
      {/* Top Section: Event info (left) + Weather (right) */}
      <div className="flex items-start gap-4 p-5">
        {/* Left: Date & Event */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              {dateStr}
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="text-xs text-[var(--text-muted)]">{timeStr}</span>
            {!alert.read && <span className="w-2 h-2 bg-[var(--accent)] rounded-full ml-1" />}
          </div>

          <h3 className="font-display text-lg text-[var(--text-primary)] mb-1 truncate">
            {alert.eventTitle}
          </h3>

          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {alert.eventLocation}
          </div>
        </div>

        {/* Right: Weather Info */}
        <div className="shrink-0 text-right">
          <div className="text-3xl mb-1.5">{CONDITION_ICONS[alert.condition] || '☁️'}</div>

          <span
            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${SEVERITY_BADGE[alert.severity]}`}
          >
            {alert.severity}
          </span>

          <div className="text-sm font-medium text-[var(--text-primary)] mt-1.5">
            {Math.round(alert.tempMax)}° / {Math.round(alert.tempMin)}°
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border)]/30 mx-5" />

      {/* Bottom: Message with Markdown */}
      <div className="px-5 py-4">
        {alert.aiGenerated && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-light)]/50 px-2 py-0.5 rounded-full border border-[var(--accent-muted)]/30">
              AI Recommendation
            </span>
          </div>
        )}
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed prose prose-sm max-w-none alert-message">
          <ReactMarkdown>{alert.message}</ReactMarkdown>
        </div>

        {/* Mark Read */}
        {!alert.read && (
          <div className="flex justify-end mt-3">
            <button
              onClick={() => onMarkRead(alert._id)}
              className="text-xs bg-[var(--bg-surface-hover)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors"
            >
              Mark as read
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
