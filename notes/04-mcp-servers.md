# MCP Servers

The Model Context Protocol (MCP) is an open standard letting an AI host
(like Claude Code) talk to external systems through a consistent interface
— tools, resources, and prompts — instead of bespoke integrations per
system. Three pieces cooperate: the **host** (the AI application), the
**client** (built into the host, manages server connections), and the
**server** (your code, exposing capabilities).

Two transports are common: `stdio` for local servers and CLI tools, and
`SSE` (Server-Sent Events over HTTP) for remote or shared services. Servers
are registered in `.mcp.json` or `.claude/settings.json` under
`mcpServers`, either with a `command`/`args` pair (stdio) or a `url` (SSE).

Useful off-the-shelf servers include browser-inspection tools (e.g. Chrome
DevTools MCP, Playwright MCP) and database servers (e.g. Postgres MCP), plus
whatever custom internal servers your team needs (API gateways, feature
flags, deployment pipelines, monitoring).

See `mcp-project-manager/` for a full custom server built for this course's
Lab 01.
