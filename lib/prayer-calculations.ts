/**
 * Prayer time calculations
 *
 * Pure functions for calculating prayer states and formatting times.
 * These functions are stateless and can be easily unit tested.
 */

import type { CombinedPrayerTimes, CombinedPrayerTimesKey, PrayerTime } from "@/lib/types/prayer-times";

/**
 * Display state for a prayer row in the table
 */
export type PrayerDisplayState = "now" | "past" | "future";

/**
 * Prayer name for holding duration configuration
 */
export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "jumuah1" | "jumuah2" | "asr" | "maghrib" | "isha";

/**
 * Configuration for prayer holding durations (in milliseconds)
 *
 * Different prayers may have different durations based on their nature:
 * - Fajr: typically shorter (2 rakah)
 * - Jumuah: longer due to khutbah
 * - Other prayers: standard duration
 */
export interface PrayerHoldingDurations {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  jumuah1: number;
  jumuah2: number;
  asr: number;
  maghrib: number;
  isha: number;
}

/**
 * Default prayer holding durations in milliseconds
 *
 * These are the default durations for the "prayer now" state.
 * Can be overridden per-tenant or via configuration.
 */
export const DEFAULT_PRAYER_HOLDING_DURATIONS: PrayerHoldingDurations = {
  fajr: 15 * 60 * 1000, // 15 minutes
  sunrise: 0, // 0 minutes (not used)
  dhuhr: 10 * 60 * 1000, // 10 minutes
  jumuah1: 20 * 60 * 1000, // 20 minutes
  jumuah2: 20 * 60 * 1000, // 20 minutes
  asr: 10 * 60 * 1000, // 10 minutes
  maghrib: 15 * 60 * 1000, // 15 minutes
  isha: 15 * 60 * 1000, // 15 minutes
};

/**
 * Get the holding duration for a specific prayer
 *
 * @param prayer - Prayer name
 * @param durations - Optional custom durations (defaults to DEFAULT_PRAYER_HOLDING_DURATIONS)
 * @returns Duration in milliseconds
 */
export function getPrayerHoldingDuration(
  prayer: string,
  durations: PrayerHoldingDurations = DEFAULT_PRAYER_HOLDING_DURATIONS,
): number {
  const prayerKey = prayer as PrayerName;
  return durations[prayerKey] ?? DEFAULT_PRAYER_HOLDING_DURATIONS.dhuhr; // Fall back to dhuhr duration (15 min)
}

/**
 * Result of finding the next prayer
 */
export interface NextPrayerResult {
  /** Prayer name (e.g., "fajr", "dhuhr", "jumuah1") */
  prayer: string;
  /** Athan time string (HH:MM) or undefined for prayers without athan (e.g., jumuah2) */
  athan: string | undefined;
}

/**
 * Pre-parsed prayer timestamps for use with getNextPrayerMs
 */
export interface ParsedPrayerTimestamps {
  [prayer: string]: { athan: number; iqamah: number | null };
}

/**
 * Result of finding the previous prayer
 */
export interface PreviousPrayerResult {
  /** Prayer name */
  prayer: string;
  /** Athan time as Date */
  athan: Date;
  /** Iqamah time as Date */
  iqamah: Date;
}

/**
 * Format seconds as HH:MM:SS countdown string
 *
 * @param seconds - Total seconds remaining
 * @returns Formatted string like "01:23:45"
 */
export function formatTimeToGo(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Format seconds as a friendly countdown string
 *
 * Examples:
 * - 3661 seconds → "1h 1m 1s"
 * - 125 seconds → "2m 5s"
 * - 45 seconds → "45s"
 * - 3600 seconds → "1h 0m 0s"
 *
 * @param seconds - Total seconds remaining (must be >= 0)
 * @returns Formatted string like "20m 5s" or "1h 30m 0s"
 */
export function formatFriendlyCountdown(seconds: number): string {
  if (seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Convert 24-hour time string to 12-hour format (without AM/PM)
 *
 * @param time24 - Time in "HH:MM" format
 * @returns Time in "H:MM" 12-hour format
 */
export function convertTo12HourFormat(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hours12 = Number.parseInt(hours) % 12 || 12;
  return `${hours12}:${minutes}`;
}

/**
 * Format time for display (currently always 12-hour)
 *
 * @param time24 - Time in "HH:MM" format, or undefined
 * @returns Formatted time string, or empty string if undefined
 */
export function formatTime(time24: string | undefined): string {
  if (!time24) return "";
  return convertTo12HourFormat(time24);
}

/**
 * Get date string in YYYY-MM-DD format from a Date object
 *
 * @param date - Date object
 * @returns Date string in "YYYY-MM-DD" format
 */
export function getDateStringFromDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Find the next prayer based on current time
 *
 * Logic:
 * - Iterates through prayers in order
 * - Returns first prayer where either athan or iqamah hasn't passed yet
 * - If all prayers have passed (after Isha), returns Fajr (next day)
 *
 * @param prayerTimes - Combined prayer times for the day
 * @param currentTime - Current time
 * @returns Next prayer name and athan time
 */
export function getNextPrayer(prayerTimes: CombinedPrayerTimes, currentTime: Date): NextPrayerResult {
  const dateString = prayerTimes.date;

  const activePrayer = Object.entries(prayerTimes).find(([prayer, time]) => {
    if (prayer === "date" || typeof time !== "object" || time === null) {
      return false;
    }

    const prayerTime = time as PrayerTime;

    // Skip prayers with no times defined
    if (!prayerTime.athan && !prayerTime.iqamah) {
      return false;
    }

    const prayerAthanTime = prayerTime.athan ? new Date(`${dateString}T${prayerTime.athan}`) : null;
    const prayerIqamahTime = prayerTime.iqamah ? new Date(`${dateString}T${prayerTime.iqamah}`) : null;

    // Check if the current time is before the athan time
    if (prayerAthanTime && currentTime < prayerAthanTime) {
      return true;
    }

    // Check if the iqamah time is available and the current time is before it
    if (prayerIqamahTime && currentTime < prayerIqamahTime) {
      return true;
    }

    return false;
  });

  // All prayers passed (after Isha), return Fajr (next day uses today's time as approximation)
  if (!activePrayer) {
    return { prayer: "fajr", athan: prayerTimes.fajr.athan };
  }

  const [prayer, time] = activePrayer;
  return { prayer, athan: (time as PrayerTime).athan };
}

/** Prayer order for iteration in getNextPrayerMs */
const PRAYER_ORDER = ["fajr", "sunrise", "dhuhr", "jumuah1", "jumuah2", "asr", "maghrib", "isha"] as const;

/**
 * Find the next prayer using pre-parsed timestamps (performance optimised)
 *
 * This is an optimised version of getNextPrayer that avoids Date object creation
 * by working directly with millisecond timestamps. Use this in high-frequency
 * render loops where performance matters.
 *
 * @param parsedTimes - Pre-parsed prayer timestamps (athan/iqamah as ms since epoch)
 * @param currentTimeMs - Current time in milliseconds since epoch
 * @returns Prayer name of the next prayer
 */
export function getNextPrayerMs(parsedTimes: ParsedPrayerTimestamps, currentTimeMs: number): string {
  for (const prayer of PRAYER_ORDER) {
    const times = parsedTimes[prayer];
    if (!times || (!times.athan && !times.iqamah)) {
      continue;
    }

    // Check if current time is before athan
    if (times.athan && currentTimeMs < times.athan) {
      return prayer;
    }

    // Check if current time is before iqamah
    if (times.iqamah && currentTimeMs < times.iqamah) {
      return prayer;
    }
  }

  // All prayers passed (after Isha), return Fajr
  return "fajr";
}

/**
 * Result of finding the previous prayer using timestamps
 */
export interface PreviousPrayerMsResult {
  /** Prayer name */
  prayer: string;
  /** Athan timestamp (ms since epoch) */
  athanMs: number;
  /** Iqamah timestamp (ms since epoch), or null if no iqamah */
  iqamahMs: number | null;
}

/**
 * Find the previous (currently active) prayer using pre-parsed timestamps (performance optimised)
 *
 * This is an optimised version of getPreviousPrayer that avoids Date object creation
 * by working directly with millisecond timestamps.
 *
 * @param parsedTimes - Pre-parsed prayer timestamps (athan/iqamah as ms since epoch)
 * @param currentTimeMs - Current time in milliseconds since epoch
 * @returns Previous prayer details, or undefined if before first prayer
 */
export function getPreviousPrayerMs(
  parsedTimes: ParsedPrayerTimestamps,
  currentTimeMs: number,
): PreviousPrayerMsResult | undefined {
  // Build list of prayers with valid times, sorted by athan descending
  const prayersWithTimes: Array<{ prayer: string; athanMs: number; iqamahMs: number | null }> = [];

  for (const prayer of PRAYER_ORDER) {
    const times = parsedTimes[prayer];
    if (!times || (!times.athan && !times.iqamah)) {
      continue;
    }
    // Use iqamah as fallback for athan (e.g., jumuah2 has no athan)
    const athanMs = times.athan || times.iqamah || 0;
    prayersWithTimes.push({
      prayer,
      athanMs,
      iqamahMs: times.iqamah,
    });
  }

  // Sort by athan time descending so we can find the latest passed prayer
  prayersWithTimes.sort((a, b) => b.athanMs - a.athanMs);

  // Find the first prayer where current time is after athan
  return prayersWithTimes.find((p) => currentTimeMs >= p.athanMs);
}

/**
 * Check if currently within the "prayer now" holding period (timestamp version)
 *
 * @param iqamahMs - Iqamah timestamp in milliseconds
 * @param currentTimeMs - Current time in milliseconds
 * @param holdingDurationMsOrPrayer - Duration in ms, or prayer name to look up duration (default 15 minutes)
 * @param durations - Optional custom durations when using prayer name lookup
 * @returns True if within holding period
 */
export function isWithinPrayerHoldingPeriodMs(
  iqamahMs: number | null,
  currentTimeMs: number,
  holdingDurationMsOrPrayer: number | string = 15 * 60 * 1000,
  durations?: PrayerHoldingDurations,
): boolean {
  if (!iqamahMs) {
    return false;
  }

  const holdingDurationMs =
    typeof holdingDurationMsOrPrayer === "string"
      ? getPrayerHoldingDuration(holdingDurationMsOrPrayer, durations)
      : holdingDurationMsOrPrayer;

  return currentTimeMs >= iqamahMs && currentTimeMs < iqamahMs + holdingDurationMs;
}

/**
 * Find the previous (currently active) prayer based on current time
 *
 * Logic:
 * - Sorts prayers by athan time
 * - Returns the most recent prayer that has already started
 * - Used for displaying "Prayer Now" state
 *
 * @param prayerTimes - Combined prayer times for the day
 * @param currentTime - Current time
 * @returns Previous prayer details, or undefined if before first prayer
 */
export function getPreviousPrayer(
  prayerTimes: CombinedPrayerTimes,
  currentTime: Date,
): PreviousPrayerResult | undefined {
  const dateString = prayerTimes.date;

  const prayers = Object.entries(prayerTimes)
    .filter(([prayer, time]) => {
      if (prayer === "date" || typeof time !== "object" || time === null) {
        return false;
      }
      const prayerTime = time as PrayerTime;
      // Must have at least athan or iqamah defined
      return prayerTime.athan !== undefined || prayerTime.iqamah !== undefined;
    })
    .map(([prayer, time]) => {
      const prayerTime = time as PrayerTime;
      // Use iqamah as fallback for athan (e.g., jumuah2 has no athan)
      const athanString = prayerTime.athan ?? prayerTime.iqamah;
      return {
        prayer,
        athan: new Date(`${dateString}T${athanString}`),
        iqamah: new Date(`${dateString}T${prayerTime.iqamah}`),
      };
    })
    .sort((a, b) => a.athan.getTime() - b.athan.getTime())
    .reverse(); // Reverse so find() gets the latest prayer that has passed

  return prayers.find((prayer) => currentTime >= prayer.athan);
}

/**
 * Check if currently within the "prayer now" holding period
 *
 * @param previousPrayer - The previous prayer result
 * @param currentTime - Current time
 * @param holdingDurationMsOrUsePrayerDuration - Duration in ms, or true to use per-prayer duration (default 15 minutes)
 * @param durations - Optional custom durations when using prayer-based lookup
 * @returns True if within holding period
 */
export function isWithinPrayerHoldingPeriod(
  previousPrayer: PreviousPrayerResult | undefined,
  currentTime: Date,
  holdingDurationMsOrUsePrayerDuration: number | boolean = 15 * 60 * 1000,
  durations?: PrayerHoldingDurations,
): boolean {
  if (!previousPrayer?.iqamah) {
    return false;
  }

  const holdingDurationMs =
    holdingDurationMsOrUsePrayerDuration === true
      ? getPrayerHoldingDuration(previousPrayer.prayer, durations)
      : typeof holdingDurationMsOrUsePrayerDuration === "number"
        ? holdingDurationMsOrUsePrayerDuration
        : 15 * 60 * 1000;

  const iqamahTime = previousPrayer.iqamah.getTime();
  const currentTimeMs = currentTime.getTime();

  return currentTimeMs >= iqamahTime && currentTimeMs < iqamahTime + holdingDurationMs;
}

/**
 * Calculate countdown to target time in seconds
 *
 * @param targetTime - Target time to count down to
 * @param currentTime - Current time
 * @returns Seconds until target (can be negative if past)
 */
export function calculateCountdownSeconds(targetTime: Date, currentTime: Date): number {
  return Math.floor((targetTime.getTime() - currentTime.getTime()) / 1000);
}

/**
 * Determines the display state of a prayer row
 *
 * @param prayer - The prayer key (e.g., "fajr", "dhuhr")
 * @param prayerTimes - Combined prayer times for the day
 * @param currentTime - Current time
 * @param currentPrayer - Name of the currently active prayer (if any)
 * @returns Display state: "now", "past", or "future"
 */
export function getPrayerDisplayState(
  prayer: CombinedPrayerTimesKey,
  prayerTimes: CombinedPrayerTimes,
  currentTime: Date,
  currentPrayer?: string,
): PrayerDisplayState {
  if (currentPrayer === prayer) {
    return "now";
  }

  const time = prayerTimes[prayer];
  if (!time) return "future";

  const prayerTime = time.athan ?? time.iqamah;
  if (!prayerTime) return "future";

  const prayerDate = new Date(`${prayerTimes.date}T${prayerTime}`);
  if (currentPrayer && currentTime >= prayerDate) {
    return "past";
  }

  return "future";
}
