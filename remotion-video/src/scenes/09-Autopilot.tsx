// src/scenes/09-Autopilot.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { KanbanCard } from '../components/KanbanCard';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily: _fontFamily } = loadFont();
const DUR = SCENES.AUTOPILOT.durationFrames;

export const AutopilotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Semaphore label
  const semaphoreOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Next card picks up at frame 60
  const pickupProgress = spring({ frame: frame - 60, fps, config: { stiffness: 80, damping: 14 } });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#001a1a" to="#08080f" angle={150} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* Semaphore status */}
        <div style={{ opacity: semaphoreOpacity, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 13, color: '#22d3ee', letterSpacing: 2 }}>
            .autopilot
          </div>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 13, color: '#888' }}>→</div>
          <div
            style={{
              fontFamily: THEME.fontMono, fontSize: 13, fontWeight: 700,
              color: '#22d3ee', background: '#0a2a2a',
              border: '1px solid #22d3ee55', borderRadius: 20, padding: '2px 14px',
            }}
          >
            run
          </div>
        </div>

        {/* Completed item — greyed */}
        <div style={{ opacity: 0.3 }}>
          <KanbanCard
            title="✓ US-DM-05: Health endpoint resilience"
            tag="DONE"
            tagColor="#4ade80"
          />
        </div>

        {/* Next item — highlights and picks up (no human action) */}
        <div style={{ transform: `scale(${0.95 + pickupProgress * 0.05})`, opacity: 0.4 + pickupProgress * 0.6 }}>
          <KanbanCard
            title="US-DM-01: Priority sorting in UI"
            tag="NEXT"
            tagColor={THEME.stageColors.autopilot}
            delayFrames={60}
          />
        </div>

        <TerminalLine
          text="Agent picking up next item — no prompt needed"
          startFrame={80}
          color="#22d3ee"
          fontSize={17}
        />
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.AUTOPILOT.label}
        tagline="The pipeline never waits."
        accentColor={THEME.stageColors.autopilot}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
