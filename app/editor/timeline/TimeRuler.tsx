"use client";

import { TIMELINE_PPS, formatTime } from "../utils/time";

interface TimeRulerProps {
  duration: number;
}

export function TimeRuler({ duration }: TimeRulerProps) {
  const step = duration > 30 ? 5 : 1;
  const ticks = Math.ceil(duration / step) + 1;

  return (
    <div className="relative h-6 border-b border-zinc-800 bg-zinc-900">
      {Array.from({ length: ticks }).map((_, i) => {
        const time = i * step;
        const left = time * TIMELINE_PPS;
        return (
          <div
            key={i}
            className="absolute top-0 flex h-full items-center"
            style={{ left: `${left}px` }}
          >
            <div className="absolute top-0 h-2 w-px bg-zinc-600" />
            <span className="ml-1 text-[10px] text-zinc-500">
              {formatTime(time, false)}
            </span>
          </div>
        );
      })}
      {/* Minor ticks */}
      {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
        <div
          key={`minor-${i}`}
          className="absolute top-0 h-1 w-px bg-zinc-700"
          style={{ left: `${i * TIMELINE_PPS}px` }}
        />
      ))}
    </div>
  );
}
