"use client";

import { useState } from "react";
import { useEditorStore } from "../store/editorStore";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"png" | "video">("png");

  const handleExport = async () => {
    if (mode === "png") {
      handleExportPNG();
    } else {
      handleExportVideo();
    }
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `creative-studio-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportVideo = async () => {
    const state = useEditorStore.getState();
    const clips = Array.from(state.clips.values());

    if (clips.length === 0) {
      alert("请先添加视频到时间线");
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      // 动态加载 ffmpeg.wasm（懒加载，不进主 bundle）
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();

      // 监听进度
      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      // 从本地 public/ffmpeg/ 加载，避免 CDN CORS 问题
      const baseURL = window.location.origin + "/ffmpeg";
      const coreURL = `${baseURL}/ffmpeg-core.js`;
      const wasmURL = `${baseURL}/ffmpeg-core.wasm`;

      await ffmpeg.load({
        coreURL: await toBlobURL(coreURL, "text/javascript"),
        wasmURL: await toBlobURL(wasmURL, "application/wasm"),
      });

      // 对每个 clip 执行裁剪
      const outputFiles: string[] = [];

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const inputName = `input-${i}.mp4`;
        const outputName = `output-${i}.mp4`;

        setProgress(Math.round((i / clips.length) * 100));

        // 写入文件
        await ffmpeg.writeFile(inputName, await fetchFile(clip.videoUrl));

        // 裁剪：-ss 起始时间 -to 结束时间，重新编码为 MP4（兼容 webm 输入）
        const startTime = clip.trimStart;
        const endTime = clip.trimStart + clip.duration;

        // 根据输入格式决定编码方式
        // MP4 → -c copy 直接拷贝（秒级，体积按比例缩小）
        // WebM → libx264 重编码（格式转换）
        const isWebm = clip.fileType?.includes("webm") || clip.videoUrl.includes(".webm");
        const execArgs = isWebm
          ? [
              "-ss", startTime.toString(),
              "-to", endTime.toString(),
              "-i", inputName,
              "-c:v", "libx264",
              "-preset", "ultrafast",
              "-c:a", "aac",
              outputName,
            ]
          : [
              "-ss", startTime.toString(),
              "-to", endTime.toString(),
              "-i", inputName,
              "-c", "copy",
              outputName,
            ];

        await ffmpeg.exec(execArgs);

        outputFiles.push(outputName);
      }

      // 读取输出文件
      if (outputFiles.length === 1) {
        // 单个 clip 直接下载
        const data = await ffmpeg.readFile(outputFiles[0]);
        const blob = new Blob([data], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${Date.now()}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // 多个 clip 分别下载
        for (const name of outputFiles) {
          const data = await ffmpeg.readFile(name);
          const blob = new Blob([data], { type: "video/mp4" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
        }
      }

      setProgress(100);
    } catch (err) {
      console.error("Video export failed:", err);
      alert("视频导出失败: " + (err as Error).message);
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
    <div className="flex overflow-hidden rounded-md border border-zinc-700">
      <button
        onClick={() => setMode("png")}
        disabled={exporting}
        className={`px-2.5 py-1 text-xs transition-colors ${
          mode === "png" ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        PNG
      </button>
      <button
        onClick={() => setMode("video")}
        disabled={exporting}
        className={`px-2.5 py-1 text-xs transition-colors ${
          mode === "video" ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Video
      </button>
    </div>
    <button
      onClick={handleExport}
      disabled={exporting}
      className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {exporting
        ? `Exporting ${progress}%`
        : mode === "png"
          ? "Export PNG"
          : "Export MP4"}
    </button>
    </div>
  );
}
