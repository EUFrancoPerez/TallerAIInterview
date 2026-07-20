# In-Class Brief & Lab 01 — Working Notes

## Brief: Custom MCP Server + Workflow
Goal: build an MCP server exposing tools for an external system, wire it
into Claude Code, back it with a CLAUDE.md and commands that use those
tools, and demonstrate an end-to-end workflow.

Deliverables I'm tracking:
- [ ] Working MCP server (Python or TypeScript) — see `mcp-project-manager/`
- [ ] `.claude/` config: settings, commands, CLAUDE.md — see `.claude/`
- [ ] Demo recording/screenshots of the workflow

Workshop exercises to complete separately: rewrite a bloated CLAUDE.md
following the best-practice principles, and build out a full `.claude/`
config (settings + 2 commands + 1 hook + CLAUDE.md) against a sample repo.

## Lab 01: Build & Deploy a Custom MCP Server
Goal: a "Project Manager" MCP server with three tools — `create_task`,
`list_tasks`, `update_task` — backed by SQLite, runnable locally over stdio
and deployable over SSE (Railway/Render).

Progress checklist:
- [ ] Project scaffolded (`pyproject.toml`/`package.json`)
- [ ] Three tools defined with full JSON Schema inputs
- [ ] SQLite-backed handlers implemented
- [ ] `.mcp.json` wired up, `claude mcp list` shows the server
- [ ] Local test pass (create/list/update via Claude Code)
- [ ] SSE entrypoint deployed, `.mcp.json` updated to remote URL
