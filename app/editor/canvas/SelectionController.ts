import { Container, Graphics, Rectangle, FederatedPointerEvent } from "pixi.js";
import type { Viewport } from "pixi-viewport";
import { useEditorStore } from "../store/editorStore";
import type { ResizeHandle } from "../store/types";

const HANDLE_SIZE = 8;
const HANDLE_COLOR = 0x3b82f6;
const HANDLE_BORDER = 0xffffff;
 const SELECTION_COLOR = 0x3b82f6;

const HANDLE_CONFIGS: { type: ResizeHandle; cursor: string }[] = [
  { type: "nw", cursor: "nwse-resize" },
  { type: "n", cursor: "ns-resize" },
  { type: "ne", cursor: "nesw-resize" },
  { type: "e", cursor: "ew-resize" },
  { type: "se", cursor: "nwse-resize" },
  { type: "s", cursor: "ns-resize" },
  { type: "sw", cursor: "nesw-resize" },
  { type: "w", cursor: "ew-resize" },
];

export class SelectionController {
  private viewport: Viewport;
  private selectionContainer: Container;
  private selectionBox: Graphics;
  private handles: Map<ResizeHandle, Graphics> = new Map();
  private selectedId: string | null = null;
  private isResizing = false;
  private resizeHandle: ResizeHandle | null = null;
  private resizeStart: { x: number; y: number; w: number; h: number } | null = null;
  private resizeStartWorld: { x: number; y: number } | null = null;

  constructor(viewport: Viewport) {
    this.viewport = viewport;

    this.selectionContainer = new Container();
    this.selectionContainer.visible = false;
    this.selectionContainer.label = "selection";

    this.selectionBox = new Graphics();
    this.selectionContainer.addChild(this.selectionBox);

    // Create 8 resize handles
    for (const config of HANDLE_CONFIGS) {
      const handle = new Graphics();
      handle
        .rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
        .fill({ color: HANDLE_COLOR })
        .stroke({ width: 1, color: HANDLE_BORDER });
      handle.eventMode = "static";
      handle.cursor = config.cursor;
      handle.label = `handle-${config.type}`;

      handle.on("pointerdown", (e: FederatedPointerEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        this.startResize(config.type, e);
      });

      this.handles.set(config.type, handle);
      this.selectionContainer.addChild(handle);
    }

    viewport.addChild(this.selectionContainer);
  }

  updateSelection(id: string | null) {
    this.selectedId = id;
    if (!id) {
      this.selectionContainer.visible = false;
      return;
    }

    const state = useEditorStore.getState();
    const obj = state.objects.get(id);
    if (!obj) {
      this.selectionContainer.visible = false;
      return;
    }

    this.selectionContainer.visible = true;
    this.redrawSelection(obj.x, obj.y, obj.width, obj.height);
  }

  private redrawSelection(x: number, y: number, w: number, h: number) {
    this.selectionBox.clear();
    this.selectionBox
      .rect(x, y, w, h)
      .stroke({ width: 2, color: SELECTION_COLOR });

    const positions: Record<ResizeHandle, [number, number]> = {
      nw: [x, y],
      n: [x + w / 2, y],
      ne: [x + w, y],
      e: [x + w, y + h / 2],
      se: [x + w, y + h],
      s: [x + w / 2, y + h],
      sw: [x, y + h],
      w: [x, y + h / 2],
    };

    for (const [type, [hx, hy]] of Object.entries(positions)) {
      const handle = this.handles.get(type as ResizeHandle)!;
      handle.position.set(hx, hy);
    }
  }

  private startResize(handle: ResizeHandle, e: FederatedPointerEvent) {
    this.isResizing = true;
    this.resizeHandle = handle;

    const state = useEditorStore.getState();
    const obj = state.objects.get(this.selectedId!);
    if (!obj) return;

    this.resizeStart = { x: obj.x, y: obj.y, w: obj.width, h: obj.height };
    const world = this.viewport.toWorld(e.global.x, e.global.y);
    this.resizeStartWorld = { x: world.x, y: world.y };

    const onMove = (ev: FederatedPointerEvent) => {
      if (!this.isResizing || !this.resizeStart || !this.resizeStartWorld || !this.resizeHandle) return;

      const w = this.viewport.toWorld(ev.global.x, ev.global.y);
      const dx = w.x - this.resizeStartWorld.x;
      const dy = w.y - this.resizeStartWorld.y;

      let { x, y, w: ow, h: oh } = this.resizeStart;
      const minSize = 20;

      switch (this.resizeHandle) {
        case "nw": x += dx; y += dy; ow -= dx; oh -= dy; break;
        case "n": y += dy; oh -= dy; break;
        case "ne": ow += dx; y += dy; oh -= dy; break;
        case "e": ow += dx; break;
        case "se": ow += dx; oh += dy; break;
        case "s": oh += dy; break;
        case "sw": x += dx; ow -= dx; oh += dy; break;
        case "w": x += dx; ow -= dx; break;
      }

      // Enforce minimum size
      if (ow < minSize) {
        if (this.resizeHandle.includes("w")) x -= minSize - ow;
        ow = minSize;
      }
      if (oh < minSize) {
        if (this.resizeHandle.includes("n")) y -= minSize - oh;
        oh = minSize;
      }

      const s = useEditorStore.getState();
      s.updateObject(this.selectedId!, {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(ow),
        height: Math.round(oh),
      });

      // Update selection box immediately
      this.redrawSelection(x, y, ow, oh);
    };

    const onUp = () => {
      this.isResizing = false;
      this.resizeHandle = null;
      this.resizeStart = null;
      this.resizeStartWorld = null;
      this.viewport.off("globalpointermove", onMove);
      this.viewport.off("pointerup", onUp);
      this.viewport.off("pointerupoutside", onUp);
    };

    this.viewport.on("globalpointermove", onMove);
    this.viewport.on("pointerup", onUp);
    this.viewport.on("pointerupoutside", onUp);
  }

  destroy() {
    this.selectionContainer.destroy({ children: true });
  }
}
