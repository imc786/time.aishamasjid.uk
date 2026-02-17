/**
 * Shared hook for prayer time page state
 *
 * Encapsulates all the timer, countdown, and prayer state logic
 * used by different layout variants of the /time page.
 *
 * This hook provides:
 * - Current time (real or simulated)
 * - Prayer times for today
 * - Next and previous prayer information
 * - Countdown string
 * - "Prayer now" holding state
 * - DevTools controls (non-production only)
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDateString, getTomorrowDateString, useSimulatedTime } from "@/hooks/use-simulated-time";
import {
  formatTimeToGo,
  getNextPrayerMs,
  getPrayerHoldingDuration,
  getPreviousPrayerMs,
  isWithinPrayerHoldingPeriodMs,
  type NextPrayerResult,
  type ParsedPrayerTimestamps,
  type PreviousPrayerResult,
} from "@/lib/prayer-calculations";
import { getCombinedPrayerTimes } from "@/lib/prayer-data";
import type { CombinedPrayerTimes } from "@/lib/types/prayer-times";

/**
 * Parse time string to timestamp for a given date
 */
function parseTimeToMs(dateStr: string, timeStr: string | undefined): number {
  if (!timeStr) return 0;
  return new Date(`${dateStr}T${timeStr}`).getTime();
}

/**
 * Parse all prayer times to timestamps for a given day
 * This is done once per day to avoid repeated Date parsing
 *
 * On Fridays, dhuhr is excluded when jumuah1 is active to ensure
 * jumuah1/jumuah2 are highlighted correctly (they share the same athan time).
 */
function parsePrayerTimesToMs(prayerTimes: CombinedPrayerTimes, tomorrowDateStr: string): ParsedPrayerTimestamps {
  const today = prayerTimes.date;
  const prayers = ["fajr", "sunrise", "dhuhr", "jumuah1", "jumuah2", "asr", "maghrib", "isha"] as const;

  // Check if jumuah1 is active (has iqamah defined)
  const jumuah1Active = prayerTimes.jumuah1?.iqamah !== undefined;

  const times: ParsedPrayerTimestamps = {};

  for (const prayer of prayers) {
    // Skip dhuhr when jumuah1 is active (Fridays) - matches UI behaviour
    if (prayer === "dhuhr" && jumuah1Active) {
      continue;
    }

    const details = prayerTimes[prayer];
    if (typeof details === "object" && details !== null) {
      const athanStr = details.athan ?? details.iqamah;
      times[prayer] = {
        athan: parseTimeToMs(today, athanStr),
        iqamah: details.iqamah ? parseTimeToMs(today, details.iqamah) : null,
      };
    }
  }

  // Tomorrow's Fajr for after-Isha countdown
  times.tomorrowFajr = {
    athan: parseTimeToMs(tomorrowDateStr, prayerTimes.fajr.athan),
    iqamah: null,
  };

  return times;
}

/**
 * Return type for the usePrayerPageState hook
 */
export interface PrayerPageState {
  /** Current time (real or simulated) */
  currentTime: Date;
  /** Whether the component has hydrated */
  isHydrated: boolean;
  /** Prayer times for today */
  todayPrayerTimes: CombinedPrayerTimes;
  /** The next upcoming prayer */
  nextPrayer: NextPrayerResult;
  /** The previous (currently active) prayer, if any */
  previousPrayer: PreviousPrayerResult | undefined;
  /** Formatted countdown string (HH:MM:SS) */
  countdown: string;
  /** Whether currently counting down to iqamah (vs athan) */
  isCountingToIqamah: boolean;
  /** Whether to show "prayer now" holding state */
  showPrayerNow: boolean;
  /** Whether iqamah times are available */
  hasIqamah: boolean;
  /** Whether Jumuah 1 has an iqamah time (affects Dhuhr display) */
  jumuah1HasIqamah: boolean;
  /** DevTools state - only relevant in non-production */
  devTools: {
    isSimulating: boolean;
    speed: number;
    setTime: (time: Date) => void;
    setSpeed: (speed: number) => void;
    jumpForward: (minutes: number) => void;
    reset: () => void;
  };
}

/**
 * Hook that provides all state needed for prayer time display pages
 *
 * Encapsulates:
 * - Time simulation (dev only)
 * - Prayer time calculations
 * - Countdown timer
 * - "Prayer now" holding state
 *
 * @returns PrayerPageState object with all prayer page data and controls
 */
export function usePrayerPageState(): PrayerPageState {
  const { currentTime, isHydrated, isSimulating, speed, setSimulatedTime, setSpeed, jumpForward, reset } =
    useSimulatedTime();

  const [isCountingToIqamah, setIsCountingToIqamah] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [showPrayerNow, setShowPrayerNow] = useState(false);

  // Ref to store prayer now timeout for proper cleanup (prevents CPU leak)
  const prayerNowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Performance: Use date string and timestamp for memoisation keys
  const dateString = getDateString(currentTime);
  const tomorrowDateString = getTomorrowDateString(currentTime);
  const currentTimeMs = currentTime.getTime();

  // Memoised prayer times for current date - only recalculate when date changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally depend on dateString to prevent re-fetching every second
  const todayPrayerTimes = useMemo(() => {
    return getCombinedPrayerTimes(currentTime);
  }, [dateString]);

  // Pre-parse all prayer times to timestamps once per day
  // This avoids expensive Date string parsing every second
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally depend on dateString to prevent re-parsing every second
  const parsedTimes = useMemo((): ParsedPrayerTimestamps => {
    return parsePrayerTimesToMs(todayPrayerTimes, tomorrowDateString);
  }, [dateString, todayPrayerTimes]);

  // Calculate next and previous prayers using optimised timestamp functions
  const previousPrayerMs = useMemo(() => getPreviousPrayerMs(parsedTimes, currentTimeMs), [parsedTimes, currentTimeMs]);

  const nextPrayerKey = useMemo(() => getNextPrayerMs(parsedTimes, currentTimeMs), [parsedTimes, currentTimeMs]);

  // For backwards compatibility, also compute the original format objects
  // These are used by the page components that expect NextPrayerResult format
  const previousPrayer = useMemo((): PreviousPrayerResult | undefined => {
    if (!previousPrayerMs) return undefined;
    return {
      prayer: previousPrayerMs.prayer,
      athan: new Date(previousPrayerMs.athanMs),
      iqamah: new Date(previousPrayerMs.iqamahMs ?? previousPrayerMs.athanMs),
    };
  }, [previousPrayerMs]);

  const nextPrayer = useMemo((): NextPrayerResult => {
    const details = todayPrayerTimes[nextPrayerKey as keyof CombinedPrayerTimes];
    const athan = typeof details === "object" && details !== null ? details.athan : undefined;
    return { prayer: nextPrayerKey, athan };
  }, [nextPrayerKey, todayPrayerTimes]);

  // Main timer effect - updates countdown and handles prayer state
  // Performance: Uses pre-parsed timestamps, no Date object creation
  // biome-ignore lint/correctness/useExhaustiveDependencies: Complex dependency chain managed manually
  useEffect(() => {
    const times = parsedTimes[nextPrayerKey];
    if (!times || (!times.athan && !times.iqamah)) {
      return;
    }

    // Use pre-parsed timestamps for all comparisons (simple integer arithmetic)
    const ishaTimeMs = parsedTimes.isha?.iqamah ?? parsedTimes.isha?.athan ?? 0;
    const nextPrayerAthanMs = times.athan || times.iqamah || 0;
    const nextPrayerIqamahMs = times.iqamah;

    let targetTimeMs: number;
    if (currentTimeMs >= ishaTimeMs) {
      // Isha time has passed, count down to Fajr of next day
      targetTimeMs = parsedTimes.tomorrowFajr?.athan ?? 0;
      setIsCountingToIqamah(false);
    } else if (currentTimeMs > nextPrayerAthanMs && nextPrayerIqamahMs) {
      // Athan has passed, count down to iqamah
      targetTimeMs = nextPrayerIqamahMs;
      setIsCountingToIqamah(true);
    } else {
      // Count down to athan
      targetTimeMs = nextPrayerAthanMs;
      setIsCountingToIqamah(false);
    }

    const timeToGoInSeconds = Math.floor((targetTimeMs - currentTimeMs) / 1000);
    setCountdown(formatTimeToGo(timeToGoInSeconds + 1));

    // Handle "prayer now" state using timestamp-based check with per-prayer durations
    if (previousPrayerMs) {
      try {
        // Use per-prayer holding duration (e.g., Jumuah is longer due to khutbah)
        const holdingDuration = getPrayerHoldingDuration(previousPrayerMs.prayer);
        const withinHoldingPeriod = isWithinPrayerHoldingPeriodMs(
          previousPrayerMs.iqamahMs,
          currentTimeMs,
          previousPrayerMs.prayer,
        );

        if (!showPrayerNow && withinHoldingPeriod) {
          setShowPrayerNow(true);

          // Clear any existing timeout before creating new one
          if (prayerNowTimeoutRef.current) {
            clearTimeout(prayerNowTimeoutRef.current);
          }

          // Auto-reset after the prayer-specific duration
          prayerNowTimeoutRef.current = setTimeout(() => {
            setShowPrayerNow(false);
            prayerNowTimeoutRef.current = null;
          }, holdingDuration);
        } else if (showPrayerNow && !withinHoldingPeriod) {
          setShowPrayerNow(false);
        }
      } catch (error) {
        console.error(error);
        setShowPrayerNow(false);
      }
    }

    // Cleanup: clear timeout on unmount or when effect re-runs
    return () => {
      if (prayerNowTimeoutRef.current) {
        clearTimeout(prayerNowTimeoutRef.current);
        prayerNowTimeoutRef.current = null;
      }
    };
  }, [currentTimeMs, parsedTimes, nextPrayerKey, previousPrayerMs, showPrayerNow]);

  // Derived state
  const hasIqamah = todayPrayerTimes.fajr.iqamah !== undefined;
  const jumuah1HasIqamah = todayPrayerTimes.jumuah1?.iqamah !== undefined;

  return {
    currentTime,
    isHydrated,
    todayPrayerTimes,
    nextPrayer,
    previousPrayer,
    countdown,
    isCountingToIqamah,
    showPrayerNow,
    hasIqamah,
    jumuah1HasIqamah,
    devTools: {
      isSimulating,
      speed,
      setTime: setSimulatedTime,
      setSpeed,
      jumpForward,
      reset,
    },
  };
}
