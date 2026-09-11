import type { Viewport } from "pixi-viewport";

export function screenToWorld(viewport: Viewport, screenX: number, screenY: number) {
  return viewport.toWorld(screenX, screenY);
}

export function worldToScreen(viewport: Viewport, worldX: number, worldY: number) {
  return viewport.toScreen(worldX, worldY);
}

export function formatCoords(x: number, y: number): string {
  return `${Math.round(x)}, ${Math.round(y)}`;
}
