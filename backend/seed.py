"""
Demo seed data — 5 vaults covering every state the platform can be in.
"""
import json
import uuid
from datetime import datetime, timezone, timedelta

import aiosqlite

from database import DB_PATH, SCHEMA


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _ago(**kw) -> str:
    return (datetime.now(timezone.utc) - timedelta(**kw)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _from_now(**kw) -> str:
    return (datetime.now(timezone.utc) + timedelta(**kw)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _id() -> str:
    return str(uuid.uuid4())


async def _evt(db, rule_name, event_type, summary, payload, fired_at=None):
    await db.execute(
        "INSERT INTO reactive_events VALUES (?,?,?,?,?,?)",
        (_id(), rule_name, event_type, summary, json.dumps(payload), fired_at or _now()),
    )


async def seed():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.executescript(SCHEMA)

        async with db.execute("SELECT COUNT(*) AS n FROM vaults") as cur:
            if (await cur.fetchone())["n"] > 0:
                return  # already seeded

        # ── Peers ──────────────────────────────────────────────────────────────
        # (id, name, earned, lost, survived, quit, created, joined_at)
        peers = [
            ("peer-alice",  "alice.eth",    0,     0,    0, 0, 1, _ago(days=30)),
            ("peer-bob",    "bob.eth",      0,     0,    0, 0, 0, _ago(days=28)),
            ("peer-carol",  "carol.eth",    0,     0,    0, 0, 1, _ago(days=25)),
            ("peer-dave",   "dave.eth",     0,     0,    0, 0, 0, _ago(days=20)),
            ("peer-eve",    "eve.eth",      750,   250,  0, 1, 0, _ago(days=15)),
            ("peer-frank",  "frank.eth",    500,   2000, 1, 1, 0, _ago(days=40)),
            ("peer-grace",  "grace.eth",    500,   2000, 1, 1, 0, _ago(days=40)),
            ("peer-henry",  "henry.eth",    500,   2000, 1, 1, 1, _ago(days=40)),
            ("peer-rialo",  "Rialo DAO",    0,     0,    0, 0, 1, _ago(days=60)),
        ]
        for p in peers:
            await db.execute("INSERT INTO peers VALUES (?,?,?,?,?,?,?,?)", p)

        # ══════════════════════════════════════════════════════════════════════
        # VAULT 1 — Bali Trip 2026
        # State: filling (4/5) — 1 open slot, joinable live during demo
        # ══════════════════════════════════════════════════════════════════════
        v1 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v1, "Bali Trip 2026",
             "5 friends commit to saving 2,500 RIAO each for the Bali trip. "
             "Bail early and lose 20% to everyone who stayed.",
             "savings", 2500, 5, 20, 48, _from_now(days=30),
             "filling", "peer-alice", "alice.eth", 10000, _ago(days=2)),
        )
        for pid, name, h in [
            ("peer-alice", "alice.eth", 48),
            ("peer-bob",   "bob.eth",   36),
            ("peer-carol", "carol.eth", 24),
            ("peer-dave",  "dave.eth",  12),
        ]:
            await db.execute(
                "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v1, pid, name, 2500, 2500, _ago(hours=h), None, "active"),
            )
        await _evt(db, "member_joined", "notification",
                   'alice.eth joined "Bali Trip 2026" — 2,500 RIAO locked',
                   {"vault_id": v1, "pot_total": 2500}, _ago(hours=48))
        await _evt(db, "member_joined", "notification",
                   'bob.eth joined "Bali Trip 2026" — 5,000 RIAO locked',
                   {"vault_id": v1, "pot_total": 5000}, _ago(hours=36))
        await _evt(db, "member_joined", "notification",
                   'carol.eth joined "Bali Trip 2026" — 7,500 RIAO locked',
                   {"vault_id": v1, "pot_total": 7500}, _ago(hours=24))
        await _evt(db, "member_joined", "notification",
                   'dave.eth joined "Bali Trip 2026" — 10,000 RIAO locked',
                   {"vault_id": v1, "pot_total": 10000}, _ago(hours=12))

        # ══════════════════════════════════════════════════════════════════════
        # VAULT 2 — 30-Day Gym Pact
        # State: active, 1 rage quit already fired
        # Demo: shows the pot redistribute moment has already happened
        # Math: 4×1000=4000. eve quit → penalty=250, refund=750.
        #       250 split 3 ways → carol=+84, dave=+83, frank=+83
        # ══════════════════════════════════════════════════════════════════════
        v2 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v2, "30-Day Gym Pact",
             "4 people. 30 days. Gym every day. Miss a day, you can rage quit — "
             "but you lose 25% to everyone who actually showed up.",
             "accountability", 1000, 4, 25, 24, _from_now(days=20),
             "active", "peer-carol", "carol.eth", 3250, _ago(days=5)),
        )
        for pid, name, expected in [
            ("peer-carol", "carol.eth", 1084),
            ("peer-dave",  "dave.eth",  1083),
            ("peer-frank", "frank.eth", 1083),
        ]:
            await db.execute(
                "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v2, pid, name, 1000, expected, _ago(days=5), None, "active"),
            )
        # eve already quit
        await db.execute(
            "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v2, "peer-eve", "eve.eth", 1000, 750, _ago(days=5), _ago(days=3), "quit"),
        )
        await _evt(db, "vault_activated", "announcement",
                   '"30-Day Gym Pact" is FULL — vault locked, countdown started. 4,000 RIAO at stake.',
                   {"vault_id": v2, "pot_total": 4000}, _ago(days=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
                   '💀 eve.eth RAGE QUIT "30-Day Gym Pact" — lost 250 RIAO (25% penalty), split among 3 survivors',
                   {"vault_id": v2, "quitter": "eve.eth", "penalty": 250,
                    "refund": 750, "each_survivor_gains": 83}, _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # VAULT 3 — Q3 Launch Lock
        # State: active, deadline in 10 minutes — perfect for fast-forward demo
        # ══════════════════════════════════════════════════════════════════════
        v3 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v3, "Q3 Launch Lock",
             "Rialo DAO and three core contributors lock 5,000 RIAO each until Q3 ships. "
             "Anyone who rage quits loses 30% to the team that delivered.",
             "dao", 5000, 4, 30, 72, _from_now(minutes=10),
             "active", "peer-rialo", "Rialo DAO", 20000, _ago(hours=10)),
        )
        for pid, name in [
            ("peer-rialo", "Rialo DAO"),
            ("peer-alice", "alice.eth"),
            ("peer-bob",   "bob.eth"),
            ("peer-carol", "carol.eth"),
        ]:
            await db.execute(
                "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v3, pid, name, 5000, 5000, _ago(hours=10), None, "active"),
            )
        await _evt(db, "vault_activated", "announcement",
                   '"Q3 Launch Lock" is FULL — vault locked, countdown started. 20,000 RIAO at stake.',
                   {"vault_id": v3, "pot_total": 20000, "deadline": _from_now(minutes=10)},
                   _ago(hours=10))

        # ══════════════════════════════════════════════════════════════════════
        # VAULT 4 — Study Streak
        # State: completed — all 3 survived, shows what winning looks like
        # ══════════════════════════════════════════════════════════════════════
        v4 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v4, "Study Streak",
             "3 devs commit to 2 hours of study every day for 30 days. "
             "All three made it. Full payout.",
             "accountability", 500, 3, 20, 24, _ago(days=1),
             "completed", "peer-frank", "frank.eth", 0, _ago(days=31)),
        )
        for pid, name in [
            ("peer-frank", "frank.eth"),
            ("peer-grace", "grace.eth"),
            ("peer-henry", "henry.eth"),
        ]:
            await db.execute(
                "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v4, pid, name, 500, 500, _ago(days=31), None, "paid"),
            )
        await _evt(db, "vault_activated", "announcement",
                   '"Study Streak" is FULL — vault locked, countdown started. 1,500 RIAO at stake.',
                   {"vault_id": v4}, _ago(days=31))
        await _evt(db, "vault_completed", "payout",
                   '🏆 "Study Streak" completed — 3 survivors paid out 1,500 RIAO total',
                   {"vault_id": v4, "survivors": ["frank.eth", "grace.eth", "henry.eth"],
                    "total_paid": 1500,
                    "payouts": [{"peer": "frank.eth", "amount": 500},
                                {"peer": "grace.eth", "amount": 500},
                                {"peer": "henry.eth", "amount": 500}]},
                   _ago(days=1))

        # ══════════════════════════════════════════════════════════════════════
        # VAULT 5 — The Abandoned Protocol
        # State: dead — everyone rage quit before the deadline
        # ══════════════════════════════════════════════════════════════════════
        v5 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v5, "The Abandoned Protocol",
             "Three founders locked 10,000 RIAO each as a commitment to ship. "
             "One by one, they all rage quit. The vault died.",
             "vesting", 10000, 3, 20, 0, _ago(hours=1),
             "dead", "peer-henry", "henry.eth", 0, _ago(days=10)),
        )
        for pid, name, quit_h in [
            ("peer-henry", "henry.eth", 8),
            ("peer-grace",  "grace.eth",  5),
            ("peer-frank",  "frank.eth",  2),
        ]:
            await db.execute(
                "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v5, pid, name, 10000, 8000, _ago(days=10), _ago(hours=quit_h), "quit"),
            )
        await _evt(db, "vault_activated", "announcement",
                   '"The Abandoned Protocol" is FULL — vault locked. 30,000 RIAO at stake.',
                   {"vault_id": v5}, _ago(days=10))
        await _evt(db, "rage_quit_approved", "rage_quit",
                   '💀 henry.eth RAGE QUIT "The Abandoned Protocol" — lost 2,000 RIAO (20% penalty)',
                   {"vault_id": v5, "quitter": "henry.eth", "penalty": 2000, "refund": 8000},
                   _ago(hours=8))
        await _evt(db, "rage_quit_approved", "rage_quit",
                   '💀 grace.eth RAGE QUIT "The Abandoned Protocol" — lost 2,000 RIAO (20% penalty)',
                   {"vault_id": v5, "quitter": "grace.eth", "penalty": 2000, "refund": 8000},
                   _ago(hours=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
                   '💀 frank.eth RAGE QUIT "The Abandoned Protocol" — lost 2,000 RIAO (20% penalty)',
                   {"vault_id": v5, "quitter": "frank.eth", "penalty": 2000, "refund": 8000},
                   _ago(hours=2))
        await _evt(db, "vault_dead", "announcement",
                   '☠️ "The Abandoned Protocol" died — everyone rage quit before the deadline',
                   {"vault_id": v5}, _ago(hours=1))

        await db.commit()
