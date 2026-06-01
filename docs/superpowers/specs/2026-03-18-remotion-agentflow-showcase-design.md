# Design Spec: Remotion Agentflow Showcase Video

**Date:** 2026-03-18
**Project:** 10_agentflow-demo
**Spec status:** Approved (spec-panel score 7.6/10)

---

## 1. Purpose

Produce a 3-minute cinematic Remotion video that follows a single real bug — `US-DM-05: Health endpoint resilience` — from its raw form as an INBOX note all the way to a shipped fix and a codified team pattern. The video demonstrates the complete agentflow/Shepherd pipeline including business analysis, spec review, TDD, verification, autopilot, and institutional knowledge capture.

**Primary audience:** Developers and engineering leads evaluating agentflow as a workflow system.
**Distribution:** Conference slides, LinkedIn, repo README embed, demo recordings.

---

## 2. Hero Story

| | |
|---|---|
| **Raw signal** | `INBOX.md` line: *"The health endpoint returns 200 even when the DB file is missing — should return 503"* |
| **Resulting ticket** | `US-DM-05: Health endpoint resilience` |
| **Resolution** | `/api/health` returns `503 {"status":"degraded","error":"..."}` on DB failure |
| **Pattern codified** | `KNOWN_PATTERNS.md` Pattern #12 — "Health endpoint must probe dependencies" |

---

## 3. Visual Style

**Cinematic.** Bold typography, gradient scene backdrops, dramatic inter-scene transitions. Closer to a product launch video than a screencast. No voiceover — text cards carry the narrative. Each scene transition uses a cinematic wipe or fade with the stage name as a full-screen title card.

**Colour palette:**
- Background: `#08080f` (near-black)
- Primary accent: `#6c63ff` (violet)
- Stage accents: per toolchain category (cyan=autopilot, green=TDD, amber=verify, red=patterns)
- Typography: **Inter** (loaded via `@remotion/google-fonts`) for all sans-serif; `JetBrains Mono` (Google Fonts) for code/tool names. Explicit fonts required — system fonts differ across macOS and Linux render environments.

---

## 4. Scene Breakdown — 10 Scenes (~3:00)

### Scene 01 — INBOX `0:00–0:18`
**Concept:** Cold open. A single line of plain text appears in a dark void — the raw note. No framing yet, no context. Just the signal.
**Visuals:** Cursor blink. Text types itself character by character. Then a beat of silence.
**Text card:** *"Every bug starts as a note."*

### Scene 02 — TRIAGE `0:18–0:35`
**Concept:** `/sh:triage` classifies the note. The raw line transforms — gains structure, a label, a home.
**Visuals:** Agent label appears. `Bug` tag snaps on. Card slides into `BACKLOG / Ideation` column.
**Tool shown:** `/sh:triage`
**Text card:** *"Classify. Prioritise. Route."*

### Scene 03 — BUSINESS PANEL `0:35–0:58`
**Concept:** Is this worth doing? The business panel runs impact, risk, and MoSCoW analysis. It concludes: Must Have, P1.
**Visuals:** Three analysis panels slide in — Impact, Risk, MoSCoW. Score bars animate. `Must Have` badge locks in.
**Tool shown:** `/sh:business-panel`
**Text card:** *"Silent failures are never low priority."*

### Scene 04 — BRAINSTORM + DESIGN `0:58–1:18`
**Concept:** Scope defined. Architecture decided. Acceptance criteria written. The vague bug becomes a spec.
**Visuals:** Branching diagram showing two approach options. One gets selected. AC lines appear one by one.
**Tools shown:** `/sh:brainstorm`, `/sh:design`
**Text card:** *"From symptom to solution."*

### Scene 05 — SPEC PANEL `1:18–1:40`
**Concept:** The spec faces a panel of expert reviewers. Each criterion scores. Aggregate: 8.2/10. Gate passed — item graduates to Ready.
**Visuals:** Score panel with animated bars per criterion. Aggregate counter ticks up to 8.2. `→ Ready` transition.
**Tool shown:** `/sh:spec-panel` (DOR gate)
**Text card:** *"Quality is a gate, not a hope."*

### Scene 06 — TDD LOOP `1:40–2:02`
**Concept:** Red → Green → Refactor. The fix written test-first. The failing test shown, the minimal implementation added, the refactor clean.
**Visuals:** Split screen — left: test file with red assertion. Right: implementation. Green flash on pass. Refactor pass shown.
**Tool shown:** `/sh:tdd`
**Text card:** *"Write the test. Then earn the green."*

### Scene 07 — VERIFY + REVIEW `2:02–2:22`
**Concept:** Evidence-based verification before anyone claims it's done. `/sh:verify` runs commands and confirms output. `/sh:review` checks for issues. DOD gate passes.
**Visuals:** Terminal output scrolling. Each check item ticking. DOD checklist filling green.
**Tools shown:** `/sh:verify`, `/sh:review`, DOD check
**Text card:** *"Done means proven, not assumed."*

### Scene 08 — SHIPPED `2:22–2:38`
**Concept:** `/sh:finish` commits, archives to DONE-Today, logs timestamp. The silent bug is closed.
**Visuals:** Commit message appears. DONE-Today entry with timestamp. A final `✓` on the original INBOX note.
**Tool shown:** `/sh:finish`
**Text card:** *"503. Bug closed. System honest."*

### Scene 09 — AUTOPILOT `2:38–2:50`
**Concept:** The loop doesn't stop. `.autopilot` semaphore is still `run`. The next item is picked up automatically — no human prompt needed.
**Visuals:** Queue advances. Next card highlights. Agent begins. The cycle restarts.
**Tool shown:** `.autopilot` semaphore, queue advance
**Text card:** *"The pipeline never waits."*

### Scene 10 — KNOWN PATTERNS `2:50–3:00`
**Concept:** The lesson is codified. `KNOWN_PATTERNS.md` opens. Pattern #12 appears. The bug didn't just get fixed — it got remembered.
**Visuals:** KNOWN_PATTERNS.md slides in. New row animates in. Row #12 highlighted.
**Tool shown:** `KNOWN_PATTERNS.md`
**Text card:** *"Fix the bug. Remember the lesson."*
**Final title card:** `agentflow — idea to production.`

---

## 5. Technical Spec

### Framework
- **Remotion ≥ 4.0** (React + TypeScript) with `remotion-best-practices` skill active
- Key packages: `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/transitions`
- Output: MP4, 1920×1080, 30fps
- Duration: ~180 seconds (5400 frames at 30fps)

### Project structure
```
remotion-video/
├── src/
│   ├── Root.tsx              # Composition registry
│   ├── AgentflowShowcase.tsx # Main composition (all 10 scenes)
│   ├── scenes/
│   │   ├── 01-Inbox.tsx
│   │   ├── 02-Triage.tsx
│   │   ├── 03-BusinessPanel.tsx
│   │   ├── 04-Brainstorm.tsx
│   │   ├── 05-SpecPanel.tsx
│   │   ├── 06-TDD.tsx
│   │   ├── 07-Verify.tsx
│   │   ├── 08-Shipped.tsx
│   │   ├── 09-Autopilot.tsx
│   │   └── 10-KnownPatterns.tsx
│   ├── components/
│   │   ├── TitleCard.tsx     # Full-screen stage title cards
│   │   ├── TerminalLine.tsx  # Animated monospace line
│   │   ├── ScoreBar.tsx      # Animated score bar (spec panel, biz panel)
│   │   ├── KanbanCard.tsx    # Pipeline card with motion
│   │   └── GradientScene.tsx # Reusable cinematic backdrop
│   └── lib/
│       ├── theme.ts          # Colours, fonts, easing curves
│       └── timing.ts         # Scene durations, frame offsets
└── public/
    └── (fonts, any static assets)
```

### Timing constants (`timing.ts`)
Each scene defined by `startFrame` and `durationFrames`. All scenes sum to 5400 frames. Transitions: 15-frame cross-fade between scenes.

### Animation principles
- **Entrances:** `spring()` with `stiffness: 80, damping: 14` for cards and panels
- **Text reveals:** `interpolate()` with frame-based character masking for typewriter effect
- **Score bars:** `interpolate()` from 0 to target over 30 frames, eased with `Easing.out(Easing.cubic)`
- **Scene transitions:** 15-frame cross-fade using `@remotion/transitions` `<TransitionSeries>` with `fade()` presenter. Each scene is a `<TransitionSeries.Sequence>`. This is the idiomatic Remotion 4.x pattern — do NOT use overlapping `<Sequence>` with manual opacity interpolation.

---

## 6. Acceptance Criteria

- [ ] Video renders to MP4 at 1920×1080, ~3 minutes
- [ ] All 10 scenes present with correct tool names and artefacts per Section 4
- [ ] Real source content used: INBOX.md line 4, BACKLOG.md US-DM-05 spec block, KNOWN_PATTERNS.md Pattern #12 row (paths relative to `10_agentflow-demo/`)
- [ ] Background colour is `#08080f`, primary accent is `#6c63ff`, title font-weight ≥ 700 — verified against `theme.ts`
- [ ] Each scene has a text card matching the exact copy in Section 4
- [ ] Scene 09 contains no cursor/click animation — queue advances without a human-initiated action element
- [ ] Scene 10 renders the actual Pattern #12 row text from KNOWN_PATTERNS.md highlighted
- [ ] All scene `durationFrames` values in `timing.ts` sum to exactly 5400
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npm run build` produces a clean bundle with no TypeScript errors
- [ ] No `useCurrentFrame` called outside a Remotion component; all assets via `staticFile()` or `delayRender()`

---

## 7. Source Material

All text content is sourced directly from the `10_agentflow-demo` repo — no fabrication.

| Scene | Source file | Content |
|---|---|---|
| 01 | `INBOX.md` line 8 | Raw bug note |
| 02–08 | `BACKLOG.md` US-DM-05 block | Spec, AC, status |
| 09 | `.autopilot` semaphore file | Value: `run` |
| 10 | `agentflow/KNOWN_PATTERNS.md` | Pattern #12 row |

---

## 8. Out of Scope

- Voiceover / audio
- Interactive elements
- Mobile format (vertical/square)
- Deployment to hosting — this spec covers local render to MP4 only
