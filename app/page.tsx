/**
 * Time Page - Prayer times display for TV
 *
 * Features:
 * - 12-column grid layout (5:7 ratio)
 * - Swappable panel order via ?order=2
 * - Configurable middle element via ?middle=clock
 * - Emerald accent gradient (disable via ?bgglow=false)
 * - CSS Grid for prayer table alignment
 */

"use client";

import { useEffect, useState } from "react";
import { Clock } from "@/components/time/Clock";
import { Countdown } from "@/components/time/Countdown";
import { MasjidBranding } from "@/components/time/MasjidBranding";
import { PrayerHolding } from "@/components/time/PrayerHolding";
import { PrayerTable } from "@/components/time/PrayerTable";
import { TimeDevTools } from "@/components/time/TimeDevTools";
import { usePrayerPageState } from "@/hooks/use-prayer-page-state";

export default function TimePage() {
  const {
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
    devTools,
  } = usePrayerPageState();

  // URL query parameters for layout customisation
  const [isSwapped, setIsSwapped] = useState(false);
  const [isClockMiddle, setIsClockMiddle] = useState(false);
  const [showBgGlow, setShowBgGlow] = useState(true);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsSwapped(queryParams.get("order") === "2");
    setIsClockMiddle(queryParams.get("middle") === "clock");
    setShowBgGlow(queryParams.get("bgglow") !== "false");
  }, []);

  return (
    <>
      {/* Time DevTools - only visible in non-production */}
      <TimeDevTools
        currentTime={currentTime}
        isSimulating={devTools.isSimulating}
        speed={devTools.speed}
        onSetTime={devTools.setTime}
        onSetSpeed={devTools.setSpeed}
        onJumpForward={devTools.jumpForward}
        onReset={devTools.reset}
        prayerTimes={todayPrayerTimes}
        dateString={todayPrayerTimes.date}
      />

      <div className="h-screen w-screen overflow-hidden bg-black text-white cursor-none selection:bg-emerald-500/30 relative">
        {/* Ambient Background Glow - Matches live page aesthetic (disable via ?bgglow=false) */}
        {showBgGlow && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-700/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-700/10 blur-[120px] pointer-events-none" />
          </>
        )}

        {/* Full-screen prayer holding state */}
        <PrayerHolding prayerName={previousPrayer?.prayer} show={showPrayerNow} variant="fullscreen" />

        {/* Main Grid Layout - 12 columns for precise control */}
        <div className={`grid grid-cols-12 h-full relative z-10 ${showPrayerNow ? "hidden" : ""}`}>
          {/* Status Panel (Branding, Clock/Countdown) - 5 columns */}
          <div
            className={`col-span-5 flex flex-col justify-between p-10 pb-20 bg-slate-950/80 backdrop-blur-sm border-r border-slate-800/50 relative overflow-hidden ${
              isSwapped ? "order-last border-r-0 border-l" : ""
            }`}
          >
            {/* Background gradient accent */}
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-emerald-900/10 to-transparent pointer-events-none" />

            {/* Top: Branding */}
            <div className="relative z-10">
              <MasjidBranding />
            </div>

            {/* Middle: Clock OR Countdown/Holding (configurable via ?middle=clock) */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              {isClockMiddle ? (
                <Clock currentTime={currentTime} />
              ) : showPrayerNow ? (
                <PrayerHolding prayerName={previousPrayer?.prayer} show={true} variant="inline" />
              ) : (
                <Countdown prayerName={nextPrayer.prayer} countdown={countdown} isIqamah={isCountingToIqamah} />
              )}
            </div>

            {/* Bottom: Countdown/Holding OR Clock (opposite of middle) */}
            <div className="relative z-10">
              {isClockMiddle ? (
                showPrayerNow ? (
                  <PrayerHolding prayerName={previousPrayer?.prayer} show={true} variant="inline" />
                ) : (
                  <Countdown prayerName={nextPrayer.prayer} countdown={countdown} isIqamah={isCountingToIqamah} />
                )
              ) : (
                <Clock currentTime={currentTime} />
              )}
            </div>
          </div>

          {/* Schedule Panel (Prayer Table) - 7 columns */}
          <div className="col-span-7 p-4">
            <PrayerTable
              prayerTimes={todayPrayerTimes}
              currentTime={currentTime}
              currentPrayer={previousPrayer?.prayer}
              showIqamah={hasIqamah}
              jumuah1HasIqamah={jumuah1HasIqamah}
              isHydrated={isHydrated}
            />
          </div>
        </div>
      </div>
    </>
  );
}
