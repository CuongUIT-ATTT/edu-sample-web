import type { CalendarEvent } from "./CalendarApp";

export interface LayoutedEvent {
  event: CalendarEvent;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
}

const HOUR_HEIGHT = 64;

/**
 * Compute pixel positions and overlapping columns for a set of events.
 */
export function computeEventColumns(events: CalendarEvent[]): LayoutedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) return diff;
    return (
      b.end.getTime() -
      b.start.getTime() -
      (a.end.getTime() - a.start.getTime())
    );
  });

  const columns: CalendarEvent[][] = [];
  const assignments: Array<{ column: number; event: CalendarEvent }> = [];

  for (const event of sorted) {
    const evStart = event.start.getTime();
    let col = 0;
    for (; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (lastInCol.end.getTime() <= evStart) break;
    }
    if (col >= columns.length) {
      columns.push([]);
    }
    columns[col].push(event);
    assignments.push({ column: col, event });
  }

  const totalColumns = Math.max(columns.length, 1);

  return sorted.map((event) => {
    const assign = assignments.find((a) => a.event === event)!;
    const startHours = event.start.getHours() + event.start.getMinutes() / 60;
    const endHours = event.end.getHours() + event.end.getMinutes() / 60;
    const durationHours = Math.max(endHours - startHours, 0.25);

    return {
      event,
      topPx: startHours * HOUR_HEIGHT,
      heightPx: durationHours * HOUR_HEIGHT,
      leftPercent: (assign.column / totalColumns) * 100,
      widthPercent: 100 / totalColumns,
    };
  });
}
