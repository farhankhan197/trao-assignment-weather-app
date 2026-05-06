import { WeatherSnapshot } from '../models/WeatherSnapshot';

export interface StreakResult {
  condition: string;
  days: number;
  label: string;
}

export const calculateStreak = async (cityId: string): Promise<StreakResult | null> => {
  // Get last 30 snapshots sorted newest first
  const snapshots = await WeatherSnapshot
    .find({ cityId })
    .sort({ date: -1 })
    .limit(30);

  if (snapshots.length < 2) return null;

  const latestCondition = snapshots[0].condition;
  let streakDays = 1;

  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].condition === latestCondition) {
      streakDays++;
    } else {
      break;
    }
  }

  if (streakDays < 2) return null;

  const labels: Record<string, string> = {
    sunny: `☀️ ${streakDays}-day sunshine streak`,
    rainy: `🌧️ Rainy for ${streakDays} days`,
    cloudy: `☁️ Overcast ${streakDays} days running`,
    snowy: `❄️ Snow for ${streakDays} days`,
    stormy: `⛈️ Stormy ${streakDays}-day stretch`,
  };

  return {
    condition: latestCondition,
    days: streakDays,
    label: labels[latestCondition] || `${streakDays} days of ${latestCondition}`,
  };
};
