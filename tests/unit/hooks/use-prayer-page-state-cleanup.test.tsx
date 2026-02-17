/**
 * Test to verify setTimeout cleanup in usePrayerPageState hook
 *
 * This test simulates multiple prayer cycles using fake timers to verify
 * that timeouts are properly cleaned up and don't accumulate.
 *
 * Before fix: Each prayer creates a new setTimeout that's never cancelled,
 * causing orphaned timeouts to accumulate (memory leak).
 *
 * After fix: Timeouts are stored in a ref and cleaned up when:
 * - A new timeout is created (clears previous)
 * - The effect re-runs (cleanup function)
 * - Component unmounts
 *
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Track setTimeout calls for leak detection
let activeTimeouts = new Set<NodeJS.Timeout>();
let totalTimeoutsCreated = 0;
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

// Mock simulated time hook
vi.mock("@/hooks/use-simulated-time", () => ({
  useSimulatedTime: () => ({
    currentTime: new Date("2026-01-08T12:30:00"), // Just after Dhuhr iqamah
    isHydrated: true,
    isSimulating: false,
    speed: 1,
    setSimulatedTime: vi.fn(),
    setSpeed: vi.fn(),
    jumpForward: vi.fn(),
    reset: vi.fn(),
  }),
  getDateString: (date: Date) => date.toISOString().split("T")[0],
  getTomorrowDateString: (date: Date) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  },
}));

// Mock prayer data
vi.mock("@/lib/prayer-data", () => ({
  getCombinedPrayerTimes: () => ({
    date: "2026-01-08",
    fajr: { athan: "06:30", iqamah: "06:45" },
    sunrise: { athan: "08:00" },
    dhuhr: { athan: "12:15", iqamah: "12:30" },
    asr: { athan: "14:30", iqamah: "14:45" },
    maghrib: { athan: "16:45", iqamah: "16:50" },
    isha: { athan: "18:15", iqamah: "18:30" },
  }),
}));

describe("usePrayerPageState setTimeout cleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeTimeouts.clear();
    totalTimeoutsCreated = 0;

    // Instrument setTimeout to track active timeouts
    global.setTimeout = ((callback: () => void, ms: number) => {
      const id = originalSetTimeout(callback, ms);
      activeTimeouts.add(id);
      totalTimeoutsCreated++;
      return id;
    }) as typeof setTimeout;

    // Instrument clearTimeout to track cleared timeouts
    global.clearTimeout = ((id: NodeJS.Timeout) => {
      activeTimeouts.delete(id);
      originalClearTimeout(id);
    }) as typeof clearTimeout;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it("should clean up timeouts when effect re-runs (simulating multiple prayer cycles)", async () => {
    // Import after mocks are set up
    const { usePrayerPageState } = await import("@/hooks/use-prayer-page-state");

    const timeoutCounts: number[] = [];
    const { rerender, unmount } = renderHook(() => usePrayerPageState());

    // Record initial state
    timeoutCounts.push(activeTimeouts.size);

    // Simulate 10 prayer cycles by forcing re-renders
    // Each cycle should trigger the useEffect which may create a new timeout
    for (let i = 1; i <= 10; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      rerender();
      timeoutCounts.push(activeTimeouts.size);
    }

    // Unmount to trigger final cleanup
    unmount();

    const maxActive = Math.max(...timeoutCounts);

    // Should have 0 active timeouts after unmount
    expect(activeTimeouts.size).toBe(0);

    // Should never have more than 2 concurrent timeouts
    // (1 from current effect + potentially 1 being cleaned up)
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
