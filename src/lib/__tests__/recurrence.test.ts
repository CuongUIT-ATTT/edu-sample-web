import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';

import {
  createRecurrenceRule,
  expandRecurrence,
  generateRecurrenceId,
  formatInTimezone,
} from '../recurrence';

const BASE_DATE = new Date('2026-01-15T09:00:00Z'); // Thursday
const BASE_END = new Date('2026-01-15T10:00:00Z');

describe('createRecurrenceRule', () => {
  it('creates daily recurrence', () => {
    const rrule = createRecurrenceRule({ frequency: 'DAILY' });
    expect(rrule).toContain('FREQ=DAILY');
    expect(rrule).toContain('INTERVAL=1');
  });

  it('creates weekly recurrence with specific days', () => {
    const rrule = createRecurrenceRule({
      frequency: 'WEEKLY',
      daysOfWeek: ['MO', 'WE', 'FR'],
    });
    expect(rrule).toContain('FREQ=WEEKLY');
    expect(rrule).toContain('BYDAY=MO,WE,FR');
  });

  it('creates monthly recurrence with count limit', () => {
    const rrule = createRecurrenceRule({ frequency: 'MONTHLY', count: 5 });
    expect(rrule).toContain('FREQ=MONTHLY');
    expect(rrule).toContain('COUNT=5');
  });

  it('creates yearly recurrence with until date', () => {
    const until = new Date('2026-12-31T23:59:59Z');
    const rrule = createRecurrenceRule({ frequency: 'YEARLY', until });
    expect(rrule).toContain('FREQ=YEARLY');
    expect(rrule).toContain('UNTIL=');
  });

  it('uses custom interval', () => {
    const rrule = createRecurrenceRule({ frequency: 'DAILY', interval: 3 });
    expect(rrule).toContain('INTERVAL=3');
  });
});

describe('expandRecurrence', () => {
  it('returns non-recurring event if it overlaps the range', () => {
    const range = { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-31T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END },
      range.start,
      range.end
    );
    expect(result).toHaveLength(1);
    expect(result[0].start).toEqual(BASE_DATE);
    expect(result[0].isException).toBe(false);
  });

  it('returns empty for non-recurring event outside the range', () => {
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END },
      new Date('2026-02-01T00:00:00Z'),
      new Date('2026-02-28T23:59:59Z')
    );
    expect(result).toHaveLength(0);
  });

  it('expands daily recurrence across 3 days', () => {
    const rrule = createRecurrenceRule({ frequency: 'DAILY' });
    const range = { start: new Date('2026-01-15T00:00:00Z'), end: new Date('2026-01-17T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END, recurrenceRule: rrule },
      range.start,
      range.end
    );
    expect(result).toHaveLength(3);
    expect(result[0].start).toEqual(BASE_DATE);
    expect(result[1].start).toEqual(addDays(BASE_DATE, 1));
    expect(result[2].start).toEqual(addDays(BASE_DATE, 2));
  });

  it('expands weekly MWF recurrence', () => {
    const rrule = createRecurrenceRule({ frequency: 'WEEKLY', daysOfWeek: ['MO', 'WE', 'FR'] });
    const range = { start: new Date('2026-01-15T00:00:00Z'), end: new Date('2026-01-25T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END, recurrenceRule: rrule },
      range.start,
      range.end
    );
    // Should have multiple instances on Mon/Wed/Fri
    expect(result.length).toBeGreaterThanOrEqual(4);
    const days = result.map((r) => r.start.getUTCDay());
    expect(days).toContain(1); // Monday
    expect(days).toContain(3); // Wednesday
    expect(days).toContain(5); // Friday
  });

  it('respects count limit', () => {
    const rrule = createRecurrenceRule({ frequency: 'DAILY', count: 3 });
    const range = { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-02-01T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END, recurrenceRule: rrule },
      range.start,
      range.end
    );
    expect(result).toHaveLength(3);
  });

  it('handles exceptions (overridden instances)', () => {
    const rrule = createRecurrenceRule({ frequency: 'DAILY' });
    const exceptionStart = new Date('2026-01-16T14:00:00Z');
    const exceptionEnd = new Date('2026-01-16T15:30:00Z');
    const recId = generateRecurrenceId(addDays(BASE_DATE, 1));

    const range = { start: new Date('2026-01-15T00:00:00Z'), end: new Date('2026-01-17T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END, recurrenceRule: rrule },
      range.start,
      range.end,
      [
        {
          originalStart: addDays(BASE_DATE, 1),
          recurrenceId: recId,
          startTime: exceptionStart,
          endTime: exceptionEnd,
        },
      ]
    );

    expect(result).toHaveLength(3);
    const exceptionInstance = result.find((r) => r.isException);
    expect(exceptionInstance).toBeDefined();
    expect(exceptionInstance?.start).toEqual(exceptionStart);
    expect(exceptionInstance?.end).toEqual(exceptionEnd);
  });

  it('handles empty exceptions array gracefully', () => {
    const rrule = createRecurrenceRule({ frequency: 'WEEKLY' });
    const range = { start: new Date('2026-01-15T00:00:00Z'), end: new Date('2026-02-15T23:59:59Z') };
    const result = expandRecurrence(
      { startTime: BASE_DATE, endTime: BASE_END, recurrenceRule: rrule },
      range.start,
      range.end
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => !r.isException)).toBe(true);
  });
});

describe('generateRecurrenceId', () => {
  it('generates ISO string from date', () => {
    const id = generateRecurrenceId(BASE_DATE);
    expect(id).toBe('2026-01-15T09:00:00.000Z');
  });
});

describe('formatInTimezone', () => {
  it('formats date in given timezone', () => {
    const result = formatInTimezone(BASE_DATE, 'Asia/Ho_Chi_Minh', 'HH:mm');
    // UTC 09:00 = ICT 16:00 (UTC+7)
    expect(result).toBe('16:00');
  });
});
