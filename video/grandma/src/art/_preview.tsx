// Temporary preview entry for the art kit — NOT part of the main video.
// Render: npx remotion still src/art/_preview.tsx <Id> preview/<file>.png --browser-executable=...
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Kitchen, KitchenTable, Grandma, FiveApps, HotPhone, CheeseTrap, Neighbors, OneButton, Doorbell, MoneyCard, Zina, PieSticker} from './index';
import {loadFont} from '@remotion/google-fonts/Montserrat';
loadFont('normal', {weights: ['900'], subsets: ['cyrillic', 'latin']});
import type {Emotion} from './index';

/** Recommended grandma placement in a 1080×1920 frame. */
export const GRANDMA_PLACEMENT = {left: 22, top: 230, scale: 1.15};

const Scene: React.FC<{phoneUp?: boolean; emotion?: Emotion; mouth?: number; wink?: number}> = ({phoneUp = false, emotion = 'sly', mouth = 0.4, wink = 0}) => (
	<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0, top: 0}}>
			<Kitchen parallax={0} />
		</div>
		<div
			style={{
				position: 'absolute',
				left: GRANDMA_PLACEMENT.left,
				top: GRANDMA_PLACEMENT.top,
				transform: `scale(${GRANDMA_PLACEMENT.scale})`,
				transformOrigin: '0 0',
			}}
		>
			<Grandma emotion={emotion} mouth={mouth} phoneUp={phoneUp} breathe={0.5} screenGlow={0.8} wink={wink} />
		</div>
		<div style={{position: 'absolute', left: 0, top: 0}}>
			<KitchenTable parallax={0} />
		</div>
	</AbsoluteFill>
);

const Emotions: React.FC = () => {
	const list: Emotion[] = ['sly', 'surprised', 'serious', 'proud', 'happy'];
	return (
		<AbsoluteFill style={{background: '#F2BC93', flexDirection: 'row', alignItems: 'flex-start'}}>
			{list.map((e, i) => (
				<div key={e} style={{width: 540, height: 760, overflow: 'hidden', position: 'relative'}}>
					<div style={{position: 'absolute', left: -90, top: -60, transform: 'scale(0.8)', transformOrigin: '0 0'}}>
						<Grandma emotion={e} mouth={i % 2 ? 0.6 : 0} phoneUp={i === 3} breathe={0.5} />
					</div>
					<div style={{position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', font: '700 40px Inter', color: '#3A2A2E'}}>
						{e}
					</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

const Inserts: React.FC = () => {
	const items = [FiveApps, HotPhone, CheeseTrap, Neighbors, OneButton, Doorbell];
	return (
		<AbsoluteFill style={{background: '#E7A47E', flexDirection: 'row', flexWrap: 'wrap'}}>
			{items.map((C, i) => (
				<div key={i} style={{width: 600, height: 600}}>
					<C progress={1} t={0.3} size={600} />
				</div>
			))}
		</AbsoluteFill>
	);
};

const Inserts2: React.FC = () => (
	<AbsoluteFill style={{background: '#E7A47E', flexDirection: 'row', flexWrap: 'wrap'}}>
		<div style={{width: 600, height: 600}}><MoneyCard progress={1} t={0.4} size={600} /></div>
		<div style={{width: 600, height: 600}}><Zina progress={1} t={0.2} size={600} /></div>
		<div style={{width: 600, height: 600}}><Neighbors progress={1} t={0.9} size={600} /></div>
		<div style={{width: 900, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><PieSticker progress={1} t={0} size={760} /></div>
		<div style={{width: 900, height: 600}}><Doorbell progress={1} t={0.3} size={600} open={0.5} /></div>
	</AbsoluteFill>
);

const DoorOpen: React.FC = () => (
	<AbsoluteFill style={{background: '#E7A47E', flexDirection: 'row'}}>
		{[0, 0.5, 1].map((o) => (
			<div key={o} style={{width: 600, height: 600}}><Doorbell progress={1} t={0.3} size={600} open={o} /></div>
		))}
	</AbsoluteFill>
);

const Root: React.FC = () => (
	<>
		<Composition id="GrandmaWink" component={() => <Scene emotion="sly" mouth={0} wink={1} />} width={1080} height={1920} fps={30} durationInFrames={1} />
		<Composition id="Inserts2" component={Inserts2} width={1800} height={1200} fps={30} durationInFrames={1} />
		<Composition id="DoorOpen" component={DoorOpen} width={1800} height={600} fps={30} durationInFrames={1} />
		<Composition id="Scene" component={Scene} width={1080} height={1920} fps={30} durationInFrames={1} />
		<Composition id="ScenePhoneUp" component={() => <Scene phoneUp emotion="proud" mouth={0} />} width={1080} height={1920} fps={30} durationInFrames={1} />
		<Composition id="KitchenOnly" component={() => <AbsoluteFill><Kitchen /><div style={{position: 'absolute', inset: 0}}><KitchenTable /></div></AbsoluteFill>} width={1080} height={1920} fps={30} durationInFrames={1} />
		<Composition id="Emotions" component={Emotions} width={2700} height={760} fps={30} durationInFrames={1} />
		<Composition id="Inserts" component={Inserts} width={1800} height={1200} fps={30} durationInFrames={1} />
	</>
);

registerRoot(Root);
