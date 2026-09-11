import { Container, Graphics, Text, Rectangle, Sprite, Texture, ImageSource } from "pixi.js";
import type {
  CanvasObject,
  RectangleObject,
  CircleObject,
  TextObject,
  StickyObject,
  VideoObject,
  ImageObject,
} from "../store/types";

/**
 * Create a PixiJS display object for a given canvas object.
 * Returns a Container with the shape rendered inside.
 */
export function createShapeFor(obj: CanvasObject): Container {
  const container = new Container();
  container.label = `shape-${obj.id}`;

  switch (obj.type) {
    case "rectangle":
      container.addChild(createRectangle(obj));
      break;
    case "circle":
      container.addChild(createCircle(obj));
      break;
    case "text":
      container.addChild(createText(obj));
      break;
    case "sticky":
      container.addChild(createSticky(obj));
      break;
    case "video":
      // Video placeholder — actual sprite added async by VideoSpriteManager
      container.addChild(createVideoPlaceholder(obj));
      break;
    case "image":
      // Image placeholder — actual sprite added async by loadImageSprite
      container.addChild(createImagePlaceholder(obj));
      break;
  }

  // Set hit area to bounding box for reliable click detection
  container.hitArea = new Rectangle(0, 0, obj.width, obj.height);
  return container;
}

function createRectangle(obj: RectangleObject): Graphics {
  const g = new Graphics();
  g.rect(0, 0, obj.width, obj.height)
    .fill({ color: obj.fillColor })
    .stroke({ width: obj.strokeWidth, color: obj.strokeColor });
  return g;
}

function createCircle(obj: CircleObject): Graphics {
  const g = new Graphics();
  const radius = Math.min(obj.width, obj.height) / 2;
  g.circle(obj.width / 2, obj.height / 2, radius)
    .fill({ color: obj.fillColor })
    .stroke({ width: obj.strokeWidth, color: obj.strokeColor });
  return g;
}

function createText(obj: TextObject): Container {
  const container = new Container();
  const text = new Text({
    text: obj.text,
    style: {
      fontFamily: obj.fontFamily,
      fontSize: obj.fontSize,
      fill: obj.fillColor,
      wordWrap: true,
      wordWrapWidth: obj.width,
    },
  });
  container.addChild(text);
  return container;
}

function createSticky(obj: StickyObject): Container {
  const container = new Container();
  const bg = new Graphics();
  bg.roundRect(0, 0, obj.width, obj.height, 8)
    .fill({ color: obj.fillColor })
    .stroke({ width: 1, color: 0xd4d4d8, alpha: 0.5 });
  container.addChild(bg);

  const text = new Text({
    text: obj.text,
    style: {
      fontFamily: "Arial",
      fontSize: 14,
      fill: 0x333333,
      wordWrap: true,
      wordWrapWidth: obj.width - 16,
    },
  });
  text.position.set(8, 8);
  container.addChild(text);
  return container;
}

function createVideoPlaceholder(obj: VideoObject): Graphics {
  const g = new Graphics();
  g.rect(0, 0, obj.width, obj.height)
    .fill({ color: 0x18181b })
    .stroke({ width: 2, color: 0x3f3f46 });
  return g;
}

function createImagePlaceholder(obj: ImageObject): Graphics {
  const g = new Graphics();
  g.rect(0, 0, obj.width, obj.height)
    .fill({ color: 0x27272a })
    .stroke({ width: 1, color: 0x3f3f46 });
  return g;
}

/**
 * Async load an image texture and replace the placeholder with a real sprite.
 */
export async function loadImageSprite(container: Container, obj: ImageObject) {
  try {
    // Use HTMLImageElement + Texture.from for blob URLs
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = obj.imageUrl;
    });

    const source = new ImageSource({ resource: img });
    const texture = new Texture({ source });

    // Remove placeholder
    if (container.children.length > 0) {
      const placeholder = container.getChildAt(0);
      container.removeChild(placeholder);
      placeholder.destroy();
    }
    // Add real sprite
    const sprite = new Sprite(texture);
    sprite.width = obj.width;
    sprite.height = obj.height;
    container.addChild(sprite);
  } catch (e) {
    console.error("Failed to load image:", obj.imageUrl, e);
  }
}

/**
 * Redraw an existing container's children when the object properties change.
 */
export function redrawShape(container: Container, obj: CanvasObject) {
  // Remove old children
  const children = container.removeChildren();
  children.forEach((c) => c.destroy());

  // Re-add based on type
  switch (obj.type) {
    case "rectangle":
      container.addChild(createRectangle(obj));
      break;
    case "circle":
      container.addChild(createCircle(obj));
      break;
    case "text":
      container.addChild(createText(obj));
      break;
    case "sticky":
      container.addChild(createSticky(obj));
      break;
    case "video":
      // Don't destroy video sprite — it's managed by VideoSpriteManager
      // Just update the placeholder if no sprite yet
      container.addChild(createVideoPlaceholder(obj));
      break;
    case "image":
      // Don't destroy image sprite if it's already loaded
      // Check if first child is a Sprite (loaded) — if so just resize
      {
        const firstChild = container.children[0];
        if (firstChild && (firstChild as any).texture) {
          // Sprite already loaded — just resize
          (firstChild as Sprite).width = obj.width;
          (firstChild as Sprite).height = obj.height;
        } else {
          // Placeholder or empty — create placeholder (sprite will load async)
          container.addChild(createImagePlaceholder(obj));
        }
      }
      break;
  }

  // Update hit area
  container.hitArea = new Rectangle(0, 0, obj.width, obj.height);
}

/**
 * Create default canvas object for a given tool type.
 */
export function createDefaultObject(
  type: "rectangle" | "circle" | "text" | "sticky",
  x: number,
  y: number
): CanvasObject {
  const id = crypto.randomUUID();
  switch (type) {
    case "rectangle":
      return {
        id, type: "rectangle", x, y,
        width: 200, height: 120, rotation: 0,
        fillColor: 0x6366f1, strokeColor: 0x4f46e5, strokeWidth: 2,
      };
    case "circle":
      return {
        id, type: "circle", x, y,
        width: 120, height: 120, rotation: 0,
        fillColor: 0x10b981, strokeColor: 0x059669, strokeWidth: 2,
      };
    case "text":
      return {
        id, type: "text", x, y,
        width: 200, height: 40, rotation: 0,
        text: "Double-click to edit",
        fontSize: 24, fontFamily: "Arial", fillColor: 0xf4f4f5,
      };
    case "sticky":
      return {
        id, type: "sticky", x, y,
        width: 160, height: 120, rotation: 0,
        text: "Note...",
        fillColor: 0xfff9b0,
      };
  }
}
