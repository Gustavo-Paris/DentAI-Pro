#!/usr/bin/env bash
# Hook: PostToolUse(Edit/Write) — typecheck affected files after edit.
# Runs ONLY when the edited file is in apps/web/src/ or supabase/functions/.
# Non-blocking: exits 0 for non-matching files, exit 2 with warning on errors.

set -euo pipefail

# Read tool result JSON from stdin
INPUT=$(cat)

# Extract the file path from the tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
print(ti.get('file_path', ''))" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Web app TypeScript files
if [[ "$FILE_PATH" == *"apps/web/src/"*".ts"* ]]; then
  cd "$(git rev-parse --show-toplevel)/apps/web"
  ERRORS=$(pnpm exec tsc --noEmit 2>&1 | grep -c "error TS" || true)
  if [ "$ERRORS" -gt 0 ]; then
    echo "⚠️  TypeScript: $ERRORS error(s) after editing $(basename "$FILE_PATH"). Run 'pnpm -C apps/web exec tsc --noEmit' to see details."
    exit 2
  fi
  exit 0
fi

# Edge functions (Deno)
if [[ "$FILE_PATH" == *"supabase/functions/"*".ts" ]]; then
  cd "$(git rev-parse --show-toplevel)/supabase/functions"
  ERRORS=$(deno check --no-lock "$FILE_PATH" 2>&1 | grep -c "error" || true)
  if [ "$ERRORS" -gt 0 ]; then
    echo "⚠️  Deno check: errors in $(basename "$FILE_PATH"). Run 'deno check --no-lock $FILE_PATH' to see details."
    exit 2
  fi
  exit 0
fi

exit 0
