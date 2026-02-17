/**
 * PrayerTable component for the /tv/time page
 *
 * Displays list of prayer times with start (athan) and iqamah columns.
 * Highlights current prayer, dims past prayers, and handles Jumu'ah display.
 *
 * Features:
 * - Left-aligned prayer names for better scanning
 * - CSS Grid layout for rigid alignment
 * - Semantic structure
 * - Active state "pop" effect
 */

import { memo } from "react";
import { formatTime, getPrayerDisplayState } from "@/lib/prayer-calculations";
import type { CombinedPrayerTimes } from "@/lib/types/prayer-times";
import { PRAYER_DISPLAY_ORDER, PRAYER_LOCALE_STRINGS } from "@/lib/types/prayer-times";

interface PrayerTableProps {
  /** Combined prayer times for the current day */
  prayerTimes: CombinedPrayerTimes;
  /** Current time for determining past/current/future prayers */
  currentTime: Date;
  /** Name of the current (previous) prayer being prayed */
  currentPrayer?: string;
  /** Whether iqamah times should be shown */
  showIqamah: boolean;
  /** Whether Jumu'ah 1 has an iqamah time (hides Dhuhr on Fridays) */
  jumuah1HasIqamah: boolean;
  /** Whether the component has hydrated (prevents hydration mismatch on highlights) */
  isHydrated?: boolean;
}

export const PrayerTable = memo(function PrayerTable({
  prayerTimes,
  currentTime,
  currentPrayer,
  showIqamah,
  jumuah1HasIqamah,
  isHydrated = false,
}: PrayerTableProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Container: Forced Dark Mode colours */}
      <div className="text-white px-6 py-6 flex flex-col h-full tabular-nums">
        {/* Header: Grid layout, left aligned first col, centred others */}
        <div className="grid grid-cols-3 items-center text-slate-400 text-3xl/16 2xl:text-7xl/26 font-medium shrink-0 pb-4 mb-2">
          <span className="text-left pl-4"></span>
          <span className="text-center">Athan</span>
          <span className={`${showIqamah ? "block" : "hidden"} text-center`}>Iqamah</span>
        </div>

        {/* Prayer rows container - flex-1 and justify-between handles the 6 vs 7 rows flexibility */}
        <div className="flex-1 flex flex-col justify-between">
          {PRAYER_DISPLAY_ORDER.map((prayer) => {
            const time = prayerTimes[prayer];

            if (!time || (time.athan === undefined && time.iqamah === undefined)) {
              return null;
            }

            if (prayer === "dhuhr" && jumuah1HasIqamah) {
              return null;
            }

            const state = isHydrated
              ? getPrayerDisplayState(prayer, prayerTimes, currentTime, currentPrayer)
              : "future";

            // Dynamic classes based on state
            // Forced Dark Mode: Active is white bg with slate-900 text
            const activeClass =
              state === "now"
                ? "bg-white text-slate-900 shadow-[0_0_50px_-12px_rgba(255,255,255,0.3)] scale-[1.02] origin-center z-10 border-transparent"
                : "border-transparent";

            // Past events are smaller and dimmed
            const textClass =
              state === "past"
                ? "opacity-40 text-2xl lg:text-4xl xl:text-3xl 2xl:text-6xl" // Smaller
                : state === "now"
                  ? "text-3xl lg:text-6xl xl:text-5xl 2xl:text-8xl font-bold" // Larger/Bold
                  : "text-2xl lg:text-5xl xl:text-4xl 2xl:text-8xl"; // Default

            return (
              <div
                key={prayer}
                className={`
                  ${prayer} 
                  grid grid-cols-3 items-center font-medium py-3 px-4 rounded-xl transition-all duration-500 border
                  ${activeClass} 
                  ${textClass}
                `}
              >
                {/* Name: Left Aligned - Always 6xl (at 2xl screens) */}
                <span
                  className={`text-left pl-8 ${
                    state === "now" ? "text-slate-900" : "text-slate-400"
                  } text-2xl lg:text-4xl xl:text-3xl 2xl:text-6xl`}
                >
                  {PRAYER_LOCALE_STRINGS[prayer]}
                </span>

                {/* Times: Centre Aligned */}
                <span className="text-center" suppressHydrationWarning>
                  {prayer === "jumuah2" ? "--" : formatTime(time.athan)}
                </span>
                <span className={`${showIqamah ? "block" : "hidden"} text-center`} suppressHydrationWarning>
                  {time.iqamah ? formatTime(time.iqamah) : "--"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
