import tl from '../public/timeline.json';

export type Word = { w: string; s: number; e: number };
export type Line = {
  id: string;
  who: 'grandma' | 'grandson' | 'petrovich';
  part: 'A' | 'B';
  emotion?: 'sly' | 'surprised' | 'serious' | 'proud' | 'happy';
  text: string;
  highlight: string[];
  clipStart: number;
  clipEnd: number;
  dur: number;
  start: number;
  startFrame: number;
  durFrames: number;
  words: Word[];
  amp: number[];
};

export const TL = tl as unknown as {
  fps: number;
  total: number;
  bannerStart: number;
  bannerFrames: number;
  lines: Line[];
};

export const FPS = TL.fps;
export const line = (id: string) => TL.lines.find((l) => l.id === id)!;

/** line active at frame (or null) */
export const activeLine = (frame: number) =>
  TL.lines.find((l) => frame >= l.startFrame && frame < l.startFrame + l.durFrames) ?? null;

/** last line that started at or before frame */
export const lastLine = (frame: number) => {
  let cur: Line | null = null;
  for (const l of TL.lines) if (l.startFrame <= frame) cur = l;
  return cur;
};

/** mouth openness 0..1 for a speaker at frame */
export const mouthFor = (who: Line['who'], frame: number) => {
  const l = activeLine(frame);
  if (!l || l.who !== who) return 0;
  const i = frame - l.startFrame;
  const a = l.amp[i] ?? 0;
  const b = l.amp[i + 1] ?? a;
  return Math.max(0, Math.min(1, (a * 0.6 + b * 0.4) * 1.15 - 0.08));
};
