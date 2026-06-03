import json
import uuid
from datetime import datetime, timezone

from loguru import logger


RULES = [
    {
        "name": "member_joined",
        "trigger": "member_joined",
        "condition": "always",
        "action": "UPDATE pot_total + NOTIFY all members",
    },
    {
        "name": "vault_activated",
        "trigger": "member_joined",
        "condition": "vault.members == vault.max_members",
        "action": "SET status=active + EMIT vault_activated announcement",
    },
    {
        "name": "rage_quit_rejected",
        "trigger": "rage_quit",
        "condition": "time_in_vault < min_lock_hours",
        "action": "REJECT quit + EMIT warning",
    },
    {
        "name": "rage_quit_approved",
        "trigger": "rage_quit",
        "condition": "time_in_vault >= min_lock_hours AND deadline_not_reached",
        "action": "SLASH penalty% + REDISTRIBUTE to survivors + REMOVE member",
    },
    {
        "name": "vault_completed",
        "trigger": "deadline_reached",
        "condition": "active_members > 0",
        "action": "RELEASE payout to all survivors + CLOSE vault",
    },
    {
        "name": "vault_dead",
        "trigger": "deadline_reached",
        "condition": "active_members == 0",
        "action": "MARK vault dead + EMIT graveyard event",
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _new_id() -> str:
    return str(uuid.uuid4())


async def _log_event(
    db, rule_name: str, event_type: str, summary: str, payload: dict
) -> dict:
    event = {
        "id": _new_id(),
        "rule_name": rule_name,
        "event_type": event_type,
        "summary": summary,
        "payload": json.dumps(payload),
        "fired_at": _now(),
    }
    await db.execute(
        "INSERT INTO reactive_events VALUES (?,?,?,?,?,?)",
        (event["id"], event["rule_name"], event["event_type"],
         event["summary"], event["payload"], event["fired_at"]),
    )
    logger.info(f"[Rule] {rule_name} → {summary}")
    return event


async def on_member_joined(db, vault: dict, member: dict) -> list[dict]:
    events = []

    # Rule 1: member_joined — always fires
    e = await _log_event(
        db,
        rule_name="member_joined",
        event_type="notification",
        summary=(
            f"{member['peer_name']} joined \"{vault['name']}\" — "
            f"{vault['pot_total']:,} RIAO now locked"
        ),
        payload={
            "vault_id": vault["id"],
            "peer_id": member["peer_id"],
            "peer_name": member["peer_name"],
            "pot_total": vault["pot_total"],
        },
    )
    events.append(e)

    # Rule 2: vault_activated — fires only when vault is now full
    async with db.execute(
        "SELECT COUNT(*) AS n FROM members WHERE vault_id=? AND status='active'",
        (vault["id"],),
    ) as cur:
        row = await cur.fetchone()
        active_count = row["n"]

    if active_count >= vault["max_members"]:
        await db.execute(
            "UPDATE vaults SET status='active' WHERE id=?", (vault["id"],)
        )
        e2 = await _log_event(
            db,
            rule_name="vault_activated",
            event_type="announcement",
            summary=(
                f"\"{vault['name']}\" is FULL — vault locked, countdown started. "
                f"{vault['pot_total']:,} RIAO at stake."
            ),
            payload={
                "vault_id": vault["id"],
                "pot_total": vault["pot_total"],
                "deadline": vault["deadline"],
            },
        )
        events.append(e2)

    return events


async def on_rage_quit(db, vault: dict, member: dict) -> dict:
    joined_at = datetime.fromisoformat(member["joined_at"].replace("Z", "+00:00"))
    hours_in_vault = (datetime.now(timezone.utc) - joined_at).total_seconds() / 3600

    # Rule 3: rage_quit_rejected — member hasn't waited the minimum lock period
    if hours_in_vault < vault["min_lock_hours"]:
        e = await _log_event(
            db,
            rule_name="rage_quit_rejected",
            event_type="warning",
            summary=(
                f"{member['peer_name']} tried to quit \"{vault['name']}\" too early — "
                f"minimum lock is {vault['min_lock_hours']}h "
                f"(only been in {hours_in_vault:.1f}h)"
            ),
            payload={
                "vault_id": vault["id"],
                "peer_id": member["peer_id"],
                "hours_in_vault": round(hours_in_vault, 1),
                "min_lock_hours": vault["min_lock_hours"],
            },
        )
        return {"ok": False, "reason": "too_early", "hours_remaining": round(vault["min_lock_hours"] - hours_in_vault, 1), "event": e}

    # Rule 4: rage_quit_approved
    penalty = int(member["amount_locked"] * vault["penalty_pct"] / 100)
    refund  = member["amount_locked"] - penalty

    # Fetch survivors (everyone still active except the quitter)
    async with db.execute(
        "SELECT * FROM members WHERE vault_id=? AND status='active' AND peer_id!=?",
        (vault["id"], member["peer_id"]),
    ) as cur:
        survivors = [dict(r) for r in await cur.fetchall()]

    # Distribute penalty evenly; any remainder goes to the first survivor
    if survivors:
        share     = penalty // len(survivors)
        remainder = penalty - (share * len(survivors))
        for i, s in enumerate(survivors):
            bonus = share + (remainder if i == 0 else 0)
            await db.execute(
                "UPDATE members SET amount_expected = amount_expected + ? WHERE id=?",
                (bonus, s["id"]),
            )

    # Mark quitter — they only get the refund back
    await db.execute(
        "UPDATE members SET status='quit', quit_at=?, amount_expected=? WHERE id=?",
        (_now(), refund, member["id"]),
    )

    # Update peer lifetime stats
    await db.execute(
        "UPDATE peers SET "
        "total_earned=total_earned+?, total_lost=total_lost+?, vaults_quit=vaults_quit+1 "
        "WHERE id=?",
        (refund, penalty, member["peer_id"]),
    )

    # Remove refunded amount from the live pot
    await db.execute(
        "UPDATE vaults SET pot_total=pot_total-? WHERE id=?",
        (refund, vault["id"]),
    )

    e = await _log_event(
        db,
        rule_name="rage_quit_approved",
        event_type="rage_quit",
        summary=(
            f"\U0001f480 {member['peer_name']} RAGE QUIT \"{vault['name']}\" — "
            f"lost {penalty:,} RIAO ({vault['penalty_pct']}% penalty), "
            f"split among {len(survivors)} survivor{'s' if len(survivors) != 1 else ''}"
        ),
        payload={
            "vault_id": vault["id"],
            "quitter": member["peer_name"],
            "penalty": penalty,
            "refund": refund,
            "penalty_pct": vault["penalty_pct"],
            "survivors": [s["peer_name"] for s in survivors],
            "each_survivor_gains": (penalty // len(survivors)) if survivors else 0,
        },
    )
    return {"ok": True, "refund": refund, "penalty": penalty, "event": e}


async def on_deadline_reached(db, vault: dict) -> list[dict]:
    events = []

    async with db.execute(
        "SELECT * FROM members WHERE vault_id=? AND status='active'", (vault["id"],)
    ) as cur:
        survivors = [dict(r) for r in await cur.fetchall()]

    # Rule 6: vault_dead — everyone rage quit before the deadline
    if not survivors:
        await db.execute(
            "UPDATE vaults SET status='dead' WHERE id=?", (vault["id"],)
        )
        e = await _log_event(
            db,
            rule_name="vault_dead",
            event_type="announcement",
            summary=f"☠️ \"{vault['name']}\" died — everyone rage quit before the deadline",
            payload={"vault_id": vault["id"]},
        )
        events.append(e)
        return events

    # Rule 5: vault_completed — pay out every survivor their expected amount
    for s in survivors:
        await db.execute(
            "UPDATE members SET status='paid' WHERE id=?", (s["id"],)
        )
        await db.execute(
            "UPDATE peers SET "
            "total_earned=total_earned+?, vaults_survived=vaults_survived+1 "
            "WHERE id=?",
            (s["amount_expected"], s["peer_id"]),
        )

    await db.execute(
        "UPDATE vaults SET status='completed', pot_total=0 WHERE id=?", (vault["id"],)
    )

    total_paid = sum(s["amount_expected"] for s in survivors)

    e = await _log_event(
        db,
        rule_name="vault_completed",
        event_type="payout",
        summary=(
            f"\U0001f3c6 \"{vault['name']}\" completed — "
            f"{len(survivors)} survivor{'s' if len(survivors) != 1 else ''} "
            f"paid out {total_paid:,} RIAO total"
        ),
        payload={
            "vault_id": vault["id"],
            "survivors": [s["peer_name"] for s in survivors],
            "total_paid": total_paid,
            "payouts": [
                {"peer": s["peer_name"], "amount": s["amount_expected"]}
                for s in survivors
            ],
        },
    )
    events.append(e)
    return events
