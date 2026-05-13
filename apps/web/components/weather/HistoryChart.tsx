'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HistoryPoint {
  date: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
}

interface Props {
  data: HistoryPoint[];
}

export default function HistoryChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 24, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="chartTempMaxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="chartTempMinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          unit="°"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'var(--text-muted)' }}
        />
        <Area
          type="monotone"
          dataKey="tempMax"
          stroke="#0ea5e9"
          strokeWidth={2}
          fill="url(#chartTempMaxGrad)"
          name="High"
        />
        <Area
          type="monotone"
          dataKey="tempMin"
          stroke="#64748b"
          strokeWidth={2}
          fill="url(#chartTempMinGrad)"
          name="Low"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
