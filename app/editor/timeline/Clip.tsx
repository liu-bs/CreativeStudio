"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { TIMELINE_PPS } from "../utils/time";
import type { TimelineClip } from "../store/types";

interface ClipProps {
  clip: TimelineClip;
}

type DragState = {
  type: "move" | "trimLeft" | "trimRight";
  startX: number;
  origStart: number;
  origDuration: number;
  origTrimStart: number;
} | null;

export function Clip({ clip }: ClipProps) {
  const updateClip = useEditorStore((s) => s.updateClip);
  const selectObject = useEditorStore((s) => s.selectObject);
  const selectedId = useEditorStore((s) => s.selectedId);
  const [dragState, setDragState] = useState<DragState>(null);

  const isSelected = clip.canvasObjectId === selectedId;

  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / TIMELINE_PPS;

      if (dragState.type === "move") {
        updateClip(clip.id, {
          start: Math.max(0, dragState.origStart + deltaTime),
        });
      } else if (dragState.type === "trimLeft") {
        const deltaStart = Math.max(
          -dragState.origTrimStart,
          deltaTime
        );
        const newStart = Math.max(0, dragState.origStart + deltaStart);
        const newDuration = dragState.origDuration - deltaStart;
        const newTrimStart = dragState.origTrimStart + deltaStart;

        if (newDuration > 0.5) {
          updateClip(clip.id, {
            start: newStart,
            duration: newDuration,
            trimStart: newTrimStart,
          });
        }
      } else if (dragState.type === "trimRight") {
        const newDuration = Math.max(0.5, dragState.origDuration + deltaTime);
        updateClip(clip.id, { duration: newDuration });
      }
    };

    const onUp = () => setDragState(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, clip.id, updateClip]);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "move" | "trimLeft" | "trimRight"
  ) => {
    e.stopPropagation();
    if (clip.canvasObjectId) {
      selectObject(clip.canvasObjectId);
    }
    setDragState({
      type,
      startX: e.clientX,
      origStart: clip.start,
      origDuration: clip.duration,
      origTrimStart: clip.trimStart,
    });
  };

  const colorHex = `#${clip.color.toString(16).padStart(6, "0")}`;

  return (
    <div
      onMouseDown={(e) => handleMouseDown(e, "move")}
      className="absolute top-1 flex h-8 cursor-pointer items-center rounded px-2 text-xs text-white overflow-hidden"
      style={{
        left: `${clip.start * TIMELINE_PPS}px`,
        width: `${clip.duration * TIMELINE_PPS}px`,
        backgroundColor: colorHex,
        opacity: isSelected ? 0.7 : 1,
        outline: isSelected ? "2px solid #fff" : "none",
        outlineOffset: "-1px",
      }}
    >
      <span className="truncate pointer-events-none">{clip.label}</span>
      {/* Trim handles */}
      <div
        onMouseDown={(e) => handleMouseDown(e, "trimLeft")}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-w-resize bg-black/40 hover:bg-black/60"
      />
      <div
        onMouseDown={(e) => handleMouseDown(e, "trimRight")}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-e-resize bg-black/40 hover:bg-black/60"
      />
    </div>
  );
}
