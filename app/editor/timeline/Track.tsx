"use client";

import type { TimelineClip } from "../store/types";
import { Clip } from "./Clip";

interface TrackProps {
  index: number;
  clips: TimelineClip[];
}

export function Track({ index, clips }: TrackProps) {
  return (
    <div className="relative h-10 border-b border-zinc-800/50 bg-zinc-900">
      {/* Grid lines */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="border-r border-zinc-800/30"
            style={{ width: "50px" }}
          />
        ))}
      </div>
      {/* Clips */}
      {clips.map((clip) => (
        <Clip key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
