'use client';

import dynamic from 'next/dynamic';

const EditorShell = dynamic(() => import("./editor/EditorShell"), {
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-500">
      Loading editor...
    </div>
  ),
});

export default function Home() {
  return <EditorShell />;
}
