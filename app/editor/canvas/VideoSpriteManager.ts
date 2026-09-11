import { Sprite, Texture, VideoSource, Container } from "pixi.js";
import type { VideoObject } from "../store/types";

interface VideoCache {
  video: HTMLVideoElement;
  texture: Texture;
}

export class VideoSpriteManager {
  private cache: Map<string, VideoCache> = new Map();

  async createVideoSprite(obj: VideoObject): Promise<Sprite> {
    let cached = this.cache.get(obj.videoUrl);

    if (!cached) {
      const video = document.createElement("video");
      video.src = obj.videoUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      if (!obj.videoUrl.startsWith("blob:")) {
        video.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error(`Failed to load video: ${obj.videoUrl}`));
      });

      const source = new VideoSource({
        resource: video,
        autoPlay: false,
        loop: true,
        muted: true,
        updateFPS: 30,
      });

      const texture = new Texture({ source });
      cached = { video, texture };
      this.cache.set(obj.videoUrl, cached);
    }

    const sprite = new Sprite(cached.texture);
    sprite.width = obj.width;
    sprite.height = obj.height;
    return sprite;
  }

  seekVideo(url: string, time: number) {
    const cached = this.cache.get(url);
    if (cached && Math.abs(cached.video.currentTime - time) > 0.05) {
      cached.video.currentTime = time;
    }
  }

  playVideo(url: string) {
    const cached = this.cache.get(url);
    if (cached && cached.video.paused) {
      cached.video.play().catch(() => {});
    }
  }

  pauseVideo(url: string) {
    const cached = this.cache.get(url);
    if (cached && !cached.video.paused) {
      cached.video.pause();
    }
  }

  destroy() {
    for (const { video, texture } of this.cache.values()) {
      video.pause();
      video.src = "";
      texture.destroy(true);
    }
    this.cache.clear();
  }
}
