import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import cuesJson from '../public/cues.json';
import { Kitchen, KitchenTable, Grandma, FiveApps, HotPhone, CheeseTrap, Neighbors, OneButton, Doorbell } from './art';
import type { Emotion } from './art';
import { Captions } from './Captions';
import { loadFonts } from './fonts';
import { FPS, TL, lastLine, mouthFor } from './timeline';

loadFonts();
const C = cuesJson as Record<string, number>;
const F = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0..1 visibility of an insert between two cue times with in/out animation */
const vis = (frame: number, a: number, b: number, inF = 12, outF = 8) =>
  Math.min(interpolate(frame, [F(a), F(a) + inF], [0, 1], clamp), interpolate(frame, [F(b) - outF, F(b)], [1, 0], clamp));

const BANNER_START = TL.bannerStart;
const BANNER_END = TL.bannerStart + TL.bannerFrames;

const emotionAt = (frame: number): Emotion => {
  const t = frame / FPS;
  if (t >= C.petrovich - 0.3 && t < C.petrovich + 1.6) return 'surprised';
  if (t >= C.petrovich + 1.6) return 'happy';
  if (t >= C.doorbell && t < C.petrovich) return 'surprised';
  const l = lastLine(frame);
  if (!l) return 'sly';
  if (l.who === 'grandma') return (l.emotion as Emotion) ?? 'sly';
  // reactions while the grandson talks
  if (l.id === 'l06') return 'happy';
  if (l.id === 'l08') return 'serious';
  if (l.id === 'l11') return 'proud';
  if (l.id === 'l12b') return 'sly';
  return 'sly';
};

const blinkAt = (frame: number) => {
  // irregular natural blinks
  const seeds = [41, 113, 170, 262, 318, 409, 466, 571, 640, 722, 801, 905, 961, 1064, 1150, 1222, 1340, 1402, 1490, 1585, 1660, 1745, 1840, 1902, 2010, 2100, 2210, 2290, 2370];
  for (const s of seeds) {
    const d = frame - s;
    if (d >= 0 && d < 6) return [0.5, 1, 1, 0.6, 0.25, 0][d];
  }
  return 0;
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
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          background: '#FFF7E8',
          borderRadius: 44,
          padding: '30px 46px',
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
    <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
      {tag('С капустой', '= установка', '#D9B26A', C.cabbage, 0)}
      {frame >= F(C.meat) - 2 && tag('С мясом', '= срочно ⚡', '#C8743F', C.meat, 1)}
    </div>
  );
};

const Scene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const t = frame / FPS;

  // ---------- camera ----------
  const hookZoom = interpolate(frame, [0, 40], [1.32, 1.1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const l = lastLine(frame);
  const punch = l ? spring({ frame: frame - l.startFrame, fps, config: { damping: 12, stiffness: 120 } }) : 1;
  const punchAmt = l && l.who !== 'grandma' ? 0.025 : 0.04;
  const serious = interpolate(t, [C.money - 1.2, C.freeze], [0, 0.16], clamp) * (t < C.bannerEnd ? 1 : 0);
  const afterBanner = spring({ frame: frame - BANNER_END, fps, config: { damping: 15, stiffness: 90 } });
  const insertShift =
    Math.max(
      vis(frame, C.five, C.appsOut),
      vis(frame, C.cheese, C.buttonOut),
      vis(frame, C.neighbors, C.neighborsOut),
      vis(frame, C.cabbage, C.pricesOut),
      vis(frame, C.doorbell, C.end + 1),
    ) * 1;
  const zoom =
    hookZoom +
    (1 - punch) * punchAmt +
    serious +
    (frame >= BANNER_END ? (1 - afterBanner) * 0.12 : 0) -
    insertShift * 0.06 +
    Math.sin(t * 0.6) * 0.008;
  const panX = Math.sin(t * 0.35) * 10 - insertShift * 40;
  const panY = Math.cos(t * 0.27) * 8 + insertShift * 170 - serious * 120;

  // ---------- grandma ----------
  const mouth = mouthFor('grandma', frame);
  const emo = emotionAt(frame);
  const tilt = Math.sin(t * 1.3) * 2.2 + mouth * 2.5 * Math.sin(t * 7) + (emo === 'surprised' ? -5 : 0);
  const phoneUp = t < 3.9 || (t >= C.button - 0.2 && t < C.buttonOut);
  const breathe = (Math.sin(t * 2.1) + 1) / 2;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#1d2b33' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '540px 760px',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <Kitchen parallax={Math.sin(t * 0.35) * 0.6} />
        </div>
        <div style={{ position: 'absolute', left: 22, top: 230, transform: 'scale(1.15)', transformOrigin: '0 0' }}>
          <Grandma
            emotion={emo}
            mouth={mouth}
            blink={blinkAt(frame)}
            headTilt={tilt}
            breathe={breathe}
            phoneUp={phoneUp}
            screenGlow={0.65 + 0.35 * Math.sin(t * 4)}
          />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <KitchenTable parallax={Math.sin(t * 0.35) * 0.6} />
        </div>
      </AbsoluteFill>

      {/* serious-moment vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 35%, rgba(8,12,24,.75) 100%)',
          opacity: interpolate(t, [C.money - 1, C.freeze], [0.25, 1], clamp) * (t < C.bannerEnd ? 1 : 0.25) + (t < C.money - 1 ? 0 : 0),
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 45%, rgba(10,14,26,.45) 100%)' }} />

      {/* inserts */}
      <div style={{ position: 'absolute', left: 140, top: 90 }}>
        <FiveApps progress={vis(frame, C.five, C.appsOut)} t={t} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 520, top: 520 }}>
        <HotPhone progress={vis(frame, C.hot, C.appsOut)} t={t} size={460} />
      </div>
      <div style={{ position: 'absolute', left: 140, top: 90 }}>
        <CheeseTrap progress={vis(frame, C.cheese, C.button - 0.1)} t={t} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 140, top: 90 }}>
        <OneButton progress={vis(frame, C.button, C.buttonOut)} on={interpolate(frame, [F(C.button) + 6, F(C.button) + 16], [0, 1], clamp)} t={t} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 90, top: 80 }}>
        <Neighbors progress={vis(frame, C.neighbors, C.neighborsOut)} t={t} size={900} />
      </div>
      <PriceTags frame={frame} />
      <div style={{ position: 'absolute', left: 140, top: 90 }}>
        <Doorbell progress={vis(frame, C.doorbell, C.end + 1)} t={t} size={800} />
      </div>

      <Captions />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const inBanner = frame >= BANNER_START && frame < BANNER_END;
  // during the banner the story is frozen on its last frame and dimmed
  const sceneFrame = inBanner ? BANNER_START - 1 : frame;
  const dim = inBanner
    ? interpolate(frame, [BANNER_START, BANNER_START + 8, BANNER_END - 8, BANNER_END], [0, 0.62, 0.62, 0], clamp)
    : 0;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ filter: inBanner ? `blur(${dim * 14}px) saturate(${1 - dim * 0.6})` : undefined }}>
        <Scene frame={sceneFrame} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#05070d', opacity: dim }} />
    </AbsoluteFill>
  );
};
