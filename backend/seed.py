"""
Demo seed data — 27 vaults: mixed types, states, and themes including World Cup 2026.
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
                return

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
            ("peer-petra",  "petra.eth",    0,      0,    0, 0, 0, _ago(days=10)),
            ("peer-quinn",  "quinn.eth",    0,      0,    0, 0, 0, _ago(days=8)),
            ("peer-raj",    "raj.eth",      0,      0,    0, 0, 1, _ago(days=17)),
            ("peer-sara",   "sara.eth",     0,      0,    0, 0, 0, _ago(days=6)),
        ]
        for p in peers:
            await db.execute("INSERT INTO peers VALUES (?,?,?,?,?,?,?,?)", p)

        # ══════════════════════════════════════════════════════════════════════
        # 1. SAVINGS / active — World Cup 2026 Road Trip
        # 6 fans locking 3,000 RIAO to fund travel to the USA. 1 quit already.
        # ══════════════════════════════════════════════════════════════════════
        v1 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v1, "World Cup 2026 Road Trip",
             "6 football fans lock 3,000 RIAO each to commit to the journey to the "
             "USA for the 2026 World Cup. Back out and lose 25% to those making the trip.",
             "savings", 3000, 6, 25, 48, _from_now(days=20),
             "active", "peer-raj", "raj.eth", 13500, _ago(days=8)),
        )
        for pid, name, expected in [
            ("peer-raj",   "raj.eth",   3250), ("peer-petra", "petra.eth", 3250),
            ("peer-quinn", "quinn.eth", 3250), ("peer-sara",  "sara.eth",  3250),
            ("peer-alice", "alice.eth", 3250),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v1, pid, name, 3000, expected, _ago(days=8), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v1, "peer-bob", "bob.eth", 3000, 2250, _ago(days=8), _ago(days=3), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"World Cup 2026 Road Trip" is FULL — 18,000 RIAO at stake. Vamos!',
            {"vault_id": v1, "pot_total": 18000}, _ago(days=8))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 bob.eth RAGE QUIT \"World Cup 2026 Road Trip\" — couldn't commit to the trip",
            {"vault_id": v1, "quitter": "bob.eth", "penalty": 750, "refund": 2250}, _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # 2. ACCOUNTABILITY / filling — Build in Public 90 Days
        # ══════════════════════════════════════════════════════════════════════
        v2 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v2, "Build in Public 90 Days",
             "5 indie makers lock 600 RIAO each to commit to posting daily build updates "
             "for 90 days. Go silent and lose 20% to the builders who kept shipping.",
             "accountability", 600, 5, 20, 24, _from_now(days=90),
             "filling", "peer-petra", "petra.eth", 1800, _ago(minutes=35)),
        )
        for pid, name, h in [
            ("peer-petra", "petra.eth", 10), ("peer-quinn", "quinn.eth", 7), ("peer-raj", "raj.eth", 3),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v2, pid, name, 600, 600, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'petra.eth joined "Build in Public 90 Days"',
            {"vault_id": v2, "pot_total": 600}, _ago(hours=10))
        await _evt(db, "member_joined", "notification", 'quinn.eth joined "Build in Public 90 Days"',
            {"vault_id": v2, "pot_total": 1200}, _ago(hours=7))
        await _evt(db, "member_joined", "notification", 'raj.eth joined "Build in Public 90 Days"',
            {"vault_id": v2, "pot_total": 1800}, _ago(hours=3))

        # ══════════════════════════════════════════════════════════════════════
        # 3. ACCOUNTABILITY / filling — World Cup Final Prediction Pact
        # ══════════════════════════════════════════════════════════════════════
        v3 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v3, "World Cup Final Prediction Pact",
             "5 football fanatics each lock 3,000 RIAO on their World Cup final pick. "
             "Hold your prediction until the final whistle — bottle it early and lose "
             "30% to those who kept the faith.",
             "accountability", 3000, 5, 30, 48, _from_now(days=47),
             "filling", "peer-rialo", "Rialo DAO", 6000, _ago(minutes=5)),
        )
        for pid, name, h in [
            ("peer-rialo", "Rialo DAO", 48), ("peer-raj", "raj.eth", 20),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v3, pid, name, 3000, 3000, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'Rialo DAO joined "World Cup Final Prediction Pact"',
            {"vault_id": v3, "pot_total": 3000}, _ago(hours=48))
        await _evt(db, "member_joined", "notification", 'raj.eth joined "World Cup Final Prediction Pact"',
            {"vault_id": v3, "pot_total": 6000}, _ago(hours=20))

        # ══════════════════════════════════════════════════════════════════════
        # 4. VESTING / active — Angel Syndicate Lock
        # 4 angels locked for 180 days. 1 quit early.
        # ══════════════════════════════════════════════════════════════════════
        v4 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v4, "Angel Syndicate Lock",
             "4 angel investors lock 12,000 RIAO each for 180 days to signal "
             "long-term conviction. Break the pact early and lose 20% to the believers.",
             "vesting", 12000, 4, 20, 336, _from_now(days=130),
             "active", "peer-oscar", "oscar.eth", 28800, _ago(days=50)),
        )
        for pid, name, expected in [
            ("peer-oscar", "oscar.eth", 12800), ("peer-marco", "marco.eth", 12800),
            ("peer-nadia", "nadia.eth", 12800),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v4, pid, name, 12000, expected, _ago(days=50), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v4, "peer-julia", "julia.eth", 12000, 9600, _ago(days=50), _ago(days=20), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"Angel Syndicate Lock" is FULL — 48,000 RIAO committed.',
            {"vault_id": v4, "pot_total": 48000}, _ago(days=50))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 julia.eth RAGE QUIT \"Angel Syndicate Lock\" — lost 2,400 RIAO (20% penalty)",
            {"vault_id": v4, "quitter": "julia.eth", "penalty": 2400, "refund": 9600}, _ago(days=20))

        # ══════════════════════════════════════════════════════════════════════
        # 5. SAVINGS / filling — Bali Trip 2026
        # ══════════════════════════════════════════════════════════════════════
        v5 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v5, "Bali Trip 2026",
             "5 friends commit to saving 2,500 RIAO each for the Bali trip. "
             "Bail early and lose 20% to everyone who stayed.",
             "savings", 2500, 5, 20, 48, _from_now(days=30),
             "filling", "peer-alice", "alice.eth", 10000, _ago(minutes=20)),
        )
        for pid, name, h in [
            ("peer-alice", "alice.eth", 48), ("peer-bob", "bob.eth", 36),
            ("peer-carol", "carol.eth", 24), ("peer-dave", "dave.eth", 12),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v5, pid, name, 2500, 2500, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'alice.eth joined "Bali Trip 2026"',
            {"vault_id": v5, "pot_total": 2500}, _ago(hours=48))
        await _evt(db, "member_joined", "notification", 'dave.eth joined "Bali Trip 2026"',
            {"vault_id": v5, "pot_total": 10000}, _ago(hours=12))

        # ══════════════════════════════════════════════════════════════════════
        # 6. ACCOUNTABILITY / active — World Cup Prediction Pact
        # 6 friends locked predicting the WC winner. 2 quit after their teams crashed out.
        # ══════════════════════════════════════════════════════════════════════
        v6 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v6, "World Cup Prediction Pact",
             "6 fans each lock 500 RIAO and commit to their World Cup winner pick. "
             "If your team exits and you rage quit, lose 25% to those who held their nerve.",
             "accountability", 500, 6, 25, 12, _from_now(days=15),
             "active", "peer-carol", "carol.eth", 2250, _ago(days=12)),
        )
        for pid, name, expected in [
            ("peer-carol", "carol.eth", 625), ("peer-dave",  "dave.eth",  625),
            ("peer-petra", "petra.eth", 625), ("peer-quinn", "quinn.eth", 625),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v6, pid, name, 500, expected, _ago(days=12), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v6, "peer-eve", "eve.eth", 500, 375, _ago(days=12), _ago(days=7), "quit"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v6, "peer-ivan", "ivan.eth", 500, 375, _ago(days=12), _ago(days=4), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"World Cup Prediction Pact" FULL — 3,000 RIAO on the line.',
            {"vault_id": v6, "pot_total": 3000}, _ago(days=12))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 eve.eth RAGE QUIT \"World Cup Prediction Pact\" — team knocked out in group stage",
            {"vault_id": v6, "quitter": "eve.eth", "penalty": 125}, _ago(days=7))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 ivan.eth RAGE QUIT \"World Cup Prediction Pact\" — couldn't watch anymore",
            {"vault_id": v6, "quitter": "ivan.eth", "penalty": 125}, _ago(days=4))

        # ══════════════════════════════════════════════════════════════════════
        # 7. DAO / active — Q3 Launch Lock (10-min deadline — DEMO TARGET)
        # ══════════════════════════════════════════════════════════════════════
        v7 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v7, "Q3 Launch Lock",
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
                (_id(), v7, pid, name, 5000, 5000, _ago(hours=10), None, "active"))
        await _evt(db, "vault_activated", "announcement",
            '"Q3 Launch Lock" is FULL — vault locked. 20,000 RIAO at stake.',
            {"vault_id": v7, "pot_total": 20000, "deadline": _from_now(minutes=10)}, _ago(hours=10))

        # ══════════════════════════════════════════════════════════════════════
        # 8. VESTING / filling — Founder Lockup A
        # ══════════════════════════════════════════════════════════════════════
        v8 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v8, "Founder Lockup A",
             "3 co-founders lock 15,000 RIAO each as a public commitment to stay "
             "for 12 months. Walk early and lose 30% to your co-founders.",
             "vesting", 15000, 3, 30, 0, _from_now(days=365),
             "filling", "peer-henry", "henry.eth", 15000, _ago(hours=1, minutes=20)),
        )
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v8, "peer-henry", "henry.eth", 15000, 15000, _ago(hours=2), None, "active"))
        await _evt(db, "member_joined", "notification", 'henry.eth joined "Founder Lockup A"',
            {"vault_id": v8, "pot_total": 15000}, _ago(hours=2))

        # ══════════════════════════════════════════════════════════════════════
        # 9. SAVINGS / completed — World Cup Ticket Syndicate
        # 4 friends saved for tickets. All survived.
        # ══════════════════════════════════════════════════════════════════════
        v9 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v9, "World Cup Ticket Syndicate",
             "4 friends locked 4,000 RIAO each to stay committed to buying World Cup 2026 "
             "tickets together. All four held — tickets secured, memories guaranteed.",
             "savings", 4000, 4, 20, 48, _ago(days=5),
             "completed", "peer-quinn", "quinn.eth", 0, _ago(days=35)),
        )
        for pid, name in [
            ("peer-quinn", "quinn.eth"), ("peer-sara", "sara.eth"),
            ("peer-petra", "petra.eth"), ("peer-raj", "raj.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v9, pid, name, 4000, 4000, _ago(days=35), None, "paid"))
        await _evt(db, "vault_completed", "payout",
            '🏆 "World Cup Ticket Syndicate" — 4 fans paid out 16,000 RIAO. See you in the USA!',
            {"vault_id": v9, "survivors": ["quinn.eth","sara.eth","petra.eth","raj.eth"],
             "total_paid": 16000}, _ago(days=5))

        # ══════════════════════════════════════════════════════════════════════
        # 10. ACCOUNTABILITY / active — 30-Day Gym Pact
        # ══════════════════════════════════════════════════════════════════════
        v10 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v10, "30-Day Gym Pact",
             "4 people. 30 days. Gym every day. Miss a day, you can rage quit — "
             "but you lose 25% to everyone who actually showed up.",
             "accountability", 1000, 4, 25, 24, _from_now(days=20),
             "active", "peer-carol", "carol.eth", 3250, _ago(days=5)),
        )
        for pid, name, expected in [
            ("peer-carol", "carol.eth", 1084), ("peer-dave",  "dave.eth",  1083),
            ("peer-frank", "frank.eth", 1083),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v10, pid, name, 1000, expected, _ago(days=5), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v10, "peer-eve", "eve.eth", 1000, 750, _ago(days=5), _ago(days=3), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"30-Day Gym Pact" FULL — 4,000 RIAO at stake.',
            {"vault_id": v10, "pot_total": 4000}, _ago(days=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 eve.eth RAGE QUIT \"30-Day Gym Pact\" — lost 250 RIAO (25% penalty)",
            {"vault_id": v10, "quitter": "eve.eth", "penalty": 250}, _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # 11. DAO / filling — Protocol v2 Treasury
        # ══════════════════════════════════════════════════════════════════════
        v11 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v11, "Protocol v2 Treasury",
             "6 core contributors lock 8,000 RIAO each to signal conviction on the v2 "
             "mainnet launch. Anyone who bails before mainnet loses 25% to the team.",
             "dao", 8000, 6, 25, 72, _from_now(days=60),
             "filling", "peer-rialo", "Rialo DAO", 24000, _ago(minutes=50)),
        )
        for pid, name, h in [
            ("peer-rialo", "Rialo DAO", 72), ("peer-alice", "alice.eth", 48), ("peer-bob", "bob.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v11, pid, name, 8000, 8000, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'Rialo DAO joined "Protocol v2 Treasury"',
            {"vault_id": v11, "pot_total": 8000}, _ago(hours=72))

        # ══════════════════════════════════════════════════════════════════════
        # 12. ACCOUNTABILITY / dead — World Cup Fantasy League
        # Everyone quit after their picks flopped in the group stage.
        # ══════════════════════════════════════════════════════════════════════
        v12 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v12, "World Cup Fantasy League",
             "5 fantasy football managers locked 300 RIAO each to commit to the full "
             "tournament. Every single one rage quit after their squads flopped.",
             "accountability", 300, 5, 20, 12, _ago(hours=10),
             "dead", "peer-ivan", "ivan.eth", 0, _ago(days=9)),
        )
        for pid, name, quit_h in [
            ("peer-ivan",  "ivan.eth",  8*24), ("peer-julia", "julia.eth", 6*24),
            ("peer-kai",   "kai.eth",   4*24), ("peer-luna",  "luna.eth",  2*24),
            ("peer-marco", "marco.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v12, pid, name, 300, 240, _ago(days=9), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "World Cup Fantasy League" died — every manager rage quit after the group stage',
            {"vault_id": v12}, _ago(hours=10))

        # ══════════════════════════════════════════════════════════════════════
        # 13. SAVINGS / active — Emergency Nest Egg
        # ══════════════════════════════════════════════════════════════════════
        v13 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v13, "Emergency Nest Egg",
             "4 wallets commit 3,000 RIAO each to a shared emergency fund. "
             "Tap out early and your 20% penalty goes to those who held strong.",
             "savings", 3000, 4, 20, 24, _from_now(days=45),
             "active", "peer-bob", "bob.eth", 4800, _ago(days=6)),
        )
        for pid, name, expected in [
            ("peer-bob", "bob.eth", 3400), ("peer-carol", "carol.eth", 3400),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v13, pid, name, 3000, expected, _ago(days=6), None, "active"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v13, "peer-eve", "eve.eth", 3000, 2400, _ago(days=6), _ago(days=4), "quit"))
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v13, "peer-ivan", "ivan.eth", 3000, 2400, _ago(days=6), _ago(days=2), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"Emergency Nest Egg" FULL — 12,000 RIAO at stake.',
            {"vault_id": v13, "pot_total": 12000}, _ago(days=6))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 eve.eth RAGE QUIT \"Emergency Nest Egg\" — lost 600 RIAO",
            {"vault_id": v13, "quitter": "eve.eth", "penalty": 600}, _ago(days=4))

        # ══════════════════════════════════════════════════════════════════════
        # 14. VESTING / filling — Podcast Season 2 Lock
        # ══════════════════════════════════════════════════════════════════════
        v14 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v14, "Podcast Season 2 Lock",
             "4 content creators lock 1,200 RIAO each to commit to shipping 10 "
             "episodes of their show. Go dark before it's done and lose 25% to your co-hosts.",
             "accountability", 1200, 4, 25, 24, _from_now(days=60),
             "filling", "peer-sara", "sara.eth", 2400, _ago(hours=1, minutes=5)),
        )
        for pid, name, h in [("peer-sara", "sara.eth", 5), ("peer-petra", "petra.eth", 2)]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v14, pid, name, 1200, 1200, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'sara.eth joined "Podcast Season 2 Lock"',
            {"vault_id": v14, "pot_total": 1200}, _ago(hours=5))

        # ══════════════════════════════════════════════════════════════════════
        # 15. DAO / completed — Governance Multisig
        # ══════════════════════════════════════════════════════════════════════
        v15 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v15, "Governance Multisig",
             "5 DAO multisig signers locked 2,000 RIAO each to ratify the governance "
             "charter. All five held until ratification. Fully paid out.",
             "dao", 2000, 5, 20, 48, _ago(days=5),
             "completed", "peer-oscar", "oscar.eth", 0, _ago(days=35)),
        )
        for pid, name in [
            ("peer-oscar","oscar.eth"), ("peer-marco","marco.eth"), ("peer-nadia","nadia.eth"),
            ("peer-rialo","Rialo DAO"), ("peer-alice","alice.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v15, pid, name, 2000, 2000, _ago(days=35), None, "paid"))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Governance Multisig" — 5 signers paid out 10,000 RIAO total',
            {"vault_id": v15, "survivors": ["oscar.eth","marco.eth","nadia.eth","Rialo DAO","alice.eth"],
             "total_paid": 10000}, _ago(days=5))

        # ══════════════════════════════════════════════════════════════════════
        # 16. ACCOUNTABILITY / filling — No-Code Ship Challenge
        # ══════════════════════════════════════════════════════════════════════
        v16 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v16, "No-Code Ship Challenge",
             "4 builders lock 800 RIAO each to ship a working product in 21 days. "
             "No excuses. Quit and lose 30% to the builders who shipped.",
             "accountability", 800, 4, 30, 24, _from_now(days=21),
             "filling", "peer-kai", "kai.eth", 1600, _ago(hours=1, minutes=35)),
        )
        for pid, name, h in [("peer-kai", "kai.eth", 6), ("peer-luna", "luna.eth", 3)]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v16, pid, name, 800, 800, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'kai.eth joined "No-Code Ship Challenge"',
            {"vault_id": v16, "pot_total": 800}, _ago(hours=6))

        # ══════════════════════════════════════════════════════════════════════
        # 26. SAVINGS / filling — World Cup Away Trip Fund
        # ══════════════════════════════════════════════════════════════════════
        v26 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v26, "World Cup Away Trip Fund",
             "4 die-hard fans lock 3,500 RIAO each to commit to travelling together "
             "and watching the World Cup final live. Miss the trip? Lose 25% to those who showed up.",
             "savings", 3500, 4, 25, 48, _from_now(days=44),
             "filling", "peer-carol", "carol.eth", 7000, _ago(minutes=28)),
        )
        for pid, name, h in [("peer-carol", "carol.eth", 28), ("peer-dave", "dave.eth", 15)]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v26, pid, name, 3500, 3500, _ago(hours=h), None, "active"))
        await _evt(db, "member_joined", "notification", 'carol.eth opened "World Cup Away Trip Fund"',
            {"vault_id": v26, "pot_total": 3500}, _ago(hours=28))
        await _evt(db, "member_joined", "notification", 'dave.eth joined "World Cup Away Trip Fund"',
            {"vault_id": v26, "pot_total": 7000}, _ago(hours=15))

        # ══════════════════════════════════════════════════════════════════════
        # 27. VESTING / filling — Founder Commitment Pact
        # ══════════════════════════════════════════════════════════════════════
        v27 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v27, "Founder Commitment Pact",
             "3 co-founders each lock 6,000 RIAO as a public vesting signal. "
             "Leave the project before the cliff and forfeit 30% to the founders who stayed the course.",
             "vesting", 6000, 3, 30, 72, _from_now(days=28),
             "filling", "peer-marco", "marco.eth", 6000, _ago(hours=1, minutes=13)),
        )
        await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (_id(), v27, "peer-marco", "marco.eth", 6000, 6000, _ago(hours=10), None, "active"))
        await _evt(db, "member_joined", "notification", 'marco.eth opened "Founder Commitment Pact"',
            {"vault_id": v27, "pot_total": 6000}, _ago(hours=10))

        # ══════════════════════════════════════════════════════════════════════
        # 17. SAVINGS / completed — Down Payment Club
        # ══════════════════════════════════════════════════════════════════════
        v17 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v17, "Down Payment Club",
             "3 friends lock 5,000 RIAO each to stay committed to saving for their "
             "first property. All three survived and got paid in full.",
             "savings", 5000, 3, 15, 48, _ago(days=3),
             "completed", "peer-julia", "julia.eth", 0, _ago(days=33)),
        )
        for pid, name in [("peer-julia","julia.eth"),("peer-kai","kai.eth"),("peer-luna","luna.eth")]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v17, pid, name, 5000, 5000, _ago(days=33), None, "paid"))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Down Payment Club" — 3 survivors paid out 15,000 RIAO total',
            {"vault_id": v17, "survivors": ["julia.eth","kai.eth","luna.eth"], "total_paid": 15000},
            _ago(days=3))

        # ══════════════════════════════════════════════════════════════════════
        # 18. DAO / active — World Cup Broadcast DAO
        # 5 teams locked to build a decentralised World Cup streaming app.
        # ══════════════════════════════════════════════════════════════════════
        v18 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v18, "World Cup Broadcast DAO",
             "5 teams lock 6,000 RIAO each to commit to shipping a decentralised "
             "World Cup streaming app before the tournament kicks off. 30% slash for quitters.",
             "dao", 6000, 5, 30, 72, _from_now(days=18),
             "active", "peer-rialo", "Rialo DAO", 30000, _ago(days=4)),
        )
        for pid, name in [
            ("peer-rialo","Rialo DAO"), ("peer-henry","henry.eth"), ("peer-grace","grace.eth"),
            ("peer-frank","frank.eth"), ("peer-nadia","nadia.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v18, pid, name, 6000, 6000, _ago(days=4), None, "active"))
        await _evt(db, "vault_activated", "announcement",
            '"World Cup Broadcast DAO" FULL — 30,000 RIAO locked. Build or lose it.',
            {"vault_id": v18, "pot_total": 30000}, _ago(days=4))

        # ══════════════════════════════════════════════════════════════════════
        # 19. VESTING / active — Seed Round Commitment
        # ══════════════════════════════════════════════════════════════════════
        v19 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v19, "Seed Round Commitment",
             "4 angel investors lock 10,000 RIAO each to signal long-term conviction. "
             "Rage quit before TGE and lose 20% to believers.",
             "vesting", 10000, 4, 20, 168, _from_now(days=90),
             "active", "peer-grace", "grace.eth", 40000, _ago(days=7)),
        )
        for pid, name in [
            ("peer-grace","grace.eth"), ("peer-frank","frank.eth"),
            ("peer-oscar","oscar.eth"), ("peer-marco","marco.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v19, pid, name, 10000, 10000, _ago(days=7), None, "active"))
        await _evt(db, "vault_activated", "announcement",
            '"Seed Round Commitment" FULL — 40,000 RIAO at stake.',
            {"vault_id": v19, "pot_total": 40000}, _ago(days=7))

        # ══════════════════════════════════════════════════════════════════════
        # 20. ACCOUNTABILITY / completed — Study Streak
        # ══════════════════════════════════════════════════════════════════════
        v20 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v20, "Study Streak",
             "3 devs commit to 2 hours of study every day for 30 days. "
             "All three made it. Full payout.",
             "accountability", 500, 3, 20, 24, _ago(days=1),
             "completed", "peer-frank", "frank.eth", 0, _ago(days=31)),
        )
        for pid, name in [
            ("peer-frank","frank.eth"), ("peer-grace","grace.eth"), ("peer-henry","henry.eth"),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v20, pid, name, 500, 500, _ago(days=31), None, "paid"))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Study Streak" — 3 survivors paid out 1,500 RIAO total',
            {"vault_id": v20, "survivors": ["frank.eth","grace.eth","henry.eth"], "total_paid": 1500},
            _ago(days=1))

        # ══════════════════════════════════════════════════════════════════════
        # 21. SAVINGS / dead — Ibiza Summer '25
        # ══════════════════════════════════════════════════════════════════════
        v21 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v21, "Ibiza Summer '25",
             "4 party animals locked 1,500 RIAO each for an Ibiza trip fund. "
             "One by one they all caved. The vault is dead.",
             "savings", 1500, 4, 25, 12, _ago(hours=6),
             "dead", "peer-marco", "marco.eth", 0, _ago(days=8)),
        )
        for pid, name, quit_h in [
            ("peer-marco","marco.eth", 7*24), ("peer-nadia","nadia.eth", 5*24),
            ("peer-oscar","oscar.eth", 3*24), ("peer-alice","alice.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v21, pid, name, 1500, 1125, _ago(days=8), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_dead", "announcement",
            "☠️ \"Ibiza Summer '25\" died — all 4 rage quit",
            {"vault_id": v21}, _ago(hours=6))

        # ══════════════════════════════════════════════════════════════════════
        # 22. DAO / dead — DAO Summer Grants
        # ══════════════════════════════════════════════════════════════════════
        v22 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v22, "DAO Summer Grants",
             "3 grant committee members locked 4,000 RIAO each to commit to "
             "the Q2 grants program. Internal conflict killed it. All quit.",
             "dao", 4000, 3, 30, 48, _ago(hours=12),
             "dead", "peer-marco", "marco.eth", 0, _ago(days=14)),
        )
        for pid, name, quit_h in [
            ("peer-marco","marco.eth", 10*24), ("peer-nadia","nadia.eth", 6*24), ("peer-oscar","oscar.eth", 3*24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v22, pid, name, 4000, 2800, _ago(days=14), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "DAO Summer Grants" died — the committee dissolved',
            {"vault_id": v22}, _ago(hours=12))

        # ══════════════════════════════════════════════════════════════════════
        # 23. VESTING / completed — Series A Vest Lock
        # ══════════════════════════════════════════════════════════════════════
        v23 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v23, "Series A Vest Lock",
             "3 investors committed to a 6-month lockup of 20,000 RIAO each. "
             "All three held through volatility. Fully paid out at expiry.",
             "vesting", 20000, 3, 20, 0, _ago(days=2),
             "completed", "peer-nadia", "nadia.eth", 0, _ago(days=182)),
        )
        for pid, name in [("peer-nadia","nadia.eth"),("peer-ivan","ivan.eth"),("peer-julia","julia.eth")]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v23, pid, name, 20000, 20000, _ago(days=182), None, "paid"))
        await _evt(db, "vault_completed", "payout",
            '🏆 "Series A Vest Lock" — 3 investors paid out 60,000 RIAO total',
            {"vault_id": v23, "survivors": ["nadia.eth","ivan.eth","julia.eth"], "total_paid": 60000},
            _ago(days=2))

        # ══════════════════════════════════════════════════════════════════════
        # 24. VESTING / dead — The Abandoned Protocol
        # ══════════════════════════════════════════════════════════════════════
        v24 = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v24, "The Abandoned Protocol",
             "Three founders locked 10,000 RIAO each as a commitment to ship. "
             "One by one, they all rage quit. The vault died.",
             "vesting", 10000, 3, 20, 0, _ago(hours=1),
             "dead", "peer-henry", "henry.eth", 0, _ago(days=10)),
        )
        for pid, name, quit_h in [
            ("peer-henry","henry.eth", 8), ("peer-grace","grace.eth", 5), ("peer-frank","frank.eth", 2),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v24, pid, name, 10000, 8000, _ago(days=10), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_activated", "announcement",
            '"The Abandoned Protocol" FULL — 30,000 RIAO at stake.',
            {"vault_id": v24}, _ago(days=10))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 henry.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO",
            {"vault_id": v24, "quitter": "henry.eth", "penalty": 2000, "refund": 8000}, _ago(hours=8))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 grace.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO",
            {"vault_id": v24, "quitter": "grace.eth", "penalty": 2000, "refund": 8000}, _ago(hours=5))
        await _evt(db, "rage_quit_approved", "rage_quit",
            "💀 frank.eth RAGE QUIT \"The Abandoned Protocol\" — lost 2,000 RIAO",
            {"vault_id": v24, "quitter": "frank.eth", "penalty": 2000, "refund": 8000}, _ago(hours=2))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "The Abandoned Protocol" died — everyone rage quit before the deadline',
            {"vault_id": v24}, _ago(hours=1))

        # ══════════════════════════════════════════════════════════════════════
        # Accountability / dead — Morning Run Squad
        # ══════════════════════════════════════════════════════════════════════
        v_extra = _id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (v_extra, "Morning Run Squad",
             "5 people committed to waking up at 6 am for 30 days. "
             "The snooze button won. Everyone rage quit before the deadline.",
             "accountability", 400, 5, 20, 12, _ago(hours=8),
             "dead", "peer-ivan", "ivan.eth", 0, _ago(days=12)),
        )
        for pid, name, quit_h in [
            ("peer-ivan","ivan.eth", 11*24), ("peer-julia","julia.eth", 8*24),
            ("peer-kai","kai.eth", 6*24), ("peer-luna","luna.eth", 3*24),
            ("peer-nadia","nadia.eth", 24),
        ]:
            await db.execute("INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
                (_id(), v_extra, pid, name, 400, 320, _ago(days=12), _ago(hours=quit_h), "quit"))
        await _evt(db, "vault_dead", "announcement",
            '☠️ "Morning Run Squad" died — all 5 hit snooze before the deadline',
            {"vault_id": v_extra}, _ago(hours=8))

        await db.commit()
    finally:
        await db.close()
