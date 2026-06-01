// src/lib/timing.ts
export const FPS = 30;
export const TRANSITION_FRAMES = 15;

// durationFrames = raw scene time + TRANSITION_FRAMES (absorbed by TransitionSeries)
// Last scene has no outgoing transition, so no addition.
export const SCENES = {
  INBOX:          { durationFrames: 555, label: '01 — INBOX' },
  TRIAGE:         { durationFrames: 525, label: '02 — TRIAGE' },
  BUSINESS_PANEL: { durationFrames: 705, label: '03 — BUSINESS PANEL' },
  BRAINSTORM:     { durationFrames: 615, label: '04 — BRAINSTORM' },
  SPEC_PANEL:     { durationFrames: 675, label: '05 — SPEC PANEL' },
  TDD:            { durationFrames: 675, label: '06 — TDD LOOP' },
  VERIFY:         { durationFrames: 615, label: '07 — VERIFY + REVIEW' },
  SHIPPED:        { durationFrames: 495, label: '08 — SHIPPED' },
  AUTOPILOT:      { durationFrames: 375, label: '09 — AUTOPILOT' },
  KNOWN_PATTERNS: { durationFrames: 300, label: '10 — KNOWN PATTERNS' },
} as const;

const SCENE_COUNT = Object.keys(SCENES).length;
// TransitionSeries total = sum(durationFrames) - (n-1) * TRANSITION_FRAMES
// = 5535 - 9*15 = 5535 - 135 = 5400
export const TOTAL_FRAMES =
  Object.values(SCENES).reduce((a, s) => a + s.durationFrames, 0) -
  (SCENE_COUNT - 1) * TRANSITION_FRAMES;
