"""
Demo seed data — 16 vaults: 4 types × 4 states.
"""
import json
import uuid
from datetime import datetime, timezone, timedelta

from database import get_db


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
    db = await get_db()
    try:
        async with db.execute("SELECT COUNT(*) AS n FROM vaults") as cur:
            if (await cur.fetchone())["n"] > 0:
                return  # already seeded

        # ── Peers ──────────────────────────────────────────────────────────────
        peers = [
            ("peer-alice",  "alice.eth",    0,      0,    0, 0, 2, _ago(days=30)),
            ("peer-bob",    "bob.eth",      0,      0,    0, 0, 1, _ago(days=28)),
            ("peer-carol",  "carol.eth",    0,      0,    0, 0, 1, _ago(days=25)),
            ("peer-dave",   "dave.eth",     0,      0,    0, 0, 0, _ago(days=20)),
            ("peer-eve",    "eve.eth",      750,    250,  0, 2, 0, _ago(days=15)),
            ("peer-frank",  "frank.eth",    500,   2000,  2, 2, 1, _ago(days=40)),
            ("peer-grace",  "grace.eth",    500,   2000,  2, 2, 1, _ago(days=40)),
            ("peer-henry",  "henry.eth",    500,   2000,  1, 2, 1, _ago(days=40)),
            ("peer-rialo",  "Rialo DAO",    0,      0,    2, 0, 3, _ago(days=60)),
            ("peer-ivan",   "ivan.eth",     2400,   600,  1, 1, 0, _ago(days=18)),
            ("peer-julia",  "julia.eth",    5000,     0,  1, 0, 1, _ago(days=33)),
            ("peer-kai",    "kai.eth",      5000,     0,  1, 0, 1, _ago(days=22)),
            ("peer-luna",   "luna.eth",     5000,     0,  1, 0, 0, _ago(days=14)),
            ("peer-marco",  "marco.eth",    0,      0,    1, 1, 2, _ago(days=35)),
            ("peer-nadia",  "nadia.eth",   20000,   0,    2, 0, 1, _ago(days=12)),
            ("peer-oscar",  "oscar.eth",    2000,   0,    1, 0, 1, _ago(days=50)),
        ]
        for p in peers:
            await db.execute("INSERT INTO peers VALUES (?,?,?,?,?,?,?,?)", p)

        # ══════════════════════════════════════════════════════════════════════
        # S1 — SAVINGS / filling (4/5)
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
            ("peer-alice", "alice.eth", 48), ("peer-bob", "bob.eth", 36),
            ("peer-carol", "carol.eth", 24), ("peer-dave", "dave.eth", 12),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v1, pid, name, 2500, 2500, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'alice.eth joined "Bali Trip 2026"',
            {"vault_id": v1, "pot_total": 2500}, _ago(hours=48))
        await _evt(db, "member_joined", "notification", 'bob.eth joined "Bali Trip 2026"',
            {"vault_id": v1, "pot_total": 5000}, _ago(hours=36))
        await _evt(db, "member_joined", "notification", 'carol.eth joined "Bali Trip 2026"',
            {"vault_id": v1, "pot_total": 7500}, _ago(hours=24))
        await _evt(db, "member_joined", "notification", 'dave.eth joined "Bali Trip 2026"',
            {"vault_id": v1, "pot_total": 10000}, _ago(hours=12))

        # ══════════════════════════════════════════════════════════════════════
        # S2 — SAVINGS / active (2 rage quits already)
        # 4×3000=12000. eve quit: penalty=600, refund=2400. ivan quit: penalty=600.
        # bob+carol each gained 200+200=400 → expected=3400. pot=4800+800(penalty stays).
        # ══════════════════════════════════════════════════════════════════════
        v2 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v2, "Emergency Nest Egg",
             "4 wallets commit 3,000 RIAO each to a shared emergency fund. "
             "Tap out early and your 20% penalty goes to those who held strong.",
             "savings", 3000, 4, 20, 24, _from_now(days=45),
             "active", "peer-bob", "bob.eth", 4800, _ago(days=6)),
        )
        for pid, name, expected in [
            ("peer-bob", "bob.eth", 3400), ("peer-carol", "carol.eth", 3400),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v2, pid, name, 3000, expected, _ago(days=6), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v2, "peer-eve", "eve.eth", 3000, 2400, _ago(days=6), _ago(days=4), "quit"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v2, "peer-ivan", "ivan.eth", 3000, 2400, _ago(days=6), _ago(days=2), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"Emergency Nest Egg" is FULL — vault locked, 12,000 RIAO at stake.',
            {"vault_id": v2, "pot_total": 12000}, _ago(days=6))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 eve.eth RAGE QUIT \"Emergency Nest Egg\" — lost 600 RIAO (20% penalty)",
            {"vault_id": v2, "quitter": "eve.eth", "penalty": 600, "refund": 2400}, _ago(days=4))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 ivan.eth RAGE QUIT \"Emergency Nest Egg\" — lost 600 RIAO (20% penalty)",
            {"vault_id": v2, "quitter": "ivan.eth", "penalty": 600, "refund": 2400}, _ago(days=2))

        # ══════════════════════════════════════════════════════════════════════
        # S3 — SAVINGS / completed
        # ══════════════════════════════════════════════════════════════════════
        v3 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v3, "Down Payment Club",
             "3 friends lock 5,000 RIAO each to stay committed to saving for their "
             "first property. All three survived and got paid in full.",
             "savings", 5000, 3, 15, 48, _ago(days=3),
             "completed", "peer-julia", "julia.eth", 0, _ago(days=33)),
        )
        for pid, name in [
            ("peer-julia", "julia.eth"), ("peer-kai", "kai.eth"), ("peer-luna", "luna.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v3, pid, name, 5000, 5000, _ago(days=33), None, "paid"))
        await _evt(db, "vault_activated", "announcement",
            '"Down Payment Club" is FULL — vault locked, 15,000 RIAO at stake.',
            {"vault_id": v3}, _ago(days=33))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Down Payment Club" completed — 3 survivors paid out 15,000 RIAO total',
            {"vault_id": v3, "survivors": ["julia.eth", "kai.eth", "luna.eth"],
             "total_paid": 15000,
             "payouts": [{"peer": "julia.eth", "amount": 5000},
                         {"peer": "kai.eth", "amount": 5000},
                         {"peer": "luna.eth", "amount": 5000}]},
            _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # S4 — SAVINGS / dead
        # ══════════════════════════════════════════════════════════════════════
        v4 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v4, "Ibiza Summer '25",
             "4 party animals locked 1,500 RIAO each for an Ibiza trip fund. "
             "One by one they all caved. The vault is dead.",
             "savings", 1500, 4, 25, 12, _ago(hours=6),
             "dead", "peer-marco", "marco.eth", 0, _ago(days=8)),
        )
        for pid, name, quit_h in [
            ("peer-marco", "marco.eth", 7 * 24), ("peer-nadia", "nadia.eth", 5 * 24),
            ("peer-oscar", "oscar.eth", 3 * 24), ("peer-alice", "alice.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v4, pid, name, 1500, 1125, _ago(days=8), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"Ibiza Summer \'25" is FULL — vault locked, 6,000 RIAO at stake.',
            {"vault_id": v4}, _ago(days=8))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 marco.eth RAGE QUIT \"Ibiza Summer '25\" — lost 375 RIAO", {"vault_id": v4}, _ago(hours=7 * 24))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 nadia.eth RAGE QUIT \"Ibiza Summer '25\" — lost 375 RIAO", {"vault_id": v4}, _ago(hours=5 * 24))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 oscar.eth RAGE QUIT \"Ibiza Summer '25\" — lost 375 RIAO", {"vault_id": v4}, _ago(hours=3 * 24))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 alice.eth RAGE QUIT \"Ibiza Summer '25\" — last one out", {"vault_id": v4}, _ago(hours=24))
        await _evt(db, "vault_dead", "announcement",
            "☠️ \"Ibiza Summer '25\" died — all 4 quit before the deadline",
            {"vault_id": v4}, _ago(hours=6))

        # ══════════════════════════════════════════════════════════════════════
        # A1 — ACCOUNTABILITY / filling (2/4)
        # ══════════════════════════════════════════════════════════════════════
        v5 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v5, "No-Code Ship Challenge",
             "4 builders lock 800 RIAO each to ship a working product in 21 days. "
             "No excuses. Quit and lose 30% to the builders who shipped.",
             "accountability", 800, 4, 30, 24, _from_now(days=21),
             "filling", "peer-kai", "kai.eth", 1600, _ago(hours=6)),
        )
        for pid, name, h in [("peer-kai", "kai.eth", 6), ("peer-luna", "luna.eth", 3)]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v5, pid, name, 800, 800, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'kai.eth joined "No-Code Ship Challenge"',
            {"vault_id": v5, "pot_total": 800}, _ago(hours=6))
        await _evt(db, "member_joined", "notification", 'luna.eth joined "No-Code Ship Challenge"',
            {"vault_id": v5, "pot_total": 1600}, _ago(hours=3))

        # ══════════════════════════════════════════════════════════════════════
        # A2 — ACCOUNTABILITY / active (1 rage quit)
        # ══════════════════════════════════════════════════════════════════════
        v6 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v6, "30-Day Gym Pact",
             "4 people. 30 days. Gym every day. Miss a day, you can rage quit — "
             "but you lose 25% to everyone who actually showed up.",
             "accountability", 1000, 4, 25, 24, _from_now(days=20),
             "active", "peer-carol", "carol.eth", 3250, _ago(days=5)),
        )
        for pid, name, expected in [
            ("peer-carol", "carol.eth", 1084), ("peer-dave", "dave.eth", 1083),
            ("peer-frank", "frank.eth", 1083),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v6, pid, name, 1000, expected, _ago(days=5), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v6, "peer-eve", "eve.eth", 1000, 750, _ago(days=5), _ago(days=3), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"30-Day Gym Pact" is FULL — vault locked, countdown started. 4,000 RIAO at stake.',
            {"vault_id": v6, "pot_total": 4000}, _ago(days=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 eve.eth RAGE QUIT \"30-Day Gym Pact\" — lost 250 RIAO (25% penalty), split among 3 survivors",
            {"vault_id": v6, "quitter": "eve.eth", "penalty": 250, "refund": 750,
             "each_survivor_gains": 83}, _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # A3 — ACCOUNTABILITY / completed
        # ══════════════════════════════════════════════════════════════════════
        v7 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v7, "Study Streak",
             "3 devs commit to 2 hours of study every day for 30 days. "
             "All three made it. Full payout.",
             "accountability", 500, 3, 20, 24, _ago(days=1),
             "completed", "peer-frank", "frank.eth", 0, _ago(days=31)),
        )
        for pid, name in [
            ("peer-frank", "frank.eth"), ("peer-grace", "grace.eth"), ("peer-henry", "henry.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v7, pid, name, 500, 500, _ago(days=31), None, "paid"))
        await _evt(db, "vault_activated", "announcement",
            '"Study Streak" is FULL — vault locked, 1,500 RIAO at stake.',
            {"vault_id": v7}, _ago(days=31))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Study Streak" completed — 3 survivors paid out 1,500 RIAO total',
            {"vault_id": v7, "survivors": ["frank.eth", "grace.eth", "henry.eth"],
             "total_paid": 1500,
             "payouts": [{"peer": "frank.eth", "amount": 500},
                         {"peer": "grace.eth", "amount": 500},
                         {"peer": "henry.eth", "amount": 500}]},
            _ago(days=1))

        # ══════════════════════════════════════════════════════════════════════
        # A4 — ACCOUNTABILITY / dead
        # ══════════════════════════════════════════════════════════════════════
        v8 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v8, "Morning Run Squad",
             "5 people committed to waking up at 6 am for 30 days. "
             "The snooze button won. Everyone rage quit before the deadline.",
             "accountability", 400, 5, 20, 12, _ago(hours=8),
             "dead", "peer-ivan", "ivan.eth", 0, _ago(days=12)),
        )
        for pid, name, quit_h in [
            ("peer-ivan", "ivan.eth", 11 * 24), ("peer-julia", "julia.eth", 8 * 24),
            ("peer-kai", "kai.eth", 6 * 24), ("peer-luna", "luna.eth", 3 * 24),
            ("peer-nadia", "nadia.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v8, pid, name, 400, 320, _ago(days=12), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"Morning Run Squad" is FULL — vault locked, 2,000 RIAO at stake.',
            {"vault_id": v8}, _ago(days=12))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "Morning Run Squad" died — all 5 hit snooze before the deadline',
            {"vault_id": v8}, _ago(hours=8))

        # ══════════════════════════════════════════════════════════════════════
        # D1 — DAO / filling (3/6)
        # ══════════════════════════════════════════════════════════════════════
        v9 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v9, "Protocol v2 Treasury",
             "6 core contributors lock 8,000 RIAO each to signal conviction on the v2 "
             "mainnet launch. Anyone who bails before mainnet loses 25% to the team.",
             "dao", 8000, 6, 25, 72, _from_now(days=60),
             "filling", "peer-rialo", "Rialo DAO", 24000, _ago(days=3)),
        )
        for pid, name, h in [
            ("peer-rialo", "Rialo DAO", 72), ("peer-alice", "alice.eth", 48), ("peer-bob", "bob.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v9, pid, name, 8000, 8000, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'Rialo DAO joined "Protocol v2 Treasury"',
            {"vault_id": v9, "pot_total": 8000}, _ago(hours=72))
        await _evt(db, "member_joined", "notification", 'alice.eth joined "Protocol v2 Treasury"',
            {"vault_id": v9, "pot_total": 16000}, _ago(hours=48))
        await _evt(db, "member_joined", "notification", 'bob.eth joined "Protocol v2 Treasury"',
            {"vault_id": v9, "pot_total": 24000}, _ago(hours=24))

        # ══════════════════════════════════════════════════════════════════════
        # D2 — DAO / active (deadline in 10 mins — demo fast-forward target)
        # ══════════════════════════════════════════════════════════════════════
        v10 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v10, "Q3 Launch Lock",
             "Rialo DAO and three core contributors lock 5,000 RIAO each until Q3 ships. "
             "Anyone who rage quits loses 30% to the team that delivered.",
             "dao", 5000, 4, 30, 72, _from_now(minutes=10),
             "active", "peer-rialo", "Rialo DAO", 20000, _ago(hours=10)),
        )
        for pid, name in [
            ("peer-rialo", "Rialo DAO"), ("peer-alice", "alice.eth"),
            ("peer-bob", "bob.eth"), ("peer-carol", "carol.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v10, pid, name, 5000, 5000, _ago(hours=10), None, "active"))
        await _evt(db, "vault_activated", "announcement",
            '"Q3 Launch Lock" is FULL — vault locked, countdown started. 20,000 RIAO at stake.',
            {"vault_id": v10, "pot_total": 20000, "deadline": _from_now(minutes=10)},
            _ago(hours=10))

        # ══════════════════════════════════════════════════════════════════════
        # D3 — DAO / completed
        # ══════════════════════════════════════════════════════════════════════
        v11 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v11, "Governance Multisig",
             "5 DAO multisig signers locked 2,000 RIAO each to ratify the governance "
             "charter. All five held until ratification. Fully paid out.",
             "dao", 2000, 5, 20, 48, _ago(days=5),
             "completed", "peer-oscar", "oscar.eth", 0, _ago(days=35)),
        )
        for pid, name in [
            ("peer-oscar", "oscar.eth"), ("peer-marco", "marco.eth"), ("peer-nadia", "nadia.eth"),
            ("peer-rialo", "Rialo DAO"), ("peer-alice", "alice.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v11, pid, name, 2000, 2000, _ago(days=35), None, "paid"))
        await _evt(db, "vault_activated", "announcement",
            '"Governance Multisig" is FULL — vault locked, 10,000 RIAO at stake.',
            {"vault_id": v11}, _ago(days=35))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Governance Multisig" completed — 5 signers paid out 10,000 RIAO total',
            {"vault_id": v11,
             "survivors": ["oscar.eth", "marco.eth", "nadia.eth", "Rialo DAO", "alice.eth"],
             "total_paid": 10000,
             "payouts": [{"peer": n, "amount": 2000} for n in
                         ["oscar.eth", "marco.eth", "nadia.eth", "Rialo DAO", "alice.eth"]]},
            _ago(days=5))

        # ══════════════════════════════════════════════════════════════════════
        # D4 — DAO / dead
        # ══════════════════════════════════════════════════════════════════════
        v12 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v12, "DAO Summer Grants",
             "3 grant committee members locked 4,000 RIAO each to commit to "
             "the Q2 grants program. Internal conflict killed it. All quit.",
             "dao", 4000, 3, 30, 48, _ago(hours=12),
             "dead", "peer-marco", "marco.eth", 0, _ago(days=14)),
        )
        for pid, name, quit_h in [
            ("peer-marco", "marco.eth", 10 * 24),
            ("peer-nadia", "nadia.eth", 6 * 24),
            ("peer-oscar", "oscar.eth", 3 * 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v12, pid, name, 4000, 2800, _ago(days=14), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"DAO Summer Grants" is FULL — vault locked, 12,000 RIAO at stake.',
            {"vault_id": v12}, _ago(days=14))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 marco.eth RAGE QUIT \"DAO Summer Grants\" — lost 1,200 RIAO",
            {"vault_id": v12, "quitter": "marco.eth", "penalty": 1200}, _ago(hours=10 * 24))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 nadia.eth RAGE QUIT \"DAO Summer Grants\" — lost 1,200 RIAO",
            {"vault_id": v12, "quitter": "nadia.eth", "penalty": 1200}, _ago(hours=6 * 24))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 oscar.eth RAGE QUIT \"DAO Summer Grants\" — last one standing, vault collapsed",
            {"vault_id": v12, "quitter": "oscar.eth", "penalty": 1200}, _ago(hours=3 * 24))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "DAO Summer Grants" died — the committee dissolved',
            {"vault_id": v12}, _ago(hours=12))

        # ══════════════════════════════════════════════════════════════════════
        # V1 — VESTING / filling (1/3)
        # ══════════════════════════════════════════════════════════════════════
        v13 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v13, "Founder Lockup A",
             "3 co-founders lock 15,000 RIAO each as a public commitment to stay "
             "for 12 months. Walk early and lose 30% to your co-founders.",
             "vesting", 15000, 3, 30, 0, _from_now(days=365),
             "filling", "peer-henry", "henry.eth", 15000, _ago(hours=2)),
        )
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v13, "peer-henry", "henry.eth", 15000, 15000, _ago(hours=2), None, "active"))
        await _evt(db, "member_joined", "notification", 'henry.eth joined "Founder Lockup A"',
            {"vault_id": v13, "pot_total": 15000}, _ago(hours=2))

        # ══════════════════════════════════════════════════════════════════════
        # V2 — VESTING / active
        # ══════════════════════════════════════════════════════════════════════
        v14 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v14, "Seed Round Commitment",
             "4 angel investors lock 10,000 RIAO each to signal long-term conviction "
             "in the project. Rage quit before TGE and lose 20% to believers.",
             "vesting", 10000, 4, 20, 168, _from_now(days=90),
             "active", "peer-grace", "grace.eth", 40000, _ago(days=7)),
        )
        for pid, name in [
            ("peer-grace", "grace.eth"), ("peer-frank", "frank.eth"),
            ("peer-oscar", "oscar.eth"), ("peer-marco", "marco.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v14, pid, name, 10000, 10000, _ago(days=7), None, "active"))
        await _evt(db, "vault_activated", "announcement",
            '"Seed Round Commitment" is FULL — vault locked, 40,000 RIAO at stake.',
            {"vault_id": v14, "pot_total": 40000}, _ago(days=7))

        # ══════════════════════════════════════════════════════════════════════
        # V3 — VESTING / completed
        # ══════════════════════════════════════════════════════════════════════
        v15 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v15, "Series A Vest Lock",
             "3 investors committed to a 6-month lockup of 20,000 RIAO each. "
             "All three held through volatility. Fully paid out at expiry.",
             "vesting", 20000, 3, 20, 0, _ago(days=2),
             "completed", "peer-nadia", "nadia.eth", 0, _ago(days=182)),
        )
        for pid, name in [
            ("peer-nadia", "nadia.eth"), ("peer-ivan", "ivan.eth"), ("peer-julia", "julia.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v15, pid, name, 20000, 20000, _ago(days=182), None, "paid"))
        await _evt(db, "vault_activated", "announcement",
            '"Series A Vest Lock" is FULL — vault locked, 60,000 RIAO at stake.',
            {"vault_id": v15}, _ago(days=182))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Series A Vest Lock" completed — 3 investors paid out 60,000 RIAO total',
            {"vault_id": v15,
             "survivors": ["nadia.eth", "ivan.eth", "julia.eth"],
             "total_paid": 60000,
             "payouts": [{"peer": "nadia.eth", "amount": 20000},
                         {"peer": "ivan.eth", "amount": 20000},
                         {"peer": "julia.eth", "amount": 20000}]},
            _ago(days=2))

        # ══════════════════════════════════════════════════════════════════════
        # V4 — VESTING / dead
        # ══════════════════════════════════════════════════════════════════════
        v16 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v16, "The Abandoned Protocol",
             "Three founders locked 10,000 RIAO each as a commitment to ship. "
             "One by one, they all rage quit. The vault died.",
             "vesting", 10000, 3, 20, 0, _ago(hours=1),
             "dead", "peer-henry", "henry.eth", 0, _ago(days=10)),
        )
        for pid, name, quit_h in [
            ("peer-henry", "henry.eth", 8), ("peer-grace", "grace.eth", 5), ("peer-frank", "frank.eth", 2),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v16, pid, name, 10000, 8000, _ago(days=10), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"The Abandoned Protocol" is FULL — vault locked. 30,000 RIAO at stake.',
            {"vault_id": v16}, _ago(days=10))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 henry.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO (20% penalty)",
            {"vault_id": v16, "quitter": "henry.eth", "penalty": 2000, "refund": 8000},
            _ago(hours=8))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 grace.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO (20% penalty)",
            {"vault_id": v16, "quitter": "grace.eth", "penalty": 2000, "refund": 8000},
            _ago(hours=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 frank.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO (20% penalty)",
            {"vault_id": v16, "quitter": "frank.eth", "penalty": 2000, "refund": 8000},
            _ago(hours=2))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "The Abandoned Protocol" died — everyone rage quit before the deadline',
            {"vault_id": v16}, _ago(hours=1))

        await db.commit()
    finally:
        await db.close()
