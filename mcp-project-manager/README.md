# mcp-project-manager

A custom MCP (Model Context Protocol) server built for Lab 01. It exposes
three tools — `create_task`, `list_tasks`, `update_task` — backed by
SQLite, and can run locally over stdio or be deployed remotely over SSE.

## Setup

```bash
uv sync
```

## Run locally (stdio)

```bash
uv run server.py
```

This will hang waiting for stdio input from an MCP client — that's expected.
Register it with Claude Code via `.mcp.json` (see the file in this folder,
update `cwd` to the absolute path on your machine), then restart Claude Code
and run `claude mcp list` to confirm it's registered.

## Try it in Claude Code

- "Create a task called 'Set up CI/CD pipeline' with high priority"
- "List all tasks"
- "Update task 1 to in_progress"
- "Show me all high priority tasks that are still todo"

Inspect the database directly with:

```bash
sqlite3 tasks.db "SELECT * FROM tasks;"
```

## Deploy remotely (SSE)

```bash
uv run sse_server.py
```

This starts a Starlette app on `0.0.0.0:8000` exposing `GET /sse` and
`POST /messages/`. Deploy it to Railway or Render, then point `.mcp.json`
at the deployed URL:

```json
{
  "mcpServers": {
    "project-manager": {
      "type": "sse",
      "url": "https://your-app.example.com/sse"
    }
  }
}
```

## Files

- `server.py` — stdio MCP entrypoint and tool definitions/handlers
- `sse_server.py` — SSE entrypoint for remote deployment
- `db.py` — SQLite schema and CRUD functions
- `pyproject.toml` — dependencies
- `.mcp.json` — local Claude Code registration (stdio)
