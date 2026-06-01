// src/scenes/02-Triage.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { KanbanCard } from '../components/KanbanCard';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const DUR = SCENES.TRIAGE.durationFrames;

export const TriageScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Agent command appears first
  // Card slides in after command
  const tagOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#0a0a18" to="#0e0e22" angle={140} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Agent command */}
        <TerminalLine
          text="/sh:triage"
          startFrame={10}
          color={THEME.accent}
          fontSize={32}
        />
        <TerminalLine
          text="→ Classified: Bug · Moving to BACKLOG / Ideation"
          startFrame={35}
          color="#aaaacc"
          fontSize={20}
        />

        {/* Kanban card slides in */}
        <div style={{ opacity: tagOpacity }}>
          <KanbanCard
            title="Health endpoint returns 200 when DB missing"
            tag="BUG"
            tagColor={THEME.stageColors.triage}
            delayFrames={45}
          />
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.TRIAGE.label}
        tagline="Classify. Prioritise. Route."
        accentColor={THEME.stageColors.triage}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
