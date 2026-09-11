"use client";

import { useEffect, useRef, useState } from "react";
import { Application, FederatedPointerEvent } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { SceneManager } from "./SceneManager";
import { useEditorStore } from "../store/editorStore";

export function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let mounted = true;
    let app: Application | null = null;
    const onContextMenu = (e: Event) => e.preventDefault();

    async function init() {
      if (!containerRef.current) return;

      app = new Application();
      await app.init({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundColor: 0x18181b,
        antialias: true,
        resolution: window.devicePixelRatio,
        autoDensity: true,
        resizeTo: containerRef.current,
      });

      if (!mounted || !app) {
        app?.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);

      // Create viewport
      const viewport = new Viewport({
        screenWidth: app.canvas.width,
        screenHeight: app.canvas.height,
        worldWidth: 5000,
        worldHeight: 5000,
        events: app.renderer.events,
      });

      app.stage.addChild(viewport);

      viewport
        .drag()
        .wheel({ smooth: 10 })
        .pinch()
        .clampZoom({
          minWidth: 200,
          maxWidth: 5000,
          minHeight: 200,
          maxHeight: 5000,
        });

      // Create scene manager
      const sm = new SceneManager(viewport);
      sceneManagerRef.current = sm;

      // Track viewport for coordinate display
      viewport.on("moved", () => {
        const scale = viewport.scale.x;
        setZoom(Math.round(scale * 100));
        useEditorStore.getState().setViewport(scale, viewport.x, viewport.y);
      });

      // Track mouse position for coordinate display
      viewport.on("pointermove", (e: FederatedPointerEvent) => {
        const world = viewport.toWorld(e.global.x, e.global.y);
        setCoords({ x: Math.round(world.x), y: Math.round(world.y) });
      });

      // Prevent browser context menu on right-click
      containerRef.current?.addEventListener("contextmenu", onContextMenu);

      // Handle video tool — open file dialog
      // This is triggered from EditorShell/Toolbar when video tool is selected
      // SceneManager handles the viewport click, but for video we need file upload
    }

    init();

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const state = useEditorStore.getState();
      const shortcuts: Record<string, () => void> = {
        v: () => state.setTool("select"),
        r: () => state.setTool("rectangle"),
        o: () => state.setTool("circle"),
        t: () => state.setTool("text"),
        n: () => state.setTool("sticky"),
        i: () => {
          // Trigger image upload via toolbar button
          const btn = document.querySelector<HTMLButtonElement>('button[title^="Image"]');
          btn?.click();
        },
        d: () => {
          // Trigger video upload via toolbar button
          const btn = document.querySelector<HTMLButtonElement>('button[title^="Video"]');
          btn?.click();
        },
      };

      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        shortcuts[key]();
      }

      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        state.deleteObject(state.selectedId);
      }

      if (e.key === "Escape") {
        state.selectObject(null);
        state.setTool("select");
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Cleanup
    return () => {
      mounted = false;
      window.removeEventListener("keydown", onKeyDown);
      containerRef.current?.removeEventListener("contextmenu", onContextMenu);
      sceneManagerRef.current?.destroy();
      sceneManagerRef.current = null;
      if (app) {
        try {
          app.destroy(true, { children: true });
        } catch {
          // PixiJS may throw during destroy if internal resize timer is cancelled
        }
        app = null;
      }
    };
  }, []);

  const objectCount = useEditorStore((s) => s.objects.size);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Empty state hint */}
      {objectCount === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-zinc-600">Infinite Canvas</p>
            <p className="mt-1 text-sm text-zinc-700">
              Select a tool from the left and click anywhere to create
            </p>
            <p className="mt-3 text-xs text-zinc-700">
              Scroll to zoom | Drag to pan | V/R/O/T/N + I/D for image/video
            </p>
          </div>
        </div>
      )}
      {/* Coordinate HUD */}
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 font-mono">
        {coords.x}, {coords.y} | {zoom}%
      </div>
    </>
  );
}
