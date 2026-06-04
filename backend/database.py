import os
import re
import asyncpg
from loguru import logger

_pool: asyncpg.Pool | None = None

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS vaults (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        description     TEXT NOT NULL,
        type            TEXT NOT NULL CHECK(type IN ('savings','accountability','dao','vesting')),
        buy_in          INTEGER NOT NULL,
        max_members     INTEGER NOT NULL,
        penalty_pct     INTEGER NOT NULL DEFAULT 20,
        min_lock_hours  INTEGER NOT NULL DEFAULT 48,
        deadline        TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'filling'
                            CHECK(status IN ('filling','active','completed','dead')),
        creator_id      TEXT NOT NULL,
        creator_name    TEXT NOT NULL,
        pot_total       INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS members (
        id              TEXT PRIMARY KEY,
        vault_id        TEXT NOT NULL REFERENCES vaults(id),
        peer_id         TEXT NOT NULL,
        peer_name       TEXT NOT NULL,
        amount_locked   INTEGER NOT NULL,
        amount_expected INTEGER NOT NULL,
        joined_at       TEXT NOT NULL,
        quit_at         TEXT DEFAULT NULL,
        status          TEXT NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','quit','paid'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS peers (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        total_earned    INTEGER NOT NULL DEFAULT 0,
        total_lost      INTEGER NOT NULL DEFAULT 0,
        vaults_survived INTEGER NOT NULL DEFAULT 0,
        vaults_quit     INTEGER NOT NULL DEFAULT 0,
        vaults_created  INTEGER NOT NULL DEFAULT 0,
        joined_at       TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reactive_events (
        id          TEXT PRIMARY KEY,
        rule_name   TEXT NOT NULL,
        event_type  TEXT NOT NULL,
        summary     TEXT NOT NULL,
        payload     TEXT NOT NULL DEFAULT '{}',
        fired_at    TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS invites (
        id          TEXT PRIMARY KEY,
        vault_id    TEXT NOT NULL REFERENCES vaults(id),
        peer_id     TEXT NOT NULL,
        peer_name   TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','accepted','rejected')),
        created_at  TEXT NOT NULL,
        resolved_at TEXT DEFAULT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
        id          TEXT PRIMARY KEY,
        vault_id    TEXT NOT NULL REFERENCES vaults(id),
        peer_id     TEXT NOT NULL,
        peer_name   TEXT NOT NULL,
        content     TEXT NOT NULL,
        created_at  TEXT NOT NULL
    )
    """,
]


def _to_pg(query: str, params) -> tuple[str, list]:
    """Convert SQLite ? or :name placeholders to PostgreSQL $N."""
    if isinstance(params, dict):
        values: list = []
        def replace_named(m: re.Match) -> str:
            values.append(params[m.group(1)])
            return f"${len(values)}"
        return re.sub(r":(\w+)", replace_named, query), values
    else:
        n = 0
        def replace_pos(m: re.Match) -> str:
            nonlocal n
            n += 1
            return f"${n}"
        return re.sub(r"\?", replace_pos, query), list(params)


class _Cursor:
    def __init__(self, rows: list[dict]):
        self._rows = rows

    async def fetchone(self):
        return self._rows[0] if self._rows else None

    async def fetchall(self):
        return self._rows


class _ExecCtx:
    """Supports both `await db.execute(...)` and `async with db.execute(...) as cur:`."""

    def __init__(self, conn: asyncpg.Connection, query: str, params):
        self._conn = conn
        self._query = query
        self._params = params

    async def __aenter__(self) -> _Cursor:
        pg_q, pg_p = _to_pg(self._query, self._params)
        if pg_q.strip().upper().startswith("SELECT"):
            rows = [dict(r) for r in await self._conn.fetch(pg_q, *pg_p)]
        else:
            await self._conn.execute(pg_q, *pg_p)
            rows = []
        return _Cursor(rows)

    async def __aexit__(self, *_):
        pass

    def __await__(self):
        return self._run().__await__()

    async def _run(self):
        pg_q, pg_p = _to_pg(self._query, self._params)
        await self._conn.execute(pg_q, *pg_p)


class DBConn:
    def __init__(self, conn: asyncpg.Connection):
        self._conn = conn

    def execute(self, query: str, params=()) -> _ExecCtx:
        return _ExecCtx(self._conn, query, params)

    async def commit(self) -> None:
        pass  # asyncpg auto-commits each statement outside a transaction block

    async def close(self) -> None:
        await _pool.release(self._conn)  # type: ignore[union-attr]


async def get_db() -> DBConn:
    assert _pool is not None, "Pool not initialised — call init_db() first"
    conn = await _pool.acquire()
    return DBConn(conn)


async def init_db() -> None:
    global _pool
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    _pool = await asyncpg.create_pool(url, min_size=2, max_size=10)
    async with _pool.acquire() as conn:
        for stmt in SCHEMA:
            await conn.execute(stmt)
    logger.info("[DB] PostgreSQL pool ready")
