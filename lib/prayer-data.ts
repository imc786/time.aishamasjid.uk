/**
 * Prayer data loading and management
 *
 * Handles loading, validating, and transforming prayer time data.
 * Uses static imports for bundling efficiency and Zod for runtime validation.
 *
 * Only current year (2025) and next year (2026) are imported to minimise bundle size.
 * Historical data (2023, 2024) is not needed for production use.
 */

// Static imports for current and next year only
import athan2025 from "@/data/athan/2025.json";
import athan2026 from "@/data/athan/2026.json";
import iqamah2025 from "@/data/iqamah/2025.json";
import iqamah2026 from "@/data/iqamah/2026.json";
import { formatValidationErrors, validateAthanData, validateIqamahData } from "@/lib/schemas/prayer-times";
import type {
  AthanEntry,
  CombinedPrayerTimes,
  CombinedPrayerTimesKey,
  DateString,
  IqamahEntry,
  SupportedYear,
} from "@/lib/types/prayer-times";
import { isSupportedYear } from "@/lib/types/prayer-times";

/**
 * Athan data indexed by year
 */
const athanDataByYear: Record<SupportedYear, unknown> = {
  2025: athan2025,
  2026: athan2026,
};

/**
 * Iqamah data indexed by year
 */
const iqamahDataByYear: Record<SupportedYear, unknown> = {
  2025: iqamah2025,
  2026: iqamah2026,
};

/**
 * Cache for validated data to avoid re-validation
 */
const validatedAthanCache = new Map<SupportedYear, AthanEntry[]>();
const validatedIqamahCache = new Map<SupportedYear, IqamahEntry[]>();

/**
 * Error thrown when prayer data is invalid or unavailable
 */
export class PrayerDataError extends Error {
  constructor(
    message: string,
    public readonly year?: number,
    public readonly dataType?: "athan" | "iqamah",
  ) {
    super(message);
    this.name = "PrayerDataError";
  }
}

/**
 * Get athan data for a specific year with validation
 *
 * @param year - The year to load data for
 * @returns Validated athan entries for the year
 * @throws PrayerDataError if year is unsupported or data is invalid
 */
export function getAthanData(year: number): AthanEntry[] {
  if (!isSupportedYear(year)) {
    throw new PrayerDataError(`Unsupported year: ${year}. Supported years are 2025-2026.`, year, "athan");
  }

  // Check cache first
  const cached = validatedAthanCache.get(year);
  if (cached) {
    return cached;
  }

  // Validate and cache
  const rawData = athanDataByYear[year];
  const result = validateAthanData(rawData);

  if (!result.success) {
    const errorDetails = result.errors ? formatValidationErrors(result.errors) : "Unknown validation error";
    throw new PrayerDataError(`Invalid athan data for ${year}:\n${errorDetails}`, year, "athan");
  }

  validatedAthanCache.set(year, result.data as AthanEntry[]);
  return result.data as AthanEntry[];
}

/**
 * Get iqamah data for a specific year with validation
 *
 * @param year - The year to load data for
 * @returns Validated iqamah entries for the year
 * @throws PrayerDataError if year is unsupported or data is invalid
 */
export function getIqamahData(year: number): IqamahEntry[] {
  if (!isSupportedYear(year)) {
    throw new PrayerDataError(`Unsupported year: ${year}. Supported years are 2025-2026.`, year, "iqamah");
  }

  // Check cache first
  const cached = validatedIqamahCache.get(year);
  if (cached) {
    return cached;
  }

  // Validate and cache
  const rawData = iqamahDataByYear[year];
  const result = validateIqamahData(rawData);

  if (!result.success) {
    const errorDetails = result.errors ? formatValidationErrors(result.errors) : "Unknown validation error";
    throw new PrayerDataError(`Invalid iqamah data for ${year}:\n${errorDetails}`, year, "iqamah");
  }

  validatedIqamahCache.set(year, result.data as IqamahEntry[]);
  return result.data as IqamahEntry[];
}

/**
 * Find athan entry for a specific date
 *
 * @param date - Date to find (Date object or YYYY-MM-DD string)
 * @returns Athan entry for the date, or undefined if not found
 */
export function findAthanByDate(date: Date | DateString): AthanEntry | undefined {
  const dateString = typeof date === "string" ? date : date.toISOString().split("T")[0];
  const year = Number.parseInt(dateString.substring(0, 4), 10);

  try {
    const data = getAthanData(year);
    return data.find((entry) => entry.date === dateString);
  } catch {
    return undefined;
  }
}

/**
 * Find iqamah entry for a specific date
 *
 * @param date - Date to find (Date object or YYYY-MM-DD string)
 * @returns Iqamah entry for the date, or undefined if not found
 */
export function findIqamahByDate(date: Date | DateString): IqamahEntry | undefined {
  const dateString = typeof date === "string" ? date : date.toISOString().split("T")[0];
  const year = Number.parseInt(dateString.substring(0, 4), 10);

  try {
    const data = getIqamahData(year);
    return data.find((entry) => entry.date === dateString);
  } catch {
    return undefined;
  }
}

/**
 * Keys for prayers that can have iqamah times
 */
const PRAYERS_WITH_IQAMAH: CombinedPrayerTimesKey[] = [
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
 * Get combined prayer times for a specific date
 *
 * Merges athan and iqamah data into a single structure with all prayers.
 * Handles Jumu'ah logic (uses Dhuhr athan for Jumu'ah 1, hides Dhuhr iqamah on Fridays).
 * Auto-fills Maghrib iqamah with its athan time.
 *
 * @param date - Date to get times for (Date object or YYYY-MM-DD string)
 * @returns Combined prayer times, or empty structure if data unavailable
 */
export function getCombinedPrayerTimes(date: Date | DateString): CombinedPrayerTimes {
  const dateString = typeof date === "string" ? date : date.toISOString().split("T")[0];

  // Default empty structure
  const empty: CombinedPrayerTimes = {
    date: dateString,
    fajr: { athan: undefined, iqamah: undefined },
    sunrise: { athan: undefined, iqamah: undefined },
    dhuhr: { athan: undefined, iqamah: undefined },
    jumuah1: { athan: undefined, iqamah: undefined },
    jumuah2: { athan: undefined, iqamah: undefined },
    asr: { athan: undefined, iqamah: undefined },
    maghrib: { athan: undefined, iqamah: undefined },
    isha: { athan: undefined, iqamah: undefined },
  };

  const athanTimes = findAthanByDate(dateString);
  const iqamahTimes = findIqamahByDate(dateString);

  if (!athanTimes) {
    return empty;
  }

  const combined: CombinedPrayerTimes = { ...empty };
  const hasJumuah = iqamahTimes?.jumuah1 !== undefined;

  for (const prayer of PRAYERS_WITH_IQAMAH) {
    let athan: string | undefined;
    let iqamah: string | undefined;

    // Determine athan time
    if (prayer === "jumuah1" && hasJumuah) {
      // Jumu'ah 1 uses Dhuhr athan as its start time
      athan = athanTimes.dhuhr;
    } else if (prayer === "jumuah2") {
      // Jumu'ah 2 has no athan (follows immediately after Jumu'ah 1)
      athan = undefined;
    } else if (prayer !== "jumuah1") {
      // Regular prayers use their own athan time
      athan = athanTimes[prayer as keyof AthanEntry] as string | undefined;
    }

    // Determine iqamah time
    if (prayer === "dhuhr" && hasJumuah) {
      // Hide Dhuhr iqamah when Jumu'ah is active
      iqamah = undefined;
    } else if (prayer === "maghrib") {
      // Maghrib iqamah is always same as athan
      iqamah = athanTimes.maghrib;
    } else if (iqamahTimes) {
      // Use the iqamah time from data
      iqamah = iqamahTimes[prayer as keyof IqamahEntry] as string | undefined;
    }

    combined[prayer] = { athan, iqamah };
  }

  return combined;
}

/**
 * Get the year from a Date object, handling timezone correctly
 */
export function getYearFromDate(date: Date): number {
  return date.getFullYear();
}

/**
 * Check if data is available for a given year
 */
export function hasDataForYear(year: number): boolean {
  return isSupportedYear(year);
}

/**
 * Get all supported years
 */
export function getSupportedYears(): SupportedYear[] {
  return [2025, 2026];
}
