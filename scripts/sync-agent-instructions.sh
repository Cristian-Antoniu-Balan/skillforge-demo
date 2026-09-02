#!/usr/bin/env bash
# Sync docs/agent-instructions.md to all agent instruction targets.
# Usage: ./scripts/sync-agent-instructions.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="$ROOT_DIR/docs/agent-instructions.md"

TARGETS=(
  "$ROOT_DIR/AGENTS.md"
  "$ROOT_DIR/CLAUDE.md"
  "$ROOT_DIR/.github/copilot-instructions.md"
)

HEADER="<!-- AUTO-GENERATED — do not edit directly.
     Edit docs/agent-instructions.md and run: ./scripts/sync-agent-instructions.sh -->
"

if [[ ! -f "$SOURCE" ]]; then
  echo "Error: source file not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/.github"

for target in "${TARGETS[@]}"; do
  {
    printf '%s\n' "$HEADER"
    cat "$SOURCE"
  } > "$target"
  echo "Synced → $target"
done

echo "Done. All agent instruction files are in sync."
