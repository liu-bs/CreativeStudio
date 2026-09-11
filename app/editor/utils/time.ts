export const TIMELINE_PPS = 50; // pixels per second

export function formatTime(seconds: number, showDecimal = true): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const decs = Math.floor((seconds % 1) * 10);
  if (showDecimal) {
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${decs}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function timeToX(time: number, pps: number = TIMELINE_PPS): number {
  return time * pps;
}

export function xToTime(x: number, pps: number = TIMELINE_PPS): number {
  return x / pps;
}
