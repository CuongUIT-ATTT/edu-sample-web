"use client";

import { useEffect, useState } from "react";

/**
 * Red line showing the current time in Day/Week views.
 * Updates every minute.
 */
export default function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours() + now.getMinutes() / 60;
  const topPx = hours * 64; // 64px per hour slot

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top: topPx }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
}
