"use client";

import { TIMELINE_PPS } from "../utils/time";

interface PlayheadProps {
  currentTime: number;
  duration: number;
}

export function Playhead({ currentTime }: PlayheadProps) {
  const left = currentTime * TIMELINE_PPS;

  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-10"
      style={{ left: `${left}px` }}
    >
      {/* Playhead handle */}
      <div className="absolute -top-0 -translate-x-1/2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
      </div>
      {/* Line */}
      <div className="absolute top-0 bottom-0 w-px bg-red-500 -translate-x-1/2" />
    </div>
  );
}
