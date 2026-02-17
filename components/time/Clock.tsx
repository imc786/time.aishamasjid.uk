/**
 * Clock component for the /tv/time page
 *
 * Displays live time, Gregorian date, and Hijri date.
 * Styled with larger typography and centred layout.
 * All times are displayed in Europe/London timezone.
 */

import { memo } from "react";

interface ClockProps {
  /** Current time to display */
  currentTime: Date;
}

export const Clock = memo(function Clock({ currentTime }: ClockProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Time display - sized to balance with countdown */}
      <p className="text-[8rem] tracking-tight leading-none font-bold tabular-nums text-white" suppressHydrationWarning>
        {currentTime
          .toLocaleTimeString(`en-GB`, {
            timeZone: "Europe/London",
            hour12: true,
          })
          .replace(/AM|am|pm|PM/, "")}
      </p>
      <div className="flex flex-col items-center mt-4 space-y-2">
        <p className="text-4xl font-light text-slate-300" suppressHydrationWarning>
          {currentTime.toLocaleDateString(`en-GB`, {
            timeZone: "Europe/London",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-3xl text-slate-500" suppressHydrationWarning>
          {currentTime.toLocaleDateString(`en-GB-u-ca-islamic-umalqura`, {
            timeZone: "Europe/London",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
});
