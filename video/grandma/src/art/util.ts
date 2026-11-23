import {useId} from 'react';

/** Stable, url()-safe id prefix for SVG defs (React useId contains colons). */
export const useSvgId = (name: string) => {
	const raw = useId();
	const base = raw.replace(/[^a-zA-Z0-9_-]/g, '');
	return (part: string) => `${name}-${base}-${part}`;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** easeOutBack — springy pop for inserts. */
export const easeOutBack = (t: number) => {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	const x = clamp(t);
	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/** Shared warm-evening palette. */
export const P = {
	peach: '#F6B48F',
	peachLight: '#FAD2B4',
	terracotta: '#C8643B',
	terracottaDark: '#9E4426',
	mustard: '#E2A93B',
	mustardDark: '#B9812A',
	teal: '#1E4A52',
	tealDeep: '#12323A',
	tealMid: '#2D6670',
	cream: '#FBF1DF',
	creamDark: '#EAD8BA',
	skin: '#F2C3A0',
	skinShade: '#DDA07E',
	skinDeep: '#C9876A',
	blush: '#EE8C7A',
	hair: '#E9E6EE',
	hairShade: '#BDB8C9',
	ink: '#3A2A2E',
	lampGlow: '#FFD98A',
	red: '#E5483A',
	green: '#38C98A',
};
