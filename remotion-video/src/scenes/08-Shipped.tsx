// src/scenes/08-Shipped.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.SHIPPED.durationFrames;

export const ShippedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame: frame - 120, fps, config: { stiffness: 200, damping: 12 } });
  const doneOpacity = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#081808" to="#08080f" angle={140} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '0 120px',
        }}
      >
        {/* Git commit */}
        <TerminalLine text="$ git commit -m 'fix: health returns 503 on DB failure (US-DM-05)'" startFrame={10} color="#aaaacc" fontSize={18} />
        <TerminalLine text="[main a3f7c21] fix: health returns 503 on DB failure (US-DM-05)" startFrame={55} color="#4ade80" fontSize={17} />

        {/* DONE-Today entry */}
        <div style={{ opacity: doneOpacity, width: '100%' }}>
          <div
            style={{
              fontFamily,
              background: '#0e1a0e',
              border: `1.5px solid ${THEME.stageColors.shipped}44`,
              borderLeft: `4px solid ${THEME.stageColors.shipped}`,
              borderRadius: 10,
              padding: '16px 20px',
            }}
          >
            <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: THEME.stageColors.shipped, marginBottom: 6 }}>
              DONE-Today · 2026-03-18 14:22
            </div>
            <div style={{ fontSize: 18, color: THEME.white, fontWeight: 600 }}>
              ✓ US-DM-05: Health endpoint resilience
            </div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
              503 on DB failure. Silent bug — closed.
            </div>
          </div>
        </div>

        {/* Big ✓ closes the original note */}
        <div
          style={{
            transform: `scale(${checkScale})`,
            fontSize: 80,
            color: '#4ade80',
            lineHeight: 1,
          }}
        >
          ✓
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.SHIPPED.label}
        tagline="503. Bug closed. System honest."
        accentColor={THEME.stageColors.shipped}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
