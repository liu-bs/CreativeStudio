"use client";

import { Toolbar } from "./toolbar/Toolbar";
import { Timeline } from "./timeline/Timeline";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { PixiCanvas } from "./canvas/PixiCanvas";
import { ExportButton } from "./export/ExportButton";
import { useEditorStore } from "./store/editorStore";

export default function EditorShell() {
  const viewport = useEditorStore((s) => s.viewport);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Top Bar */}
      <header className="flex h-12 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Creative Studio</h1>
          <span className="text-xs text-zinc-600">
            Zoom: {(viewport.scale * 100).toFixed(0)}%
          </span>
        </div>
        <ExportButton />
      </header>

      {/* Main area: toolbar | canvas | properties */}
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <div className="relative flex-1 canvas-area">
          <PixiCanvas />
        </div>
        <PropertiesPanel />
      </div>

      {/* Bottom: Timeline */}
      <Timeline />
    </div>
  );
}
