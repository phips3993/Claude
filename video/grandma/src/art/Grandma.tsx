import React from 'react';
import {P, clamp, lerp, useSvgId} from './util';

export type Emotion = 'sly' | 'surprised' | 'serious' | 'proud' | 'happy';

export type GrandmaProps = {
	emotion?: Emotion;
	/** 0 closed … 1 wide open */
	mouth?: number;
	/** 0 open … 1 closed */
	blink?: number;
	/** degrees, positive = tilt to her left (viewer's right) */
	headTilt?: number;
	/** 0..1 breathing phase amplitude (pass e.g. (sin(t)+1)/2) */
	breathe?: number;
	/** raises phone, screen to viewer */
	phoneUp?: boolean;
	/** 0..1 glow of the phone screen */
	screenGlow?: number;
	/** 0..1 wink with the viewer's-right eye; rest of the face keeps the emotion */
	wink?: number;
	style?: React.CSSProperties;
};

/** Grandma half-body. viewBox 0 0 900 1100, bottom edge is cut by the table. */
export const GRANDMA_W = 900;
export const GRANDMA_H = 1100;

type Face = {
	lidL: number;
	lidR: number;
	browL: number; // vertical offset (negative = up)
	browR: number;
	browAngL: number; // degrees, positive = inner end down
	browAngR: number;
	smile: number; // −0.3..1
	asym: number; // right corner lift
	mouthW: number;
	round: number; // 0..1 how round open mouth is (surprised)
	eyeScale: number;
	lookX: number;
	tilt: number;
	happyEyes: boolean;
	blush: number;
};

const FACES: Record<Emotion, Face> = {
	sly: {lidL: 0.5, lidR: 0.42, browL: -14, browR: 6, browAngL: -8, browAngR: 10, smile: 0.55, asym: 10, mouthW: 84, round: 0, eyeScale: 1, lookX: 5, tilt: -4, happyEyes: false, blush: 0.7},
	surprised: {lidL: 0, lidR: 0, browL: -34, browR: -34, browAngL: -6, browAngR: -6, smile: -0.05, asym: 0, mouthW: 58, round: 1, eyeScale: 1.18, lookX: 0, tilt: 2, happyEyes: false, blush: 0.5},
	serious: {lidL: 0.32, lidR: 0.32, browL: 4, browR: 4, browAngL: 14, browAngR: 14, smile: -0.18, asym: 0, mouthW: 70, round: 0.2, eyeScale: 1, lookX: 0, tilt: 0, happyEyes: false, blush: 0.25},
	proud: {lidL: 0.55, lidR: 0.55, browL: -16, browR: -16, browAngL: -6, browAngR: -6, smile: 0.65, asym: 2, mouthW: 82, round: 0, eyeScale: 1, lookX: 0, tilt: -7, happyEyes: false, blush: 0.8},
	happy: {lidL: 0, lidR: 0, browL: -18, browR: -18, browAngL: -4, browAngR: -4, smile: 0.95, asym: 0, mouthW: 92, round: 0, eyeScale: 1, lookX: 0, tilt: 3, happyEyes: true, blush: 1},
};

const EYE_L = {x: 385, y: 392};
const EYE_R = {x: 515, y: 392};

const Eye: React.FC<{
	cx: number;
	cy: number;
	lid: number;
	scale: number;
	lookX: number;
	happy: boolean;
	id: (s: string) => string;
	side: 'L' | 'R';
}> = ({cx, cy, lid, scale, lookX, happy, id, side}) => {
	const rx = 21 * scale;
	const ry = 24 * scale;
	if (happy) {
		return (
			<path
				d={`M${cx - 24} ${cy + 6} Q${cx} ${cy - 22} ${cx + 24} ${cy + 6}`}
				stroke={P.ink}
				strokeWidth={8}
				strokeLinecap="round"
				fill="none"
			/>
		);
	}
	const l = clamp(lid);
	const lidY = cy - ry + 2 * ry * l;
	const clip = id(`eye${side}`);
	return (
		<g>
			<clipPath id={clip}>
				<ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
			</clipPath>
			<ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFDF8" />
			<g clipPath={`url(#${clip})`}>
				<circle cx={cx + lookX} cy={cy + 2} r={14 * scale} fill="#6B4A36" />
				<circle cx={cx + lookX} cy={cy + 2} r={8 * scale} fill="#24171A" />
				<circle cx={cx + lookX + 5} cy={cy - 4} r={4.5 * scale} fill="#fff" />
				<circle cx={cx + lookX - 4} cy={cy + 7} r={2} fill="#fff" opacity={0.7} />
				{/* eyelid */}
				<rect x={cx - rx - 2} y={cy - ry - 4} width={rx * 2 + 4} height={Math.max(0, lidY - (cy - ry) + 4)} fill={P.skinShade} />
			</g>
			{/* lash line follows lid */}
			{l < 0.97 ? (
				<path
					d={`M${cx - rx - 4} ${Math.max(lidY, cy - ry * 0.55) + 3} Q${cx} ${lidY - (1 - l) * 8} ${cx + rx + 4} ${Math.max(lidY, cy - ry * 0.55) + 3}`}
					stroke={P.ink}
					strokeWidth={5.5}
					strokeLinecap="round"
					fill="none"
				/>
			) : (
				<path d={`M${cx - rx} ${cy + 2} Q${cx} ${cy + 10} ${cx + rx} ${cy + 2}`} stroke={P.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
			)}
		</g>
	);
};

const Mouth: React.FC<{f: Face; open: number; id: (s: string) => string}> = ({f, open, id}) => {
	const cx = 450;
	const cy = 512;
	const o = clamp(open);
	const w = lerp(f.mouthW, f.mouthW * (1 - 0.35 * f.round), o);
	const lift = f.smile * 16;
	const lx = cx - w / 2;
	const rx = cx + w / 2;
	const ly = cy - lift;
	const ry = cy - lift - f.asym;
	const lipColor = '#B5584B';
	if (o < 0.06) {
		const c = cy + f.smile * 26;
		return (
			<g>
				<path d={`M${lx} ${ly} Q${cx} ${c} ${rx} ${ry}`} stroke={lipColor} strokeWidth={8} strokeLinecap="round" fill="none" />
				{f.smile > 0.3 && (
					<>
						<path d={`M${lx - 6} ${ly - 8} q-6 10 2 16`} stroke={P.skinDeep} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
						<path d={`M${rx + 6} ${ry - 8} q6 10 -2 16`} stroke={P.skinDeep} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
					</>
				)}
			</g>
		);
	}
	const upper = cy - 6 + f.smile * 8 - o * 4 * f.round;
	const lower = cy + 8 + o * (62 + 18 * f.round) + f.smile * 14;
	const d = `M${lx} ${ly} Q${cx} ${upper - (ly - upper) * 0.1} ${rx} ${ry} Q${cx + w * 0.1} ${lower + 8} ${cx} ${lower} Q${cx - w * 0.1} ${lower + 8} ${lx} ${ly}Z`;
	const clip = id('mouth');
	return (
		<g>
			<clipPath id={clip}>
				<path d={d} />
			</clipPath>
			<path d={d} fill="#6E2431" />
			<g clipPath={`url(#${clip})`}>
				<rect x={lx} y={upper - 30} width={w} height={34 + 10 * o} rx={6} fill="#FFFBF2" />
				<ellipse cx={cx} cy={lower + 4} rx={w * 0.33} ry={18 + o * 10} fill="#E0707A" />
			</g>
			<path d={d} fill="none" stroke={lipColor} strokeWidth={6} strokeLinejoin="round" />
		</g>
	);
};

const Brow: React.FC<{cx: number; cy: number; dy: number; ang: number; side: 'L' | 'R'}> = ({cx, cy, dy, ang, side}) => {
	// inner end is toward the nose
	const dir = side === 'L' ? 1 : -1;
	const rot = ang * dir;
	return (
		<path
			d={`M${cx - 30} ${cy + dy + 4} Q${cx} ${cy + dy - 12} ${cx + 30} ${cy + dy + 2}`}
			stroke={P.hairShade}
			strokeWidth={13}
			strokeLinecap="round"
			fill="none"
			transform={`rotate(${rot} ${cx} ${cy + dy})`}
		/>
	);
};

/** One and the same dark smartphone in both poses (screen with green power button). */
const PhoneBody: React.FC<{glow: number; id: (s: string) => string}> = ({glow, id}) => (
	<g>
		<rect x={-78} y={-140} width={156} height={290} rx={26} fill="#2B2F3A" />
		<rect x={-68} y={-128} width={136} height={266} rx={18} fill={`url(#${id('screen')})`} />
		<circle cx={0} cy={0} r={62} fill={P.green} opacity={0.15 + 0.25 * glow} />
		<circle cx={0} cy={0} r={44} fill="none" stroke={P.green} strokeWidth={10} opacity={0.55 + 0.35 * glow} />
		<path d="M0 -50 L0 -8" stroke={P.green} strokeWidth={11} strokeLinecap="round" opacity={0.55 + 0.35 * glow} />
		<rect x={-30} y={70} width={60} height={10} rx={5} fill="#fff" opacity={0.35} />
		<rect x={-22} y={-118} width={44} height={8} rx={4} fill="#0E1016" />
		<path d="M-68 -128 L10 -128 L-68 40Z" fill="#fff" opacity={0.06} />
	</g>
);

const Phone: React.FC<{up: boolean; glow: number; id: (s: string) => string}> = ({up, glow, id}) => {
	if (up) {
		return (
			<g transform="translate(700 470) rotate(8)">
				<PhoneBody glow={glow} id={id} />
			</g>
		);
	}
	return (
		<g transform="translate(560 900) rotate(-14) scale(0.78)">
			<PhoneBody glow={glow * 0.6} id={id} />
		</g>
	);
};

export const Grandma: React.FC<GrandmaProps> = ({
	emotion = 'sly',
	mouth = 0,
	blink = 0,
	headTilt = 0,
	breathe = 0,
	phoneUp = false,
	screenGlow = 0.5,
	wink = 0,
	style,
}) => {
	const id = useSvgId('grandma');
	const f = FACES[emotion];
	const b = clamp(breathe);
	const chestY = -b * 8;
	const tilt = headTilt + f.tilt;
	const lidL = Math.max(f.lidL, blink);
	const w = clamp(wink);
	const lidR = Math.max(f.lidR, blink, w);
	return (
		<svg
			viewBox={`0 0 ${GRANDMA_W} ${GRANDMA_H}`}
			width={GRANDMA_W}
			height={GRANDMA_H}
			style={{overflow: 'visible', ...style}}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id={id('knit')} width="26" height="34" patternUnits="userSpaceOnUse">
					<rect width="26" height="34" fill={P.mustard} />
					<path d="M3 0 Q8 8 13 0 M13 0 Q18 8 23 0 M3 17 Q8 25 13 17 M13 17 Q18 25 23 17" stroke={P.mustardDark} strokeWidth="2.5" fill="none" opacity="0.55" />
				</pattern>
				<linearGradient id={id('body')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#7A3A1E" stopOpacity="0.28" />
					<stop offset="0.4" stopColor="#7A3A1E" stopOpacity="0" />
					<stop offset="1" stopColor="#7A3A1E" stopOpacity="0.32" />
				</linearGradient>
				<radialGradient id={id('face')} cx="0.42" cy="0.38" r="0.75">
					<stop offset="0" stopColor="#F8D2B4" />
					<stop offset="0.7" stopColor={P.skin} />
					<stop offset="1" stopColor={P.skinShade} />
				</radialGradient>
				<radialGradient id={id('hair')} cx="0.4" cy="0.3" r="0.8">
					<stop offset="0" stopColor="#FFFFFF" />
					<stop offset="0.6" stopColor={P.hair} />
					<stop offset="1" stopColor={P.hairShade} />
				</radialGradient>
				<linearGradient id={id('screen')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#13303A" />
					<stop offset="1" stopColor="#0B1C24" />
				</linearGradient>
				<radialGradient id={id('blush')}>
					<stop offset="0" stopColor={P.blush} stopOpacity="0.75" />
					<stop offset="1" stopColor={P.blush} stopOpacity="0" />
				</radialGradient>
				<filter id={id('shadow')} x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="14" />
				</filter>
			</defs>

			{/* soft cast shadow on wall */}
			<ellipse cx={470} cy={760} rx={360} ry={420} fill="#5A2216" opacity={0.16} filter={`url(#${id('shadow')})`} />

			{/* neck */}
			<path d="M405 560 L405 690 Q450 720 495 690 L495 560Z" fill={P.skinShade} />

			<g transform={`translate(0 ${chestY})`}>
				{/* torso */}
				<path
					d="M150 1120 C150 860 210 720 330 680 L570 680 C690 720 750 860 750 1120Z"
					fill={`url(#${id('knit')})`}
				/>
				{/* blouse V */}
				<path d="M380 670 L450 860 L520 670Z" fill={P.cream} />
				<path d="M405 672 L450 780 L495 672" stroke={P.creamDark} strokeWidth={6} fill="none" />
				{/* cardigan lapels */}
				<path d="M330 680 L450 900 L450 1120 L400 1120 L400 920 Z" fill={P.mustardDark} opacity={0.35} />
				<path d="M570 680 L450 900 L450 1120 L500 1120 L500 920 Z" fill={P.mustardDark} opacity={0.35} />
				<path d="M335 680 L450 890" stroke="#C88E30" strokeWidth={10} strokeLinecap="round" />
				<path d="M565 680 L450 890" stroke="#C88E30" strokeWidth={10} strokeLinecap="round" />
				{[950, 1040].map((y) => (
					<circle key={y} cx={470} cy={y} r={13} fill={P.terracottaDark} />
				))}
				<path d="M150 1120 C150 860 210 720 330 680 L570 680 C690 720 750 860 750 1120Z" fill={`url(#${id('body')})`} />
				{/* beads */}
				<path d="M372 672 Q450 840 528 672" stroke="none" fill="none" />
				{[...Array(13)].map((_, i) => {
					const t = i / 12;
					const x = lerp(372, 528, t);
					const y = 672 + Math.sin(Math.PI * t) * 150;
					return <circle key={i} cx={x} cy={y} r={i % 2 ? 9 : 11} fill={i % 2 ? P.red : '#F3EBDD'} />;
				})}

				{/* left arm (viewer's left) resting toward table */}
				<path d="M245 760 C190 860 200 980 290 1060" stroke={P.mustard} strokeWidth={118} strokeLinecap="round" fill="none" />
				<path d="M245 760 C190 860 200 980 290 1060" stroke={P.mustardDark} strokeOpacity={0.22} strokeWidth={118} strokeLinecap="round" fill="none" />
				<path d="M200 840 C185 900 195 960 230 1010" stroke="#fff" strokeOpacity={0.12} strokeWidth={18} strokeLinecap="round" fill="none" />

				{/* right arm + phone */}
				{phoneUp ? (
					<g>
						<path d="M655 760 C760 820 800 760 760 600" stroke={P.mustard} strokeWidth={112} strokeLinecap="round" fill="none" />
						<path d="M655 760 C760 820 800 760 760 600" stroke={P.mustardDark} strokeOpacity={0.25} strokeWidth={112} strokeLinecap="round" fill="none" />
						<rect x={718} y={520} width={84} height={40} rx={14} fill="#F3EBDD" transform="rotate(8 760 540)" />
						{/* palm behind the phone */}
						<ellipse cx={712} cy={600} rx={74} ry={58} fill={P.skinShade} />
						<Phone up glow={screenGlow} id={id} />
						{/* thumb over left edge, fingers over right edge */}
						<ellipse cx={630} cy={548} rx={17} ry={30} fill={P.skin} transform="rotate(18 630 548)" />
						{[478, 518, 558].map((y) => (
							<ellipse key={y} cx={786 - (y - 478) * 0.06} cy={y} rx={16} ry={21} fill={P.skin} />
						))}
					</g>
				) : (
					<g>
						<path d="M655 760 C720 860 700 960 600 980" stroke={P.mustard} strokeWidth={112} strokeLinecap="round" fill="none" />
						<path d="M655 760 C720 860 700 960 600 980" stroke={P.mustardDark} strokeOpacity={0.25} strokeWidth={112} strokeLinecap="round" fill="none" />
						<Phone up={false} glow={screenGlow} id={id} />
						<ellipse cx={600} cy={990} rx={56} ry={44} fill={P.skin} />
						<ellipse cx={515} cy={925} rx={18} ry={26} fill={P.skin} transform="rotate(-20 515 925)" />
					</g>
				)}
			</g>

			{/* head */}
			<g transform={`translate(0 ${36 + chestY * 0.6}) rotate(${tilt} 450 640)`}>
				{/* hair back + bun */}
				<circle cx={450} cy={170} r={86} fill={`url(#${id('hair')})`} />
				<path d="M380 160 Q450 120 520 160" stroke={P.hairShade} strokeWidth={6} fill="none" opacity={0.6} />
				<rect x={395} y={226} width={110} height={22} rx={11} fill={P.terracotta} />
				<ellipse cx={450} cy={360} rx={190} ry={200} fill={`url(#${id('hair')})`} />

				{/* ears + earrings */}
				<ellipse cx={292} cy={420} rx={28} ry={40} fill={P.skinShade} />
				<ellipse cx={608} cy={420} rx={28} ry={40} fill={P.skinShade} />
				<circle cx={292} cy={470} r={11} fill={P.mustard} />
				<circle cx={608} cy={470} r={11} fill={P.mustard} />

				{/* face */}
				<path d="M300 380 C300 250 600 250 600 380 C600 500 540 590 450 590 C360 590 300 500 300 380Z" fill={`url(#${id('face')})`} />

				{/* hair front: soft waves */}
				<path d="M282 380 C270 230 370 190 450 205 C540 190 640 240 618 380 C600 300 540 270 470 282 C430 250 330 260 300 330Z" fill={`url(#${id('hair')})`} />
				<path d="M320 300 C360 262 420 258 470 282" stroke={P.hairShade} strokeWidth={5} fill="none" opacity={0.55} />
				<path d="M470 282 C530 262 580 285 600 330" stroke={P.hairShade} strokeWidth={5} fill="none" opacity={0.55} />

				{/* blush */}
				<ellipse cx={365} cy={478} rx={50} ry={30} fill={`url(#${id('blush')})`} opacity={f.blush} />
				<ellipse cx={535} cy={478 - w * 8} rx={50} ry={30} fill={`url(#${id('blush')})`} opacity={Math.max(f.blush, w)} />

				{/* crow's feet */}
				<path d="M322 392 l-16 -6 M322 404 l-16 4" stroke={P.skinDeep} strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />
				<path d="M578 392 l16 -6 M578 404 l16 4" stroke={P.skinDeep} strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />

				{/* eyes */}
				<Eye cx={EYE_L.x} cy={EYE_L.y} lid={lidL} scale={f.eyeScale} lookX={f.lookX} happy={f.happyEyes && blink < 0.5} id={id} side="L" />
				<Eye cx={EYE_R.x} cy={EYE_R.y} lid={lidR} scale={f.eyeScale} lookX={f.lookX} happy={f.happyEyes && blink < 0.5} id={id} side="R" />

				{/* brows */}
				<Brow cx={EYE_L.x} cy={330} dy={f.browL} ang={f.browAngL} side="L" />
				<Brow cx={EYE_R.x} cy={330} dy={f.browR + w * 12} ang={f.browAngR + w * 8} side="R" />

				{/* glasses */}
				<g>
					<circle cx={EYE_L.x} cy={EYE_L.y} r={60} fill="#FFFFFF" opacity={0.1} />
					<circle cx={EYE_R.x} cy={EYE_R.y} r={60} fill="#FFFFFF" opacity={0.1} />
					<circle cx={EYE_L.x} cy={EYE_L.y} r={60} fill="none" stroke={P.terracottaDark} strokeWidth={9} />
					<circle cx={EYE_R.x} cy={EYE_R.y} r={60} fill="none" stroke={P.terracottaDark} strokeWidth={9} />
					<path d={`M${EYE_L.x + 58} ${EYE_L.y - 6} Q450 ${EYE_L.y - 22} ${EYE_R.x - 58} ${EYE_R.y - 6}`} stroke={P.terracottaDark} strokeWidth={8} fill="none" />
					<path d={`M${EYE_L.x - 60} ${EYE_L.y - 6} L300 ${EYE_L.y - 14}`} stroke={P.terracottaDark} strokeWidth={8} />
					<path d={`M${EYE_R.x + 60} ${EYE_R.y - 6} L600 ${EYE_R.y - 14}`} stroke={P.terracottaDark} strokeWidth={8} />
					<path d={`M${EYE_L.x - 38} ${EYE_L.y - 30} Q${EYE_L.x - 20} ${EYE_L.y - 48} ${EYE_L.x + 4} ${EYE_L.y - 50}`} stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55} />
					<path d={`M${EYE_R.x - 38} ${EYE_R.y - 30} Q${EYE_R.x - 20} ${EYE_R.y - 48} ${EYE_R.x + 4} ${EYE_R.y - 50}`} stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55} />
					{/* glasses chain */}
					<path d="M300 380 C270 520 310 610 372 672" stroke={P.mustard} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
					<path d="M600 380 C630 520 590 610 528 672" stroke={P.mustard} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
				</g>

				{/* nose */}
				<path d="M450 420 C438 452 430 466 442 474 C452 480 466 476 470 468" stroke={P.skinDeep} strokeWidth={6} strokeLinecap="round" fill="none" />
				<ellipse cx={452} cy={462} rx={22} ry={14} fill={P.skinShade} opacity={0.5} />

				{/* smile lines */}
				<path d="M388 478 Q372 510 392 540" stroke={P.skinDeep} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.45} />
				<path d="M512 478 Q528 510 508 540" stroke={P.skinDeep} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.45} />

				<Mouth f={f} open={mouth} id={id} />
			</g>
		</svg>
	);
};
