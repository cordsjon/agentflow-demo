// src/components/GradientScene.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { THEME } from '../lib/theme';

interface Props {
  from?: string;
  to?: string;
  angle?: number;
}

export const GradientScene: React.FC<Props> = ({
  from = '#0a0a18',
  to = THEME.bg,
  angle = 135,
}) => (
  <AbsoluteFill
    style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }}
  />
);
