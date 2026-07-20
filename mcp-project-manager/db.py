"""SQLite persistence layer for the Project Manager MCP server."""
import aiosqlite
from datetime import datetime, timezone

DB_PATH = "tasks.db"
VALID_PRIORITIES = ("low", "medium", "high", "critical")
VALID_STATUSES = ("todo", "in_progress", "done")


async def init_db(db_path: str = DB_PATH) -> None:
    async with aiosqlite.connect(db_path) as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                priority TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'todo',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        await conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_task(title: str, description: str = "", priority: str = "medium",
                       db_path: str = DB_PATH) -> dict:
    if priority not in VALID_PRIORITIES:
        raise ValueError(f"priority must be one of {VALID_PRIORITIES}")
    now = _now()
    async with aiosqlite.connect(db_path) as conn:
        cursor = await conn.execute(
            """INSERT INTO tasks (title, description, priority, status, created_at, updated_at)
               VALUES (?, ?, ?, 'todo', ?, ?)""",
            (title, description, priority, now, now),
        )
        await conn.commit()
        task_id = cursor.lastrowid
    return await get_task(task_id, db_path=db_path)


async def get_task(task_id: int, db_path: str = DB_PATH) -> dict | None:
    async with aiosqlite.connect(db_path) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def list_tasks(status: str | None = None, priority: str | None = None,
                      db_path: str = DB_PATH) -> list[dict]:
    query = "SELECT * FROM tasks WHERE 1=1"
    params: list[str] = []
    if status:
        if status not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        query += " AND status = ?"
        params.append(status)
    if priority:
        if priority not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {VALID_PRIORITIES}")
        query += " AND priority = ?"
        params.append(priority)
    query += " ORDER BY id DESC"

    async with aiosqlite.connect(db_path) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def update_task(task_id: int, status: str, db_path: str = DB_PATH) -> dict | None:
    if status not in VALID_STATUSES:
        raise ValueError(f"status must be one of {VALID_STATUSES}")
    async with aiosqlite.connect(db_path) as conn:
        await conn.execute(
            "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?",
            (status, _now(), task_id),
        )
        await conn.commit()
    return await get_task(task_id, db_path=db_path)
