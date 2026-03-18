// src/scenes/06-TDD.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily: _fontFamily } = loadFont();
const DUR = SCENES.TDD.durationFrames;

const TEST_LINES = [
  'def test_health_db_missing_returns_503(client):',
  '    # Simulate missing DB',
  '    response = client.get("/api/health")',
  '    assert response.status_code == 503',
  '    assert response.json()["status"] == "degraded"',
];

const IMPL_LINES = [
  '@router.get("/api/health")',
  'def health():',
  '    try:',
  '        db.execute("SELECT 1")',
  '        return {"status": "ok"}',
  '    except Exception as e:',
  '        return JSONResponse(',
  '            {"status":"degraded","error":str(e)},',
  '            status_code=503',
  '        )',
];

export const TDDScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Green flash at frame 130 (test passes)
  const greenFlash = interpolate(frame, [130, 140, 160], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Refactor label at frame 170
  const refactorOpacity = interpolate(frame, [170, 185], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#081008" to="#08080f" angle={140} />

      {/* Green flash overlay */}
      <AbsoluteFill style={{ background: `rgba(74,222,128,${greenFlash})`, pointerEvents: 'none' }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'row', padding: '60px 60px 80px' }}>
        {/* Left — Test file (RED phase) */}
        <div style={{ flex: 1, borderRight: '1px solid #1e1e2e', paddingRight: 40 }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: '#ef4444', letterSpacing: 2, marginBottom: 16 }}>
            🔴 FAILING TEST
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TEST_LINES.map((line, i) => (
              <TerminalLine key={i} text={line} startFrame={15 + i * 8} color="#fca5a5" fontSize={16} />
            ))}
          </div>
          {/* FAIL label */}
          <div style={{ marginTop: 20 }}>
            <TerminalLine text="FAILED — assert 200 == 503" startFrame={70} color="#ef4444" fontSize={14} />
          </div>
        </div>

        {/* Right — Implementation (GREEN phase) */}
        <div style={{ flex: 1, paddingLeft: 40 }}>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: '#4ade80', letterSpacing: 2, marginBottom: 16 }}>
            🟢 IMPLEMENTATION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {IMPL_LINES.map((line, i) => (
              <TerminalLine key={i} text={line} startFrame={80 + i * 5} color="#86efac" fontSize={16} />
            ))}
          </div>
          {/* PASS label */}
          <div style={{ marginTop: 20 }}>
            <TerminalLine text="PASSED ✓" startFrame={135} color="#4ade80" fontSize={14} />
          </div>
        </div>
      </AbsoluteFill>

      {/* Refactor badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: refactorOpacity,
          fontFamily: THEME.fontMono,
          fontSize: 16,
          color: '#6ee7b7',
          letterSpacing: 3,
          background: '#0e2018',
          border: '1px solid #2a6a4a',
          padding: '8px 24px',
          borderRadius: 30,
        }}
      >
        ♻ REFACTOR — clean ✓
      </div>

      <TitleCard
        stage={SCENES.TDD.label}
        tagline="Write the test. Then earn the green."
        accentColor={THEME.stageColors.tdd}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
