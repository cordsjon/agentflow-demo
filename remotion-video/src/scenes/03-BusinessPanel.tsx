// src/scenes/03-BusinessPanel.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { ScoreBar } from '../components/ScoreBar';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.BUSINESS_PANEL.durationFrames;

const Panel: React.FC<{
  title: string;
  children: React.ReactNode;
  enterFrame: number;
  accentColor: string;
}> = ({ title, children, enterFrame, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - enterFrame, fps, config: { stiffness: 70, damping: 16 } });
  const y = (1 - progress) * 40;

  return (
    <div
      style={{
        fontFamily,
        background: '#0e0e1a',
        border: `1.5px solid ${accentColor}44`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 14,
        padding: '22px 24px',
        width: 320,
        transform: `translateY(${y}px)`,
        opacity: progress,
      }}
    >
      <div style={{ fontSize: 12, color: accentColor, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
};

export const BusinessPanelScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Must Have badge appears at frame 120
  const badgeOpacity = interpolate(frame, [120, 135], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeScale = interpolate(frame, [120, 135], [0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#100818" to="#08080f" angle={150} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Command label */}
        <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: THEME.stageColors.biz, letterSpacing: 3 }}>
          /sh:business-panel
        </div>

        {/* Three panels */}
        <div style={{ display: 'flex', gap: 20 }}>
          <Panel title="Impact" enterFrame={20} accentColor="#9060d0">
            <ScoreBar label="User Impact" value={8.5} startFrame={35} color="#9060d0" />
            <ScoreBar label="Technical Risk" value={9.0} startFrame={50} color="#c060a0" />
          </Panel>

          <Panel title="Risk" enterFrame={45} accentColor="#c060a0">
            <ScoreBar label="Severity" value={9.2} startFrame={60} color="#c060a0" />
            <ScoreBar label="Likelihood" value={7.5} startFrame={75} color="#a060c0" />
          </Panel>

          <Panel title="MoSCoW" enterFrame={70} accentColor={THEME.stageColors.biz}>
            <ScoreBar label="Priority" value={10} startFrame={85} color={THEME.stageColors.biz} />
            <div style={{ fontFamily, fontSize: 13, color: '#888', marginTop: 8 }}>
              Classification: Must Have
            </div>
          </Panel>
        </div>

        {/* Must Have badge */}
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            background: `${THEME.stageColors.biz}22`,
            border: `2px solid ${THEME.stageColors.biz}`,
            color: '#e0b0ff',
            fontFamily: THEME.fontMono,
            fontSize: 20,
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: 40,
            letterSpacing: 2,
          }}
        >
          ✓ MUST HAVE — P1
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.BUSINESS_PANEL.label}
        tagline="Silent failures are never low priority."
        accentColor={THEME.stageColors.biz}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
