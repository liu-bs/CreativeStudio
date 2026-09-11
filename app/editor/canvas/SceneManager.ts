import { Container, FederatedPointerEvent } from "pixi.js";
import type { Viewport } from "pixi-viewport";
import { useEditorStore } from "../store/editorStore";
import type { CanvasObject, VideoObject } from "../store/types";
import { createShapeFor, redrawShape, createDefaultObject, loadImageSprite } from "./shapeFactory";
import { SelectionController } from "./SelectionController";
import { VideoSpriteManager } from "./VideoSpriteManager";

export class SceneManager {
  private viewport: Viewport;
  private worldContainer: Container;
  private objectMap: Map<string, Container> = new Map();
  private selectionController: SelectionController;
  private videoManager: VideoSpriteManager;
  private unsubscribeObjects: (() => void) | null = null;
  private unsubscribeSelection: (() => void) | null = null;
  private unsubscribeTime: (() => void) | null = null;

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(viewport: Viewport) {
    this.viewport = viewport;
    this.worldContainer = new Container();
    this.worldContainer.label = "world";
    viewport.addChild(this.worldContainer);

    this.videoManager = new VideoSpriteManager();
    this.selectionController = new SelectionController(viewport);

    this.setupViewportInteraction();
    this.subscribeToStore();
  }

  private setupViewportInteraction() {
    // Click on empty space: deselect or create shape
    this.viewport.on("pointerdown", (e: FederatedPointerEvent) => {
      // Only respond to left click
      if (e.button !== 0) return;
      // Only handle if the target is the viewport itself (not a shape)
      if (e.target !== this.viewport && e.target !== this.worldContainer) return;

      const state = useEditorStore.getState();
      const tool = state.currentTool;

      if (tool === "select") {
        // Deselect
        state.selectObject(null);
      } else if (tool === "image" || tool === "video") {
        // Image/Video are uploaded via Toolbar file dialog, not canvas click
        // If user clicks canvas with these tools, just switch back to select
        state.setTool("select");
      } else {
        // Create shape at click position
        const world = this.viewport.toWorld(e.global.x, e.global.y);
        const obj = createDefaultObject(tool, world.x, world.y);
        state.addObject(obj);
        state.selectObject(obj.id);
        state.setTool("select");
      }
    });
  }

  private subscribeToStore() {
    // Subscribe to objects changes
    this.unsubscribeObjects = useEditorStore.subscribe(
      (s) => s.objects,
      (objects, prevObjects) => {
        this.syncObjects(objects, prevObjects);
      }
    );

    // Subscribe to selection changes
    this.unsubscribeSelection = useEditorStore.subscribe(
      (s) => s.selectedId,
      (id) => {
        this.selectionController.updateSelection(id);
      }
    );

    // Subscribe to playback time for video seeking
    this.unsubscribeTime = useEditorStore.subscribe(
      (s) => s.playback.currentTime,
      (time) => {
        this.syncVideoPlayback(time);
      }
    );
  }

  private syncObjects(
    objects: Map<string, CanvasObject>,
    prev: Map<string, CanvasObject>
  ) {
    // Add or update
    for (const [id, obj] of objects) {
      const existing = this.objectMap.get(id);
      if (!existing) {
        // New object
        const container = createShapeFor(obj);
        this.objectMap.set(id, container);
        this.worldContainer.addChild(container);
        this.setupObjectInteraction(container, id);

        // If video, create sprite async
        if (obj.type === "video") {
          this.videoManager.createVideoSprite(obj as VideoObject).then((sprite) => {
            // Remove placeholder, add real sprite
            const placeholder = container.getChildAt(0);
            container.removeChild(placeholder);
            placeholder.destroy();
            container.addChild(sprite);
          });
        } else if (obj.type === "image") {
          loadImageSprite(container, obj as ImageObject);
        }
      } else {
        // Update existing — check if properties changed
        const prevObj = prev.get(id);
        if (prevObj !== obj) {
          // Redraw (but not for video — sprite is managed)
          if (obj.type !== "video") {
            redrawShape(existing, obj);
          } else {
            // Update video sprite size
            existing.position.set(obj.x, obj.y);
            const sprite = existing.getChildAt(0);
            if (sprite) {
              sprite.width = obj.width;
              sprite.height = obj.height;
            }
          }
        }
      }
      // Update position
      const container = this.objectMap.get(id)!;
      container.position.set(obj.x, obj.y);
    }

    // Remove deleted
    for (const [id] of prev) {
      if (!objects.has(id)) {
        const container = this.objectMap.get(id);
        if (container) {
          this.worldContainer.removeChild(container);
          container.destroy({ children: true });
          this.objectMap.delete(id);
        }
      }
    }

    // Update selection box if selected object changed
    const selectedId = useEditorStore.getState().selectedId;
    if (selectedId) {
      this.selectionController.updateSelection(selectedId);
    }
  }

  private setupObjectInteraction(container: Container, id: string) {
    container.eventMode = "static";
    container.cursor = "move";

    container.on("pointerdown", (e: FederatedPointerEvent) => {
      // Only respond to left click
      if (e.button !== 0) return;
      e.stopPropagation();
      const state = useEditorStore.getState();
      state.selectObject(id);

      // Start drag
      const obj = state.objects.get(id);
      if (!obj) return;

      const world = this.viewport.toWorld(e.global.x, e.global.y);
      this.dragOffset = { x: world.x - obj.x, y: world.y - obj.y };
      this.isDragging = true;

      const onMove = (ev: FederatedPointerEvent) => {
        if (!this.isDragging) return;
        const w = this.viewport.toWorld(ev.global.x, ev.global.y);
        const newState = useEditorStore.getState();
        newState.updateObject(id, {
          x: Math.round(w.x - this.dragOffset.x),
          y: Math.round(w.y - this.dragOffset.y),
        });
      };

      const onUp = () => {
        this.isDragging = false;
        this.viewport.off("globalpointermove", onMove);
        this.viewport.off("pointerup", onUp);
        this.viewport.off("pointerupoutside", onUp);
      };

      this.viewport.on("globalpointermove", onMove);
      this.viewport.on("pointerup", onUp);
      this.viewport.on("pointerupoutside", onUp);
    });
  }

  private syncVideoPlayback(currentTime: number) {
    const state = useEditorStore.getState();
    const isPlaying = state.playback.isPlaying;

    for (const obj of state.objects.values()) {
      if (obj.type !== "video" || !obj.clipId) continue;
      const clip = state.clips.get(obj.clipId);
      if (!clip) continue;

      if (currentTime >= clip.start && currentTime < clip.start + clip.duration) {
        // Within clip range — seek video
        const videoTime = clip.trimStart + (currentTime - clip.start);
        this.videoManager.seekVideo(obj.videoUrl, videoTime);
        if (isPlaying) {
          this.videoManager.playVideo(obj.videoUrl);
        }
      } else {
        // Outside range — pause
        this.videoManager.pauseVideo(obj.videoUrl);
      }
    }
  }

  destroy() {
    this.unsubscribeObjects?.();
    this.unsubscribeSelection?.();
    this.unsubscribeTime?.();
    this.selectionController.destroy();
    this.videoManager.destroy();
    this.worldContainer.destroy({ children: true });
  }
}
