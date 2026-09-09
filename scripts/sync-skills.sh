#!/usr/bin/env bash
# Sync .claude/skills/ → .github/skills/ (identical mirrors).
# Usage:
#   ./scripts/sync-skills.sh          # copy all skills
#   ./scripts/sync-skills.sh --check  # exit 1 if mirrors differ

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_ROOT="$ROOT_DIR/.claude/skills"
TARGET_ROOT="$ROOT_DIR/.github/skills"

CHECK_ONLY=0
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=1
elif [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--check]" >&2
  exit 2
fi

if [[ ! -d "$SOURCE_ROOT" ]]; then
  echo "Error: source skills directory not found: $SOURCE_ROOT" >&2
  exit 1
fi

shopt -s nullglob
skill_dirs=("$SOURCE_ROOT"/*/)
if [[ ${#skill_dirs[@]} -eq 0 ]]; then
  echo "Error: no skills under $SOURCE_ROOT" >&2
  exit 1
fi

diffs=0

for src_dir in "${skill_dirs[@]}"; do
  name="$(basename "$src_dir")"
  src_file="$src_dir/SKILL.md"
  dst_dir="$TARGET_ROOT/$name"
  dst_file="$dst_dir/SKILL.md"

  if [[ ! -f "$src_file" ]]; then
    echo "Error: missing $src_file" >&2
    exit 1
  fi

  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    if [[ ! -f "$dst_file" ]]; then
      echo "Missing mirror: $dst_file"
      diffs=1
      continue
    fi
    if ! cmp -s "$src_file" "$dst_file"; then
      echo "Out of sync: $name"
      diffs=1
    else
      echo "OK: $name"
    fi
  else
    mkdir -p "$dst_dir"
    cp "$src_file" "$dst_file"
    echo "Synced → $dst_file"
  fi
done

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  if [[ "$diffs" -ne 0 ]]; then
    echo "Skills mirror is out of date. Run: ./scripts/sync-skills.sh" >&2
    exit 1
  fi
  echo "Done. All skill mirrors match."
  exit 0
fi

echo "Done. All skills mirrored to .github/skills/."
