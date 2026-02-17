/**
 * Unit tests for lib/schemas/prayer-times.ts
 *
 * Tests Zod schemas for prayer time data validation.
 */

import { describe, expect, it } from "vitest";
import {
  athanEntrySchema,
  athanYearSchema,
  formatValidationErrors,
  iqamahEntrySchema,
  iqamahYearSchema,
  validateAthanData,
  validateIqamahData,
} from "@/lib/schemas/prayer-times";

describe("timeStringSchema (via athanEntrySchema)", () => {
  const validEntry = {
    date: "2025-01-15",
    fajr: "06:30",
    sunrise: "07:50",
    dhuhr: "12:30",
    asr: "15:00",
    maghrib: "17:00",
    isha: "18:30",
  };

  it("accepts valid 24-hour time format HH:MM", () => {
    const result = athanEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts midnight 00:00", () => {
    const entry = { ...validEntry, fajr: "00:00" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("accepts 23:59", () => {
    const entry = { ...validEntry, isha: "23:59" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("rejects 24:00 (invalid hour)", () => {
    const entry = { ...validEntry, isha: "24:00" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects 12:60 (invalid minutes)", () => {
    const entry = { ...validEntry, dhuhr: "12:60" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects single digit hour 6:30", () => {
    const entry = { ...validEntry, fajr: "6:30" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects single digit minute 06:5", () => {
    const entry = { ...validEntry, fajr: "06:5" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects 12-hour format with AM/PM", () => {
    const entry = { ...validEntry, fajr: "06:30 AM" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const entry = { ...validEntry, fajr: "" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});

describe("dateStringSchema (via athanEntrySchema)", () => {
  const validEntry = {
    date: "2025-01-15",
    fajr: "06:30",
    sunrise: "07:50",
    dhuhr: "12:30",
    asr: "15:00",
    maghrib: "17:00",
    isha: "18:30",
  };

  it("accepts valid YYYY-MM-DD format", () => {
    const result = athanEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts 2025-12-31", () => {
    const entry = { ...validEntry, date: "2025-12-31" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("accepts 2026-01-01", () => {
    const entry = { ...validEntry, date: "2026-01-01" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("rejects DD-MM-YYYY format", () => {
    const entry = { ...validEntry, date: "15-01-2025" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects MM/DD/YYYY format", () => {
    const entry = { ...validEntry, date: "01/15/2025" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects missing leading zeros", () => {
    const entry = { ...validEntry, date: "2025-1-15" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const entry = { ...validEntry, date: "" };
    const result = athanEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});

describe("athanEntrySchema", () => {
  it("requires all prayer times", () => {
    const incomplete = {
      date: "2025-01-15",
      fajr: "06:30",
      // missing other prayers
    };
    const result = athanEntrySchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("requires date field", () => {
    const noDate = {
      fajr: "06:30",
      sunrise: "07:50",
      dhuhr: "12:30",
      asr: "15:00",
      maghrib: "17:00",
      isha: "18:30",
    };
    const result = athanEntrySchema.safeParse(noDate);
    expect(result.success).toBe(false);
  });

  it("accepts valid complete entry", () => {
    const valid = {
      date: "2025-06-21",
      fajr: "02:45",
      sunrise: "04:30",
      dhuhr: "13:05",
      asr: "18:30",
      maghrib: "21:15",
      isha: "23:00",
    };
    const result = athanEntrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("iqamahEntrySchema", () => {
  const validEntry = {
    date: "2025-01-15",
    fajr: "06:45",
    dhuhr: "13:00",
    asr: "15:30",
    isha: "19:00",
  };

  it("accepts valid iqamah entry without jumuah", () => {
    const result = iqamahEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts entry with jumuah1 only", () => {
    const entry = { ...validEntry, jumuah1: "13:00" };
    const result = iqamahEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("accepts entry with jumuah1 and jumuah2", () => {
    const entry = { ...validEntry, jumuah1: "13:00", jumuah2: "13:45" };
    const result = iqamahEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("does not require sunrise (iqamah only has fajr/dhuhr/asr/isha)", () => {
    // Iqamah schema doesn't have sunrise or maghrib
    const result = iqamahEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const incomplete = {
      date: "2025-01-15",
      fajr: "06:45",
      // missing dhuhr, asr, isha
    };
    const result = iqamahEntrySchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});

describe("athanYearSchema", () => {
  it("accepts empty array", () => {
    const result = athanYearSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts array of valid entries", () => {
    const entries = [
      {
        date: "2025-01-01",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
      {
        date: "2025-01-02",
        fajr: "06:29",
        sunrise: "07:49",
        dhuhr: "12:30",
        asr: "15:01",
        maghrib: "17:01",
        isha: "18:31",
      },
    ];
    const result = athanYearSchema.safeParse(entries);
    expect(result.success).toBe(true);
  });

  it("rejects array with invalid entry", () => {
    const entries = [
      {
        date: "2025-01-01",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
      {
        date: "invalid-date",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
    ];
    const result = athanYearSchema.safeParse(entries);
    expect(result.success).toBe(false);
  });
});

describe("iqamahYearSchema", () => {
  it("accepts empty array", () => {
    const result = iqamahYearSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts array of valid entries", () => {
    const entries = [
      { date: "2025-01-01", fajr: "06:45", dhuhr: "13:00", asr: "15:30", isha: "19:00" },
      { date: "2025-01-02", fajr: "06:45", dhuhr: "13:00", asr: "15:30", isha: "19:00" },
    ];
    const result = iqamahYearSchema.safeParse(entries);
    expect(result.success).toBe(true);
  });
});

describe("validateAthanData", () => {
  it("returns success: true for valid data", () => {
    const validData = [
      {
        date: "2025-01-01",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
    ];
    const result = validateAthanData(validData);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validData);
    expect(result.errors).toBeUndefined();
  });

  it("returns success: false for invalid data", () => {
    const invalidData = [{ date: "invalid", fajr: "not-a-time" }];
    const result = validateAthanData(invalidData);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });

  it("returns success: false for non-array data", () => {
    const result = validateAthanData({ notAnArray: true });
    expect(result.success).toBe(false);
  });

  it("returns success: true for empty array", () => {
    const result = validateAthanData([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("validateIqamahData", () => {
  it("returns success: true for valid data", () => {
    const validData = [{ date: "2025-01-01", fajr: "06:45", dhuhr: "13:00", asr: "15:30", isha: "19:00" }];
    const result = validateIqamahData(validData);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validData);
    expect(result.errors).toBeUndefined();
  });

  it("returns success: false for invalid data", () => {
    const invalidData = [{ date: "invalid", fajr: "not-a-time" }];
    const result = validateIqamahData(invalidData);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });

  it("returns success: false for non-array data", () => {
    const result = validateIqamahData("not an array");
    expect(result.success).toBe(false);
  });

  it("returns success: true for empty array", () => {
    const result = validateIqamahData([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("validates jumuah fields when present", () => {
    const validData = [
      {
        date: "2025-01-03",
        fajr: "06:45",
        dhuhr: "13:00",
        asr: "15:30",
        isha: "19:00",
        jumuah1: "13:00",
        jumuah2: "13:45",
      },
    ];
    const result = validateIqamahData(validData);
    expect(result.success).toBe(true);
  });
});

describe("formatValidationErrors", () => {
  it("formats single error", () => {
    const result = validateAthanData([{ date: "invalid" }]);
    expect(result.success).toBe(false);
    if (result.errors) {
      const formatted = formatValidationErrors(result.errors);
      expect(formatted).toContain("date:");
      expect(formatted).toContain("Invalid date format");
    }
  });

  it("formats multiple errors", () => {
    const result = validateAthanData([{ date: "invalid", fajr: "bad" }]);
    expect(result.success).toBe(false);
    if (result.errors) {
      const formatted = formatValidationErrors(result.errors);
      // Should have multiple lines
      const lines = formatted.split("\n");
      expect(lines.length).toBeGreaterThan(1);
    }
  });

  it("includes path in error message", () => {
    const result = validateAthanData([
      {
        date: "2025-01-01",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
      {
        date: "invalid",
        fajr: "06:30",
        sunrise: "07:50",
        dhuhr: "12:30",
        asr: "15:00",
        maghrib: "17:00",
        isha: "18:30",
      },
    ]);
    expect(result.success).toBe(false);
    if (result.errors) {
      const formatted = formatValidationErrors(result.errors);
      // Should show index 1.date
      expect(formatted).toContain("1.date");
    }
  });

  it("formats as list with dashes", () => {
    const result = validateAthanData([{ invalid: true }]);
    expect(result.success).toBe(false);
    if (result.errors) {
      const formatted = formatValidationErrors(result.errors);
      expect(formatted).toMatch(/^\s*-/m); // Line starts with dash
    }
  });
});
