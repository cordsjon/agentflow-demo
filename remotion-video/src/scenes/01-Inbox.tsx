// src/scenes/01-Inbox.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const DUR = SCENES.INBOX.durationFrames;

export const InboxScene: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    <GradientScene from="#08080f" to="#0e0e20" angle={160} />

    {/* Raw bug note — starts typing at frame 20 */}
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: '0 140px',
      }}
    >
      <TerminalLine
        text="$ INBOX.md"
        startFrame={10}
        color="#555577"
        fontSize={18}
      />
      <TerminalLine
        text='- "The health endpoint returns 200 even when the DB file is missing — should return 503"'
        startFrame={25}
        color="#e8e8f8"
        fontSize={26}
        showCursor
      />
    </AbsoluteFill>

    {/* Title card fades in at frame 40 */}
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <TitleCard
        stage={SCENES.INBOX.label}
        tagline="Every bug starts as a note."
        accentColor={THEME.stageColors.inbox}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);
