"""Project Manager MCP server — SSE entrypoint for remote deployment."""
import uvicorn
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route

from server import app as mcp_app
import db

sse = SseServerTransport("/messages/")


async def handle_sse(request):
    async with sse.connect_sse(request.scope, request.receive, request._send) as (read, write):
        await mcp_app.run(read, write, mcp_app.create_initialization_options())


async def on_startup():
    await db.init_db()


starlette_app = Starlette(
    debug=False,
    on_startup=[on_startup],
    routes=[
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=sse.handle_post_message),
    ],
)

if __name__ == "__main__":
    uvicorn.run(starlette_app, host="0.0.0.0", port=8000)
