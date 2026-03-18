// src/components/TitleCard.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';

const { fontFamily } = loadFont();

interface Props {
  stage: string;       // e.g. "01 — INBOX"
  tagline: string;     // e.g. "Every bug starts as a note."
  accentColor?: string;
  totalFrames: number; // scene duration — used to time the fade-out
}

export const TitleCard: React.FC<Props> = ({
  stage,
  tagline,
  accentColor = THEME.accent,
  totalFrames,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 15, totalFrames - 20, totalFrames - 5],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const y = interpolate(frame, [0, 15], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily: THEME.fontMono,
          fontSize: 13,
          color: accentColor,
          letterSpacing: 5,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}
      >
        {stage}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 72,
          fontWeight: 800,
          color: THEME.white,
          textAlign: 'center',
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          width: 64,
          height: 3,
          background: accentColor,
          borderRadius: 2,
          marginTop: 28,
        }}
      />
    </AbsoluteFill>
  );
};
