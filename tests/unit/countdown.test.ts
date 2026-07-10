import { describe, it, expect } from "vitest";

// Countdown calculation matching page.tsx logic
function calculateDaysRemaining(targetDateStr: string, currentDateStr: string) {
  const target = new Date(targetDateStr).getTime();
  const current = new Date(currentDateStr).getTime();
  const diff = target - current;
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

describe("Exam Countdown Timer Logic", () => {
  it("should calculate correct number of remaining days for a future date", () => {
    const target = "2027-06-25T07:30:00";
    const current = "2027-06-20T07:30:00"; // 5 days difference
    const days = calculateDaysRemaining(target, current);
    expect(days).toBe(5);
  });

  it("should return 0 when the target date is in the past", () => {
    const target = "2027-06-25T07:30:00";
    const current = "2027-07-01T07:30:00"; // Past date
    const days = calculateDaysRemaining(target, current);
    expect(days).toBe(0);
  });
});
