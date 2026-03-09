#!/usr/bin/env bash
# Hook: PostToolUse(Edit/Write) — typecheck affected files after edit.
# Uses baseline approach: only warns if error count INCREASES.
# Non-blocking for non-matching files (exit 0).

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
print(ti.get('file_path', ''))" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel)"

# Web app TypeScript files
if [[ "$FILE_PATH" == *"apps/web/src/"*".ts"* ]]; then
  BASELINE_FILE="$ROOT/.tsc-baseline"
  BASELINE=0
  if [ -f "$BASELINE_FILE" ]; then
    BASELINE=$(cat "$BASELINE_FILE")
  fi

  cd "$ROOT/apps/web"
  CURRENT=$(pnpm exec tsc -b --noEmit 2>&1 | grep -c "error TS" || true)

  if [ "$CURRENT" -gt "$BASELINE" ]; then
    NEW=$((CURRENT - BASELINE))
    echo "TypeScript: $NEW NEW error(s) after editing $(basename "$FILE_PATH") (was $BASELINE, now $CURRENT)."
    exit 2
  fi
  exit 0
fi

# Edge functions (Deno)
if [[ "$FILE_PATH" == *"supabase/functions/"*".ts" ]]; then
  cd "$ROOT/supabase/functions"
  ERRORS=$(deno check --no-lock "$FILE_PATH" 2>&1 | grep -c "error" || true)
  if [ "$ERRORS" -gt 0 ]; then
    echo "Deno check: errors in $(basename "$FILE_PATH"). Run 'deno check --no-lock $FILE_PATH'."
    exit 2
  fi
  exit 0
fi

exit 0
