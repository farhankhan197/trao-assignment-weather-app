/**
 * Map WMO weather code to a readable condition string.
 * Used consistently across the app.
 */
export function getCondition(code: number): string {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  return 'stormy';
}
