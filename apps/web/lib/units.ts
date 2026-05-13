export type UnitSystem = 'metric' | 'imperial';

export function formatTemp(celsius: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTempShort(celsius: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round((celsius * 9) / 5 + 32)}°`;
  }
  return `${Math.round(celsius)}°`;
}

export function formatSpeed(kmh: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${(mm * 0.03937).toFixed(1)} in`;
  }
  return `${mm} mm`;
}
