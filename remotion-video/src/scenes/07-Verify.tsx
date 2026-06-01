// src/scenes/07-Verify.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.VERIFY.durationFrames;

const DOD_ITEMS = [
  'Tests passing (3/3)',
  'TypeScript clean (0 errors)',
  'No regressions in test suite',
  'Code reviewed — 0 blockers',
  'DONE-Today entry drafted',
];

export const VerifyScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#100a00" to="#08080f" angle={145} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          padding: '60px 80px 80px',
          gap: 60,
        }}
      >
        {/* Left — terminal output */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: THEME.stageColors.verify, letterSpacing: 2, marginBottom: 16 }}>
            /sh:verify
          </div>
          <TerminalLine text="$ pytest tests/ -v" startFrame={10} color="#888" fontSize={15} />
          <TerminalLine text="test_health_ok PASSED" startFrame={25} color="#4ade80" fontSize={15} />
          <TerminalLine text="test_health_db_missing_returns_503 PASSED" startFrame={38} color="#4ade80" fontSize={15} />
          <TerminalLine text="test_health_includes_version PASSED" startFrame={51} color="#4ade80" fontSize={15} />
          <TerminalLine text="3 passed in 0.14s" startFrame={65} color="#6ee7b7" fontSize={15} />
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: '#6060a0', letterSpacing: 2, marginBottom: 12 }}>
              /sh:review
            </div>
            <TerminalLine text="0 blockers · 0 warnings · ship it" startFrame={90} color="#a0a0cc" fontSize={15} />
          </div>
        </div>

        {/* Right — DOD checklist */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: THEME.stageColors.verify, letterSpacing: 2, marginBottom: 16 }}>
            DOD GATE
          </div>
          {DOD_ITEMS.map((item, i) => {
            const tickFrame = 70 + i * 15;
            const opacity = interpolate(frame, [tickFrame, tickFrame + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={item}
                style={{
                  fontFamily,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 14,
                  opacity,
                }}
              >
                <div style={{ fontSize: 18, color: '#4ade80' }}>✓</div>
                <div style={{ fontSize: 17, color: '#ccccdd' }}>{item}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.VERIFY.label}
        tagline="Done means proven, not assumed."
        accentColor={THEME.stageColors.verify}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
