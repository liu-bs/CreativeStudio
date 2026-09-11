"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  CanvasObject,
  TimelineClip,
  PlaybackState,
  ViewportState,
  ToolType,
} from "./types";

interface EditorState {
  // Canvas
  objects: Map<string, CanvasObject>;
  selectedId: string | null;
  currentTool: ToolType;

  // Timeline
  clips: Map<string, TimelineClip>;

  // Playback
  playback: PlaybackState;

  // Viewport
  viewport: ViewportState;

  // Actions - Canvas
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, partial: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setTool: (tool: ToolType) => void;

  // Actions - Timeline
  addClip: (clip: TimelineClip) => void;
  updateClip: (id: string, partial: Partial<TimelineClip>) => void;
  deleteClip: (id: string) => void;

  // Actions - Playback
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;

  // Actions - Viewport
  setViewport: (scale: number, x: number, y: number) => void;
}

// Expose store globally for debugging/testing
export const getStore = () => useEditorStore;

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    objects: new Map(),
    selectedId: null,
    currentTool: "select",

    clips: new Map(),

    playback: {
      isPlaying: false,
      currentTime: 0,
      totalDuration: 30,
      fps: 30,
    },

    viewport: {
      scale: 1,
      x: 0,
      y: 0,
    },

    addObject: (obj) =>
      set((state) => {
        const objects = new Map(state.objects);
        objects.set(obj.id, obj);
        return { objects };
      }),

    updateObject: (id, partial) =>
      set((state) => {
        const objects = new Map(state.objects);
        const obj = objects.get(id);
        if (!obj) return {};
        objects.set(id, { ...obj, ...partial } as CanvasObject);
        return { objects };
      }),

    deleteObject: (id) =>
      set((state) => {
        const objects = new Map(state.objects);
        objects.delete(id);
        const clips = new Map(state.clips);
        // Remove linked clip
        for (const [clipId, clip] of clips) {
          if (clip.canvasObjectId === id) {
            clips.delete(clipId);
            break;
          }
        }
        return {
          objects,
          clips,
          selectedId: state.selectedId === id ? null : state.selectedId,
        };
      }),

    selectObject: (id) => set({ selectedId: id }),

    setTool: (tool) => set({ currentTool: tool }),

    addClip: (clip) =>
      set((state) => {
        const clips = new Map(state.clips);
        clips.set(clip.id, clip);
        const totalDuration = Math.max(
          state.playback.totalDuration,
          clip.start + clip.duration
        );
        return {
          clips,
          playback: { ...state.playback, totalDuration },
        };
      }),

    updateClip: (id, partial) =>
      set((state) => {
        const clips = new Map(state.clips);
        const clip = clips.get(id);
        if (!clip) return {};
        const updated = { ...clip, ...partial };
        clips.set(id, updated);

        // Sync trimStart to linked canvas video object
        let objects = state.objects;
        if (clip.canvasObjectId && partial.trimStart !== undefined) {
          objects = new Map(state.objects);
          const obj = objects.get(clip.canvasObjectId);
          if (obj && obj.type === "video") {
            objects.set(clip.canvasObjectId, {
              ...obj,
              trimStart: partial.trimStart,
            });
          }
        }

        // Recalculate total duration
        let totalDuration = 0;
        for (const c of clips.values()) {
          totalDuration = Math.max(totalDuration, c.start + c.duration);
        }

        return {
          clips,
          objects,
          playback: { ...state.playback, totalDuration },
        };
      }),

    deleteClip: (id) =>
      set((state) => {
        const clips = new Map(state.clips);
        clips.delete(id);
        return { clips };
      }),

    setPlaying: (playing) =>
      set((state) => ({
        playback: { ...state.playback, isPlaying: playing },
      })),

    setCurrentTime: (time) =>
      set((state) => ({
        playback: { ...state.playback, currentTime: time },
      })),

    setViewport: (scale, x, y) =>
      set({ viewport: { scale, x, y } }),
  }))
);
