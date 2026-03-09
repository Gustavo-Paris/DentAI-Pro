#!/usr/bin/env bash
# Typecheck with baseline — blocks commit only if error count INCREASES.
# Stores baseline in .tsc-baseline. Update with: scripts/typecheck-baseline.sh --update
set -euo pipefail

BASELINE_FILE="$(git rev-parse --show-toplevel)/.tsc-baseline"
BASELINE=0

if [ "${1:-}" = "--update" ]; then
  cd "$(git rev-parse --show-toplevel)/apps/web"
  COUNT=$(pnpm exec tsc -b --noEmit 2>&1 | grep -c "error TS" || true)
  echo "$COUNT" > "$BASELINE_FILE"
  echo "Baseline updated: $COUNT errors"
  exit 0
fi

if [ -f "$BASELINE_FILE" ]; then
  BASELINE=$(cat "$BASELINE_FILE")
fi

cd "$(git rev-parse --show-toplevel)/apps/web"
OUTPUT=$(pnpm exec tsc -b --noEmit 2>&1 || true)
CURRENT=$(echo "$OUTPUT" | grep -c "error TS" || true)

if [ "$CURRENT" -gt "$BASELINE" ]; then
  NEW_ERRORS=$((CURRENT - BASELINE))
  echo "TypeScript: $NEW_ERRORS NEW error(s) introduced (was $BASELINE, now $CURRENT)"
  echo ""
  # Show only new errors (heuristic: errors in staged files)
  STAGED=$(git diff --cached --name-only | grep '\.tsx\?\$' || true)
  if [ -n "$STAGED" ]; then
    for f in $STAGED; do
      echo "$OUTPUT" | grep "$(basename "$f")" || true
    done
  else
    echo "$OUTPUT" | tail -20
  fi
  exit 1
elif [ "$CURRENT" -lt "$BASELINE" ]; then
  echo "TypeScript: $CURRENT errors (improved from $BASELINE!)"
  # Auto-update baseline when errors decrease
  echo "$CURRENT" > "$BASELINE_FILE"
  exit 0
else
  exit 0
fi
