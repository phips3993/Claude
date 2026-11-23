import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { TL } from './timeline';

export const Root: React.FC = () => (
  <Composition id="Grandma" component={Main} durationInFrames={TL.total} fps={TL.fps} width={1080} height={1920} />
);
