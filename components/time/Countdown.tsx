/**
 * Countdown component for the /tv/time page
 *
 * Displays countdown timer to next prayer event with HH:MM:SS format.
 * Features a card-style container with backdrop blur and animated colons.
 * Shows prayer name and whether counting to athan or iqamah.
 */

import { memo } from "react";
import { PRAYER_LOCALE_STRINGS } from "@/lib/types/prayer-times";

interface CountdownProps {
  /** Name of the next prayer (e.g., "fajr", "dhuhr") */
  prayerName: string;
  /** Formatted countdown string in HH:MM:SS format */
  countdown: string;
  /** Whether counting down to iqamah (true) or athan (false) */
  isIqamah: boolean;
  /** Whether the countdown should be hidden */
  hidden?: boolean;
}

export const Countdown = memo(function Countdown({ prayerName, countdown, isIqamah, hidden = false }: CountdownProps) {
  const prayerLabel = PRAYER_LOCALE_STRINGS[prayerName as keyof typeof PRAYER_LOCALE_STRINGS];
  const targetLabel = isIqamah ? `${prayerLabel} ${PRAYER_LOCALE_STRINGS.iqamah}` : prayerLabel;
  const [hours, minutes, seconds] = (countdown || "--:--:--").split(":");

  if (hidden) return null;

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <span className="text-slate-400 text-4xl tracking-wider font-medium">Time to {targetLabel}</span>
      </div>

      <div className="flex justify-center items-baseline gap-2 tabular-nums text-white">
        <div className="flex flex-col items-center">
          <span className="text-[9rem] font-bold leading-none">{hours}</span>
          <span className="text-3xl text-slate-500 mt-2 lowercase tracking-wider">Hours</span>
        </div>
        <span className="text-9xl text-slate-500 font-light">:</span>
        <div className="flex flex-col items-center">
          <span className="text-[9rem] font-bold leading-none">{minutes}</span>
          <span className="text-3xl text-slate-500 mt-2 lowercase tracking-wider">Minutes</span>
        </div>
        <span className="text-9xl text-slate-500 font-light">:</span>
        <div className="flex flex-col items-center">
          <span className="text-[9rem] font-bold leading-none">{seconds}</span>
          <span className="text-3xl text-slate-500 mt-2 lowercase tracking-wider">Seconds</span>
        </div>
      </div>
    </div>
  );
});
