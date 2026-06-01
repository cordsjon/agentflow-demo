import React from 'react';
import { Composition } from 'remotion';
import { AgentflowShowcase } from './AgentflowShowcase';
import { TOTAL_FRAMES, FPS } from './lib/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AgentflowShowcase"
      component={AgentflowShowcase}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
