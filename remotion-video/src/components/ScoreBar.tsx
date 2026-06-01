// src/components/ScoreBar.tsx
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';

const { fontFamily } = loadFont();

interface Props {
  label: string;
  value: number;      // 0–10
  maxValue?: number;
  startFrame: number;
  color?: string;
  animateDuration?: number; // frames to animate fill
}

export const ScoreBar: React.FC<Props> = ({
  label,
  value,
  maxValue = 10,
  startFrame,
  color = THEME.accent,
  animateDuration = 30,
}) => {
  const frame = useCurrentFrame();

  const pct = interpolate(
    frame,
    [startFrame, startFrame + animateDuration],
    [0, value / maxValue],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  const displayValue = interpolate(
    frame,
    [startFrame, startFrame + animateDuration],
    [0, value],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{ fontFamily, width: '100%', marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 15,
          color: THEME.muted,
          marginBottom: 6,
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontFamily: THEME.fontMono, fontWeight: 600 }}>
          {displayValue.toFixed(1)}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: '#1e1e2e',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
};
