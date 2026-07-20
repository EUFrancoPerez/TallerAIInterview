#!/bin/bash
# Auto-format a file right after Claude edits it.
FILE_PATH="$CLAUDE_TOOL_ARG_FILE_PATH"

if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null
elif [[ "$FILE_PATH" == *.py ]]; then
  ruff format "$FILE_PATH" 2>/dev/null
fi
