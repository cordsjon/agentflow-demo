// src/AgentflowShowcase.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import { InboxScene }          from './scenes/01-Inbox';
import { TriageScene }         from './scenes/02-Triage';
import { BusinessPanelScene }  from './scenes/03-BusinessPanel';
import { BrainstormScene }     from './scenes/04-Brainstorm';
import { SpecPanelScene }      from './scenes/05-SpecPanel';
import { TDDScene }            from './scenes/06-TDD';
import { VerifyScene }         from './scenes/07-Verify';
import { ShippedScene }        from './scenes/08-Shipped';
import { AutopilotScene }      from './scenes/09-Autopilot';
import { KnownPatternsScene }  from './scenes/10-KnownPatterns';
import { SCENES, TRANSITION_FRAMES } from './lib/timing';
import { THEME as T } from './lib/theme';

// Each scene and its durationFrames
const SEQUENCE = [
  { component: InboxScene,         dur: SCENES.INBOX.durationFrames },
  { component: TriageScene,        dur: SCENES.TRIAGE.durationFrames },
  { component: BusinessPanelScene, dur: SCENES.BUSINESS_PANEL.durationFrames },
  { component: BrainstormScene,    dur: SCENES.BRAINSTORM.durationFrames },
  { component: SpecPanelScene,     dur: SCENES.SPEC_PANEL.durationFrames },
  { component: TDDScene,           dur: SCENES.TDD.durationFrames },
  { component: VerifyScene,        dur: SCENES.VERIFY.durationFrames },
  { component: ShippedScene,       dur: SCENES.SHIPPED.durationFrames },
  { component: AutopilotScene,     dur: SCENES.AUTOPILOT.durationFrames },
  { component: KnownPatternsScene, dur: SCENES.KNOWN_PATTERNS.durationFrames },
];

export const AgentflowShowcase: React.FC = () => (
  <AbsoluteFill style={{ background: T.bg }}>
    <TransitionSeries>
      {SEQUENCE.map(({ component: Scene, dur }, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={dur}>
            <Scene />
          </TransitionSeries.Sequence>
          {i < SEQUENCE.length - 1 && (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);
