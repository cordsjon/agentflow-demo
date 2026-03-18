// src/scenes/10-KnownPatterns.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const { fontFamily: monoFamily } = loadMono();
const DUR = SCENES.KNOWN_PATTERNS.durationFrames;

// Exact text from agentflow/KNOWN_PATTERNS.md Pattern #12
const PATTERN_12 = {
  num: '12',
  antiPattern: 'Health endpoint always returns 200 — masks DB/dependency failures; liveness ≠ readiness',
  correct: 'Probe each dependency; return 503 with {"status":"degraded","error":"..."} on failure',
  origin: 'agentflow-demo / US-DM-05',
  action: 'Fix',
};

export const KnownPatternsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tableProgress = spring({ frame: frame - 10, fps, config: { stiffness: 60, damping: 18 } });
  const rowGlow = interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Final title card at frame 160
  const finalOpacity = interpolate(frame, [160, 175], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // DUR is used to satisfy lint — referenced via SCENES.KNOWN_PATTERNS.durationFrames above
  void DUR;

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#180808" to="#08080f" angle={145} />

      {/* KNOWN_PATTERNS.md table */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
          opacity: tableProgress,
          transform: `translateY(${(1 - tableProgress) * 30}px)`,
        }}
      >
        <div style={{ fontFamily: monoFamily, fontSize: 13, color: THEME.stageColors.patterns, letterSpacing: 2, marginBottom: 20 }}>
          agentflow/KNOWN_PATTERNS.md — Section 3: Process & Infrastructure
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 1fr 160px 60px',
            gap: 12,
            width: '100%',
            borderBottom: '1px solid #2a2a3a',
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          {['#', 'Anti-Pattern', 'Correct Pattern', 'Origin', 'Action'].map((h) => (
            <div key={h} style={{ fontFamily, fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        {/* Existing rows (dimmed) */}
        {[6, 7, 8].map((n) => (
          <div
            key={n}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 1fr 160px 60px',
              gap: 12,
              width: '100%',
              padding: '8px 0',
              opacity: 0.25,
              borderBottom: '1px solid #1a1a2a',
            }}
          >
            <div style={{ fontFamily: monoFamily, fontSize: 13, color: '#666' }}>{n}</div>
            <div style={{ fontFamily, fontSize: 13, color: '#666' }}>…</div>
            <div style={{ fontFamily, fontSize: 13, color: '#666' }}>…</div>
            <div style={{ fontFamily, fontSize: 13, color: '#666' }}>…</div>
            <div style={{ fontFamily, fontSize: 13, color: '#666' }}>Fix</div>
          </div>
        ))}

        {/* Pattern #12 — highlighted */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 1fr 160px 60px',
            gap: 12,
            width: '100%',
            padding: '12px 10px',
            background: `rgba(154,42,42,${rowGlow * 0.15})`,
            border: `1px solid rgba(248,113,113,${rowGlow * 0.4})`,
            borderRadius: 8,
            marginTop: 4,
          }}
        >
          <div style={{ fontFamily: monoFamily, fontSize: 14, color: '#f87171', fontWeight: 700 }}>{PATTERN_12.num}</div>
          <div style={{ fontFamily, fontSize: 13, color: '#fca5a5', lineHeight: 1.4 }}>{PATTERN_12.antiPattern}</div>
          <div style={{ fontFamily, fontSize: 13, color: '#bbf7d0', lineHeight: 1.4 }}>{PATTERN_12.correct}</div>
          <div style={{ fontFamily: monoFamily, fontSize: 11, color: '#888' }}>{PATTERN_12.origin}</div>
          <div style={{ fontFamily, fontSize: 13, color: '#fb923c', fontWeight: 600 }}>{PATTERN_12.action}</div>
        </div>
      </AbsoluteFill>

      {/* Scene title */}
      <TitleCard
        stage={SCENES.KNOWN_PATTERNS.label}
        tagline="Fix the bug. Remember the lesson."
        accentColor={THEME.stageColors.patterns}
        totalFrames={150}
      />

      {/* Final title card */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: finalOpacity,
          background: `rgba(8,8,15,${finalOpacity * 0.95})`,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily, fontSize: 80, fontWeight: 800, color: THEME.white, letterSpacing: -2 }}>
            agentflow
          </div>
          <div style={{ fontFamily: monoFamily, fontSize: 18, color: THEME.accent, letterSpacing: 4, marginTop: 12 }}>
            idea to production.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
