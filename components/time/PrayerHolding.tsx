/**
 * PrayerHolding component for the /time page
 *
 * Displays full-screen or inline prayer holding state during active prayer.
 * Shows prayer name prominently while removing distracting elements.
 */

import { PRAYER_LOCALE_STRINGS } from "@/lib/types/prayer-times";

interface PrayerHoldingProps {
  /** Name of the current prayer (e.g., "fajr", "dhuhr") */
  prayerName?: string;
  /** Whether to show the holding state */
  show: boolean;
  /** Layout variant: "fullscreen" for main display, "inline" for sidebar */
  variant?: "fullscreen" | "inline";
}

export function PrayerHolding({ prayerName, show, variant = "fullscreen" }: PrayerHoldingProps) {
  const prayerLabel = prayerName ? PRAYER_LOCALE_STRINGS[prayerName as keyof typeof PRAYER_LOCALE_STRINGS] : "";

  if (variant === "fullscreen") {
    return (
      <div
        id="currentprayer"
        className={`absolute inset-0 z-20 bg-black flex items-center justify-center h-screen text-center p-6 divnow ${
          !show && " hidden"
        }`}
      >
        <p className="text-2xl lg:text-9xl 2xl:text-[250px]/80 labelevent" suppressHydrationWarning>
          {prayerLabel}
          <br />
          {PRAYER_LOCALE_STRINGS.prayer}
        </p>
      </div>
    );
  }

  // Inline variant for sidebar
  return (
    <div
      className={`text-center dark:text-white dark:bg-slate-900/90 bg-[#889977] rounded-lg mx-6 ring-1 ring-slate-900/5 shadow-xl px-6 py-6 divnow ${
        !show && " hidden"
      }`}
    >
      <p className="text-2xl lg:text-6xl xl:text-8xl 2xl:text-[150px]/50 labelevent">
        {prayerLabel} {PRAYER_LOCALE_STRINGS.prayer}
      </p>
    </div>
  );
}
