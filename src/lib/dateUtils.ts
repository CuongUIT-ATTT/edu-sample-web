// Returns 1=Monday...7=Sunday to match your dayOfWeek enum
export function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  const jsDay = d.getDay(); // 0=Sun,1=Mon...6=Sat
  return jsDay === 0 ? 7 : jsDay;
}

// Returns nearest future date (>=today) matching targetDow
export function nearestDateForDow(targetDow: number): string {
  const today = new Date();
  const jsTarget = targetDow === 7 ? 0 : targetDow;
  const diff = (jsTarget - today.getDay() + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result.toISOString().split("T")[0];
}
