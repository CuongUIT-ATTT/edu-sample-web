import { RRule, rrulestr } from "rrule";
import type { Frequency } from "rrule";
import { addMinutes } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: string[]; // ['MO','TU','WE','TH','FR','SA','SU']
  count?: number;
  until?: Date;
}

/**
 * Create an RRULE string from structured options.
 */
export function createRecurrenceRule(options: RecurrenceOptions): string {
  const freqMap: Record<RecurrenceFrequency, Frequency> = {
    DAILY: RRule.DAILY as unknown as Frequency,
    WEEKLY: RRule.WEEKLY as unknown as Frequency,
    MONTHLY: RRule.MONTHLY as unknown as Frequency,
    YEARLY: RRule.YEARLY as unknown as Frequency,
  };

  const dayMap: Record<string, unknown> = {
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
    SU: RRule.SU,
  };

  const ruleOptions: Record<string, unknown> = {
    freq: freqMap[options.frequency],
    interval: options.interval ?? 1,
  };

  if (options.daysOfWeek?.length) {
    ruleOptions.byweekday = options.daysOfWeek.map((d) => dayMap[d]);
  }

  if (options.count !== undefined) {
    ruleOptions.count = options.count;
  }

  if (options.until) {
    ruleOptions.until = options.until;
  }

  return new RRule(ruleOptions).toString();
}

/**
 * Recurrence instance after expansion.
 */
export interface RecurrenceInstance {
  start: Date;
  end: Date;
  recurrenceId: string;
  isException: boolean;
}

export interface RecurrenceException {
  originalStart: Date;
  recurrenceId: string;
  startTime?: Date;
  endTime?: Date;
  title?: string;
  description?: string;
  location?: string;
  isAllDay?: boolean;
  status?: string;
}

/**
 * Expand a recurring event into concrete instances within a date range.
 */
export function expandRecurrence(
  event: {
    startTime: Date;
    endTime: Date;
    recurrenceRule?: string;
  },
  rangeStart: Date,
  rangeEnd: Date,
  exceptions: RecurrenceException[] = []
): RecurrenceInstance[] {
  // Non-recurring event: check if it overlaps the range
  if (!event.recurrenceRule) {
    if (event.endTime >= rangeStart && event.startTime <= rangeEnd) {
      return [
        {
          start: event.startTime,
          end: event.endTime,
          recurrenceId: generateRecurrenceId(event.startTime),
          isException: false,
        },
      ];
    }
    return [];
  }

  // Parse the RRULE from the stored string
  const rule = rrulestr(event.recurrenceRule, {
    dtstart: event.startTime,
  });

  // Calculate event duration in minutes
  const durationMs = event.endTime.getTime() - event.startTime.getTime();
  const durationMin = durationMs / 60000;

  // Generate occurrences in the range
  const occurrences = rule.between(rangeStart, rangeEnd, true);

  // Build exception map keyed by recurrenceId
  const exceptionMap = new Map<string, RecurrenceException>();
  for (const ex of exceptions) {
    exceptionMap.set(ex.recurrenceId, ex);
  }

  return occurrences.map((occurrence) => {
    const recId = generateRecurrenceId(occurrence);
    const exception = exceptionMap.get(recId);

    const instanceStart = exception?.startTime ?? occurrence;
    const instanceEnd = exception?.endTime ?? addMinutes(occurrence, durationMin);

    return {
      start: instanceStart,
      end: instanceEnd,
      recurrenceId: recId,
      isException: !!exception,
    };
  });
}

/**
 * Generate a stable recurrence ID from an occurrence start time.
 */
export function generateRecurrenceId(date: Date): string {
  return date.toISOString();
}

/**
 * Convert a UTC date to a display timezone string.
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = "yyyy-MM-dd HH:mm"
): string {
  const zoned = toZonedTime(date, timezone);
  return formatTz(zoned, formatStr, { timeZone: timezone });
}
