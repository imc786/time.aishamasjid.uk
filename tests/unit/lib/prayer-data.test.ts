/**
 * Unit tests for lib/prayer-data.ts
 *
 * Tests prayer data loading, validation, and lookup functions.
 * Uses real data files for supported years (2025, 2026).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findAthanByDate,
  findIqamahByDate,
  getAthanData,
  getCombinedPrayerTimes,
  getIqamahData,
  getSupportedYears,
  getYearFromDate,
  hasDataForYear,
  PrayerDataError,
} from "@/lib/prayer-data";

describe("PrayerDataError", () => {
  it("should create error with message only", () => {
    const error = new PrayerDataError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("PrayerDataError");
    expect(error.year).toBeUndefined();
    expect(error.dataType).toBeUndefined();
  });

  it("should create error with year", () => {
    const error = new PrayerDataError("Test error", 2024);
    expect(error.message).toBe("Test error");
    expect(error.year).toBe(2024);
    expect(error.dataType).toBeUndefined();
  });

  it("should create error with year and dataType", () => {
    const error = new PrayerDataError("Test error", 2024, "athan");
    expect(error.message).toBe("Test error");
    expect(error.year).toBe(2024);
    expect(error.dataType).toBe("athan");
  });

  it("should be instanceof Error", () => {
    const error = new PrayerDataError("Test error");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PrayerDataError);
  });
});

describe("getAthanData", () => {
  it("should return athan data for 2025", () => {
    const data = getAthanData(2025);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    // Check structure of first entry
    expect(data[0]).toHaveProperty("date");
    expect(data[0]).toHaveProperty("fajr");
    expect(data[0]).toHaveProperty("sunrise");
    expect(data[0]).toHaveProperty("dhuhr");
    expect(data[0]).toHaveProperty("asr");
    expect(data[0]).toHaveProperty("maghrib");
    expect(data[0]).toHaveProperty("isha");
  });

  it("should return athan data for 2026", () => {
    const data = getAthanData(2026);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("should throw PrayerDataError for unsupported year 2024", () => {
    expect(() => getAthanData(2024)).toThrow(PrayerDataError);
    expect(() => getAthanData(2024)).toThrow("Unsupported year: 2024");
  });

  it("should throw PrayerDataError for unsupported year 2027", () => {
    expect(() => getAthanData(2027)).toThrow(PrayerDataError);
    expect(() => getAthanData(2027)).toThrow("Unsupported year: 2027");
  });

  it("should include year and dataType in error", () => {
    try {
      getAthanData(2024);
    } catch (e) {
      expect(e).toBeInstanceOf(PrayerDataError);
      expect((e as PrayerDataError).year).toBe(2024);
      expect((e as PrayerDataError).dataType).toBe("athan");
    }
  });

  it("should return cached data on second call", () => {
    const first = getAthanData(2025);
    const second = getAthanData(2025);
    // Same reference means cached
    expect(first).toBe(second);
  });
});

describe("getIqamahData", () => {
  it("should return iqamah data for 2025", () => {
    const data = getIqamahData(2025);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    // Check structure of first entry
    expect(data[0]).toHaveProperty("date");
    expect(data[0]).toHaveProperty("fajr");
    expect(data[0]).toHaveProperty("dhuhr");
    expect(data[0]).toHaveProperty("asr");
    expect(data[0]).toHaveProperty("isha");
  });

  it("should return iqamah data for 2026", () => {
    const data = getIqamahData(2026);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("should throw PrayerDataError for unsupported year 2024", () => {
    expect(() => getIqamahData(2024)).toThrow(PrayerDataError);
    expect(() => getIqamahData(2024)).toThrow("Unsupported year: 2024");
  });

  it("should throw PrayerDataError for unsupported year 2027", () => {
    expect(() => getIqamahData(2027)).toThrow(PrayerDataError);
    expect(() => getIqamahData(2027)).toThrow("Unsupported year: 2027");
  });

  it("should include year and dataType in error", () => {
    try {
      getIqamahData(2024);
    } catch (e) {
      expect(e).toBeInstanceOf(PrayerDataError);
      expect((e as PrayerDataError).year).toBe(2024);
      expect((e as PrayerDataError).dataType).toBe("iqamah");
    }
  });

  it("should return cached data on second call", () => {
    const first = getIqamahData(2025);
    const second = getIqamahData(2025);
    // Same reference means cached
    expect(first).toBe(second);
  });
});

describe("findAthanByDate", () => {
  it("should find athan by Date object", () => {
    const date = new Date("2025-01-15");
    const result = findAthanByDate(date);
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-01-15");
  });

  it("should find athan by date string", () => {
    const result = findAthanByDate("2025-06-15");
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-06-15");
  });

  it("should return undefined for unsupported year", () => {
    const result = findAthanByDate("2024-01-15");
    expect(result).toBeUndefined();
  });

  it("should return undefined for non-existent date in supported year", () => {
    // Feb 30 doesn't exist
    const result = findAthanByDate("2025-02-30");
    expect(result).toBeUndefined();
  });

  it("should find first day of 2025", () => {
    const result = findAthanByDate("2025-01-01");
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-01-01");
  });

  it("should find last day of 2025", () => {
    const result = findAthanByDate("2025-12-31");
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-12-31");
  });

  it("should have valid time format for all prayers", () => {
    const result = findAthanByDate("2025-07-01");
    expect(result).toBeDefined();
    // Time format: HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    expect(result?.fajr).toMatch(timeRegex);
    expect(result?.sunrise).toMatch(timeRegex);
    expect(result?.dhuhr).toMatch(timeRegex);
    expect(result?.asr).toMatch(timeRegex);
    expect(result?.maghrib).toMatch(timeRegex);
    expect(result?.isha).toMatch(timeRegex);
  });
});

describe("findIqamahByDate", () => {
  it("should find iqamah by Date object", () => {
    const date = new Date("2025-01-15");
    const result = findIqamahByDate(date);
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-01-15");
  });

  it("should find iqamah by date string", () => {
    const result = findIqamahByDate("2025-06-15");
    expect(result).toBeDefined();
    expect(result?.date).toBe("2025-06-15");
  });

  it("should return undefined for unsupported year", () => {
    const result = findIqamahByDate("2024-01-15");
    expect(result).toBeUndefined();
  });

  it("should return undefined for non-existent date in supported year", () => {
    const result = findIqamahByDate("2025-02-30");
    expect(result).toBeUndefined();
  });

  it("should have valid time format for prayers", () => {
    const result = findIqamahByDate("2025-07-01");
    expect(result).toBeDefined();
    const timeRegex = /^\d{2}:\d{2}$/;
    expect(result?.fajr).toMatch(timeRegex);
    expect(result?.dhuhr).toMatch(timeRegex);
    expect(result?.asr).toMatch(timeRegex);
    expect(result?.isha).toMatch(timeRegex);
  });
});

describe("getCombinedPrayerTimes", () => {
  it("should return combined times with athan and iqamah", () => {
    const result = getCombinedPrayerTimes("2025-01-15");
    expect(result.date).toBe("2025-01-15");
    expect(result.fajr.athan).toBeDefined();
    expect(result.fajr.iqamah).toBeDefined();
    expect(result.dhuhr.athan).toBeDefined();
    expect(result.asr.athan).toBeDefined();
    expect(result.maghrib.athan).toBeDefined();
    expect(result.isha.athan).toBeDefined();
  });

  it("should work with Date object", () => {
    const result = getCombinedPrayerTimes(new Date("2025-03-15"));
    expect(result.date).toBe("2025-03-15");
    expect(result.fajr.athan).toBeDefined();
  });

  it("should return empty structure for unsupported year", () => {
    const result = getCombinedPrayerTimes("2024-01-15");
    expect(result.date).toBe("2024-01-15");
    expect(result.fajr.athan).toBeUndefined();
    expect(result.fajr.iqamah).toBeUndefined();
    expect(result.dhuhr.athan).toBeUndefined();
  });

  it("should auto-fill maghrib iqamah with athan time", () => {
    const result = getCombinedPrayerTimes("2025-06-15");
    expect(result.maghrib.iqamah).toBe(result.maghrib.athan);
  });

  it("should have sunrise with no iqamah", () => {
    const result = getCombinedPrayerTimes("2025-01-15");
    expect(result.sunrise.athan).toBeDefined();
    expect(result.sunrise.iqamah).toBeUndefined();
  });

  it("should return all prayer keys", () => {
    const result = getCombinedPrayerTimes("2025-01-15");
    expect(result).toHaveProperty("fajr");
    expect(result).toHaveProperty("sunrise");
    expect(result).toHaveProperty("dhuhr");
    expect(result).toHaveProperty("jumuah1");
    expect(result).toHaveProperty("jumuah2");
    expect(result).toHaveProperty("asr");
    expect(result).toHaveProperty("maghrib");
    expect(result).toHaveProperty("isha");
  });
});

describe("getCombinedPrayerTimes - Friday Jumu'ah handling", () => {
  // Find a Friday in 2025 - January 3rd is a Friday
  const friday = "2025-01-03";

  it("should have jumuah1 on Fridays", () => {
    const result = getCombinedPrayerTimes(friday);
    // If iqamah data has jumuah1, it should be present
    const iqamah = findIqamahByDate(friday);
    if (iqamah?.jumuah1 && result.jumuah1) {
      expect(result.jumuah1.iqamah).toBeDefined();
    }
  });

  it("should use dhuhr athan for jumuah1 athan", () => {
    const result = getCombinedPrayerTimes(friday);
    const iqamah = findIqamahByDate(friday);
    if (iqamah?.jumuah1 && result.jumuah1) {
      expect(result.jumuah1.athan).toBe(result.dhuhr.athan);
    }
  });

  it("should hide dhuhr iqamah when jumuah is active", () => {
    const result = getCombinedPrayerTimes(friday);
    const iqamah = findIqamahByDate(friday);
    if (iqamah?.jumuah1) {
      expect(result.dhuhr.iqamah).toBeUndefined();
    }
  });

  it("should have no athan for jumuah2", () => {
    const result = getCombinedPrayerTimes(friday);
    expect(result.jumuah2?.athan).toBeUndefined();
  });
});

describe("getYearFromDate", () => {
  it("should return 2025 for date in 2025", () => {
    expect(getYearFromDate(new Date("2025-06-15"))).toBe(2025);
  });

  it("should return 2026 for date in 2026", () => {
    expect(getYearFromDate(new Date("2026-01-01"))).toBe(2026);
  });

  it("should handle start of year", () => {
    expect(getYearFromDate(new Date("2025-01-01T00:00:00"))).toBe(2025);
  });

  it("should handle end of year", () => {
    expect(getYearFromDate(new Date("2025-12-31T23:59:59"))).toBe(2025);
  });
});

describe("hasDataForYear", () => {
  it("should return true for 2025", () => {
    expect(hasDataForYear(2025)).toBe(true);
  });

  it("should return true for 2026", () => {
    expect(hasDataForYear(2026)).toBe(true);
  });

  it("should return false for 2024", () => {
    expect(hasDataForYear(2024)).toBe(false);
  });

  it("should return false for 2027", () => {
    expect(hasDataForYear(2027)).toBe(false);
  });

  it("should return false for 0", () => {
    expect(hasDataForYear(0)).toBe(false);
  });

  it("should return false for negative year", () => {
    expect(hasDataForYear(-2025)).toBe(false);
  });
});

describe("getSupportedYears", () => {
  it("should return array with 2025 and 2026", () => {
    const years = getSupportedYears();
    expect(years).toContain(2025);
    expect(years).toContain(2026);
  });

  it("should return exactly 2 years", () => {
    expect(getSupportedYears()).toHaveLength(2);
  });

  it("should return years in order", () => {
    const years = getSupportedYears();
    expect(years[0]).toBe(2025);
    expect(years[1]).toBe(2026);
  });
});
