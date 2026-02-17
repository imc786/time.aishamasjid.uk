/**
 * Unit tests for lib/prayer-calculations.ts
 *
 * Tests all pure functions for prayer time calculations.
 * These functions are stateless and take all inputs as parameters.
 */

import { describe, expect, it } from "vitest";
import type { ParsedPrayerTimestamps, PrayerHoldingDurations } from "@/lib/prayer-calculations";
import {
  calculateCountdownSeconds,
  convertTo12HourFormat,
  DEFAULT_PRAYER_HOLDING_DURATIONS,
  formatFriendlyCountdown,
  formatTime,
  formatTimeToGo,
  getDateStringFromDate,
  getNextPrayer,
  getNextPrayerMs,
  getPrayerHoldingDuration,
  getPreviousPrayer,
  getPreviousPrayerMs,
  isWithinPrayerHoldingPeriod,
  isWithinPrayerHoldingPeriodMs,
} from "@/lib/prayer-calculations";
import type { CombinedPrayerTimes } from "@/lib/types/prayer-times";

// Mock prayer times for a regular weekday (Thursday)
const mockWeekdayPrayerTimes: CombinedPrayerTimes = {
  date: "2026-01-15",
  fajr: { athan: "06:30", iqamah: "06:45" },
  sunrise: { athan: "07:50", iqamah: undefined },
  dhuhr: { athan: "12:30", iqamah: "13:00" },
  jumuah1: { athan: undefined, iqamah: undefined },
  jumuah2: { athan: undefined, iqamah: undefined },
  asr: { athan: "15:00", iqamah: "15:30" },
  maghrib: { athan: "17:00", iqamah: "17:00" },
  isha: { athan: "18:30", iqamah: "19:00" },
};

// Mock prayer times for Friday (with Jumu'ah)
const mockFridayPrayerTimes: CombinedPrayerTimes = {
  date: "2026-01-16",
  fajr: { athan: "06:30", iqamah: "06:45" },
  sunrise: { athan: "07:50", iqamah: undefined },
  dhuhr: { athan: "12:30", iqamah: undefined }, // Dhuhr hidden on Fridays
  jumuah1: { athan: "12:30", iqamah: "13:00" },
  jumuah2: { athan: undefined, iqamah: "13:45" },
  asr: { athan: "15:00", iqamah: "15:30" },
  maghrib: { athan: "17:00", iqamah: "17:00" },
  isha: { athan: "18:30", iqamah: "19:00" },
};

// Mock pre-parsed timestamps for getNextPrayerMs (matching mockWeekdayPrayerTimes)
const mockParsedTimestamps: ParsedPrayerTimestamps = {
  fajr: { athan: new Date("2026-01-15T06:30:00").getTime(), iqamah: new Date("2026-01-15T06:45:00").getTime() },
  sunrise: { athan: new Date("2026-01-15T07:50:00").getTime(), iqamah: null },
  dhuhr: { athan: new Date("2026-01-15T12:30:00").getTime(), iqamah: new Date("2026-01-15T13:00:00").getTime() },
  asr: { athan: new Date("2026-01-15T15:00:00").getTime(), iqamah: new Date("2026-01-15T15:30:00").getTime() },
  maghrib: { athan: new Date("2026-01-15T17:00:00").getTime(), iqamah: new Date("2026-01-15T17:00:00").getTime() },
  isha: { athan: new Date("2026-01-15T18:30:00").getTime(), iqamah: new Date("2026-01-15T19:00:00").getTime() },
};

describe("formatTimeToGo", () => {
  it("should format 0 seconds as 00:00:00", () => {
    expect(formatTimeToGo(0)).toBe("00:00:00");
  });

  it("should format seconds only", () => {
    expect(formatTimeToGo(45)).toBe("00:00:45");
  });

  it("should format minutes and seconds", () => {
    expect(formatTimeToGo(125)).toBe("00:02:05");
  });

  it("should format hours, minutes, and seconds", () => {
    expect(formatTimeToGo(3661)).toBe("01:01:01");
  });

  it("should handle large values", () => {
    expect(formatTimeToGo(86399)).toBe("23:59:59");
  });

  it("should pad single digits with zeros", () => {
    expect(formatTimeToGo(61)).toBe("00:01:01");
  });
});

describe("formatFriendlyCountdown", () => {
  it("should format 0 seconds as 0s", () => {
    expect(formatFriendlyCountdown(0)).toBe("0s");
  });

  it("should format seconds only when under a minute", () => {
    expect(formatFriendlyCountdown(45)).toBe("45s");
  });

  it("should format minutes and seconds", () => {
    expect(formatFriendlyCountdown(125)).toBe("2m 5s");
  });

  it("should format hours, minutes, and seconds", () => {
    expect(formatFriendlyCountdown(3661)).toBe("1h 1m 1s");
  });

  it("should show 0m and 0s when exactly on the hour", () => {
    expect(formatFriendlyCountdown(3600)).toBe("1h 0m 0s");
  });

  it("should handle large values", () => {
    expect(formatFriendlyCountdown(7325)).toBe("2h 2m 5s");
  });

  it("should handle negative values by returning 0s", () => {
    expect(formatFriendlyCountdown(-10)).toBe("0s");
  });

  it("should not pad single digits", () => {
    expect(formatFriendlyCountdown(61)).toBe("1m 1s");
  });
});

describe("convertTo12HourFormat", () => {
  it("should convert midnight (00:00) to 12:00", () => {
    expect(convertTo12HourFormat("00:00")).toBe("12:00");
  });

  it("should convert 01:30 to 1:30", () => {
    expect(convertTo12HourFormat("01:30")).toBe("1:30");
  });

  it("should convert 12:00 to 12:00 (noon)", () => {
    expect(convertTo12HourFormat("12:00")).toBe("12:00");
  });

  it("should convert 13:45 to 1:45", () => {
    expect(convertTo12HourFormat("13:45")).toBe("1:45");
  });

  it("should convert 23:59 to 11:59", () => {
    expect(convertTo12HourFormat("23:59")).toBe("11:59");
  });

  it("should convert 06:30 to 6:30", () => {
    expect(convertTo12HourFormat("06:30")).toBe("6:30");
  });
});

describe("formatTime", () => {
  it("should format a valid time string", () => {
    expect(formatTime("13:45")).toBe("1:45");
  });

  it("should return empty string for undefined", () => {
    expect(formatTime(undefined)).toBe("");
  });

  it("should handle morning times", () => {
    expect(formatTime("06:30")).toBe("6:30");
  });
});

describe("getDateStringFromDate", () => {
  it("should format date as YYYY-MM-DD", () => {
    const date = new Date("2026-01-15T10:30:00");
    expect(getDateStringFromDate(date)).toBe("2026-01-15");
  });

  it("should handle different months", () => {
    const date = new Date("2026-12-25T00:00:00");
    expect(getDateStringFromDate(date)).toBe("2026-12-25");
  });
});

describe("getNextPrayer", () => {
  it("should return fajr when current time is before fajr", () => {
    const currentTime = new Date("2026-01-15T05:00:00");
    const result = getNextPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result.prayer).toBe("fajr");
    expect(result.athan).toBe("06:30");
  });

  it("should return dhuhr when current time is after fajr iqamah but before dhuhr", () => {
    const currentTime = new Date("2026-01-15T10:00:00");
    const result = getNextPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result.prayer).toBe("dhuhr");
    expect(result.athan).toBe("12:30");
  });

  it("should return next prayer iqamah when between athan and iqamah", () => {
    // At 12:45, dhuhr athan has passed but iqamah hasn't
    const currentTime = new Date("2026-01-15T12:45:00");
    const result = getNextPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result.prayer).toBe("dhuhr");
  });

  it("should return fajr (next day) when all prayers have passed", () => {
    const currentTime = new Date("2026-01-15T20:00:00");
    const result = getNextPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result.prayer).toBe("fajr");
  });

  it("should skip jumuah prayers on weekdays", () => {
    const currentTime = new Date("2026-01-15T12:00:00");
    const result = getNextPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result.prayer).toBe("dhuhr");
  });

  it("should return dhuhr/jumuah1 on Fridays (same athan time)", () => {
    // Note: dhuhr and jumuah1 share the same athan time (12:30)
    // The function returns the first matching prayer in object iteration order
    // In production, dhuhr is filtered out in the UI when jumuah1 is available
    const currentTime = new Date("2026-01-16T12:00:00");
    const result = getNextPrayer(mockFridayPrayerTimes, currentTime);
    // Both dhuhr and jumuah1 are valid - function returns first match
    expect(["dhuhr", "jumuah1"]).toContain(result.prayer);
  });
});

describe("getNextPrayerMs", () => {
  it("should return fajr when current time is before fajr", () => {
    const currentTimeMs = new Date("2026-01-15T05:00:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("fajr");
  });

  it("should return dhuhr when current time is after sunrise but before dhuhr", () => {
    const currentTimeMs = new Date("2026-01-15T10:00:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("dhuhr");
  });

  it("should return same prayer when between athan and iqamah", () => {
    // At 12:45, dhuhr athan has passed but iqamah hasn't
    const currentTimeMs = new Date("2026-01-15T12:45:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("dhuhr");
  });

  it("should return fajr when all prayers have passed (after isha iqamah)", () => {
    const currentTimeMs = new Date("2026-01-15T20:00:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("fajr");
  });

  it("should return asr when between dhuhr iqamah and asr", () => {
    const currentTimeMs = new Date("2026-01-15T14:00:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("asr");
  });

  it("should return isha when between maghrib and isha", () => {
    const currentTimeMs = new Date("2026-01-15T18:00:00").getTime();
    const result = getNextPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result).toBe("isha");
  });

  it("should skip prayers with no athan or iqamah", () => {
    const parsedWithMissingPrayer: ParsedPrayerTimestamps = {
      ...mockParsedTimestamps,
      sunrise: { athan: 0, iqamah: null }, // No valid time
    };
    const currentTimeMs = new Date("2026-01-15T07:00:00").getTime();
    const result = getNextPrayerMs(parsedWithMissingPrayer, currentTimeMs);
    // Should skip sunrise (no valid time) and return dhuhr
    expect(result).toBe("dhuhr");
  });

  it("should handle empty timestamps object", () => {
    const result = getNextPrayerMs({}, new Date("2026-01-15T10:00:00").getTime());
    expect(result).toBe("fajr"); // Default fallback
  });
});

describe("getPreviousPrayer", () => {
  it("should return undefined when before first prayer", () => {
    const currentTime = new Date("2026-01-15T05:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result).toBeUndefined();
  });

  it("should return sunrise when between sunrise and dhuhr", () => {
    // At 10:00, sunrise (07:50) has already passed
    // getPreviousPrayer returns the most recent prayer that has started
    const currentTime = new Date("2026-01-15T10:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result?.prayer).toBe("sunrise");
  });

  it("should return fajr when between fajr and sunrise", () => {
    // At 07:00, fajr (06:30) has passed but sunrise (07:50) hasn't
    const currentTime = new Date("2026-01-15T07:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result?.prayer).toBe("fajr");
  });

  it("should return dhuhr when between dhuhr and asr", () => {
    const currentTime = new Date("2026-01-15T14:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result?.prayer).toBe("dhuhr");
  });

  it("should return isha when after isha", () => {
    const currentTime = new Date("2026-01-15T20:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result?.prayer).toBe("isha");
  });

  it("should return Date objects for athan and iqamah", () => {
    const currentTime = new Date("2026-01-15T10:00:00");
    const result = getPreviousPrayer(mockWeekdayPrayerTimes, currentTime);
    expect(result?.athan).toBeInstanceOf(Date);
    expect(result?.iqamah).toBeInstanceOf(Date);
  });

  it("should return jumuah2 on Fridays after jumuah2", () => {
    const currentTime = new Date("2026-01-16T14:30:00");
    const result = getPreviousPrayer(mockFridayPrayerTimes, currentTime);
    expect(result?.prayer).toBe("jumuah2");
  });
});

describe("isWithinPrayerHoldingPeriod", () => {
  it("should return false when previousPrayer is undefined", () => {
    expect(isWithinPrayerHoldingPeriod(undefined, new Date())).toBe(false);
  });

  it("should return true when within holding period", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const currentTime = new Date("2026-01-15T13:05:00"); // 5 minutes after iqamah
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime)).toBe(true);
  });

  it("should return false when before iqamah time", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const currentTime = new Date("2026-01-15T12:55:00"); // 5 minutes before iqamah
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime)).toBe(false);
  });

  it("should return false when after holding period", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const currentTime = new Date("2026-01-15T13:20:00"); // 20 minutes after iqamah (default is 15)
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime)).toBe(false);
  });

  it("should respect custom holding duration", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const currentTime = new Date("2026-01-15T13:20:00"); // 20 minutes after iqamah
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    // With 30 minute holding period, should still be within
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime, 30 * 60 * 1000)).toBe(true);
  });

  it("should return true at exactly iqamah time", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    expect(isWithinPrayerHoldingPeriod(previousPrayer, iqamahTime)).toBe(true);
  });
});

describe("calculateCountdownSeconds", () => {
  it("should calculate positive countdown", () => {
    const targetTime = new Date("2026-01-15T13:00:00");
    const currentTime = new Date("2026-01-15T12:55:00");
    expect(calculateCountdownSeconds(targetTime, currentTime)).toBe(300); // 5 minutes
  });

  it("should return 0 when times are equal", () => {
    const time = new Date("2026-01-15T13:00:00");
    expect(calculateCountdownSeconds(time, time)).toBe(0);
  });

  it("should return negative when target is in the past", () => {
    const targetTime = new Date("2026-01-15T12:00:00");
    const currentTime = new Date("2026-01-15T12:05:00");
    expect(calculateCountdownSeconds(targetTime, currentTime)).toBe(-300);
  });

  it("should handle large time differences", () => {
    const targetTime = new Date("2026-01-16T06:30:00");
    const currentTime = new Date("2026-01-15T20:00:00");
    // 10 hours 30 minutes = 37800 seconds
    expect(calculateCountdownSeconds(targetTime, currentTime)).toBe(37800);
  });
});

describe("getPreviousPrayerMs", () => {
  it("should return undefined before first prayer", () => {
    const currentTimeMs = new Date("2026-01-15T05:00:00").getTime(); // Before Fajr
    expect(getPreviousPrayerMs(mockParsedTimestamps, currentTimeMs)).toBeUndefined();
  });

  it("should return fajr during fajr time", () => {
    const currentTimeMs = new Date("2026-01-15T07:00:00").getTime(); // After Fajr athan
    const result = getPreviousPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result?.prayer).toBe("fajr");
  });

  it("should return dhuhr during dhuhr time", () => {
    const currentTimeMs = new Date("2026-01-15T14:00:00").getTime(); // After Dhuhr athan
    const result = getPreviousPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result?.prayer).toBe("dhuhr");
  });

  it("should return isha after isha time", () => {
    const currentTimeMs = new Date("2026-01-15T20:00:00").getTime(); // After Isha
    const result = getPreviousPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result?.prayer).toBe("isha");
  });

  it("should return timestamps in the result", () => {
    const currentTimeMs = new Date("2026-01-15T14:00:00").getTime();
    const result = getPreviousPrayerMs(mockParsedTimestamps, currentTimeMs);
    expect(result?.athanMs).toBe(mockParsedTimestamps.dhuhr.athan);
    expect(result?.iqamahMs).toBe(mockParsedTimestamps.dhuhr.iqamah);
  });

  it("should handle jumuah prayers on Friday", () => {
    const currentTimeMs = new Date("2026-01-16T14:00:00").getTime(); // After Jumuah1
    const result = getPreviousPrayerMs(mockFridayParsedTimes, currentTimeMs);
    // Should return jumuah2 as it has the latest athan (iqamah used as fallback)
    expect(result?.prayer).toBe("jumuah2");
  });
});

describe("isWithinPrayerHoldingPeriodMs", () => {
  it("should return false when iqamahMs is null", () => {
    expect(isWithinPrayerHoldingPeriodMs(null, Date.now())).toBe(false);
  });

  it("should return true during holding period", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const currentTimeMs = new Date("2026-01-15T13:05:00").getTime(); // 5 minutes after
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs)).toBe(true);
  });

  it("should return false after holding period", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const currentTimeMs = new Date("2026-01-15T13:20:00").getTime(); // 20 minutes after
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs)).toBe(false);
  });

  it("should return false before iqamah time", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const currentTimeMs = new Date("2026-01-15T12:50:00").getTime(); // 10 minutes before
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs)).toBe(false);
  });

  it("should respect custom holding duration", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const currentTimeMs = new Date("2026-01-15T13:20:00").getTime(); // 20 minutes after
    // With 30 minute holding period, should still be within
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs, 30 * 60 * 1000)).toBe(true);
  });

  it("should return true at exactly iqamah time", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, iqamahMs)).toBe(true);
  });
});

// Mock pre-parsed timestamps for Friday (matching mockFridayPrayerTimes)
const mockFridayParsedTimes: ParsedPrayerTimestamps = {
  fajr: {
    athan: new Date("2026-01-16T06:30:00").getTime(),
    iqamah: new Date("2026-01-16T06:45:00").getTime(),
  },
  sunrise: {
    athan: new Date("2026-01-16T07:50:00").getTime(),
    iqamah: null,
  },
  dhuhr: {
    athan: new Date("2026-01-16T12:30:00").getTime(),
    iqamah: null,
  },
  jumuah1: {
    athan: new Date("2026-01-16T12:30:00").getTime(),
    iqamah: new Date("2026-01-16T13:00:00").getTime(),
  },
  jumuah2: {
    athan: new Date("2026-01-16T13:45:00").getTime(), // Uses iqamah as athan fallback
    iqamah: new Date("2026-01-16T13:45:00").getTime(),
  },
  asr: {
    athan: new Date("2026-01-16T15:00:00").getTime(),
    iqamah: new Date("2026-01-16T15:30:00").getTime(),
  },
  maghrib: {
    athan: new Date("2026-01-16T17:00:00").getTime(),
    iqamah: new Date("2026-01-16T17:00:00").getTime(),
  },
  isha: {
    athan: new Date("2026-01-16T18:30:00").getTime(),
    iqamah: new Date("2026-01-16T19:00:00").getTime(),
  },
};

describe("DEFAULT_PRAYER_HOLDING_DURATIONS", () => {
  it("should have correct default duration for fajr (15 minutes)", () => {
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS.fajr).toBe(15 * 60 * 1000);
  });

  it("should have correct default duration for dhuhr (10 minutes)", () => {
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS.dhuhr).toBe(10 * 60 * 1000);
  });

  it("should have longer duration for jumuah1 (20 minutes)", () => {
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS.jumuah1).toBe(20 * 60 * 1000);
  });

  it("should have longer duration for jumuah2 (20 minutes)", () => {
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS.jumuah2).toBe(20 * 60 * 1000);
  });

  it("should have all prayers defined", () => {
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("fajr");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("sunrise");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("dhuhr");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("jumuah1");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("jumuah2");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("asr");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("maghrib");
    expect(DEFAULT_PRAYER_HOLDING_DURATIONS).toHaveProperty("isha");
  });
});

describe("getPrayerHoldingDuration", () => {
  it("should return default duration for fajr", () => {
    expect(getPrayerHoldingDuration("fajr")).toBe(15 * 60 * 1000);
  });

  it("should return longer duration for jumuah1", () => {
    expect(getPrayerHoldingDuration("jumuah1")).toBe(20 * 60 * 1000);
  });

  it("should return longer duration for jumuah2", () => {
    expect(getPrayerHoldingDuration("jumuah2")).toBe(20 * 60 * 1000);
  });

  it("should fall back to dhuhr duration for unknown prayer", () => {
    expect(getPrayerHoldingDuration("unknown")).toBe(10 * 60 * 1000);
  });

  it("should use custom durations when provided", () => {
    const customDurations: PrayerHoldingDurations = {
      fajr: 10 * 60 * 1000, // 10 minutes
      sunrise: 10 * 60 * 1000,
      dhuhr: 20 * 60 * 1000, // 20 minutes
      jumuah1: 60 * 60 * 1000, // 60 minutes
      jumuah2: 45 * 60 * 1000,
      asr: 20 * 60 * 1000,
      maghrib: 20 * 60 * 1000,
      isha: 20 * 60 * 1000,
    };
    expect(getPrayerHoldingDuration("fajr", customDurations)).toBe(10 * 60 * 1000);
    expect(getPrayerHoldingDuration("jumuah1", customDurations)).toBe(60 * 60 * 1000);
  });
});

describe("isWithinPrayerHoldingPeriodMs with prayer name", () => {
  it("should use dhuhr duration (10 min) when prayer name is dhuhr", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();

    // 5 minutes after iqamah - should be within 10 min dhuhr period
    const within = new Date("2026-01-15T13:05:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, within, "dhuhr")).toBe(true);

    // 15 minutes after iqamah - should be outside 10 min dhuhr period
    const outside = new Date("2026-01-15T13:15:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, outside, "dhuhr")).toBe(false);
  });

  it("should use jumuah1 duration (20 min) when prayer name is jumuah1", () => {
    const iqamahMs = new Date("2026-01-16T13:00:00").getTime();

    // 10 minutes after iqamah - should be within 20 min jumuah1 period
    const within10min = new Date("2026-01-16T13:10:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, within10min, "jumuah1")).toBe(true);

    // 15 minutes after iqamah - should be within 20 min jumuah1 period
    const within15min = new Date("2026-01-16T13:15:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, within15min, "jumuah1")).toBe(true);

    // 25 minutes after iqamah - should be outside 20 min jumuah1 period
    const outside = new Date("2026-01-16T13:25:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, outside, "jumuah1")).toBe(false);
  });

  it("should use jumuah2 duration (20 min) when prayer name is jumuah2", () => {
    const iqamahMs = new Date("2026-01-16T13:45:00").getTime();

    // 15 minutes after iqamah - should be within 20 min jumuah2 period
    const within = new Date("2026-01-16T14:00:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, within, "jumuah2")).toBe(true);

    // 25 minutes after iqamah - should be outside 20 min jumuah2 period
    const outside = new Date("2026-01-16T14:10:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, outside, "jumuah2")).toBe(false);
  });

  it("should accept custom durations with prayer name", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const customDurations: PrayerHoldingDurations = {
      fajr: 10 * 60 * 1000,
      sunrise: 10 * 60 * 1000,
      dhuhr: 5 * 60 * 1000, // 5 minutes custom
      jumuah1: 60 * 60 * 1000,
      jumuah2: 45 * 60 * 1000,
      asr: 10 * 60 * 1000,
      maghrib: 10 * 60 * 1000,
      isha: 10 * 60 * 1000,
    };

    // 3 minutes after - should be within custom 5 min dhuhr period
    const within = new Date("2026-01-15T13:03:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, within, "dhuhr", customDurations)).toBe(true);

    // 7 minutes after - should be outside custom 5 min dhuhr period
    const outside = new Date("2026-01-15T13:07:00").getTime();
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, outside, "dhuhr", customDurations)).toBe(false);
  });

  it("should still accept number for backwards compatibility", () => {
    const iqamahMs = new Date("2026-01-15T13:00:00").getTime();
    const currentTimeMs = new Date("2026-01-15T13:25:00").getTime(); // 25 minutes after

    // With 30 minute duration (number), should be within
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs, 30 * 60 * 1000)).toBe(true);

    // With 20 minute duration (number), should be outside
    expect(isWithinPrayerHoldingPeriodMs(iqamahMs, currentTimeMs, 20 * 60 * 1000)).toBe(false);
  });
});

describe("isWithinPrayerHoldingPeriod with prayer-based duration", () => {
  it("should use per-prayer duration when true is passed", () => {
    const iqamahTime = new Date("2026-01-16T13:00:00");
    const previousPrayer = {
      prayer: "jumuah1",
      athan: new Date("2026-01-16T12:30:00"),
      iqamah: iqamahTime,
    };

    // 15 minutes after iqamah - should be within 20 min jumuah1 period
    const within = new Date("2026-01-16T13:15:00");
    expect(isWithinPrayerHoldingPeriod(previousPrayer, within, true)).toBe(true);

    // 25 minutes after iqamah - should be outside 20 min jumuah1 period
    const outside = new Date("2026-01-16T13:25:00");
    expect(isWithinPrayerHoldingPeriod(previousPrayer, outside, true)).toBe(false);
  });

  it("should use custom durations when passed with true", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    const customDurations: PrayerHoldingDurations = {
      fajr: 10 * 60 * 1000,
      sunrise: 10 * 60 * 1000,
      dhuhr: 5 * 60 * 1000, // 5 minutes custom
      jumuah1: 60 * 60 * 1000,
      jumuah2: 45 * 60 * 1000,
      asr: 10 * 60 * 1000,
      maghrib: 10 * 60 * 1000,
      isha: 10 * 60 * 1000,
    };

    // 3 minutes after - should be within custom 5 min dhuhr period
    const within = new Date("2026-01-15T13:03:00");
    expect(isWithinPrayerHoldingPeriod(previousPrayer, within, true, customDurations)).toBe(true);

    // 7 minutes after - should be outside custom 5 min dhuhr period
    const outside = new Date("2026-01-15T13:07:00");
    expect(isWithinPrayerHoldingPeriod(previousPrayer, outside, true, customDurations)).toBe(false);
  });

  it("should still accept number for backwards compatibility", () => {
    const iqamahTime = new Date("2026-01-15T13:00:00");
    const previousPrayer = {
      prayer: "dhuhr",
      athan: new Date("2026-01-15T12:30:00"),
      iqamah: iqamahTime,
    };
    const currentTime = new Date("2026-01-15T13:25:00"); // 25 minutes after

    // With 30 minute duration (number), should be within
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime, 30 * 60 * 1000)).toBe(true);

    // With 20 minute duration (number), should be outside
    expect(isWithinPrayerHoldingPeriod(previousPrayer, currentTime, 20 * 60 * 1000)).toBe(false);
  });
});
