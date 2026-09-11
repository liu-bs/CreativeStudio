"use client";

import { useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { formatTime, TIMELINE_PPS } from "../utils/time";
import { Track } from "./Track";
import { Playhead } from "./Playhead";
import { TimeRuler } from "./TimeRuler";

const NUM_TRACKS = 4;

export function Timeline() {
  const playback = useEditorStore((s) => s.playback);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const clips = useEditorStore((s) => s.clips);
  const currentTimeRef = useRef(0);

  // Group clips by track
  const trackClips = useMemo(() => {
    const tracks = new Map<number, typeof clips extends Map<string, infer T> ? T[] : never>();
    const map: Record<number, typeof clips extends Map<string, infer T> ? T[] : never> = {};
    for (const clip of clips.values()) {
      const arr = (map[clip.trackIndex] || []) as any[];
      arr.push(clip);
      (map as any)[clip.trackIndex] = arr;
    }
    return map;
  }, [clips]);

  // Playback loop
  useEffect(() => {
    if (!playback.isPlaying) return;

    let lastTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const newTime = currentTimeRef.current + delta;

      if (newTime >= playback.totalDuration) {
        setCurrentTime(0);
        currentTimeRef.current = 0;
        setPlaying(false);
      } else {
        setCurrentTime(newTime);
        currentTimeRef.current = newTime;
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playback.isPlaying, playback.totalDuration, setPlaying, setCurrentTime]);

  // Sync ref when currentTime changes externally (seeking)
  useEffect(() => {
    currentTimeRef.current = playback.currentTime;
  }, [playback.currentTime]);

  // Click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (e.currentTarget.parentElement?.scrollLeft || 0);
    const time = Math.max(0, x / TIMELINE_PPS);
    setCurrentTime(time);
  };

  return (
    <div className="flex h-52 flex-col border-t border-zinc-800 bg-zinc-900">
      {/* Play controls bar */}
      <div className="flex h-9 items-center gap-3 border-b border-zinc-800 px-4">
        <button
          onClick={() => setPlaying(!playback.isPlaying)}
          className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs text-white hover:bg-blue-500"
        >
          {playback.isPlaying ? "⏸" : "▶"}
        </button>
        <span className="font-mono text-xs text-zinc-400">
          {formatTime(playback.currentTime)} / {formatTime(playback.totalDuration)}
        </span>
        <span className="text-xs text-zinc-600">{playback.fps} fps</span>
      </div>

      {/* Timeline body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track labels */}
        <div className="w-24 shrink-0 border-r border-zinc-800">
          <div className="h-6 border-b border-zinc-800" />
          {Array.from({ length: NUM_TRACKS }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 items-center border-b border-zinc-800/50 px-3 text-xs text-zinc-500"
            >
              Track {i + 1}
            </div>
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
          <div className="relative" style={{ width: `${playback.totalDuration * TIMELINE_PPS + 100}px` }}>
            <TimeRuler duration={playback.totalDuration} />
            {/* Click-to-seek overlay */}
            <div className="absolute inset-0 top-6" onClick={handleTimelineClick} />
            {/* Tracks */}
            <div className="relative">
              {Array.from({ length: NUM_TRACKS }).map((_, i) => (
                <Track
                  key={i}
                  index={i}
                  clips={(trackClips as any)[i] || []}
                />
              ))}
            </div>
            <Playhead
              currentTime={playback.currentTime}
              duration={playback.totalDuration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
