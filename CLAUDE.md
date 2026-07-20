# CLAUDE.md

This repository holds Day 1 onboarding notes and lab work for the "Claude Code
Mastery & Context Engineering" course.

## What this repo is
- Mostly notes and reference templates about Claude Code, not a shipped app.
- `mcp-project-manager/` is the one runnable piece of code (Lab 01 MCP server).

## Conventions
- Notes live in `notes/`, one markdown file per topic, named `NN-topic.md`.
- CLAUDE.md templates for other stacks live in `examples/claude-md-templates/`
  — reference only, not this project's own config.
- The working Claude Code config for this repo lives in `.claude/`.

## When working in mcp-project-manager/
- Python 3.11+, dependencies managed with `uv` (see `pyproject.toml`).
- `server.py` is the stdio entrypoint, `sse_server.py` is the deployable
  HTTP/SSE entrypoint, `db.py` is the SQLite persistence layer.
- Keep the three tools (`create_task`, `list_tasks`, `update_task`) and their
  JSON Schemas in sync between `server.py`'s tool definitions and `db.py`'s
  validation logic.
- Run `uv run server.py` to test locally over stdio.

## Git
- Conventional commit prefixes: feat:, fix:, docs:, chore:.
