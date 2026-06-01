// src/scenes/04-Brainstorm.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.BRAINSTORM.durationFrames;

const AC_LINES = [
  'AC1: GET /api/health returns 503 when DB is unreachable',
  'AC2: Response body: {"status":"degraded","error":"..."}',
  'AC3: Returns 200 {"status":"ok"} when DB is reachable',
];

export const BrainstormScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Option B gets selected at frame 60
  const optionAOpacity = interpolate(frame, [60, 75], [1, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const optionBScale = spring({ frame: frame - 65, fps, config: { stiffness: 120, damping: 12 } });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#080a18" to="#08080f" angle={145} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '0 100px',
        }}
      >
        {/* Commands */}
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: THEME.stageColors.brain, letterSpacing: 2 }}>
            /sh:brainstorm
          </div>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: '#446688', letterSpacing: 2 }}>
            /sh:design
          </div>
        </div>

        {/* Two approach options */}
        <div style={{ display: 'flex', gap: 20, width: '100%' }}>
          {/* Option A — fades out */}
          <div
            style={{
              flex: 1,
              background: '#0e0e1a',
              border: '1.5px solid #333',
              borderRadius: 12,
              padding: '18px 20px',
              opacity: optionAOpacity,
              fontFamily,
            }}
          >
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 8 }}>OPTION A</div>
            <div style={{ fontSize: 18, color: '#aaa', fontWeight: 600 }}>Catch DB errors at call site</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Each handler wraps its own DB call. More granular, more code.</div>
          </div>

          {/* Option B — selected */}
          <div
            style={{
              flex: 1,
              background: '#101830',
              border: `2px solid ${THEME.stageColors.brain}`,
              borderRadius: 12,
              padding: '18px 20px',
              transform: `scale(${0.95 + optionBScale * 0.05})`,
              fontFamily,
            }}
          >
            <div style={{ fontSize: 11, color: THEME.stageColors.brain, letterSpacing: 2, marginBottom: 8 }}>OPTION B ✓</div>
            <div style={{ fontSize: 18, color: THEME.white, fontWeight: 600 }}>Probe DB in health handler</div>
            <div style={{ fontSize: 13, color: '#8888aa', marginTop: 8 }}>Single responsibility. Health endpoint owns its own probe.</div>
          </div>
        </div>

        {/* AC lines appear sequentially */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {AC_LINES.map((line, i) => (
            <TerminalLine
              key={i}
              text={`  ${line}`}
              startFrame={90 + i * 20}
              color="#88aacc"
              fontSize={17}
            />
          ))}
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.BRAINSTORM.label}
        tagline="From symptom to solution."
        accentColor={THEME.stageColors.brain}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
