"""Project Manager MCP server — stdio entrypoint (Lab 01)."""
import asyncio
import json

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

import db

app = Server("project-manager")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="create_task",
            description=(
                "Create a new project task. Use this when the user asks to "
                "add, log, or track a new piece of work."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short task title"},
                    "description": {"type": "string", "description": "Optional longer description"},
                    "priority": {
                        "type": "string",
                        "enum": list(db.VALID_PRIORITIES),
                        "description": "How urgent the task is",
                    },
                },
                "required": ["title", "priority"],
            },
        ),
        Tool(
            name="list_tasks",
            description=(
                "List existing tasks, optionally filtered by status and/or "
                "priority. Use this to answer questions about what work exists."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": list(db.VALID_STATUSES)},
                    "priority": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                },
            },
        ),
        Tool(
            name="update_task",
            description="Update the status of an existing task by its numeric ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "description": "Task ID"},
                    "status": {"type": "string", "enum": list(db.VALID_STATUSES)},
                },
                "required": ["id", "status"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        if name == "create_task":
            task = await db.create_task(
                title=arguments["title"],
                description=arguments.get("description", ""),
                priority=arguments["priority"],
            )
            return [TextContent(type="text", text=json.dumps(task, indent=2))]

        if name == "list_tasks":
            tasks = await db.list_tasks(
                status=arguments.get("status"),
                priority=arguments.get("priority"),
            )
            return [TextContent(type="text", text=json.dumps(tasks, indent=2))]

        if name == "update_task":
            task = await db.update_task(arguments["id"], arguments["status"])
            if task is None:
                return [TextContent(type="text", text=f"Error: task {arguments['id']} not found")]
            return [TextContent(type="text", text=json.dumps(task, indent=2))]

        return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except ValueError as exc:
        return [TextContent(type="text", text=f"Error: {exc}")]


async def main() -> None:
    await db.init_db()
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
