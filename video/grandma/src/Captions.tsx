import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FPS, TL, Line, Word } from './timeline';

const norm = (s: string) => s.toLowerCase().replace(/[.,!?…:;«»"—]/g, '');
const SHORT = new Set(['у', 'и', 'за', 'на', 'с', 'в', 'к', 'о', 'а', 'не', 'из', 'что', 'ты', 'я', 'по', 'от', 'до', 'же']);

const isHot = (l: Line, w: Word) => {
  const n = norm(w.w);
  return l.highlight.some((h) => norm(h).split(' ').includes(n));
};

/** chunks of up to 3 words / ~16 chars; never end a chunk on a short function word */
const chunk = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w, i) => {
    cur.push(w);
    len += w.w.length + 1;
    const end = /[.,!?…:]$/.test(w.w);
    const next = words[i + 1];
    const dangling = SHORT.has(norm(w.w)) && !!next;
    if (!next || end || (!dangling && (cur.length >= 3 || len + (next?.w.length ?? 0) > 16))) {
      out.push(cur);
      cur = [];
      len = 0;
    }
  });
  return out;
};

// safe area: x 90..930 (TikTok buttons on the right), so usable width 840
const SAFE_W = 840;
const CHAR_W = 0.78; // Montserrat 900 uppercase, em per glyph (approx, Cyrillic)
const fit = (base: number, c: Word[]) => {
  const longest = Math.max(...c.map((w) => w.w.length));
  return Math.min(base, Math.floor(SAFE_W / 1.1 / (longest * CHAR_W)));
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / FPS;

  const l = TL.lines.find((x) => t >= x.start && t < x.start + x.dur + 0.12);
  if (!l) return null;
  const local = t - l.start;
  const chunks = chunk(l.words);
  let idx = chunks.findIndex((c) => local < c[c.length - 1].e + 0.05);
  if (idx === -1) idx = chunks.length - 1;
  const c = chunks[idx];
  const f0 = Math.round((l.start + Math.max(0, c[0].s - 0.06)) * FPS);
  const hookFirst = l.id === 'l01' && idx === 0;
  const pop = hookFirst ? 1 : spring({ frame: frame - f0, fps, config: { damping: 16, stiffness: 240, mass: 0.6 } });
  const grandma = l.who === 'grandma';
  const base = l.id === 'l01' ? 108 : grandma ? 96 : 78;
  const size = fit(base, c);

  const words = c.map((w, i) => {
    const hot = isHot(l, w);
    const said = hookFirst || local >= w.s - 0.03;
    const wf = Math.round((l.start + w.s) * FPS);
    const kick = spring({ frame: frame - wf, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
    return (
      <span
        key={i}
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.04,
          textTransform: 'uppercase',
          color: hot && said ? '#FFD23F' : grandma ? '#FFFFFF' : '#FFFFFF',
          WebkitTextStroke: grandma ? `${Math.round(size * 0.16)}px #1B1B2F` : undefined,
          paintOrder: 'stroke fill',
          textShadow: grandma ? '0 8px 0 rgba(27,27,47,.6), 0 16px 36px rgba(0,0,0,.45)' : '0 4px 14px rgba(0,0,0,.35)',
          display: 'inline-block',
          transform: said && hot && !hookFirst ? `scale(${interpolate(kick, [0, 1], [1.1, 1])})` : undefined,
        }}
      >
        {w.w}
      </span>
    );
  });

  const enter = {
    transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])}) translateY(${interpolate(pop, [0, 1], [18, 0])}px)`,
    opacity: interpolate(pop, [0, 1], [0, 1]),
  };

  if (grandma) {
    return (
      <div style={{ position: 'absolute', left: 90, width: SAFE_W, top: l.id === 'l01' ? 1040 : 1090, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 20, rowGap: 0, ...enter }}>{words}</div>
      </div>
    );
  }

  const label = l.who === 'grandson' ? 'ВНУК' : 'ПЕТРОВИЧ ЗА ДВЕРЬЮ';
  const accent = l.who === 'grandson' ? '#7FD8FF' : '#FFB36B';
  return (
    <div style={{ position: 'absolute', left: 90, width: SAFE_W, top: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: 3,
          color: '#10202A',
          background: accent,
          padding: '8px 26px',
          borderRadius: 999,
          opacity: interpolate(local, [0, 0.12], [0, 1], { extrapolateRight: 'clamp' }),
          boxShadow: '0 6px 18px rgba(0,0,0,.3)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 18,
          background: 'rgba(16,24,34,.78)',
          border: `5px solid ${accent}`,
          borderRadius: 36,
          padding: '18px 34px 22px',
          boxShadow: '0 16px 40px rgba(0,0,0,.35)',
          ...enter,
        }}
      >
        {words}
      </div>
    </div>
  );
};
