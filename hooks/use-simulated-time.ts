"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TimeSimulation {
  /** The current time (real or simulated) */
  currentTime: Date;
  /** Whether the component has hydrated (safe to use time-dependent rendering) */
  isHydrated: boolean;
  /** Whether time simulation is active */
  isSimulating: boolean;
  /** Current simulation speed multiplier */
  speed: number;
  /** Set a specific time to simulate from */
  setSimulatedTime: (time: Date) => void;
  /** Set the simulation speed multiplier (1 = real-time, 60 = 1 min/sec) */
  setSpeed: (multiplier: number) => void;
  /** Jump forward by specified minutes */
  jumpForward: (minutes: number) => void;
  /** Reset to real current time */
  reset: () => void;
}

/**
 * Hook for time management with simulation support for development testing.
 *
 * In production: Always returns real current time via `new Date()`.
 * In development: Can simulate time with configurable speed for testing prayer transitions.
 *
 * @returns TimeSimulation object with current time and control methods
 */
export function useSimulatedTime(): TimeSimulation {
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  // State for React re-renders
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [speed, setSpeedState] = useState(1);

  // Refs for values accessed in the interval (to avoid recreating interval on every change)
  const simulatedTimeRef = useRef<Date | null>(null);
  const speedRef = useRef(1);
  const isSimulatingRef = useRef(false);
  // Track when time was last manually set to prevent advancing too soon
  const lastManualSetRef = useRef<number>(0);

  // Set simulated time and enable simulation
  const setSimulatedTimeHandler = useCallback(
    (time: Date) => {
      if (isProduction) return;
      const newTime = new Date(time);
      simulatedTimeRef.current = newTime;
      isSimulatingRef.current = true;
      lastManualSetRef.current = Date.now(); // Track when time was manually set
      setCurrentTime(newTime);
      setIsSimulating(true);
    },
    [isProduction],
  );

  // Set simulation speed
  const setSpeed = useCallback(
    (multiplier: number) => {
      if (isProduction) return;
      const clamped = Math.max(1, Math.min(multiplier, 3600));
      speedRef.current = clamped;
      setSpeedState(clamped);
    },
    [isProduction],
  );

  // Jump forward by minutes
  const jumpForward = useCallback(
    (minutes: number) => {
      if (isProduction) return;

      const baseTime = simulatedTimeRef.current || new Date();
      const newTime = new Date(baseTime.getTime() + minutes * 60 * 1000);
      simulatedTimeRef.current = newTime;
      isSimulatingRef.current = true;
      lastManualSetRef.current = Date.now(); // Track when time was manually set
      setCurrentTime(newTime);
      setIsSimulating(true);
    },
    [isProduction],
  );

  // Reset to real time
  const reset = useCallback(() => {
    if (isProduction) return;
    simulatedTimeRef.current = null;
    isSimulatingRef.current = false;
    speedRef.current = 1;
    setIsSimulating(false);
    setSpeedState(1);
    setCurrentTime(new Date());
  }, [isProduction]);

  // Main timer effect - manages the tick interval
  // When simulating at higher speeds, the interval runs faster so you still see
  // seconds counting up one by one (e.g., 60x = 60 ticks per real second)
  useEffect(() => {
    // Mark as hydrated on first client-side render
    setIsHydrated(true);

    const tick = () => {
      if (isProduction) {
        // Production: ALWAYS use real time
        // This ensures browser tab sleep doesn't cause drift
        setCurrentTime(new Date());
      } else if (isSimulatingRef.current && simulatedTimeRef.current) {
        // Don't advance if time was recently manually set (within last 500ms)
        // This prevents the +1 second jump when setting time via dev tools
        const timeSinceManualSet = Date.now() - lastManualSetRef.current;
        if (timeSinceManualSet < 500) {
          return;
        }
        // Development with simulation: advance by 1 second each tick
        // The interval frequency handles the speed multiplier
        const newTime = new Date(simulatedTimeRef.current.getTime() + 1000);
        simulatedTimeRef.current = newTime;
        setCurrentTime(newTime);
      } else {
        // Development without simulation: use real time
        setCurrentTime(new Date());
      }
    };

    // Initial tick
    tick();

    // Calculate interval based on simulation state and speed
    // When simulating: interval = 1000ms / speed (capped at 16ms minimum for smooth animation)
    // When not simulating: 1000ms for real-time updates
    const interval = !isProduction && isSimulating ? Math.max(16, Math.floor(1000 / speed)) : 1000;

    const intervalId = setInterval(tick, interval);

    return () => clearInterval(intervalId);
  }, [isProduction, isSimulating, speed]); // Recreate interval when speed changes

  return {
    currentTime,
    isHydrated,
    isSimulating: !isProduction && isSimulating,
    speed,
    setSimulatedTime: setSimulatedTimeHandler,
    setSpeed,
    jumpForward,
    reset,
  };
}

/**
 * Get the date string in YYYY-MM-DD format for a given Date
 */
export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get tomorrow's date string in YYYY-MM-DD format
 */
export function getTomorrowDateString(date: Date): string {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}
