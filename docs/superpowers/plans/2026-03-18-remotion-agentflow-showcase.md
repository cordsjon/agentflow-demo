# Remotion Agentflow Showcase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-minute cinematic Remotion video (`remotion-video/`) inside `10_agentflow-demo/` that follows the real bug `US-DM-05` through all 10 agentflow pipeline stages from INBOX note to shipped fix and codified pattern.

**Architecture:** 10 scene components assembled via `<TransitionSeries>` with 15-frame fade transitions. Shared components (`GradientScene`, `TitleCard`, `TerminalLine`, `ScoreBar`, `KanbanCard`) handle all reusable visual patterns. All timing constants live in `lib/timing.ts`; all design tokens in `lib/theme.ts`.

**Tech Stack:** Remotion ≥ 4.0, React, TypeScript, `@remotion/google-fonts` (Inter + JetBrains Mono), `@remotion/transitions` (TransitionSeries + fade)

---

## File Map

| File | Responsibility |
|------|----------------|
| `remotion-video/src/lib/theme.ts` | All colours, fonts, easing — single source of truth |
| `remotion-video/src/lib/timing.ts` | Scene durations (durationFrames), FPS, transition length, total frame count |
| `remotion-video/src/components/GradientScene.tsx` | Full-bleed gradient backdrop, reused by every scene |
| `remotion-video/src/components/TitleCard.tsx` | Full-screen stage name + tagline, fade in/out |
| `remotion-video/src/components/TerminalLine.tsx` | Typewriter-effect monospace line with blinking cursor |
| `remotion-video/src/components/ScoreBar.tsx` | Animated horizontal score bar (used in scenes 03, 05) |
| `remotion-video/src/components/KanbanCard.tsx` | Pipeline card that slides in with spring motion |
| `remotion-video/src/scenes/01-Inbox.tsx` | Cold open — typewriter bug note |
| `remotion-video/src/scenes/02-Triage.tsx` | Agent classifies, card moves to BACKLOG |
| `remotion-video/src/scenes/03-BusinessPanel.tsx` | Three panels, score bars, Must Have badge |
| `remotion-video/src/scenes/04-Brainstorm.tsx` | Approach fork → selection → AC lines |
| `remotion-video/src/scenes/05-SpecPanel.tsx` | Score panel, aggregate counter, → Ready |
| `remotion-video/src/scenes/06-TDD.tsx` | Split screen: red test → green pass → refactor |
| `remotion-video/src/scenes/07-Verify.tsx` | Terminal output scroll + DOD checklist |
| `remotion-video/src/scenes/08-Shipped.tsx` | Commit message, DONE-Today entry, ✓ closure |
| `remotion-video/src/scenes/09-Autopilot.tsx` | Queue advances, next card, loop restarts |
| `remotion-video/src/scenes/10-KnownPatterns.tsx` | KNOWN_PATTERNS.md slides in, row #12 highlighted |
| `remotion-video/src/AgentflowShowcase.tsx` | TransitionSeries wiring all 10 scenes |
| `remotion-video/src/Root.tsx` | Remotion composition registry |

---

## Task 1: Scaffold Remotion project

**Files:**
- Create: `remotion-video/` (entire directory via npm init)

- [ ] **Step 1: Scaffold from Remotion's official template**

```bash
cd /Users/jcords-macmini/projects/10_agentflow-demo
npm init video -- --blank remotion-video
```

When prompted for a template, choose **Blank** (TypeScript). Accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
cd remotion-video
npm install @remotion/google-fonts @remotion/transitions
```

- [ ] **Step 3: Delete scaffold boilerplate**

```bash
rm -rf src/HelloWorld src/Video.tsx src/Composition.tsx 2>/dev/null; true
```

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p src/scenes src/components src/lib
```

- [ ] **Step 5: Verify Remotion studio opens**

```bash
npx remotion studio
```

Expected: Browser opens at `http://localhost:3000` with an empty composition list. Ctrl+C to stop.

- [ ] **Step 6: Commit**

```bash
git add remotion-video
git commit -m "chore: scaffold remotion-video project with blank template"
```

---

## Task 2: Theme and timing foundations

**Files:**
- Create: `remotion-video/src/lib/theme.ts`
- Create: `remotion-video/src/lib/timing.ts`

- [ ] **Step 1: Write `theme.ts`**

```typescript
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
```

- [ ] **Step 2: Write `timing.ts`**

Scene durations include the 15-frame transition overlap so that `TransitionSeries` total = 5400 frames (9 transitions × 15 frames = 135 frames reclaimed).

```typescript
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
```

- [ ] **Step 3: Verify arithmetic**

```bash
cd remotion-video
node -e "
const s=[555,525,705,615,675,675,615,495,375,300];
const sum=s.reduce((a,b)=>a+b,0);
const total=sum-9*15;
console.log('sum:', sum, 'total:', total, total===5400?'✓ PASS':'✗ FAIL');
"
```

Expected output: `sum: 5535 total: 5400 ✓ PASS`

- [ ] **Step 4: Commit**

```bash
git add src/lib/
git commit -m "feat: add theme and timing foundations"
```

---

## Task 3: Shared components — GradientScene and TitleCard

**Files:**
- Create: `remotion-video/src/components/GradientScene.tsx`
- Create: `remotion-video/src/components/TitleCard.tsx`

- [ ] **Step 1: Write `GradientScene.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `TitleCard.tsx`**

TitleCard is a full-screen overlay showing the stage name and tagline. It fades in over 15 frames, holds, then fades out at the end of its lifetime.

```tsx
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
```

- [ ] **Step 3: TypeScript check**

```bash
cd remotion-video && npx tsc --noEmit
```

Expected: exit code 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/GradientScene.tsx src/components/TitleCard.tsx
git commit -m "feat: add GradientScene and TitleCard shared components"
```

---

## Task 4: Shared components — TerminalLine and KanbanCard

**Files:**
- Create: `remotion-video/src/components/TerminalLine.tsx`
- Create: `remotion-video/src/components/KanbanCard.tsx`

- [ ] **Step 1: Write `TerminalLine.tsx`**

Renders a single line of monospace text with a typewriter reveal. `startFrame` controls when the line begins typing relative to `useCurrentFrame()`.

```tsx
// src/components/TerminalLine.tsx
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/JetBrainsMono';
import { THEME } from '../lib/theme';

const { fontFamily } = loadFont();

interface Props {
  text: string;
  startFrame: number;       // frame at which typing begins
  color?: string;
  fontSize?: number;
  showCursor?: boolean;     // show blinking cursor after text
}

export const TerminalLine: React.FC<Props> = ({
  text,
  startFrame,
  color = '#c8ffc8',
  fontSize = 28,
  showCursor = false,
}) => {
  const frame = useCurrentFrame();
  const charsPerFrame = 1.8;

  const charsVisible = Math.floor(
    Math.max(0, (frame - startFrame) * charsPerFrame),
  );
  const visible = text.slice(0, Math.min(charsVisible, text.length));
  const done = charsVisible >= text.length;

  // Cursor blinks every 15 frames once typing is done
  const cursorVisible = showCursor && done && Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        color,
        lineHeight: 1.6,
        whiteSpace: 'pre',
      }}
    >
      {visible}
      {cursorVisible && (
        <span
          style={{
            display: 'inline-block',
            width: fontSize * 0.55,
            height: fontSize * 0.9,
            background: color,
            verticalAlign: 'text-bottom',
            marginLeft: 2,
          }}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 2: Write `KanbanCard.tsx`**

A pipeline card that enters from the left with a spring animation. `delayFrames` staggers multiple cards.

```tsx
// src/components/KanbanCard.tsx
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';

const { fontFamily } = loadFont();

interface Props {
  title: string;
  tag?: string;
  tagColor?: string;
  delayFrames?: number;
  width?: number;
}

export const KanbanCard: React.FC<Props> = ({
  title,
  tag,
  tagColor = THEME.accent,
  delayFrames = 0,
  width = 380,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config: { stiffness: 80, damping: 14 },
  });

  const x = (1 - progress) * -60;
  const opacity = progress;

  return (
    <div
      style={{
        fontFamily,
        width,
        background: '#14141e',
        border: `1.5px solid ${tagColor}44`,
        borderLeft: `4px solid ${tagColor}`,
        borderRadius: 10,
        padding: '14px 18px',
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      {tag && (
        <div
          style={{
            display: 'inline-block',
            fontFamily: THEME.fontMono,
            fontSize: 11,
            color: tagColor,
            background: `${tagColor}22`,
            border: `1px solid ${tagColor}55`,
            borderRadius: 20,
            padding: '2px 10px',
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          {tag}
        </div>
      )}
      <div style={{ fontSize: 20, fontWeight: 600, color: THEME.white }}>
        {title}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: TypeScript check**

```bash
cd remotion-video && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/TerminalLine.tsx src/components/KanbanCard.tsx
git commit -m "feat: add TerminalLine and KanbanCard shared components"
```

---

## Task 5: Shared component — ScoreBar

**Files:**
- Create: `remotion-video/src/components/ScoreBar.tsx`

- [ ] **Step 1: Write `ScoreBar.tsx`**

Animated horizontal score bar. `startFrame` controls when the fill animation begins. Used in Business Panel (Scene 03) and Spec Panel (Scene 05).

```tsx
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd remotion-video && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/ScoreBar.tsx
git commit -m "feat: add ScoreBar shared component"
```

---

## Task 6: Scenes 01 + 02 — INBOX and TRIAGE

**Source material:** `../INBOX.md` line 8, `../BACKLOG.md` US-DM-05 block.

**Files:**
- Create: `remotion-video/src/scenes/01-Inbox.tsx`
- Create: `remotion-video/src/scenes/02-Triage.tsx`

- [ ] **Step 1: Write `01-Inbox.tsx`**

```tsx
// src/scenes/01-Inbox.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const DUR = SCENES.INBOX.durationFrames;

export const InboxScene: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    <GradientScene from="#08080f" to="#0e0e20" angle={160} />

    {/* Raw bug note — starts typing at frame 20 */}
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: '0 140px',
      }}
    >
      <TerminalLine
        text="$ INBOX.md"
        startFrame={10}
        color="#555577"
        fontSize={18}
      />
      <TerminalLine
        text='- "The health endpoint returns 200 even when the DB file is missing — should return 503"'
        startFrame={25}
        color="#e8e8f8"
        fontSize={26}
        showCursor
      />
    </AbsoluteFill>

    {/* Title card fades in at frame 40 */}
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <TitleCard
        stage={SCENES.INBOX.label}
        tagline="Every bug starts as a note."
        accentColor={THEME.stageColors.inbox}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);
```

- [ ] **Step 2: Write `02-Triage.tsx`**

```tsx
// src/scenes/02-Triage.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { KanbanCard } from '../components/KanbanCard';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const DUR = SCENES.TRIAGE.durationFrames;

export const TriageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Agent command appears first
  // Card slides in after command
  const tagOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#0a0a18" to="#0e0e22" angle={140} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Agent command */}
        <TerminalLine
          text="/sh:triage"
          startFrame={10}
          color={THEME.accent}
          fontSize={32}
        />
        <TerminalLine
          text="→ Classified: Bug · Moving to BACKLOG / Ideation"
          startFrame={35}
          color="#aaaacc"
          fontSize={20}
        />

        {/* Kanban card slides in */}
        <div style={{ opacity: tagOpacity }}>
          <KanbanCard
            title="Health endpoint returns 200 when DB missing"
            tag="BUG"
            tagColor={THEME.stageColors.triage}
            delayFrames={45}
          />
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.TRIAGE.label}
        tagline="Classify. Prioritise. Route."
        accentColor={THEME.stageColors.triage}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: TypeScript check**

```bash
cd remotion-video && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/01-Inbox.tsx src/scenes/02-Triage.tsx
git commit -m "feat: add INBOX and TRIAGE scenes"
```

---

## Task 7: Scene 03 — BUSINESS PANEL

**Files:**
- Create: `remotion-video/src/scenes/03-BusinessPanel.tsx`

- [ ] **Step 1: Write `03-BusinessPanel.tsx`**

Three panels (Impact, Risk, MoSCoW) slide in sequentially. Score bars animate inside each.

```tsx
// src/scenes/03-BusinessPanel.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { ScoreBar } from '../components/ScoreBar';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.BUSINESS_PANEL.durationFrames;

const Panel: React.FC<{
  title: string;
  children: React.ReactNode;
  enterFrame: number;
  accentColor: string;
}> = ({ title, children, enterFrame, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - enterFrame, fps, config: { stiffness: 70, damping: 16 } });
  const y = (1 - progress) * 40;

  return (
    <div
      style={{
        fontFamily,
        background: '#0e0e1a',
        border: `1.5px solid ${accentColor}44`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 14,
        padding: '22px 24px',
        width: 320,
        transform: `translateY(${y}px)`,
        opacity: progress,
      }}
    >
      <div style={{ fontSize: 12, color: accentColor, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
};

export const BusinessPanelScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Must Have badge appears at frame 120
  const badgeOpacity = interpolate(frame, [120, 135], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeScale = interpolate(frame, [120, 135], [0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#100818" to="#08080f" angle={150} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Command label */}
        <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: THEME.stageColors.biz, letterSpacing: 3 }}>
          /sh:business-panel
        </div>

        {/* Three panels */}
        <div style={{ display: 'flex', gap: 20 }}>
          <Panel title="Impact" enterFrame={20} accentColor="#9060d0">
            <ScoreBar label="User Impact" value={8.5} startFrame={35} color="#9060d0" />
            <ScoreBar label="Technical Risk" value={9.0} startFrame={50} color="#c060a0" />
          </Panel>

          <Panel title="Risk" enterFrame={45} accentColor="#c060a0">
            <ScoreBar label="Severity" value={9.2} startFrame={60} color="#c060a0" />
            <ScoreBar label="Likelihood" value={7.5} startFrame={75} color="#a060c0" />
          </Panel>

          <Panel title="MoSCoW" enterFrame={70} accentColor={THEME.stageColors.biz}>
            <ScoreBar label="Priority" value={10} startFrame={85} color={THEME.stageColors.biz} />
            <div style={{ fontFamily, fontSize: 13, color: '#888', marginTop: 8 }}>
              Classification: Must Have
            </div>
          </Panel>
        </div>

        {/* Must Have badge */}
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            background: `${THEME.stageColors.biz}22`,
            border: `2px solid ${THEME.stageColors.biz}`,
            color: '#e0b0ff',
            fontFamily: THEME.fontMono,
            fontSize: 20,
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: 40,
            letterSpacing: 2,
          }}
        >
          ✓ MUST HAVE — P1
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.BUSINESS_PANEL.label}
        tagline="Silent failures are never low priority."
        accentColor={THEME.stageColors.biz}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/03-BusinessPanel.tsx
git commit -m "feat: add BUSINESS PANEL scene"
```

---

## Task 8: Scene 04 — BRAINSTORM + DESIGN

**Files:**
- Create: `remotion-video/src/scenes/04-Brainstorm.tsx`

- [ ] **Step 1: Write `04-Brainstorm.tsx`**

Shows two approach options forking, one gets selected, then AC lines appear one by one.

```tsx
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
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/04-Brainstorm.tsx
git commit -m "feat: add BRAINSTORM scene"
```

---

## Task 9: Scene 05 — SPEC PANEL

**Files:**
- Create: `remotion-video/src/scenes/05-SpecPanel.tsx`

- [ ] **Step 1: Write `05-SpecPanel.tsx`**

Score panel for five review criteria. Aggregate counter ticks up to 8.2. `→ Ready` badge appears.

```tsx
// src/scenes/05-SpecPanel.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { ScoreBar } from '../components/ScoreBar';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.SPEC_PANEL.durationFrames;

const CRITERIA = [
  { label: 'Completeness', value: 8.5, startFrame: 25 },
  { label: 'Clarity', value: 8.0, startFrame: 45 },
  { label: 'Testability', value: 9.0, startFrame: 65 },
  { label: 'Feasibility', value: 8.0, startFrame: 85 },
  { label: 'Scope Discipline', value: 7.5, startFrame: 105 },
];

export const SpecPanelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const aggregate = interpolate(frame, [115, 145], [0, 8.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const readyProgress = spring({ frame: frame - 150, fps, config: { stiffness: 100, damping: 14 } });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#100820" to="#08080f" angle={155} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '0 200px',
        }}
      >
        <div style={{ fontFamily: THEME.fontMono, fontSize: 14, color: THEME.stageColors.spec, letterSpacing: 3, marginBottom: 32 }}>
          /sh:spec-panel — DOR GATE
        </div>

        <div style={{ width: '100%' }}>
          {CRITERIA.map((c) => (
            <ScoreBar key={c.label} label={c.label} value={c.value} startFrame={c.startFrame} color={THEME.stageColors.spec} />
          ))}
        </div>

        {/* Aggregate */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 24 }}>
          <div style={{ fontFamily, fontSize: 16, color: THEME.muted }}>Aggregate score:</div>
          <div style={{ fontFamily: THEME.fontMono, fontSize: 48, fontWeight: 800, color: THEME.stageColors.spec }}>
            {aggregate.toFixed(1)}
          </div>
          <div style={{ fontFamily, fontSize: 16, color: '#555' }}>/ 10</div>
        </div>

        {/* → Ready badge */}
        <div
          style={{
            marginTop: 20,
            opacity: readyProgress,
            transform: `scale(${0.8 + readyProgress * 0.2})`,
            background: '#1a3a1a',
            border: `2px solid #4ade80`,
            color: '#4ade80',
            fontFamily: THEME.fontMono,
            fontSize: 18,
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: 40,
            letterSpacing: 3,
          }}
        >
          ✓ GATE PASSED → READY
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.SPEC_PANEL.label}
        tagline="Quality is a gate, not a hope."
        accentColor={THEME.stageColors.spec}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/05-SpecPanel.tsx
git commit -m "feat: add SPEC PANEL scene"
```

---

## Task 10: Scene 06 — TDD LOOP

**Files:**
- Create: `remotion-video/src/scenes/06-TDD.tsx`

- [ ] **Step 1: Write `06-TDD.tsx`**

Split screen. Left: test file lines appear (red). Right: implementation lines appear. Green flash on pass. Refactor label.

```tsx
// src/scenes/06-TDD.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
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
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/06-TDD.tsx
git commit -m "feat: add TDD LOOP scene"
```

---

## Task 11: Scene 07 — VERIFY + REVIEW

**Files:**
- Create: `remotion-video/src/scenes/07-Verify.tsx`

- [ ] **Step 1: Write `07-Verify.tsx`**

Terminal output scrolling. DOD checklist items tick green one by one.

```tsx
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
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/07-Verify.tsx
git commit -m "feat: add VERIFY + REVIEW scene"
```

---

## Task 12: Scene 08 — SHIPPED

**Files:**
- Create: `remotion-video/src/scenes/08-Shipped.tsx`

- [ ] **Step 1: Write `08-Shipped.tsx`**

Commit message appears, DONE-Today entry animates in, final ✓ closes the loop on the original INBOX note.

```tsx
// src/scenes/08-Shipped.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { GradientScene } from '../components/GradientScene';
import { TerminalLine } from '../components/TerminalLine';
import { TitleCard } from '../components/TitleCard';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';
import { SCENES } from '../lib/timing';

const { fontFamily } = loadFont();
const DUR = SCENES.SHIPPED.durationFrames;

export const ShippedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame: frame - 120, fps, config: { stiffness: 200, damping: 12 } });
  const doneOpacity = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GradientScene from="#081808" to="#08080f" angle={140} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '0 120px',
        }}
      >
        {/* Git commit */}
        <TerminalLine text="$ git commit -m 'fix: health returns 503 on DB failure (US-DM-05)'" startFrame={10} color="#aaaacc" fontSize={18} />
        <TerminalLine text="[main a3f7c21] fix: health returns 503 on DB failure (US-DM-05)" startFrame={55} color="#4ade80" fontSize={17} />

        {/* DONE-Today entry */}
        <div style={{ opacity: doneOpacity, width: '100%' }}>
          <div
            style={{
              fontFamily,
              background: '#0e1a0e',
              border: `1.5px solid ${THEME.stageColors.shipped}44`,
              borderLeft: `4px solid ${THEME.stageColors.shipped}`,
              borderRadius: 10,
              padding: '16px 20px',
            }}
          >
            <div style={{ fontFamily: THEME.fontMono, fontSize: 11, color: THEME.stageColors.shipped, marginBottom: 6 }}>
              DONE-Today · 2026-03-18 14:22
            </div>
            <div style={{ fontSize: 18, color: THEME.white, fontWeight: 600 }}>
              ✓ US-DM-05: Health endpoint resilience
            </div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
              503 on DB failure. Silent bug — closed.
            </div>
          </div>
        </div>

        {/* Big ✓ closes the original note */}
        <div
          style={{
            transform: `scale(${checkScale})`,
            fontSize: 80,
            color: '#4ade80',
            lineHeight: 1,
          }}
        >
          ✓
        </div>
      </AbsoluteFill>

      <TitleCard
        stage={SCENES.SHIPPED.label}
        tagline="503. Bug closed. System honest."
        accentColor={THEME.stageColors.shipped}
        totalFrames={DUR}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/08-Shipped.tsx
git commit -m "feat: add SHIPPED scene"
```

---

## Task 13: Scenes 09 + 10 — AUTOPILOT and KNOWN PATTERNS

**Source material:** `.autopilot` file value `run`; `agentflow/KNOWN_PATTERNS.md` Pattern #12 row.

**Files:**
- Create: `remotion-video/src/scenes/09-Autopilot.tsx`
- Create: `remotion-video/src/scenes/10-KnownPatterns.tsx`

- [ ] **Step 1: Write `09-Autopilot.tsx`**

Queue advances without any cursor/click — no human action. The next card highlights and the agent picks it up.

```tsx
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

const { fontFamily } = loadFont();
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
```

- [ ] **Step 2: Write `10-KnownPatterns.tsx`**

KNOWN_PATTERNS.md table slides in. Row #12 is highlighted. Final title card: `agentflow — idea to production.`

```tsx
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
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd remotion-video && npx tsc --noEmit
git add src/scenes/09-Autopilot.tsx src/scenes/10-KnownPatterns.tsx
git commit -m "feat: add AUTOPILOT and KNOWN PATTERNS scenes"
```

---

## Task 14: Wire composition — AgentflowShowcase + Root

**Files:**
- Create: `remotion-video/src/AgentflowShowcase.tsx`
- Modify: `remotion-video/src/Root.tsx`

- [ ] **Step 1: Write `AgentflowShowcase.tsx`**

```tsx
// src/AgentflowShowcase.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, fade } from '@remotion/transitions';

import { InboxScene }          from './scenes/01-Inbox';
import { TriageScene }         from './scenes/02-Triage';
import { BusinessPanelScene }  from './scenes/03-BusinessPanel';
import { BrainstormScene }     from './scenes/04-Brainstorm';
import { SpecPanelScene }      from './scenes/05-SpecPanel';
import { TDDScene }            from './scenes/06-TDD';
import { VerifyScene }         from './scenes/07-Verify';
import { ShippedScene }        from './scenes/08-Shipped';
import { AutopilotScene }      from './scenes/09-Autopilot';
import { KnownPatternsScene }  from './scenes/10-KnownPatterns';
import { SCENES, TRANSITION_FRAMES } from './lib/timing';
import { THEME as T } from './lib/theme';

// Each scene and its durationFrames
const SEQUENCE = [
  { component: InboxScene,         dur: SCENES.INBOX.durationFrames },
  { component: TriageScene,        dur: SCENES.TRIAGE.durationFrames },
  { component: BusinessPanelScene, dur: SCENES.BUSINESS_PANEL.durationFrames },
  { component: BrainstormScene,    dur: SCENES.BRAINSTORM.durationFrames },
  { component: SpecPanelScene,     dur: SCENES.SPEC_PANEL.durationFrames },
  { component: TDDScene,           dur: SCENES.TDD.durationFrames },
  { component: VerifyScene,        dur: SCENES.VERIFY.durationFrames },
  { component: ShippedScene,       dur: SCENES.SHIPPED.durationFrames },
  { component: AutopilotScene,     dur: SCENES.AUTOPILOT.durationFrames },
  { component: KnownPatternsScene, dur: SCENES.KNOWN_PATTERNS.durationFrames },
];

export const AgentflowShowcase: React.FC = () => (
  <AbsoluteFill style={{ background: T.bg }}>
    <TransitionSeries>
      {SEQUENCE.map(({ component: Scene, dur }, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={dur}>
            <Scene />
          </TransitionSeries.Sequence>
          {i < SEQUENCE.length - 1 && (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={{ type: 'spring', config: { damping: 200 } }}
              durationInFrames={TRANSITION_FRAMES}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);
```

- [ ] **Step 2: Write `Root.tsx`**

```tsx
// src/Root.tsx
import { Composition } from 'remotion';
import { AgentflowShowcase } from './AgentflowShowcase';
import { TOTAL_FRAMES, FPS } from './lib/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AgentflowShowcase"
      component={AgentflowShowcase}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
```

- [ ] **Step 3: Check `remotion.config.ts` points to Root**

Open `remotion-video/remotion.config.ts` and confirm it contains:
```ts
Config.setEntryPoint('./src/Root.tsx');
```
If not, add it.

- [ ] **Step 4: Open Remotion studio and preview**

```bash
cd remotion-video && npx remotion studio
```

Expected: browser opens, `AgentflowShowcase` appears in the composition list at 5400 frames / 3:00. Scrub through all 10 scenes.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/AgentflowShowcase.tsx src/Root.tsx remotion.config.ts
git commit -m "feat: wire all 10 scenes into AgentflowShowcase composition"
```

---

## Task 15: Verification and render

**Files:** None created — validation and output only.

- [ ] **Step 1: Verify timing sum**

```bash
node -e "
const s=[555,525,705,615,675,675,615,495,375,300];
const sum=s.reduce((a,b)=>a+b,0);
const total=sum-9*15;
console.log('Frame sum:',sum,'| Total:',total,total===5400?'✓ PASS':'✗ FAIL');
"
```

Expected: `Frame sum: 5535 | Total: 5400 ✓ PASS`

- [ ] **Step 2: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exit code 0, zero errors.

- [ ] **Step 3: Bundle build**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors, bundle output in `build/`.

- [ ] **Step 4: Render to MP4**

```bash
npx remotion render AgentflowShowcase out/agentflow-showcase.mp4 \
  --codec=h264 \
  --jpeg-quality=90
```

Expected: renders 5400 frames, output `out/agentflow-showcase.mp4` (~3:00, 1920×1080).

- [ ] **Step 5: Spot-check acceptance criteria**

Open `out/agentflow-showcase.mp4` and verify:
- All 10 scenes present
- Background is near-black, accent is violet `#6c63ff`
- Scene 09 (Autopilot): no cursor/click animation visible
- Scene 10 (Known Patterns): Pattern #12 row highlighted, final title card `agentflow — idea to production.`
- Text cards match spec Section 4 exactly

- [ ] **Step 6: Final commit**

```bash
git add out/agentflow-showcase.mp4
git commit -m "feat: render agentflow showcase video (5400 frames, 1920x1080)"
```

---

## Acceptance Criteria Checklist

- [ ] Video renders to MP4 at 1920×1080, ~3 minutes
- [ ] All 10 scenes present with correct tool names and artefacts per spec Section 4
- [ ] Real source content: INBOX.md line 8, BACKLOG.md US-DM-05 block, KNOWN_PATTERNS.md Pattern #12
- [ ] Background `#08080f`, accent `#6c63ff`, title font-weight ≥ 700 — verified in `theme.ts`
- [ ] Each scene has exact text card copy from spec Section 4
- [ ] Scene 09: no cursor/click animation
- [ ] Scene 10: actual Pattern #12 row text highlighted
- [ ] All scene `durationFrames` in `timing.ts` sum to 5400 (post-transition)
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] No `useCurrentFrame` outside Remotion components; assets via `staticFile()` or `delayRender()`
