#!/usr/bin/env bash
# Hook: PostToolUse(Edit/Write) — run Deno prompt regression tests
# when a prompt definition file is edited.
# Triggers ONLY for files in supabase/functions/_shared/prompts/

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

# Only trigger for prompt files
if [[ "$FILE_PATH" != *"_shared/prompts/"* ]]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)/supabase/functions"

echo "Running prompt regression tests..."
RESULT=$(deno test --allow-read --allow-env --allow-net _shared/prompts/prompts.test.ts 2>&1) || true

FAILURES=$(echo "$RESULT" | grep -c "FAILED" || true)
if [ "$FAILURES" -gt 0 ]; then
  FAIL_LINES=$(echo "$RESULT" | grep "FAILED" | head -5)
  echo "⚠️  Prompt regression: $FAILURES test(s) FAILED after editing $(basename "$FILE_PATH"):"
  echo "$FAIL_LINES"
  exit 2
fi

PASSES=$(echo "$RESULT" | grep -oE "[0-9]+ passed" | head -1 || echo "unknown")
echo "✓ Prompt tests: $PASSES"
exit 0
