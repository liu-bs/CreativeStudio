"use client";

import { useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import type { ToolType, ImageObject, VideoObject } from "../store/types";

const TOOLS: { type: ToolType; icon: string; label: string; shortcut: string }[] = [
  { type: "select", icon: "↖", label: "Select", shortcut: "V" },
  { type: "rectangle", icon: "▬", label: "Rectangle", shortcut: "R" },
  { type: "circle", icon: "●", label: "Circle", shortcut: "O" },
  { type: "text", icon: "T", label: "Text", shortcut: "T" },
  { type: "sticky", icon: "▣", label: "Sticky Note", shortcut: "N" },
  { type: "image", icon: "🖼", label: "Image", shortcut: "I" },
  { type: "video", icon: "▶", label: "Video", shortcut: "D" },
];

export function Toolbar() {
  const currentTool = useEditorStore((s) => s.currentTool);
  const setTool = useEditorStore((s) => s.setTool);
  const addObject = useEditorStore((s) => s.addObject);
  const selectObject = useEditorStore((s) => s.selectObject);
  const addClip = useEditorStore((s) => s.addClip);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: ToolType) => {
    if (tool === "image") {
      imageInputRef.current?.click();
    } else if (tool === "video") {
      videoInputRef.current?.click();
    } else {
      setTool(tool);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxDim = 400;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const obj: ImageObject = {
        id: crypto.randomUUID(),
        type: "image",
        x: 100 + Math.random() * 100,
        y: 100 + Math.random() * 100,
        width: w,
        height: h,
        rotation: 0,
        imageUrl: url,
      };
      addObject(obj);
      selectObject(obj.id);
    };
    img.src = url;
    e.target.value = "";
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration || 10;
      const objId = crypto.randomUUID();
      const clipId = crypto.randomUUID();

      const videoObj: VideoObject = {
        id: objId,
        type: "video",
        x: 100 + Math.random() * 100,
        y: 100 + Math.random() * 100,
        width: 320,
        height: 180,
        rotation: 0,
        videoUrl: url,
        trimStart: 0,
        trimEnd: duration,
        clipId,
      };

      addObject(videoObj);
      addClip({
        id: clipId,
        trackIndex: 0,
        start: 0,
        duration,
        videoUrl: url,
        canvasObjectId: objId,
        color: 0x6366f1,
        label: file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name,
        trimStart: 0,
        fileType: file.type || "video/mp4",
      });
      selectObject(objId);
    };
    video.src = url;
    e.target.value = "";
  };

  return (
    <div className="flex w-12 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-900 py-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => handleToolClick(tool.type)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-base transition-colors ${
            currentTool === tool.type
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />
    </div>
  );
}
