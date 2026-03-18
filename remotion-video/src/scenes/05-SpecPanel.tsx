// src/scenes/05-SpecPanel.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { ScoreBar } from '../components/ScoreBar';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.SPEC_PANEL.durationFrames;

const CRITERIA = [
  { label: 'Completeness', value: 8.5, startFrame: 25 },
  { label: 'Clarity', value: 8.0, startFrame: 45 },
  { label: 'Testability', value: 9.0, startFrame: 65 },
  { label: 'Feasibility', value: 8.0, startFrame: 85 },
  { label: 'Scope Discipline', value: 7.5, startFrame: 105 },
];

export const SpecPanelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const aggregate = interpolate(frame, [115, 145], [0, 8.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const readyProgress = spring({ frame: frame - 150, fps, config: { stiffness: 100, damping: 14 } });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#100820" to="#08080f" angle={155} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '0 200px',
        }}
      >
        <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: THEME.stageColors.spec, letterSpacing: 3, marginBottom: 32 }}>
          /sh:spec-panel — DOR GATE
        </div>

        <div style={{ width: '100%' }}>
          {CRITERIA.map((c) => (
            <ScoreBar key={c.label} label={c.label} value={c.value} startFrame={c.startFrame} color={THEME.stageColors.spec} />
          ))}
        </div>

        {/* Aggregate */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 24 }}>
          <div style={{ fontFamily, fontSize: 16, color: THEME.muted }}>Aggregate score:</div>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 48, fontWeight: 800, color: THEME.stageColors.spec }}>
            {aggregate.toFixed(1)}
          </div>
          <div style={{ fontFamily, fontSize: 16, color: '#555' }}>/ 10</div>
        </div>

        {/* → Ready badge */}
        <div
          style={{
            marginTop: 20,
            opacity: readyProgress,
            transform: `scale(${0.8 + readyProgress * 0.2})`,
            background: '#1a3a1a',
            border: `2px solid #4ade80`,
            color: '#4ade80',
            fontFamily: THEME.fontMono,
            fontSize: 18,
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: 40,
            letterSpacing: 3,
          }}
        >
          ✓ GATE PASSED → READY
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.SPEC_PANEL.label}
        tagline="Quality is a gate, not a hope."
        accentColor={THEME.stageColors.spec}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
