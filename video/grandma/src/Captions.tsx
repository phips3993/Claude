import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FPS, TL, Line, Word } from './timeline';

const norm = (s: string) => s.toLowerCase().replace(/[.,!?…:;«»"—]/g, '');

const isHot = (l: Line, w: Word) => {
  const n = norm(w.w);
  return l.highlight.some((h) => norm(h).split(' ').includes(n));
};

/** split words of a line into chunks of max ~3 words / 18 chars, breaking on punctuation */
const chunk = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w, i) => {
    cur.push(w);
    len += w.w.length + 1;
    const end = /[.,!?…:]$/.test(w.w);
    const next = words[i + 1];
    if (!next || end || cur.length >= 3 || len + (next?.w.length ?? 0) > 18) {
      out.push(cur);
      cur = [];
      len = 0;
    }
  });
  return out;
};

const SPEAKER: Record<Line['who'], { label: string; color: string } | null> = {
  grandma: null,
  grandson: { label: 'ВНУК', color: '#7FD8FF' },
  petrovich: { label: 'ПЕТРОВИЧ · ЗА ДВЕРЬЮ', color: '#FFB36B' },
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / FPS;

  // find line whose caption window covers t (keep last chunk up a little after line end)
  const l = TL.lines.find((x) => t >= x.start && t < x.start + x.dur + 0.15);
  if (!l) return null;
  const local = t - l.start;
  const chunks = chunk(l.words);
  let idx = chunks.findIndex((c) => local < c[c.length - 1].e + 0.05);
  if (idx === -1) idx = chunks.length - 1;
  const c = chunks[idx];
  const chunkStart = l.start + Math.max(0, c[0].s - 0.06);
  const f0 = Math.round(chunkStart * FPS);
  const hookFirst = l.id === 'l01' && idx === 0;
  const pop = hookFirst ? 1 : spring({ frame: frame - f0, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const sp = SPEAKER[l.who];
  const big = l.id === 'l01';

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: big ? 1060 : 1180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}
    >
      {sp && (
        <div
          style={{
            fontFamily: 'Montserrat',
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: 4,
            color: '#14232B',
            background: sp.color,
            padding: '8px 22px',
            borderRadius: 999,
            opacity: interpolate(local, [0, 0.15], [0, 1], { extrapolateRight: 'clamp' }),
            boxShadow: '0 6px 18px rgba(0,0,0,.25)',
          }}
        >
          {sp.label}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 22,
          rowGap: 4,
          transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])}) translateY(${interpolate(pop, [0, 1], [24, 0])}px)`,
          opacity: interpolate(pop, [0, 1], [0, 1]),
        }}
      >
        {c.map((w, i) => {
          const hot = isHot(l, w);
          const said = hookFirst || local >= w.s - 0.03;
          const wf = Math.round((l.start + w.s) * FPS);
          const kick = spring({ frame: frame - wf, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
          return (
            <span
              key={i}
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 900,
                fontSize: big ? 104 : 92,
                lineHeight: 1.05,
                textTransform: 'uppercase',
                color: hot ? '#FFD23F' : '#FFFFFF',
                opacity: said ? 1 : 0.55,
                WebkitTextStroke: '14px #1B1B2F',
                paintOrder: 'stroke fill',
                textShadow: '0 10px 0 rgba(27,27,47,.55), 0 18px 40px rgba(0,0,0,.35)',
                display: 'inline-block',
                transform: said && hot ? `scale(${interpolate(kick, [0, 1], [1.25, 1])}) rotate(${interpolate(kick, [0, 1], [-4, 0])}deg)` : undefined,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
