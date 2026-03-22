## vexp — Context-Aware AI Coding <!-- vexp v0.0.0 -->

### MANDATORY: use vexp pipeline — do NOT grep or glob the codebase
For every task — bug fixes, features, refactors, debugging:
**call `run_pipeline` FIRST**. It executes context search + impact analysis +
memory recall in a single call, returning compressed results.

Do NOT use grep, glob, Bash, or cat to search/explore the codebase.
vexp returns pre-indexed, graph-ranked context that is more relevant and
uses fewer tokens than manual searching. Prefer `get_skeleton` over Read to
inspect files (detail: minimal/standard/detailed, 70-90% token savings).
Only use Read when you need exact raw content to edit a specific line.

### Primary Tool
- `run_pipeline` — **USE THIS FOR EVERYTHING**. Single call that runs
  capsule + impact + memory server-side. Returns compressed results.
  Auto-detects intent (debug/modify/refactor/explore) from your task.
  Includes full file content for pivots.

### Other MCP tools (use only when run_pipeline is insufficient)
- `get_context_capsule` — lightweight alternative for simple questions only
- `get_skeleton` — **preferred over Read** for inspecting files (70-90% token savings)
- `index_status` — indexing status and health check
- `get_session_context` — recall observations from current/previous sessions
- `search_memory` — cross-session search for past decisions
- `save_observation` — persist insights (prefer run_pipeline's observation param)

### Workflow
1. `run_pipeline("your task")` — ALWAYS FIRST
2. Need more detail? Use `get_skeleton({ files: [...], detail: "detailed" })`
3. Make targeted changes based on context returned
4. Do NOT chain multiple vexp calls — one `run_pipeline` replaces capsule + impact + memory

### Subagent / Explore / Plan mode
- Subagents CAN and MUST call `run_pipeline` — always include the task description
- The PreToolUse hook blocks Grep/Glob when vexp daemon is running
- Do NOT spawn Agent(Explore) to freely search — call `run_pipeline` first

## Philosophy
There are no solutions, only trade-offs.
