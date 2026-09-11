export type ToolType = "select" | "rectangle" | "circle" | "text" | "sticky" | "image" | "video";
export type ShapeType = "rectangle" | "circle" | "text" | "sticky" | "image" | "video";
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface BaseObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface RectangleObject extends BaseObject {
  type: "rectangle";
  fillColor: number;
  strokeColor: number;
  strokeWidth: number;
}

export interface CircleObject extends BaseObject {
  type: "circle";
  fillColor: number;
  strokeColor: number;
  strokeWidth: number;
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fillColor: number;
}

export interface StickyObject extends BaseObject {
  type: "sticky";
  text: string;
  fillColor: number;
}

export interface VideoObject extends BaseObject {
  type: "video";
  videoUrl: string;
  trimStart: number;
  trimEnd: number;
  clipId: string | null;
}

export interface ImageObject extends BaseObject {
  type: "image";
  imageUrl: string;
}

export type CanvasObject =
  | RectangleObject
  | CircleObject
  | TextObject
  | StickyObject
  | ImageObject
  | VideoObject;

export interface TimelineClip {
  id: string;
  trackIndex: number;
  start: number;
  duration: number;
  videoUrl: string;
  canvasObjectId: string | null;
  color: number;
  label: string;
  trimStart: number;
  fileType: string; // MIME type, e.g. "video/mp4", "video/webm"
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  fps: number;
}

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}
