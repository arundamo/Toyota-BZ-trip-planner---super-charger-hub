import { DistanceUnit } from '../types';

export const KM_PER_MILE = 1.609344;
export const MILES_PER_KM = 0.621371;

/**
 * Converts a distance in miles to the targeted unit (miles or km)
 */
export function convertDistance(miles: number, toUnit: DistanceUnit): number {
  if (toUnit === 'km') {
    return Math.round(miles * KM_PER_MILE);
  }
  return Math.round(miles);
}

/**
 * Formats a distance in miles with unit suffix, e.g. "150 mi" or "241 km"
 */
export function formatDistance(
  miles: number,
  unit: DistanceUnit,
  includeSecondary = false
): string {
  const primaryVal = convertDistance(miles, unit);
  const primaryUnit = unit === 'km' ? 'km' : 'mi';

  if (!includeSecondary) {
    return `${primaryVal} ${primaryUnit}`;
  }

  const secondaryUnit = unit === 'km' ? 'mi' : 'km';
  const secondaryVal = unit === 'km' ? Math.round(miles) : Math.round(miles * KM_PER_MILE);

  return `${primaryVal} ${primaryUnit} (${secondaryVal} ${secondaryUnit})`;
}

/**
 * Formats vehicle range with unit
 */
export function formatRange(
  rangeMiles: number,
  unit: DistanceUnit,
  includeSecondary = false
): string {
  return formatDistance(rangeMiles, unit, includeSecondary);
}

/**
 * Formats incremental delta distance, e.g. "+45 mi" or "+72 km"
 */
export function formatDistanceDelta(miles: number, unit: DistanceUnit): string {
  const val = convertDistance(miles, unit);
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  return `+${val} ${unitLabel}`;
}
