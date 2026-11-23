import React from 'react';
import {P, useSvgId} from './util';

/**
 * Back layer of the kitchen: wall, window with city lights + tulle, lamp,
 * fridge, tiles, wall carpet hint. Grandma is drawn on top of this, then
 * <KitchenTable/> on top of her.
 *
 * Canvas is 1080×1920 with ~120px bleed on every side for camera moves.
 * parallax: −1..1 — far layers (city) move most, wall a bit.
 */
export type KitchenProps = {parallax?: number; style?: React.CSSProperties};

const W = 1080;
const H = 1920;
const B = 140; // bleed

const CityLights: React.FC<{id: (s: string) => string}> = ({id}) => {
	// deterministic pseudo-random windows
	const wins: React.ReactNode[] = [];
	const buildings = [
		{x: -20, w: 120, h: 330},
		{x: 95, w: 90, h: 420},
		{x: 180, w: 140, h: 300},
		{x: 315, w: 100, h: 460},
		{x: 410, w: 150, h: 350},
	];
	let seed = 7;
	const rnd = () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
	buildings.forEach((b, i) => {
		const top = 760 - b.h;
		wins.push(
			<rect key={`b${i}`} x={b.x} y={top} width={b.w} height={b.h + 40} fill={i % 2 ? '#1B3A48' : '#163240'} />,
		);
		for (let yy = top + 22; yy < 740; yy += 34) {
			for (let xx = b.x + 14; xx < b.x + b.w - 16; xx += 26) {
				if (rnd() > 0.55) {
					const warm = rnd() > 0.25;
					wins.push(
						<rect
							key={`w${i}-${xx}-${yy}`}
							x={xx}
							y={yy}
							width={13}
							height={17}
							rx={2}
							fill={warm ? '#FFC96B' : '#9FD6E8'}
							opacity={0.55 + rnd() * 0.45}
						/>,
					);
				}
			}
		}
	});
	return (
		<g>
			<rect x={-60} y={150} width={700} height={700} fill={`url(#${id('sky')})`} />
			<circle cx={430} cy={330} r={34} fill="#FFF3D1" opacity={0.95} />
			<circle cx={430} cy={330} r={70} fill="#FFF3D1" opacity={0.12} />
			{[...Array(18)].map((_, i) => (
				<circle key={i} cx={30 + ((i * 97) % 520)} cy={210 + ((i * 53) % 220)} r={i % 3 ? 1.6 : 2.4} fill="#fff" opacity={0.6} />
			))}
			{wins}
		</g>
	);
};

export const Kitchen: React.FC<KitchenProps> = ({parallax = 0, style}) => {
	const id = useSvgId('kitchen');
	const far = parallax * 36;
	const mid = parallax * 14;
	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			width={W}
			height={H}
			style={{overflow: 'visible', ...style}}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#E0875F" />
					<stop offset="0.55" stopColor="#EFAA7E" />
					<stop offset="1" stopColor="#DE8B63" />
				</linearGradient>
				<radialGradient id={id('lamp')} cx="0.62" cy="0.22" r="0.75">
					<stop offset="0" stopColor="#FFE7A8" stopOpacity="0.38" />
					<stop offset="0.3" stopColor="#FFC98A" stopOpacity="0.12" />
					<stop offset="1" stopColor="#8E3F2A" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={id('vignette')} cx="0.5" cy="0.45" r="0.8">
					<stop offset="0.5" stopColor="#000" stopOpacity="0" />
					<stop offset="1" stopColor="#2A1210" stopOpacity="0.72" />
				</radialGradient>
				<linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#0E2533" />
					<stop offset="0.7" stopColor="#24465A" />
					<stop offset="1" stopColor="#3E5D6B" />
				</linearGradient>
				<linearGradient id={id('fridge')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#FFF8EC" />
					<stop offset="0.7" stopColor="#F1E4CE" />
					<stop offset="1" stopColor="#D9C6A6" />
				</linearGradient>
				<pattern id={id('tiles')} width="120" height="60" patternUnits="userSpaceOnUse">
					<rect width="120" height="60" fill="#F7EBD6" />
					<rect x="3" y="3" width="114" height="26" rx="9" fill="#FFF7EA" />
					<rect x="3" y="3" width="114" height="8" rx="6" fill="#fff" opacity="0.7" />
					<rect x="-57" y="33" width="114" height="26" rx="9" fill="#FFF7EA" />
					<rect x="63" y="33" width="114" height="26" rx="9" fill="#FFF7EA" />
				</pattern>
				<pattern id={id('carpet')} width="70" height="70" patternUnits="userSpaceOnUse">
					<rect width="70" height="70" fill="#9E3226" />
					<path d="M35 6 L64 35 L35 64 L6 35Z" fill="#C2533A" />
					<path d="M35 18 L52 35 L35 52 L18 35Z" fill="#E2A93B" />
					<circle cx="35" cy="35" r="6" fill="#1E4A52" />
				</pattern>
				<linearGradient id={id('tulle')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#FFF6E8" stopOpacity="0.4" />
					<stop offset="1" stopColor="#FFF6E8" stopOpacity="0.14" />
				</linearGradient>
			</defs>

			{/* wall */}
			<rect x={-B} y={-B} width={W + 2 * B} height={H + 2 * B} fill={`url(#${id('wall')})`} />
			{/* subtle wall paper stripes */}
			<g opacity={0.07} transform={`translate(${mid} 0)`}>
				{[...Array(16)].map((_, i) => (
					<rect key={i} x={-B + i * 90} y={-B} width={34} height={1150} fill="#7A2E1A" />
				))}
			</g>

			{/* window (far) */}
			<g transform={`translate(${mid} 0)`}>
				<rect x={60} y={170} width={500} height={700} rx={18} fill="#F7EEDD" />
				<g clipPath={`url(#${id('winclip')})`}>
					<clipPath id={id('winclip')}>
						<rect x={84} y={194} width={452} height={652} rx={8} />
					</clipPath>
					<g transform={`translate(${far + 70} 40)`}>
						<CityLights id={id} />
					</g>
					{/* glass sheen */}
					<path d="M84 194 L250 194 L84 520Z" fill="#fff" opacity={0.08} />
				</g>
				{/* frame cross */}
				<rect x={304} y={194} width={14} height={652} fill="#F7EEDD" />
				<rect x={84} y={440} width={452} height={14} fill="#F7EEDD" />
				{/* sill + plant */}
				<rect x={36} y={862} width={548} height={30} rx={10} fill="#FFF7EA" />
				<rect x={36} y={884} width={548} height={10} fill="#D7B892" opacity={0.6} />
				<path d="M450 862 L470 800 L520 800 L540 862Z" fill={P.terracotta} />
				<path d="M495 800 C470 740 430 730 420 700 C460 705 490 740 497 790 C500 730 530 700 560 690 C545 735 520 760 505 800Z" fill="#4E8A5C" />
				<path d="M497 800 C505 760 470 735 455 735" stroke="#3B6E48" strokeWidth={4} fill="none" />
				{/* tulle */}
				<path
					d="M60 150 C120 170 180 160 230 170 C230 400 200 650 190 890 L60 890Z"
					fill={`url(#${id('tulle')})`}
				/>
				<path
					d="M560 150 C500 170 450 160 410 172 C420 400 440 650 452 890 L560 890Z"
					fill={`url(#${id('tulle')})`}
				/>
				{[110, 150, 190].map((x) => (
					<path key={x} d={`M${x} 170 C${x - 6} 450 ${x + 8} 700 ${x - 4} 885`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />
				))}
				{[470, 510].map((x) => (
					<path key={x} d={`M${x} 170 C${x + 6} 450 ${x - 8} 700 ${x + 4} 885`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />
				))}
				<rect x={40} y={140} width={540} height={14} rx={7} fill={P.mustardDark} />
			</g>

			{/* wall carpet hint (right top, behind lamp) */}
			<g transform={`translate(${mid * 0.8} 0)`}>
				<rect x={640} y={150} width={520} height={420} rx={10} fill={`url(#${id('carpet')})`} />
				<rect x={640} y={150} width={520} height={420} rx={10} fill="none" stroke="#E2A93B" strokeWidth={14} />
				<rect x={640} y={150} width={520} height={420} rx={10} fill="#2A1210" opacity={0.18} />
				{[...Array(14)].map((_, i) => (
					<rect key={i} x={652 + i * 37} y={566} width={6} height={22} rx={3} fill="#E2A93B" />
				))}
			</g>

			{/* tiles backsplash */}
			<rect x={-B} y={930} width={W + 2 * B} height={460} fill={`url(#${id('tiles')})`} />
			<rect x={-B} y={930} width={W + 2 * B} height={16} fill="#E7D3B2" />
			<rect x={-B} y={946} width={W + 2 * B} height={40} fill="#C98F6B" opacity={0.18} />

			{/* fridge (right, mid) */}
			<g transform={`translate(${mid * 0.6} 0)`}>
				<rect x={800} y={640} width={360} height={900} rx={46} fill={`url(#${id('fridge')})`} />
				<rect x={800} y={640} width={360} height={900} rx={46} fill="none" stroke="#CDB894" strokeWidth={4} />
				<rect x={812} y={960} width={340} height={6} fill="#D6C3A2" />
				<rect x={830} y={720} width={14} height={180} rx={7} fill="#C8B796" />
				<rect x={830} y={1000} width={14} height={180} rx={7} fill="#C8B796" />
				{/* magnets */}
				<circle cx={930} cy={740} r={22} fill={P.red} />
				<rect x={975} y={760} width={70} height={48} rx={8} fill={P.mustard} transform="rotate(-8 1010 784)" />
				<rect x={900} y={820} width={110} height={78} rx={6} fill="#fff" transform="rotate(5 955 860)" />
				<path d="M918 868 L940 840 L960 860 L985 830 L1000 868Z" fill="#7CC3A1" transform="rotate(5 955 860)" />
				<circle cx={1000} cy={820} r={10} fill={P.tealMid} />
				<path d="M1050 700 l14 26 h-28z" fill="#4E8A5C" />
			</g>

			{/* lamp light pool */}
			<rect x={-B} y={-B} width={W + 2 * B} height={H + 2 * B} fill={`url(#${id('lamp')})`} />

			{/* hanging lamp shade */}
			<g transform={`translate(${mid * 0.4} 0)`}>
				<rect x={668} y={-B} width={6} height={B + 92} fill="#5A2E22" />
				<path d="M560 230 C580 140 760 140 780 230Z" fill={P.terracotta} />
				<path d="M560 230 C580 140 670 140 670 230Z" fill="#D8784C" />
				<path d="M548 230 L792 230 L780 248 L560 248Z" fill={P.mustard} />
				{[...Array(12)].map((_, i) => (
					<rect key={i} x={556 + i * 20} y={248} width={8} height={16} rx={4} fill={P.mustard} />
				))}
				<ellipse cx={670} cy={262} rx={60} ry={14} fill="#FFF2C4" opacity={0.95} />
				<ellipse cx={670} cy={262} rx={190} ry={60} fill="#FFE7A8" opacity={0.1} />
			</g>

			<rect x={-B} y={-B} width={W + 2 * B} height={H + 2 * B} fill={`url(#${id('vignette')})`} />
		</svg>
	);
};

/**
 * Foreground table (drawn OVER grandma). Table top edge at y≈1380.
 * Contains oilcloth, teapot, cup and a bowl of pirozhki.
 */
export const KitchenTable: React.FC<KitchenProps> = ({parallax = 0, style}) => {
	const id = useSvgId('table');
	const near = -parallax * 10;
	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			width={W}
			height={H}
			style={{overflow: 'visible', ...style}}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id={id('cloth')} width="80" height="80" patternUnits="userSpaceOnUse">
					<rect width="80" height="80" fill="#FBF1DF" />
					<rect width="40" height="40" fill="#E3826A" opacity="0.55" />
					<rect x="40" y="40" width="40" height="40" fill="#E3826A" opacity="0.55" />
					<rect width="80" height="40" fill="#E3826A" opacity="0.18" />
					<circle cx="20" cy="20" r="5" fill="#fff" opacity="0.6" />
					<circle cx="60" cy="60" r="5" fill="#fff" opacity="0.6" />
				</pattern>
				<linearGradient id={id('top')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#fff" stopOpacity="0.25" />
					<stop offset="1" stopColor="#5A2216" stopOpacity="0.22" />
				</linearGradient>
				<linearGradient id={id('teapot')} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#3F8A93" />
					<stop offset="1" stopColor="#1E4A52" />
				</linearGradient>
				<radialGradient id={id('pie')} cx="0.4" cy="0.3" r="0.8">
					<stop offset="0" stopColor="#F4C26B" />
					<stop offset="0.7" stopColor="#D58A36" />
					<stop offset="1" stopColor="#A9601F" />
				</radialGradient>
				<filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="12" />
				</filter>
			</defs>
			<g transform={`translate(${near} 0)`}>
				{/* table shadow on grandma */}
				<rect x={-B} y={1350} width={W + 2 * B} height={60} fill="#2A1210" opacity={0.25} filter={`url(#${id('soft')})`} />
				{/* table top in perspective */}
				<path d={`M${-B} 1380 L${W + B} 1380 L${W + B} ${H + B} L${-B} ${H + B}Z`} fill={`url(#${id('cloth')})`} />
				<path d={`M${-B} 1380 L${W + B} 1380 L${W + B} ${H + B} L${-B} ${H + B}Z`} fill={`url(#${id('top')})`} />
				<rect x={-B} y={1376} width={W + 2 * B} height={8} fill="#fff" opacity={0.5} />

				{/* teapot (right) */}
				<g transform="translate(820 1250)">
					<ellipse cx={20} cy={200} rx={170} ry={28} fill="#5A2216" opacity={0.22} />
					<path d="M-110 120 C-170 90 -190 40 -170 20 C-150 40 -130 80 -95 95Z" fill="#2D6670" />
					<path d="M130 70 C210 60 210 170 120 170" stroke="#2D6670" strokeWidth={22} fill="none" />
					<path d="M-110 60 C-110 -30 130 -30 130 60 C140 150 100 200 10 200 C-80 200 -120 150 -110 60Z" fill={`url(#${id('teapot')})`} />
					<ellipse cx={10} cy={-8} rx={78} ry={18} fill="#2D6670" />
					<circle cx={10} cy={-30} r={18} fill={P.mustard} />
					{/* folk flower */}
					<circle cx={10} cy={95} r={36} fill={P.red} />
					<circle cx={10} cy={95} r={16} fill={P.mustard} />
					{[0, 72, 144, 216, 288].map((a) => (
						<ellipse key={a} cx={10} cy={45} rx={10} ry={16} fill="#FBF1DF" transform={`rotate(${a} 10 95)`} />
					))}
					<path d="M-60 30 C-40 0 0 -6 20 0" stroke="#fff" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" fill="none" />
					{/* steam */}
					<path d="M-185 0 C-215 -40 -165 -70 -195 -120" stroke="#fff" strokeOpacity={0.45} strokeWidth={8} strokeLinecap="round" fill="none" />
				</g>

				{/* bowl with pirozhki (left) */}
				<g transform="translate(200 1480)">
					<ellipse cx={0} cy={110} rx={210} ry={34} fill="#5A2216" opacity={0.22} />
					{[
						[-110, 10, -14],
						[-30, -10, 8],
						[60, 5, -6],
						[-70, -55, 12],
						[20, -60, -10],
						[110, -35, 18],
					].map(([x, y, r], i) => (
						<g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
							<ellipse cx={0} cy={0} rx={62} ry={36} fill={`url(#${id('pie')})`} />
							<path d="M-40 -6 C-15 -18 15 -18 40 -6" stroke="#FCE3A8" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8} />
							<ellipse cx={-14} cy={-16} rx={18} ry={6} fill="#fff" opacity={0.25} />
						</g>
					))}
					<path d="M-200 20 C-190 110 190 110 200 20Z" fill="#FBF1DF" />
					<path d="M-200 20 C-190 110 190 110 200 20Z" fill="none" stroke="#E2A93B" strokeWidth={6} />
					<path d="M-170 50 C-120 80 120 80 170 50" stroke={P.terracotta} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" fill="none" />
					<ellipse cx={0} cy={20} rx={200} ry={20} fill="none" stroke="#fff" strokeWidth={6} />
				</g>

				{/* cup in front center-left */}
				<g transform="translate(470 1640)">
					<ellipse cx={0} cy={80} rx={110} ry={20} fill="#5A2216" opacity={0.2} />
					<ellipse cx={0} cy={70} rx={95} ry={16} fill="#FBF1DF" />
					<path d="M60 0 C110 0 110 60 55 60" stroke="#FBF1DF" strokeWidth={14} fill="none" />
					<path d="M-60 -10 L60 -10 L50 60 C30 72 -30 72 -50 60Z" fill="#FBF1DF" />
					<ellipse cx={0} cy={-10} rx={60} ry={13} fill="#7A3A1E" />
					<path d="M-55 15 L55 15" stroke={P.terracotta} strokeWidth={8} />
				</g>
			</g>
		</svg>
	);
};
