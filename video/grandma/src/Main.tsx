import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import cuesJson from '../public/cues.json';
import {
  Kitchen, KitchenTable, Grandma, FiveApps, HotPhone, CheeseTrap, Neighbors, OneButton, Doorbell,
  MoneyCard, Zina, PieSticker,
} from './art';
import type { Emotion } from './art';
import { Captions } from './Captions';
import { loadFonts } from './fonts';
import { FPS, TL, lastLine, mouthFor } from './timeline';

loadFonts();
const C = cuesJson as Record<string, number>;
const F = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

/** 0..1 visibility of an insert between two cue times with in/out animation */
const vis = (frame: number, a: number, b: number, inF = 12, outF = 8) =>
  Math.min(interpolate(frame, [F(a), F(a) + inF], [0, 1], clamp), interpolate(frame, [F(b) - outF, F(b)], [1, 0], clamp));

const BANNER_START = TL.bannerStart;
const BANNER_END = TL.bannerStart + TL.bannerFrames;

const emotionAt = (frame: number): Emotion => {
  const t = frame / FPS;
  if (t >= C.doorbell && t < C.petrovich + 1.4) return 'surprised';
  if (t >= C.petrovich + 1.4) return 'happy';
  if (t >= C.zina - 0.2 && t < C.bannerStart) return 'serious';
  const l = lastLine(frame);
  if (!l) return 'sly';
  if (l.who === 'grandma') return (l.emotion as Emotion) ?? 'sly';
  if (l.id === 'l06') return 'happy';
  if (l.id === 'l08') return 'serious';
  if (l.id === 'l11') return 'proud';
  return 'sly';
};

const blinkAt = (frame: number) => {
  const seeds = [41, 113, 170, 262, 318, 409, 466, 571, 640, 722, 801, 905, 961, 1064, 1150, 1222, 1340, 1402, 1490, 1585, 1660, 1745, 1840, 1902, 2010];
  for (const s of seeds) {
    const d = frame - s;
    if (d >= 0 && d < 6) return [0.5, 1, 1, 0.6, 0.25, 0][d];
  }
  return 0;
};

/** alternating shot size per line: medium / close-up, eased over 7 frames ("cut" feel) */
const shotAt = (frame: number) => {
  const lines = TL.lines;
  let prev = 0;
  let cur = 0;
  let start = 0;
  lines.forEach((l, i) => {
    if (l.startFrame <= frame) {
      prev = cur;
      cur = l.who === 'grandma' ? (i % 2 === 0 ? 0.1 : 0) : 0.04;
      start = l.startFrame;
    }
  });
  return interpolate(frame, [start, start + 7], [prev, cur], { ...clamp, easing: ease });
};

const PriceTags: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const tag = (label: string, price: string, color: string, at: number, i: number) => {
    const p = spring({ frame: frame - F(at), fps, config: { damping: 11, stiffness: 180 } });
    const out = interpolate(frame, [F(C.pricesOut) - 8, F(C.pricesOut)], [1, 0], clamp);
    return (
      <div
        key={label}
        style={{
          display: 'flex', alignItems: 'center', gap: 26, background: '#FFF7E8', borderRadius: 44, padding: '30px 46px',
          boxShadow: '0 18px 40px rgba(40,20,10,.35)',
          transform: `translateX(${interpolate(p, [0, 1], [i ? 700 : -700, 0])}px) rotate(${i ? 3 : -3}deg)`,
          opacity: out,
        }}
      >
        <div style={{ width: 120, height: 82, borderRadius: 50, background: color, boxShadow: 'inset 0 -8px 0 rgba(0,0,0,.15)' }} />
        <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 70, color: '#3A2416', lineHeight: 1.05 }}>
          {label}
          <div style={{ fontSize: 50, fontWeight: 700, color: '#B5532E' }}>{price}</div>
        </div>
      </div>
    );
  };
  if (frame < F(C.cabbage) - 2 || frame > F(C.pricesOut)) return null;
  return (
    <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
      {tag('С капустой', '= установка', '#D9B26A', C.cabbage, 0)}
      {frame >= F(C.meat) - 2 && tag('С мясом', '= срочно', '#C8743F', C.meat, 1)}
    </div>
  );
};

/** circular inserts live in the top third; when one is up the camera lowers grandma under it */
const TOP_INSERT = { left: 225, top: 36, size: 630 };

const Scene: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;

  const topInsert = Math.max(
    vis(frame, C.five, C.appsOut),
    vis(frame, C.zina, C.money),
    vis(frame, C.money, C.thing - 0.1),
    vis(frame, C.cheese, C.buttonOut),
    vis(frame, C.neighbors, C.neighborsOut),
    vis(frame, C.cabbage, C.pricesOut),
    vis(frame, C.doorbell, C.end + 1),
  );
  const insertEase = ease(topInsert);

  // ---------- camera ----------
  const hook = interpolate(frame, [0, 60], [1.04, 1.17], { ...clamp, easing: Easing.out(Easing.cubic) });
  const settle = interpolate(frame, [95, 115], [0, 1], { ...clamp, easing: ease });
  const base = hook * (1 - settle) + 1.06 * settle;
  const dramatic = interpolate(t, [C.thing - 1.2, C.freeze + 0.3], [0, 0.24], { ...clamp, easing: Easing.in(Easing.quad) }) * (t < C.bannerEnd ? 1 : 0);
  const zoom = base + (frame > 115 ? shotAt(frame) : 0) * (1 - insertEase) + dramatic - insertEase * 0.1 + Math.sin(t * 0.6) * 0.006;
  const panX = Math.sin(t * 0.35) * 8;
  const panY = Math.cos(t * 0.27) * 6 + insertEase * 250 - dramatic * 260;

  // ---------- grandma ----------
  const mouth = mouthFor('grandma', frame);
  const emo = emotionAt(frame);
  const tilt = Math.sin(t * 1.3) * 2.2 + mouth * 2.5 * Math.sin(t * 7) + (emo === 'surprised' ? -5 : 0);
  const phoneUp = t < 3.6 || (t >= C.button - 0.2 && t < C.buttonOut);
  const wink = interpolate(t, [C.meatEnd + 0.05, C.meatEnd + 0.2], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#1d2b33' }}>
      <AbsoluteFill style={{ filter: 'contrast(1.08) saturate(1.14)' }}>
        <AbsoluteFill style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '540px 760px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <Kitchen parallax={Math.sin(t * 0.35) * 0.6} />
          </div>
          <div style={{ position: 'absolute', left: 22, top: 230, transform: 'scale(1.15)', transformOrigin: '0 0' }}>
            <Grandma
              emotion={emo}
              mouth={mouth}
              blink={wink > 0 ? 0 : blinkAt(frame)}
              wink={wink}
              headTilt={tilt}
              breathe={(Math.sin(t * 2.1) + 1) / 2}
              phoneUp={phoneUp}
              screenGlow={0.65 + 0.35 * Math.sin(t * 4)}
            />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <KitchenTable parallax={Math.sin(t * 0.35) * 0.6} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* edge vignette, deepens on the dramatic beat */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 42%, rgba(12,8,6,.55) 100%)',
          opacity: 0.7 + interpolate(t, [C.zina, C.freeze], [0, 0.3], clamp) * (t < C.bannerEnd ? 1 : 0),
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 30%, rgba(20,4,4,.7) 100%)',
          opacity: interpolate(t, [C.money, C.money + 0.4, C.freeze], [0, 0.55, 0.85], clamp) * (t < C.bannerEnd ? 1 : 0),
        }}
      />

      {/* hook sticker */}
      <div style={{ position: 'absolute', left: 610, top: 330 }}>
        <PieSticker progress={Math.min(interpolate(frame, [9, 20], [0, 1], clamp), interpolate(frame, [F(3.5), F(3.8)], [1, 0], clamp))} t={t} size={400} />
      </div>

      {/* top-third inserts */}
      <div style={{ position: 'absolute', left: TOP_INSERT.left - 85, top: TOP_INSERT.top - 85 }}>
        <FiveApps progress={vis(frame, C.five, C.appsOut)} t={t} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 30, top: 640 }}>
        <HotPhone progress={vis(frame, C.hot, C.appsOut)} t={t} size={400} />
      </div>
      {[
        [Zina, C.zina, C.money],
        [MoneyCard, C.money, C.thing - 0.1],
        [CheeseTrap, C.cheese, C.button - 0.1],
        [OneButton, C.button, C.buttonOut],
        [Neighbors, C.neighbors, C.neighborsOut],
        [Doorbell, C.doorbell, C.end + 1],
      ].map(([Comp, a, b], i) => {
        const Cmp = Comp as React.FC<any>;
        const extra =
          Cmp === OneButton
            ? { on: interpolate(frame, [F(C.button) + 6, F(C.button) + 16], [0, 1], clamp) }
            : Cmp === Doorbell
              ? { open: interpolate(t, [C.petrovich - 0.1, C.petrovich + 0.45], [0, 1], { ...clamp, easing: ease }) }
              : {};
        return (
          <div key={i} style={{ position: 'absolute', left: TOP_INSERT.left, top: TOP_INSERT.top }}>
            <Cmp progress={vis(frame, a as number, b as number)} t={t} size={TOP_INSERT.size} {...extra} />
          </div>
        );
      })}
      <PriceTags frame={frame} />

      <Captions />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const inBanner = frame >= BANNER_START && frame < BANNER_END;
  const sceneFrame = inBanner ? BANNER_START - 1 : frame;
  const dim = inBanner
    ? interpolate(frame, [BANNER_START, BANNER_START + 6, BANNER_END - 6, BANNER_END], [0, 1, 1, 0], clamp)
    : 0;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ filter: dim ? `blur(${dim * 20}px)` : undefined, transform: dim ? `scale(${1 + dim * 0.04})` : undefined }}>
        <Scene frame={sceneFrame} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#1a1410', opacity: dim * 0.62 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(120,200,140,.18) 0%, rgba(0,0,0,0) 60%)', opacity: dim }} />
    </AbsoluteFill>
  );
};
