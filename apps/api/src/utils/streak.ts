export interface WeatherDay {
  date: string;
  condition: string;
}

export interface StreakResult {
  condition: string;
  days: number;
  label: string;
}

export const calculateStreak = (days: WeatherDay[]): StreakResult | null => {
  if (days.length < 2) return null;

  // Sort newest first to count consecutive matching days from today backward
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const latestCondition = sorted[0].condition;
  let streakDays = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].condition === latestCondition) {
      streakDays++;
    } else {
      break;
    }
  }

  if (streakDays < 2) return null;

  const labels: Record<string, string> = {
    sunny: `${streakDays}-day sunshine streak`,
    rainy: `Rainy for ${streakDays} days`,
    cloudy: `Overcast ${streakDays} days running`,
    snowy: `Snow for ${streakDays} days`,
    stormy: `Stormy ${streakDays}-day stretch`,
  };

  return {
    condition: latestCondition,
    days: streakDays,
    label: labels[latestCondition] || `${streakDays} days of ${latestCondition}`,
  };
};
