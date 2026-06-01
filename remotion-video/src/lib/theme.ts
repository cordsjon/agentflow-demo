// src/lib/theme.ts
import { Easing } from 'remotion';

export const THEME = {
  bg: '#08080f',
  accent: '#6c63ff',
  white: '#ffffff',
  muted: '#888899',
  // Stage accent colours
  stageColors: {
    inbox:    '#4a4a8a',
    triage:   '#4a4a9a',
    biz:      '#6c2fa0',
    brain:    '#1a4a9a',
    spec:     '#7a2faa',
    tdd:      '#2a8a4a',
    verify:   '#a06020',
    shipped:  '#2a9a4a',
    autopilot:'#20909a',
    patterns: '#9a2a2a',
  },
  font: 'Inter',
  fontMono: 'JetBrains Mono',
  // Reusable easing
  ease: Easing.out(Easing.cubic),
} as const;
