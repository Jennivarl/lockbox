import os
import aiosqlite

DB_PATH = os.getenv("DB_PATH", "ragevault.db")

SCHEMA = """
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
);

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
);

CREATE TABLE IF NOT EXISTS peers (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_lost      INTEGER NOT NULL DEFAULT 0,
    vaults_survived INTEGER NOT NULL DEFAULT 0,
    vaults_quit     INTEGER NOT NULL DEFAULT 0,
    vaults_created  INTEGER NOT NULL DEFAULT 0,
    joined_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reactive_events (
    id          TEXT PRIMARY KEY,
    rule_name   TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    summary     TEXT NOT NULL,
    payload     TEXT NOT NULL DEFAULT '{}',
    fired_at    TEXT NOT NULL
);
"""


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()
