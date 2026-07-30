import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Calendar - Event & Exception", () => {
  it("evt-001 có RRULE + CANCELLED exception + 3 participant statuses + 2 reminders", async () => {
    const e = await db.event.findUnique({
      where: { id: "evt-001" },
      include: { exceptions: true, participants: true, reminders: true },
    });
    expect(e).not.toBeNull();
    expect(e!.recurrenceRule).toContain("FREQ=WEEKLY");
    expect(e!.exceptions.length).toBeGreaterThanOrEqual(1);
    expect(e!.exceptions[0].status).toBe("CANCELLED");
    const pStatuses = e!.participants.map((p) => p.responseStatus);
    expect(pStatuses).toContain("ACCEPTED");
    expect(pStatuses).toContain("DECLINED");
    expect(pStatuses).toContain("PENDING");
    const rMethods = e!.reminders.map((r) => r.method);
    expect(rMethods).toContain("POPUP");
    expect(rMethods).toContain("EMAIL");
  });
});
