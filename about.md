---
schema_version: 1
app:
  name: "agentflow-demo"
  owners: ['@cto']
  repo: "/Users/jcords-macmini/projects/10_agentflow-demo"
  envs: ['dev']
about_last_reviewed: "2026-05-18"
about_review_cadence_days: 60
themes:
  - id: reliability
    metric: error_rate
    direction: down
    measurement_status: unmeasured
    metric_kind: quantitative
    anti_theme: "do not reduce safety checks (auth/validation) to improve uptime"
    signal_types: [logs, metrics, transcript]
    examples:
      - "repeated 5xx bursts, crash loops, or unexpected restarts"
      - "timeouts or retries spike on a key endpoint"
  - id: time_to_resolution
    metric: null
    direction: null
    measurement_status: unmeasured
    metric_kind: qualitative
    anti_theme: "do not increase operator cognitive load to appear 'more automated'"
    signal_types: [transcript, support_ticket]
    examples:
      - "operators cannot quickly diagnose failures"
      - "runbooks missing for common incidents"
  - id: cost_to_serve
    metric: usd_per_day
    direction: down
    measurement_status: unmeasured
    metric_kind: quantitative
    anti_theme: "do not lower cost by leaking sensitive data to external services"
    signal_types: [metrics, logs]
    examples:
      - "API/model costs rise without measurable outcome improvement"
      - "storage growth or compute usage is unbounded"
slo:
  availability:
    value: null
    measurement_status: unmeasured
  p95_latency_ms:
    value: null
    measurement_status: unmeasured
  error_budget_policy: "halt non-critical experiments when burn > 2x; prioritize reliability fixes"
scout:
  confidence_threshold: 0.6
  cooldown_hours: 72
  max_signals_per_run: 5
  dispatcher: paperclip
  triggers: [transcript_close, cron_6h]
  sinks:
    - kind: local_jsonl
      mode: always
      path: ./.innovation/pending.jsonl
guardrails:
  pii: "redact emails, phone numbers, full names before ingest"
  secrets: "never persist tokens/keys; entropy-detect and drop the record"
  cost_cap_usd_per_day: 50
  do_not_file:
    - "signal lacks a theme mapping"
    - "PII present after redaction attempt"
    - "evidence cannot be paraphrased without quoting raw text"
---

<!-- section:value_proposition v=1 -->
## Value Proposition
- Cross-project governance: central backlog, roadmap, known patterns, DOR/DOD checklists, agent capabilities, UX patterns, project registry, and historical archives
- Reliability and operator clarity are prioritized over fragile automation.
- Changes should be measurable against themes and SLOs once defined.

<!-- section:target_users v=1 -->
## Target Users & Use Cases
- Primary users: (to be refined).
- Core workflows: (to be refined).

<!-- section:inputs_outputs v=1 -->
## Inputs / Outputs
- Local port: `9127`
- Health endpoint: (to be specified)
- Data stores: (to be specified)
- Outputs: (to be specified)
- Integrations: (to be specified)

<!-- section:known_pain_points v=1 -->
## Known Pain Points
- (to be specified)

<!-- section:experiment_playbook v=1 -->
## Experiment Playbook

### safe_to_try
- Add structured logs/metrics around key flows.
- Improve error messages and runbooks.

### requires_approval
- Schema changes, data egress changes, or auth/trust-boundary changes.

<!-- section:feedback_intake v=1 -->
## Feedback & Intake
- Innovation Scout sink: `./.innovation/pending.jsonl`
- Escalate significant issues via Paperclip.
