/**
 * Prayer times validation schemas
 *
 * Zod schemas for validating prayer time JSON data files.
 * Provides runtime validation to catch data errors early.
 */

import { z } from "zod";

/**
 * Time string pattern: HH:MM (24-hour format)
 */
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (expected HH:MM)");

/**
 * Date string pattern: YYYY-MM-DD
 */
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)");

/**
 * Schema for a single athan entry (daily prayer start times)
 */
export const athanEntrySchema = z.object({
  date: dateStringSchema,
  fajr: timeStringSchema,
  sunrise: timeStringSchema,
  dhuhr: timeStringSchema,
  asr: timeStringSchema,
  maghrib: timeStringSchema,
  isha: timeStringSchema,
});

export type AthanEntrySchema = z.infer<typeof athanEntrySchema>;

/**
 * Schema for a single iqamah entry (daily congregation times)
 */
export const iqamahEntrySchema = z.object({
  date: dateStringSchema,
  fajr: timeStringSchema,
  dhuhr: timeStringSchema,
  asr: timeStringSchema,
  isha: timeStringSchema,
  jumuah1: timeStringSchema.optional(),
  jumuah2: timeStringSchema.optional(),
});

export type IqamahEntrySchema = z.infer<typeof iqamahEntrySchema>;

/**
 * Schema for a full year of athan data
 */
export const athanYearSchema = z.array(athanEntrySchema);

export type AthanYearSchema = z.infer<typeof athanYearSchema>;

/**
 * Schema for a full year of iqamah data
 */
export const iqamahYearSchema = z.array(iqamahEntrySchema);

export type IqamahYearSchema = z.infer<typeof iqamahYearSchema>;

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

/**
 * Validate athan data for a year
 */
export function validateAthanData(data: unknown): ValidationResult<AthanYearSchema> {
  const result = athanYearSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate iqamah data for a year
 */
export function validateIqamahData(data: unknown): ValidationResult<IqamahYearSchema> {
  const result = iqamahYearSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Format Zod validation errors for logging
 */
export function formatValidationErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path}: ${issue.message}`;
    })
    .join("\n");
}
