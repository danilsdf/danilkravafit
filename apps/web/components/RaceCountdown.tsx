"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 864e5),
    hours: Math.floor((diff % 864e5) / 36e5),
    minutes: Math.floor((diff % 36e5) / 6e4),
    seconds: Math.floor((diff % 6e4) / 1e3),
  };
}

export default function RaceCountdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate);
    const tick = () => setTime(getTimeLeft(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!time) return null;

  return (
    <p className="mt-1.5 tabular-nums text-xs font-bold text-[#d6a936]">
      {time.days}d {String(time.hours).padStart(2, "0")}h{" "}
      {String(time.minutes).padStart(2, "0")}m{" "}
      {String(time.seconds).padStart(2, "0")}s
    </p>
  );
}
