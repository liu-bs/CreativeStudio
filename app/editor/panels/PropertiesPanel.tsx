"use client";

import { useEditorStore } from "../store/editorStore";

export function PropertiesPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const objects = useEditorStore((s) => s.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const deleteObject = useEditorStore((s) => s.deleteObject);
  const viewport = useEditorStore((s) => s.viewport);

  const obj = selectedId ? objects.get(selectedId) : null;

  if (!obj) {
    return (
      <div className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-600">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-zinc-500">Canvas Info</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Zoom</span>
              <span className="text-zinc-400">{(viewport.scale * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Position</span>
              <span className="text-zinc-400">
                {Math.round(viewport.x)}, {Math.round(viewport.y)}
              </span>
            </div>
          </div>
          <div className="pt-4 text-zinc-600">
            Select an object to edit its properties.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 space-y-4 border-l border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-xs font-semibold uppercase text-zinc-500">
        {obj.type} Properties
      </h2>

      {/* Position */}
      <div className="space-y-1.5">
        <label className="text-xs text-zinc-500">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="X"
            value={Math.round(obj.x)}
            onChange={(v) => updateObject(obj.id, { x: v })}
          />
          <NumberInput
            label="Y"
            value={Math.round(obj.y)}
            onChange={(v) => updateObject(obj.id, { y: v })}
          />
        </div>
      </div>

      {/* Size */}
      <div className="space-y-1.5">
        <label className="text-xs text-zinc-500">Size</label>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="W"
            value={Math.round(obj.width)}
            onChange={(v) => updateObject(obj.id, { width: Math.max(20, v) })}
          />
          <NumberInput
            label="H"
            value={Math.round(obj.height)}
            onChange={(v) => updateObject(obj.id, { height: Math.max(20, v) })}
          />
        </div>
      </div>

      {/* Type-specific properties */}
      {(obj.type === "rectangle" || obj.type === "circle") && (
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Fill Color</label>
          <ColorInput
            value={obj.fillColor}
            onChange={(v) => updateObject(obj.id, { fillColor: v })}
          />
        </div>
      )}

      {obj.type === "text" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Text</label>
            <input
              type="text"
              value={obj.text}
              onChange={(e) => updateObject(obj.id, { text: e.target.value })}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Font Size</label>
            <NumberInput
              label="px"
              value={obj.fontSize}
              onChange={(v) => updateObject(obj.id, { fontSize: Math.max(8, v) })}
            />
          </div>
        </>
      )}

      {obj.type === "sticky" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Text</label>
            <textarea
              value={obj.text}
              onChange={(e) => updateObject(obj.id, { text: e.target.value })}
              rows={3}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Color</label>
            <ColorInput
              value={obj.fillColor}
              onChange={(v) => updateObject(obj.id, { fillColor: v })}
            />
          </div>
        </>
      )}

      {obj.type === "video" && (
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Trim Start (seconds)</label>
          <NumberInput
            label="s"
            value={obj.trimStart}
            step={0.1}
            onChange={(v) => updateObject(obj.id, { trimStart: Math.max(0, v) })}
          />
        </div>
      )}

      {obj.type === "image" && (
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Source</label>
          <div className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400 truncate">
            {obj.imageUrl.startsWith("blob:") ? "Uploaded file" : obj.imageUrl}
          </div>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => deleteObject(obj.id)}
        className="w-full rounded bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-zinc-500 w-4">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const hex = `#${value.toString(16).padStart(6, "0")}`;
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(e) => {
          const num = parseInt(e.target.value.slice(1), 16);
          onChange(num);
        }}
        className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-zinc-800"
      />
      <span className="font-mono text-xs text-zinc-400">{hex.toUpperCase()}</span>
    </div>
  );
}
