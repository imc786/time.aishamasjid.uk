/**
 * Prayer times type definitions
 *
 * This module provides type-safe definitions for prayer time data
 * used by the /time page and related components.
 */

/**
 * Time string in 24-hour format (HH:MM)
 */
export type TimeString = string;

/**
 * Date string in ISO format (YYYY-MM-DD)
 */
export type DateString = string;

/**
 * Prayer names used in the system
 */
export const PRAYER_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

/**
 * Extended prayer names including Jumu'ah
 */
export const EXTENDED_PRAYER_NAMES = [...PRAYER_NAMES, "jumuah1", "jumuah2"] as const;
export type ExtendedPrayerName = (typeof EXTENDED_PRAYER_NAMES)[number];

/**
 * Localised display strings for prayer names
 */
export const PRAYER_LOCALE_STRINGS: Record<ExtendedPrayerName | "date" | "athan" | "iqamah" | "prayer", string> = {
  date: "Date",
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  jumuah1: "Jumu'ah",
  jumuah2: "Jumu'ah 2",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  athan: "Athan",
  iqamah: "Iqamah",
  prayer: "Prayer",
} as const;

/**
 * Raw athan times from JSON data file
 * Contains daily prayer start times
 */
export interface AthanEntry {
  date: DateString;
  fajr: TimeString;
  sunrise: TimeString;
  dhuhr: TimeString;
  asr: TimeString;
  maghrib: TimeString;
  isha: TimeString;
}

/**
 * Raw iqamah times from JSON data file
 * Contains daily congregation times (maghrib is auto-calculated from athan)
 */
export interface IqamahEntry {
  date: DateString;
  fajr: TimeString;
  dhuhr: TimeString;
  asr: TimeString;
  isha: TimeString;
  /** First Jumu'ah prayer (Fridays only) */
  jumuah1?: TimeString;
  /** Second Jumu'ah prayer (Fridays only) */
  jumuah2?: TimeString;
}

/**
 * Combined prayer time with both athan and iqamah
 */
export interface PrayerTime {
  athan: TimeString | undefined;
  iqamah: TimeString | undefined;
}

/**
 * Combined prayer times for a single day
 * Merges athan and iqamah data into a single structure
 */
export interface CombinedPrayerTimes {
  date: DateString;
  fajr: PrayerTime;
  sunrise: PrayerTime;
  dhuhr: PrayerTime;
  jumuah1?: PrayerTime;
  jumuah2?: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
}

/**
 * Key type for CombinedPrayerTimes (excluding date)
 */
export type CombinedPrayerTimesKey = keyof Omit<CombinedPrayerTimes, "date">;

/**
 * Display order for prayers on the /time page
 * This guarantees consistent ordering regardless of object property order
 */
export const PRAYER_DISPLAY_ORDER: CombinedPrayerTimesKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "jumuah1",
  "jumuah2",
  "asr",
  "maghrib",
  "isha",
];

/**
 * Prayer state during countdown/display
 */
export interface PrayerState {
  prayer: ExtendedPrayerName;
  athan: Date;
  iqamah: Date;
}

/**
 * Supported years for prayer data
 * Only current year (2025) and next year (2026) are bundled to minimise size.
 */
export type SupportedYear = 2025 | 2026;

/**
 * Check if a year is supported
 */
export function isSupportedYear(year: number): year is SupportedYear {
  return year === 2025 || year === 2026;
}

/**
 * Prayer data for a full year
 */
export interface YearlyPrayerData {
  year: SupportedYear;
  athan: AthanEntry[];
  iqamah: IqamahEntry[];
}
