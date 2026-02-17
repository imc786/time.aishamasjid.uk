"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDateString } from "@/hooks/use-simulated-time";

interface TimeDevToolsProps {
  currentTime: Date;
  isSimulating: boolean;
  speed: number;
  onSetTime: (time: Date) => void;
  onSetSpeed: (speed: number) => void;
  onJumpForward: (minutes: number) => void;
  onReset: () => void;
  /** Prayer times for preset buttons */
  prayerTimes?: {
    fajr?: { athan?: string; iqamah?: string };
    sunrise?: { athan?: string };
    dhuhr?: { athan?: string; iqamah?: string };
    asr?: { athan?: string; iqamah?: string };
    maghrib?: { athan?: string };
    isha?: { athan?: string; iqamah?: string };
    jumuah1?: { iqamah?: string };
    jumuah2?: { iqamah?: string };
  };
  /** Current date string YYYY-MM-DD */
  dateString?: string;
}

const SPEED_OPTIONS = [1, 2, 5, 10, 60] as const;

const STORAGE_KEY = "time-devtools-position";

interface Position {
  x: number;
  y: number;
}

/**
 * Floating DevTools panel for time simulation during development.
 * Only renders in non-production environments.
 */
export function TimeDevTools({
  currentTime,
  isSimulating,
  speed,
  onSetTime,
  onSetSpeed,
  onJumpForward,
  onReset,
  prayerTimes,
  dateString,
}: TimeDevToolsProps) {
  // Don't render in production
  if (process.env.NEXT_PUBLIC_ENV === "production") {
    return null;
  }

  return (
    <TimeDevToolsPanel
      currentTime={currentTime}
      isSimulating={isSimulating}
      speed={speed}
      onSetTime={onSetTime}
      onSetSpeed={onSetSpeed}
      onJumpForward={onJumpForward}
      onReset={onReset}
      prayerTimes={prayerTimes}
      dateString={dateString}
    />
  );
}

function TimeDevToolsPanel({
  currentTime,
  isSimulating,
  speed,
  onSetTime,
  onSetSpeed,
  onJumpForward,
  onReset,
  prayerTimes,
  dateString,
}: TimeDevToolsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Date/time input state
  const [inputDate, setInputDate] = useState("");
  const [inputTime, setInputTime] = useState("");

  // Load position from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Position;
        setPosition(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save position to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Ignore errors
    }
  }, [position]);

  // Sync inputs with current time when not simulating
  // This prevents stale inputs when the panel is opened
  useEffect(() => {
    if (!isCollapsed && !isSimulating) {
      setInputDate(getDateString(currentTime));
      setInputTime(
        currentTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
  }, [currentTime, isCollapsed, isSimulating]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, input, select")) {
        return; // Don't drag when clicking interactive elements
      }
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position],
  );

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle setting time from inputs
  const handleSetTime = useCallback(() => {
    if (!inputDate || !inputTime) return;
    const newTime = new Date(`${inputDate}T${inputTime}`);
    if (!Number.isNaN(newTime.getTime())) {
      onSetTime(newTime);
    }
  }, [inputDate, inputTime, onSetTime]);

  // Create preset time button handler - jumps to 5 seconds before the time
  const createPresetHandler = useCallback(
    (timeString: string | undefined) => {
      if (!timeString || !dateString) return undefined;
      return () => {
        const targetTime = new Date(`${dateString}T${timeString}:00`);
        // Jump to 5 seconds before the target time
        const newTime = new Date(targetTime.getTime() - 5 * 1000);
        if (!Number.isNaN(newTime.getTime())) {
          onSetTime(newTime);
        }
      };
    },
    [dateString, onSetTime],
  );

  // Jump to 23:59:55 to see end-of-day transition
  const handleJumpToEndOfDay = useCallback(() => {
    if (!dateString) return;
    const targetTime = new Date(`${dateString}T23:59:55`);
    if (!Number.isNaN(targetTime.getTime())) {
      onSetTime(targetTime);
    }
  }, [dateString, onSetTime]);

  // Build ordered list of all events for prev/next navigation (memoized to avoid recreating on every render)
  const orderedEvents = useMemo(() => {
    if (!prayerTimes || !dateString) return [];

    const events: { name: string; time: Date; label: string }[] = [];
    const addEvent = (name: string, timeStr: string | undefined, label: string) => {
      if (timeStr) {
        events.push({
          name,
          time: new Date(`${dateString}T${timeStr}:00`),
          label,
        });
      }
    };

    // Add events in chronological order
    addEvent("fajr-athan", prayerTimes.fajr?.athan, "Fajr Athan");
    addEvent("fajr-iqamah", prayerTimes.fajr?.iqamah, "Fajr Iqamah");
    addEvent("sunrise", prayerTimes.sunrise?.athan, "Sunrise");

    // Dhuhr Athan always happens (even on Fridays)
    addEvent("dhuhr-athan", prayerTimes.dhuhr?.athan, "Dhuhr Athan");

    // On Fridays: Jumuah 1 & 2 replace Dhuhr Iqamah
    if (prayerTimes.jumuah1?.iqamah) {
      addEvent("jumuah1", prayerTimes.jumuah1.iqamah, "Jumuah 1");
      addEvent("jumuah2", prayerTimes.jumuah2?.iqamah, "Jumuah 2");
    } else {
      addEvent("dhuhr-iqamah", prayerTimes.dhuhr?.iqamah, "Dhuhr Iqamah");
    }

    addEvent("asr-athan", prayerTimes.asr?.athan, "Asr Athan");
    addEvent("asr-iqamah", prayerTimes.asr?.iqamah, "Asr Iqamah");
    addEvent("maghrib", prayerTimes.maghrib?.athan, "Maghrib");
    addEvent("isha-athan", prayerTimes.isha?.athan, "Isha Athan");
    addEvent("isha-iqamah", prayerTimes.isha?.iqamah, "Isha Iqamah");

    // Sort by time and filter out invalid dates
    return events.filter((e) => !Number.isNaN(e.time.getTime())).sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [prayerTimes, dateString]);

  // Find current event index based on current time
  const getCurrentEventIndex = useCallback(() => {
    if (orderedEvents.length === 0) return -1;

    // Find the last event that has passed or is about to happen (within 5 seconds)
    for (let i = orderedEvents.length - 1; i >= 0; i--) {
      if (currentTime.getTime() >= orderedEvents[i].time.getTime() - 5000) {
        return i;
      }
    }
    return -1; // Before first event
  }, [currentTime, orderedEvents]);

  // Jump to previous event (5 seconds before)
  // When at first event (Fajr), goes to previous day's Isha Iqamah
  const handlePrevEvent = useCallback(() => {
    if (orderedEvents.length === 0 || !dateString) return;

    const currentIndex = getCurrentEventIndex();

    if (currentIndex <= 0) {
      // At or before first event - go to previous day's Isha Iqamah
      const prevDate = new Date(dateString);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateString = prevDate.toISOString().split("T")[0];

      // Use Isha Iqamah time from current data as approximation for yesterday
      const ishaIqamahTime = prayerTimes?.isha?.iqamah;
      if (ishaIqamahTime) {
        const targetTime = new Date(`${prevDateString}T${ishaIqamahTime}:00`);
        onSetTime(new Date(targetTime.getTime() - 5000));
      }
    } else {
      const targetTime = new Date(orderedEvents[currentIndex - 1].time.getTime() - 5000);
      onSetTime(targetTime);
    }
  }, [orderedEvents, getCurrentEventIndex, onSetTime, dateString, prayerTimes]);

  // Jump to next event (5 seconds before)
  // When at last event (Isha Iqamah), goes to next day's Fajr Athan
  const handleNextEvent = useCallback(() => {
    if (orderedEvents.length === 0 || !dateString) return;

    const currentIndex = getCurrentEventIndex();

    if (currentIndex >= orderedEvents.length - 1) {
      // At last event (Isha Iqamah) - go to next day's Fajr Athan
      const nextDate = new Date(dateString);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateString = nextDate.toISOString().split("T")[0];

      // Use Fajr Athan time from current data as approximation for tomorrow
      const fajrAthanTime = prayerTimes?.fajr?.athan;
      if (fajrAthanTime) {
        const targetTime = new Date(`${nextDateString}T${fajrAthanTime}:00`);
        onSetTime(new Date(targetTime.getTime() - 5000));
      }
    } else {
      const targetTime = new Date(orderedEvents[currentIndex + 1].time.getTime() - 5000);
      onSetTime(targetTime);
    }
  }, [orderedEvents, getCurrentEventIndex, onSetTime, dateString, prayerTimes]);

  // Get current event label for display
  const getCurrentEventLabel = useCallback(() => {
    const currentIndex = getCurrentEventIndex();
    if (currentIndex < 0 || orderedEvents.length === 0) return "Before Fajr";
    return orderedEvents[currentIndex].label;
  }, [orderedEvents, getCurrentEventIndex]);

  // Format current time for display
  const formattedTime = currentTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  if (isCollapsed) {
    return (
      <div
        ref={panelRef}
        className="fixed z-9999 bg-slate-900 text-white rounded-full p-2 shadow-lg cursor-move select-none ring-1 ring-slate-600"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-2 text-sm"
          title="Expand Time DevTools"
        >
          <span>🕐</span>
          {isSimulating && <span className="text-xs text-amber-400">{speed}x</span>}
          {isSimulating && <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded">SIMULATING</span>}
          <span className={isSimulating ? "text-amber-400" : "text-slate-400"}>{formattedTime}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-9999 bg-slate-900 text-white rounded-lg shadow-xl select-none cursor-default ring-1 ring-slate-600"
      style={{
        left: position.x,
        top: position.y,
        width: 380,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 cursor-grab">
        <div className="flex items-center gap-2">
          <span>🕐</span>
          <span className="font-medium text-sm">Time DevTools</span>
          {isSimulating && <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded">SIMULATING</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-white px-1"
            title="Collapse"
          >
            −
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 text-sm">
        {/* Current time display */}
        <div className="text-center bg-slate-800 rounded p-2">
          <div className="text-lg font-mono" suppressHydrationWarning>
            {formattedTime}
          </div>
          <div className="text-xs text-slate-400">{formattedDate}</div>
        </div>

        {/* Date/Time input */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Simulate Time</div>
          <div className="flex gap-2">
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm cursor-pointer"
            />
            <input
              type="time"
              step="1"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm cursor-pointer"
            />
            <button
              type="button"
              onClick={handleSetTime}
              disabled={!inputDate || !inputTime}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 px-3 py-1 rounded text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              Set
            </button>
          </div>
        </div>

        {/* Speed control */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Speed</div>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetSpeed(s)}
                className={`flex-1 py-1 rounded text-sm cursor-pointer ${
                  speed === s ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Quick jumps */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Quick Jump</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onJumpForward(-1440)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              −1d
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(5)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(10)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +10m
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(30)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(60)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +1h
            </button>
            <button
              type="button"
              onClick={() => onJumpForward(1440)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-sm cursor-pointer"
            >
              +1d
            </button>
            <button
              type="button"
              onClick={handleJumpToEndOfDay}
              className="flex-1 bg-amber-900 hover:bg-amber-800 py-1 rounded text-sm cursor-pointer"
              title="Jump to 23:59:55"
            >
              EOD
            </button>
          </div>
        </div>

        {/* Event navigation */}
        {prayerTimes && dateString && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Event Navigation</div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handlePrevEvent}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm cursor-pointer"
                title="Previous event (5s before)"
              >
                ← Prev
              </button>
              <div className="flex-1 text-center text-sm text-slate-300 bg-slate-800 py-1.5 rounded">
                {getCurrentEventLabel()}
              </div>
              <button
                type="button"
                onClick={handleNextEvent}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm cursor-pointer"
                title="Next event (5s before)"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Prayer presets */}
        {prayerTimes && dateString && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Athan Presets (5s before)</div>
            <div className="grid grid-cols-4 gap-1">
              {prayerTimes.fajr?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.fajr.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Fajr Athan (${prayerTimes.fajr.athan})`}
                >
                  Fajr
                </button>
              )}
              {prayerTimes.sunrise?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.sunrise.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Sunrise (${prayerTimes.sunrise.athan})`}
                >
                  Sunrise
                </button>
              )}
              {prayerTimes.dhuhr?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.dhuhr.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Dhuhr Athan (${prayerTimes.dhuhr.athan})`}
                >
                  Dhuhr
                </button>
              )}
              {prayerTimes.asr?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.asr.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Asr Athan (${prayerTimes.asr.athan})`}
                >
                  Asr
                </button>
              )}
              {prayerTimes.maghrib?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.maghrib.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Maghrib (${prayerTimes.maghrib.athan})`}
                >
                  Maghrib
                </button>
              )}
              {prayerTimes.isha?.athan && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.isha.athan)}
                  className="bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Isha Athan (${prayerTimes.isha.athan})`}
                >
                  Isha
                </button>
              )}
            </div>
            {/* Iqamah presets */}
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-3">Iqamah Presets (5s before)</div>
            <div className="grid grid-cols-4 gap-1">
              {prayerTimes.fajr?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.fajr.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Fajr Iqamah (${prayerTimes.fajr.iqamah})`}
                >
                  Fajr
                </button>
              )}
              {prayerTimes.dhuhr?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.dhuhr.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Dhuhr Iqamah (${prayerTimes.dhuhr.iqamah})`}
                >
                  Dhuhr
                </button>
              )}
              {prayerTimes.jumuah1?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.jumuah1.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Jumu'ah 1 (${prayerTimes.jumuah1.iqamah})`}
                >
                  Jumu'ah 1
                </button>
              )}
              {prayerTimes.jumuah2?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.jumuah2.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Jumu'ah 2 (${prayerTimes.jumuah2.iqamah})`}
                >
                  Jumu'ah 2
                </button>
              )}
              {prayerTimes.asr?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.asr.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Asr Iqamah (${prayerTimes.asr.iqamah})`}
                >
                  Asr
                </button>
              )}
              {prayerTimes.isha?.iqamah && (
                <button
                  type="button"
                  onClick={createPresetHandler(prayerTimes.isha.iqamah)}
                  className="bg-emerald-900 hover:bg-emerald-800 py-1 rounded text-xs cursor-pointer"
                  title={`Jump to 5s before Isha Iqamah (${prayerTimes.isha.iqamah})`}
                >
                  Isha
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reset button */}
        <button
          type="button"
          onClick={onReset}
          className="w-full bg-red-900 hover:bg-red-800 py-2 rounded text-sm cursor-pointer"
        >
          Reset to Real Time
        </button>
      </div>
    </div>
  );
}
