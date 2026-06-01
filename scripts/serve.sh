#!/usr/bin/env bash
# Launch agentflow-demo on its portmgr-assigned port (9127).
# Override with PORT env var.
set -e
cd "$(dirname "$0")/.."
PORT="${PORT:-9127}"
HOST="${HOST:-127.0.0.1}"
exec uvicorn app.main:app --host "$HOST" --port "$PORT" "$@"
