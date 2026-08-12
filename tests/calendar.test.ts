import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Calendar - Event & Exception", () => {
  it("event 'Họp giao ban' có RRULE + CANCELLED exception + participants + reminders", async () => {
    const e = await db.event.findFirst({
      where: { title: { contains: "Họp giao ban" } },
      include: { exceptions: true, participants: true, reminders: true },
    });
    expect(e).not.toBeNull();
    expect(e!.recurrenceRule).toContain("FREQ=WEEKLY");
    expect(e!.exceptions.length).toBeGreaterThanOrEqual(1);
    expect(e!.exceptions.some((x) => x.status === "CANCELLED")).toBe(true);
    const pStatuses = e!.participants.map((p) => p.responseStatus);
    expect(pStatuses).toContain("ACCEPTED");
    expect(pStatuses).toContain("PENDING");
    const rMethods = e!.reminders.map((r) => r.method);
    expect(rMethods).toContain("POPUP");
    expect(rMethods).toContain("EMAIL");
  });
});
