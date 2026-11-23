import React from 'react';
import {P, clamp, easeOutBack, easeOutCubic, useSvgId} from './util';

/**
 * Pop-up inserts. Every component:
 *  - progress 0..1 — appearance (springy pop-in; 0 = invisible)
 *  - t (optional) — seconds, drives idle loops (heat waves, glow pulse…)
 *  - size (optional) — rendered px width (square viewBox 800×800), default 800
 */
export type InsertProps = {progress: number; t?: number; size?: number; style?: React.CSSProperties};

const Frame: React.FC<React.PropsWithChildren<InsertProps & {viewBox?: string}>> = ({
	progress,
	size = 800,
	style,
	children,
	viewBox = '0 0 800 800',
}) => {
	const p = clamp(progress);
	const s = easeOutBack(p);
	return (
		<svg
			viewBox={viewBox}
			width={size}
			height={size}
			style={{overflow: 'visible', opacity: clamp(p * 3), ...style}}
			xmlns="http://www.w3.org/2000/svg"
		>
			<g transform={`translate(400 400) scale(${Math.max(0.0001, s)}) translate(-400 -400)`}>{children}</g>
		</svg>
	);
};

/** Card backdrop shared by inserts: soft cream blob with drop shadow. */
const Card: React.FC<{id: (s: string) => string; r?: number}> = ({id, r = 330}) => (
	<g>
		<defs>
			<filter id={id('cardShadow')} x="-30%" y="-30%" width="160%" height="160%">
				<feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#3A1608" floodOpacity="0.35" />
			</filter>
			<radialGradient id={id('card')} cx="0.4" cy="0.3" r="0.9">
				<stop offset="0" stopColor="#FFF9EE" />
				<stop offset="1" stopColor="#F3DFC0" />
			</radialGradient>
		</defs>
		<circle cx={400} cy={400} r={r} fill={`url(#${id('card')})`} filter={`url(#${id('cardShadow')})`} />
	</g>
);

const Shield: React.FC<{x: number; y: number; rot: number; c1: string; c2: string; glyph: 'lock' | 'key' | 'star' | 'bolt' | 'eye'}> = ({
	x,
	y,
	rot,
	c1,
	c2,
	glyph,
}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot})`}>
		<rect x={-82} y={-82} width={164} height={164} rx={40} fill={c1} />
		<rect x={-82} y={-82} width={164} height={80} rx={40} fill="#fff" opacity={0.14} />
		<path d="M0 -52 L44 -34 L40 14 C36 40 16 54 0 62 C-16 54 -36 40 -40 14 L-44 -34Z" fill={c2} />
		{glyph === 'lock' && (
			<g fill={c1}>
				<rect x={-18} y={-4} width={36} height={30} rx={6} />
				<path d="M-11 -4 v-10 a11 11 0 0 1 22 0 v10" stroke={c1} strokeWidth={7} fill="none" />
			</g>
		)}
		{glyph === 'key' && (
			<g stroke={c1} strokeWidth={8} fill="none" strokeLinecap="round">
				<circle cx={-8} cy={-8} r={12} />
				<path d="M2 2 L22 22 M14 14 l-8 8" />
			</g>
		)}
		{glyph === 'star' && <path d="M0 -26 L8 -6 L28 -6 L12 6 L18 26 L0 14 L-18 26 L-12 6 L-28 -6 L-8 -6Z" fill={c1} />}
		{glyph === 'bolt' && <path d="M6 -30 L-18 6 L-2 6 L-8 32 L18 -6 L2 -6Z" fill={c1} />}
		{glyph === 'eye' && (
			<g>
				<path d="M-28 0 Q0 -26 28 0 Q0 26 -28 0Z" fill={c1} />
				<circle cx={0} cy={0} r={8} fill={c2} />
			</g>
		)}
	</g>
);

/** Five shady "free VPN" apps fanned out; one has a red AD badge, one is overheating. */
export const FiveApps: React.FC<InsertProps> = (props) => {
	const id = useSvgId('five');
	const t = props.t ?? 0;
	const p = clamp(props.progress);
	const apps = [
		{c1: '#6C5CE7', c2: '#E8E4FF', g: 'lock' as const},
		{c1: '#00A6A6', c2: '#D9FFFA', g: 'key' as const},
		{c1: P.red, c2: '#FFE3DE', g: 'star' as const},
		{c1: '#F39C12', c2: '#FFF1D6', g: 'bolt' as const},
		{c1: '#2D6670', c2: '#DDF3F5', g: 'eye' as const},
	];
	return (
		<Frame {...props}>
			<Card id={id} />
			{apps.map((a, i) => {
				const local = clamp(p * 1.6 - i * 0.12);
				const ang = (i - 2) * 24 * easeOutCubic(local);
				const r = 300;
				const rad = ((ang - 90) * Math.PI) / 180;
				const x = 400 + Math.cos(rad) * r;
				const y = 700 + Math.sin(rad) * r;
				return <g key={i} transform={`translate(${x} ${y}) scale(0.82) translate(${-x} ${-y})`}><Shield x={x} y={y} rot={ang} c1={a.c1} c2={a.c2} glyph={a.g} /></g>;
			})}
			{/* AD badge on app #1 */}
			<g transform={`translate(${400 + Math.cos(((-48 - 90) * Math.PI) / 180) * 300 + 40} ${700 + Math.sin(((-48 - 90) * Math.PI) / 180) * 300 - 75}) scale(${easeOutBack(clamp(p * 2 - 0.8))})`}>
				<rect x={-46} y={-26} width={92} height={52} rx={26} fill={P.red} />
				<text x={0} y={12} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={34} fill="#fff">
					AD
				</text>
			</g>
			{/* heat waves from app #4 */}
			<g transform={`translate(${400 + Math.cos(((24 - 90) * Math.PI) / 180) * 300} ${700 + Math.sin(((24 - 90) * Math.PI) / 180) * 300 - 95})`} opacity={clamp(p * 2 - 1)}>
				{[-28, 0, 28].map((dx, i) => (
					<path
						key={i}
						d={`M${dx} 0 c-14 -18 14 -30 0 -48 c-14 -18 14 -30 0 -48`}
						stroke={P.red}
						strokeWidth={9}
						strokeLinecap="round"
						fill="none"
						opacity={0.55 + 0.35 * Math.sin(t * 6 + i)}
						transform={`translate(0 ${-((t * 40 + i * 12) % 24)})`}
					/>
				))}
			</g>
		</Frame>
	);
};

/** Overheating phone used as a hand warmer. */
export const HotPhone: React.FC<InsertProps> = (props) => {
	const id = useSvgId('hot');
	const t = props.t ?? 0;
	const glow = 0.5 + 0.5 * Math.sin(t * 5);
	return (
		<Frame {...props}>
			<Card id={id} />
			<defs>
				<radialGradient id={id('heat')} cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor="#FF7A45" stopOpacity="0.85" />
					<stop offset="1" stopColor="#FF7A45" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={id('scr')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#FF9E6B" />
					<stop offset="1" stopColor="#E5483A" />
				</linearGradient>
			</defs>
			<circle cx={380} cy={430} r={230} fill={`url(#${id('heat')})`} opacity={0.5 + 0.4 * glow} />
			<g transform="translate(370 430) rotate(-10)">
				<rect x={-110} y={-190} width={220} height={380} rx={36} fill="#2B2F3A" />
				<rect x={-96} y={-174} width={192} height={348} rx={26} fill={`url(#${id('scr')})`} />
				{/* fire glyph */}
				<path d="M0 -70 C40 -30 60 0 50 40 C42 74 14 90 0 90 C-14 90 -46 74 -52 40 C-58 8 -30 -10 -24 -34 C-10 -14 -4 -4 0 6 C10 -20 6 -46 0 -70Z" fill="#FFE08A" />
				<path d="M0 10 C18 30 24 46 18 62 C12 76 -12 76 -18 62 C-22 48 -12 34 0 10Z" fill="#fff" opacity={0.85} />
			</g>
			{/* thermometer */}
			<g transform="translate(560 330) rotate(12)">
				<rect x={-26} y={-150} width={52} height={230} rx={26} fill="#fff" />
				<rect x={-12} y={-130} width={24} height={200} rx={12} fill="#F2E6D6" />
				<rect x={-12} y={-130 + 200 * (1 - (0.75 + 0.2 * glow))} width={24} height={200 * (0.75 + 0.2 * glow)} rx={12} fill={P.red} />
				<circle cx={0} cy={96} r={44} fill={P.red} />
				<circle cx={-12} cy={84} r={10} fill="#fff" opacity={0.5} />
			</g>
			{/* steam */}
			{[0, 1, 2].map((i) => (
				<path
					key={i}
					d={`M${300 + i * 60} 300 c-20 -24 20 -40 0 -64 c-20 -24 20 -40 0 -64`}
					stroke="#fff"
					strokeWidth={14}
					strokeLinecap="round"
					fill="none"
					opacity={0.6 + 0.3 * Math.sin(t * 4 + i * 2)}
					transform={`translate(0 ${-((t * 30 + i * 10) % 20)})`}
				/>
			))}
		</Frame>
	);
};

/** Mousetrap with a cheese wedge — "free cheese only in a mousetrap". */
export const CheeseTrap: React.FC<InsertProps> = (props) => {
	const id = useSvgId('cheese');
	const t = props.t ?? 0;
	const sparkle = 0.5 + 0.5 * Math.sin(t * 6);
	return (
		<Frame {...props}>
			<Card id={id} />
			<defs>
				<linearGradient id={id('wood')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#E7B57A" />
					<stop offset="1" stopColor="#B97B45" />
				</linearGradient>
				<linearGradient id={id('ch')} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#FFE07A" />
					<stop offset="1" stopColor="#F2B53A" />
				</linearGradient>
			</defs>
			<g transform="translate(400 420) scale(0.78) translate(-400 -420)">
			<ellipse cx={400} cy={600} rx={250} ry={34} fill="#5A2216" opacity={0.2} />
			{/* base board (perspective) */}
			<path d="M170 520 L630 520 L680 590 L120 590Z" fill={`url(#${id('wood')})`} />
			<path d="M120 590 L680 590 L680 620 L120 620Z" fill="#9C6436" />
			{[0, 1, 2].map((i) => (
				<path key={i} d={`M${200 + i * 140} 540 q40 10 90 0`} stroke="#A8693A" strokeWidth={4} fill="none" opacity={0.6} />
			))}
			{/* spring bar */}
			<path d="M200 560 C200 380 600 380 600 560" stroke="#9AA4B2" strokeWidth={14} fill="none" />
			<path d="M200 560 C200 380 600 380 600 560" stroke="#fff" strokeWidth={4} fill="none" opacity={0.5} />
			<circle cx={200} cy={560} r={20} fill="#7D8794" />
			<circle cx={600} cy={560} r={20} fill="#7D8794" />
			{/* cheese */}
			<g transform="translate(400 470)">
				<path d="M-110 60 L110 60 L110 0 L-110 -40Z" fill="#F0A93A" />
				<path d="M-110 -40 L110 0 L60 -60 Z" fill={`url(#${id('ch')})`} />
				<path d="M-110 -40 L110 0 L110 60 L-110 60Z" fill={`url(#${id('ch')})`} />
				{[
					[-60, 10, 14],
					[10, 30, 18],
					[70, 14, 10],
					[-20, -14, 8],
				].map(([x, y, r], i) => (
					<circle key={i} cx={x} cy={y} r={r} fill="#E39A2C" />
				))}
			</g>
			</g>
			{/* price tag "0 ₽" */}
			<g transform={`translate(540 270) rotate(${10 + 4 * Math.sin(t * 3)})`}>
				<path d="M-70 -40 L60 -40 L90 0 L60 40 L-70 40Z" fill={P.red} />
				<circle cx={58} cy={0} r={9} fill="#FFF9EE" />
				<text x={-10} y={16} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={46} fill="#fff">
					0 ₽
				</text>
			</g>
			{/* sparkle */}
			<path d="M260 300 l10 26 26 10 -26 10 -10 26 -10 -26 -26 -10 26 -10Z" fill="#fff" opacity={sparkle} />
		</Frame>
	);
};

const Head: React.FC<{
	x: number;
	y: number;
	s?: number;
	skin?: string;
	hair: string;
	kind: 'cap' | 'bun' | 'curls' | 'scarf' | 'bald';
	accent: string;
	mouthOpen?: number;
}> = ({x, y, s = 1, skin = P.skin, hair, kind, accent, mouthOpen = 0}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		{/* body */}
		<path d="M-90 200 C-90 120 -60 90 0 90 C60 90 90 120 90 200Z" fill={accent} />
		<rect x={-18} y={60} width={36} height={40} fill={P.skinShade} />
		{kind === 'bun' && <circle cx={0} cy={-80} r={34} fill={hair} />}
		{kind === 'curls' &&
			[-50, -25, 0, 25, 50].map((cx) => <circle key={cx} cx={cx} cy={-50} r={28} fill={hair} />)}
		<ellipse cx={0} cy={0} rx={62} ry={72} fill={skin} />
		{kind === 'bun' && <path d="M-62 -6 C-64 -70 64 -70 62 -6 C46 -40 -46 -40 -62 -6Z" fill={hair} />}
		{kind === 'curls' && <path d="M-62 -10 C-64 -60 64 -60 62 -10 C40 -30 -40 -30 -62 -10Z" fill={hair} />}
		{kind === 'scarf' && (
			<g>
				<path d="M-74 10 C-80 -90 80 -90 74 10 C60 -30 -60 -30 -74 10Z" fill={accent} />
				<path d="M-40 60 L-70 110 L-30 96Z" fill={accent} />
				<circle cx={-30} cy={-40} r={8} fill="#fff" opacity={0.6} />
				<circle cx={20} cy={-50} r={8} fill="#fff" opacity={0.6} />
			</g>
		)}
		{kind === 'cap' && (
			<g>
				<path d="M-66 -20 C-66 -80 66 -80 66 -20Z" fill="#4A4F5C" />
				<path d="M-66 -20 L86 -20 Q80 -4 40 -6 L-66 -6Z" fill="#3A3E48" />
				<path d="M-40 34 Q0 60 40 34 Q30 66 0 70 Q-30 66 -40 34Z" fill={hair} />
			</g>
		)}
		{kind === 'bald' && <path d="M-62 0 C-70 -20 -60 -40 -50 -30 M62 0 C70 -20 60 -40 50 -30" stroke={hair} strokeWidth={14} strokeLinecap="round" fill="none" />}
		<circle cx={-22} cy={0} r={7} fill={P.ink} />
		<circle cx={22} cy={0} r={7} fill={P.ink} />
		<ellipse cx={-34} cy={22} rx={12} ry={8} fill={P.blush} opacity={0.6} />
		<ellipse cx={34} cy={22} rx={12} ry={8} fill={P.blush} opacity={0.6} />
		{mouthOpen > 0.1 ? (
			<ellipse cx={0} cy={34} rx={14} ry={6 + mouthOpen * 10} fill="#6E2431" />
		) : (
			<path d="M-16 30 Q0 44 16 30" stroke="#B5584B" strokeWidth={6} strokeLinecap="round" fill="none" />
		)}
	</g>
);

const Pie: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 0}) => (
	<g transform={`translate(${x} ${y}) rotate(${r})`}>
		<ellipse cx={0} cy={0} rx={40} ry={24} fill="#D58A36" />
		<ellipse cx={0} cy={-4} rx={36} ry={18} fill="#ECAA55" />
		<path d="M-24 -6 C-8 -14 8 -14 24 -6" stroke="#FCE3A8" strokeWidth={4} strokeLinecap="round" fill="none" />
	</g>
);

/** Queue of pensioner neighbours with pirozhki (Petrovich in a cap, Valentina, choir). */
export const Neighbors: React.FC<InsertProps> = (props) => {
	const id = useSvgId('neigh');
	const t = props.t ?? 0;
	const p = clamp(props.progress);
	const people = [
		{x: 170, y: 430, s: 0.95, hair: '#D9D6DE', kind: 'curls' as const, accent: '#6C5CE7'},
		{x: 320, y: 400, s: 1.05, hair: '#CFCFD6', kind: 'cap' as const, accent: P.tealMid},
		{x: 480, y: 410, s: 1, hair: P.terracotta, kind: 'scarf' as const, accent: P.red},
		{x: 630, y: 440, s: 0.92, hair: '#BDB8C9', kind: 'bun' as const, accent: P.mustardDark},
	];
	return (
		<Frame {...props}>
			<Card id={id} r={350} />
			<clipPath id={id('clip')}>
				<circle cx={400} cy={400} r={350} />
			</clipPath>
			<g clipPath={`url(#${id('clip')})`}>
				{people.map((pp, i) => {
					const local = easeOutBack(clamp(p * 1.8 - i * 0.18));
					const bob = Math.sin(t * 5 + i * 1.3) * 6;
					return (
						<g key={i} transform={`translate(0 ${(1 - local) * 260 + bob})`}>
							<Head {...pp} mouthOpen={Math.max(0, Math.sin(t * 8 + i * 2))} />
							<Pie x={pp.x + 50 * pp.s} y={pp.y + 150 * pp.s} r={-12} />
						</g>
					);
				})}
				{/* choir song notes */}
				{[0, 1, 2].map((i) => (
					<text
						key={i}
						x={250 + i * 160}
						y={200 - ((t * 50 + i * 30) % 70)}
						fontSize={56}
						fill={P.terracotta}
						opacity={0.75}
						fontFamily="DejaVu Sans, Arial"
					>
						♪
					</text>
				))}
			</g>
		</Frame>
	);
};

/** Big glowing power button (no brand). on: 0..1 — transitions grey→green. */
export const OneButton: React.FC<InsertProps & {on?: number}> = (props) => {
	const id = useSvgId('btn');
	const t = props.t ?? 0;
	const on = clamp(props.on ?? 1);
	const pulse = 0.5 + 0.5 * Math.sin(t * 4);
	const col = on > 0.5 ? P.green : '#9AA4B2';
	return (
		<Frame {...props}>
			<defs>
				<radialGradient id={id('glow')} cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor={P.green} stopOpacity={0.6 * on} />
					<stop offset="1" stopColor={P.green} stopOpacity="0" />
				</radialGradient>
				<radialGradient id={id('face')} cx="0.4" cy="0.3" r="0.8">
					<stop offset="0" stopColor="#24505A" />
					<stop offset="1" stopColor="#0F2C33" />
				</radialGradient>
				<filter id={id('sh')} x="-30%" y="-30%" width="160%" height="160%">
					<feDropShadow dx="0" dy="20" stdDeviation="24" floodColor="#0A1A1F" floodOpacity="0.5" />
				</filter>
			</defs>
			<circle cx={400} cy={400} r={360 + pulse * 20} fill={`url(#${id('glow')})`} />
			<circle cx={400} cy={400} r={250} fill={`url(#${id('face')})`} filter={`url(#${id('sh')})`} />
			<circle cx={400} cy={400} r={232} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={10} />
			<circle cx={400} cy={400} r={250} fill="none" stroke={col} strokeWidth={10} strokeOpacity={0.4 + 0.6 * on} />
			<path d="M330 320 A110 110 0 1 0 470 320" stroke={col} strokeWidth={34} strokeLinecap="round" fill="none" />
			<path d="M400 270 L400 400" stroke={col} strokeWidth={34} strokeLinecap="round" />
			<path d="M240 300 Q300 200 420 190" stroke="#fff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.12} />
		</Frame>
	);
};

/** Front door with ringing doorbell waves. */
export const Doorbell: React.FC<InsertProps> = (props) => {
	const id = useSvgId('door');
	const t = props.t ?? 0;
	const ring = (t * 1.6) % 1;
	return (
		<Frame {...props}>
			<Card id={id} />
			<defs>
				<linearGradient id={id('door')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#8E4A2A" />
					<stop offset="1" stopColor="#6E3620" />
				</linearGradient>
			</defs>
			<rect x={210} y={140} width={300} height={500} rx={14} fill="#E9D8BC" />
			<rect x={228} y={156} width={264} height={484} rx={8} fill={`url(#${id('door')})`} />
			{/* quilted door padding */}
			{[...Array(4)].map((_, r) =>
				[...Array(3)].map((__, c) => <circle key={`${r}-${c}`} cx={280 + c * 80} cy={230 + r * 110} r={7} fill={P.mustard} />),
			)}
			<path d="M280 230 L440 560 M440 230 L280 560" stroke="#5A2A18" strokeWidth={3} opacity={0.4} />
			<circle cx={460} cy={410} r={14} fill={P.mustard} />
			<rect x={330} y={190} width={60} height={30} rx={6} fill={P.mustard} />
			<text x={360} y={214} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={22} fill="#5A2A18">
				47
			</text>
			{/* bell */}
			<g transform="translate(570 330)">
				<rect x={-34} y={-46} width={68} height={92} rx={14} fill="#FFFFFF" stroke="#D9C2A0" strokeWidth={5} />
				<circle cx={0} cy={0} r={20} fill={P.red} transform={`scale(${1 - 0.15 * Math.sin(t * 20) ** 2})`} />
				{[0, 1, 2].map((i) => {
					const k = (ring + i / 3) % 1;
					return (
						<path
							key={i}
							d={`M${50 + k * 90} ${-50 - k * 40} Q${80 + k * 110} 0 ${50 + k * 90} ${50 + k * 40}`}
							stroke={P.terracotta}
							strokeWidth={12}
							strokeLinecap="round"
							fill="none"
							opacity={1 - k}
						/>
					);
				})}
			</g>
			<text x={590} y={200} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={60} fill={P.terracotta} transform={`rotate(-10 590 200)`}>
				ДЗЫНЬ!
			</text>
		</Frame>
	);
};
