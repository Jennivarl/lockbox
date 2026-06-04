import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from database import get_db, init_db
from models import (
    InviteAction,
    InviteCreate,
    InviteOut,
    JoinRequest,
    MessageCreate,
    MessageOut,
    MemberOut,
    PeerOut,
    PeerUpsert,
    QuitRequest,
    ReactiveEventOut,
    StatsOut,
    VaultCreate,
    VaultOut,
)
from rules import RULES, on_deadline_reached, on_member_joined, on_rage_quit

load_dotenv()


async def _check_deadlines() -> None:
    """Find all vaults past their deadline and settle them."""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        async with db.execute(
            "SELECT * FROM vaults WHERE status IN ('filling','active') AND deadline <= ?",
            (now,),
        ) as cur:
            due = [dict(r) for r in await cur.fetchall()]

        for vault in due:
            logger.info(f"[Deadline checker] Settling: \"{vault['name']}\"")
            events = await on_deadline_reached(db, vault)
            await db.commit()
            logger.info(f"[Deadline checker] {len(events)} event(s) fired")
    finally:
        await db.close()


async def _deadline_loop() -> None:
    """Background task — checks for due vaults every 30 seconds."""
    while True:
        try:
            await _check_deadlines()
        except Exception as exc:
            logger.error(f"[Deadline checker] {exc}")
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("[RageVault] Database ready")
    if os.getenv("SEED_ON_START", "false").lower() == "true":
        from seed import seed
        await seed()
        logger.info("[RageVault] Demo data seeded")

    task = asyncio.create_task(_deadline_loop())
    logger.info("[RageVault] Deadline checker started (30s interval)")

    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("[RageVault] Deadline checker stopped")


app = FastAPI(title="RageVault API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── helpers ────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _new_id() -> str:
    return str(uuid.uuid4())


async def _get_vault(db, vault_id: str) -> dict:
    async with db.execute("SELECT * FROM vaults WHERE id=?", (vault_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Vault not found")
    return dict(row)


async def _vault_with_members(db, vault_id: str) -> dict:
    vault = await _get_vault(db, vault_id)
    async with db.execute(
        "SELECT * FROM members WHERE vault_id=? ORDER BY joined_at", (vault_id,)
    ) as cur:
        vault["members"] = [dict(r) for r in await cur.fetchall()]
    return vault


async def _ensure_peer(db, peer_id: str, peer_name: str) -> None:
    async with db.execute("SELECT id FROM peers WHERE id=?", (peer_id,)) as cur:
        if not await cur.fetchone():
            await db.execute(
                "INSERT INTO peers VALUES (?,?,0,0,0,0,0,?)",
                (peer_id, peer_name, _now()),
            )


# ── stats ──────────────────────────────────────────────────────────────────

@app.get("/stats", response_model=StatsOut)
async def get_stats():
    db = await get_db()
    try:
        async with db.execute("SELECT COUNT(*) AS n FROM vaults") as c:
            total_vaults = (await c.fetchone())["n"]
        async with db.execute(
            "SELECT COUNT(*) AS n FROM vaults WHERE status IN ('filling','active')"
        ) as c:
            active_vaults = (await c.fetchone())["n"]
        async with db.execute(
            "SELECT COALESCE(SUM(pot_total),0) AS n FROM vaults"
        ) as c:
            total_locked = (await c.fetchone())["n"]
        async with db.execute(
            "SELECT COUNT(*) AS n FROM members WHERE status='quit'"
        ) as c:
            total_rage_quits = (await c.fetchone())["n"]
        async with db.execute(
            "SELECT COUNT(*) AS n FROM members WHERE status IN ('active','paid')"
        ) as c:
            total_survivors = (await c.fetchone())["n"]
        async with db.execute("SELECT COUNT(*) AS n FROM peers") as c:
            total_peers = (await c.fetchone())["n"]
        return StatsOut(
            total_vaults=total_vaults,
            active_vaults=active_vaults,
            total_locked=total_locked,
            total_rage_quits=total_rage_quits,
            total_survivors=total_survivors,
            total_peers=total_peers,
        )
    finally:
        await db.close()


# ── rules ──────────────────────────────────────────────────────────────────

@app.get("/rules")
async def get_rules():
    return {"rules": RULES, "count": len(RULES)}


# ── vaults ─────────────────────────────────────────────────────────────────

@app.get("/vaults", response_model=list[VaultOut])
async def list_vaults(status: str | None = None, limit: int = 50):
    db = await get_db()
    try:
        if status:
            async with db.execute(
                "SELECT * FROM vaults WHERE status=? ORDER BY created_at DESC LIMIT ?",
                (status, limit),
            ) as cur:
                vaults = [dict(r) for r in await cur.fetchall()]
        else:
            async with db.execute(
                "SELECT * FROM vaults ORDER BY created_at DESC LIMIT ?", (limit,)
            ) as cur:
                vaults = [dict(r) for r in await cur.fetchall()]

        for v in vaults:
            async with db.execute(
                "SELECT * FROM members WHERE vault_id=? ORDER BY joined_at", (v["id"],)
            ) as cur:
                v["members"] = [dict(r) for r in await cur.fetchall()]
        return vaults
    finally:
        await db.close()


@app.post("/vaults", response_model=VaultOut, status_code=201)
async def create_vault(body: VaultCreate):
    db = await get_db()
    try:
        await _ensure_peer(db, body.creator_id, body.creator_name)
        vault_id = _new_id()
        await db.execute(
            "INSERT INTO vaults VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                vault_id, body.name, body.description, body.type,
                body.buy_in, body.max_members, body.penalty_pct,
                body.min_lock_hours, body.deadline, "filling",
                body.creator_id, body.creator_name, 0, _now(),
            ),
        )
        await db.execute(
            "UPDATE peers SET vaults_created=vaults_created+1 WHERE id=?",
            (body.creator_id,),
        )
        await db.commit()
        return await _vault_with_members(db, vault_id)
    finally:
        await db.close()


@app.get("/vaults/{vault_id}", response_model=VaultOut)
async def get_vault(vault_id: str):
    db = await get_db()
    try:
        return await _vault_with_members(db, vault_id)
    finally:
        await db.close()


# ── join ───────────────────────────────────────────────────────────────────

@app.post("/vaults/{vault_id}/join")
async def join_vault(vault_id: str, body: JoinRequest):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)

        if vault["status"] != "filling":
            raise HTTPException(400, f"Vault is {vault['status']} — cannot join")

        async with db.execute(
            "SELECT id FROM members WHERE vault_id=? AND peer_id=? AND status='active'",
            (vault_id, body.peer_id),
        ) as cur:
            if await cur.fetchone():
                raise HTTPException(400, "Already a member of this vault")

        async with db.execute(
            "SELECT COUNT(*) AS n FROM members WHERE vault_id=? AND status='active'",
            (vault_id,),
        ) as cur:
            if (await cur.fetchone())["n"] >= vault["max_members"]:
                raise HTTPException(400, "Vault is full")

        await _ensure_peer(db, body.peer_id, body.peer_name)

        member_id = _new_id()
        await db.execute(
            "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (
                member_id, vault_id, body.peer_id, body.peer_name,
                vault["buy_in"], vault["buy_in"], _now(), None, "active",
            ),
        )
        await db.execute(
            "UPDATE vaults SET pot_total=pot_total+? WHERE id=?",
            (vault["buy_in"], vault_id),
        )
        await db.commit()

        vault = await _get_vault(db, vault_id)
        member = {"peer_id": body.peer_id, "peer_name": body.peer_name, "id": member_id}
        events = await on_member_joined(db, vault, member)
        await db.commit()

        return {"ok": True, "member_id": member_id, "events_fired": len(events)}
    finally:
        await db.close()


# ── quit ───────────────────────────────────────────────────────────────────

@app.post("/vaults/{vault_id}/quit")
async def rage_quit(vault_id: str, body: QuitRequest):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)

        if vault["status"] not in ("filling", "active"):
            raise HTTPException(400, f"Vault is {vault['status']} — cannot quit")

        deadline = datetime.fromisoformat(vault["deadline"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) >= deadline:
            raise HTTPException(400, "Deadline already passed — vault will settle automatically")

        async with db.execute(
            "SELECT * FROM members WHERE vault_id=? AND peer_id=? AND status='active'",
            (vault_id, body.peer_id),
        ) as cur:
            row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Not an active member of this vault")

        # Penalty escalator: scales from base_pct → 2× base_pct over the vault lifetime
        vault_with_pct = dict(vault)
        if vault["status"] == "active":
            try:
                dl = datetime.fromisoformat(vault["deadline"].replace("Z", "+00:00"))
                cr = datetime.fromisoformat(vault["created_at"].replace("Z", "+00:00"))
                total = (dl - cr).total_seconds()
                elapsed = (datetime.now(timezone.utc) - cr).total_seconds()
                ratio = min(max(elapsed / total, 0), 1) if total > 0 else 0
                vault_with_pct["penalty_pct"] = min(int(vault["penalty_pct"] * (1 + ratio)), 95)
            except Exception:
                pass

        result = await on_rage_quit(db, vault_with_pct, dict(row))
        await db.commit()
        return result
    finally:
        await db.close()


# ── join requests ─────────────────────────────────────────────────────────

@app.post("/vaults/{vault_id}/requests", status_code=201)
async def request_join(vault_id: str, body: InviteCreate):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)
        if vault["status"] != "filling":
            raise HTTPException(400, f"Vault is {vault['status']} — cannot request to join")
        if body.peer_id == vault["creator_id"]:
            raise HTTPException(400, "Vault creator can join directly")
        async with db.execute(
            "SELECT id FROM members WHERE vault_id=? AND peer_id=? AND status='active'",
            (vault_id, body.peer_id),
        ) as cur:
            if await cur.fetchone():
                raise HTTPException(400, "Already a member")
        async with db.execute(
            "SELECT id FROM invites WHERE vault_id=? AND peer_id=? AND status='pending'",
            (vault_id, body.peer_id),
        ) as cur:
            if await cur.fetchone():
                raise HTTPException(400, "Already have a pending request")
        await _ensure_peer(db, body.peer_id, body.peer_name)
        invite_id = _new_id()
        await db.execute(
            "INSERT INTO invites VALUES (?,?,?,?,?,?,?)",
            (invite_id, vault_id, body.peer_id, body.peer_name, "pending", _now(), None),
        )
        await db.commit()
        return {"ok": True, "invite_id": invite_id}
    finally:
        await db.close()


@app.get("/vaults/{vault_id}/requests", response_model=list[InviteOut])
async def get_requests(vault_id: str):
    db = await get_db()
    try:
        await _get_vault(db, vault_id)
        async with db.execute(
            "SELECT * FROM invites WHERE vault_id=? AND status='pending' ORDER BY created_at DESC",
            (vault_id,),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]
    finally:
        await db.close()


@app.post("/vaults/{vault_id}/requests/{invite_id}/accept")
async def accept_request(vault_id: str, invite_id: str, body: InviteAction):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)
        if body.creator_id != vault["creator_id"]:
            raise HTTPException(403, "Only the vault creator can accept requests")
        async with db.execute(
            "SELECT * FROM invites WHERE id=? AND vault_id=? AND status='pending'",
            (invite_id, vault_id),
        ) as cur:
            row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Request not found or already resolved")
        invite = dict(row)
        if vault["status"] != "filling":
            raise HTTPException(400, f"Vault is {vault['status']} — cannot add member")
        async with db.execute(
            "SELECT COUNT(*) AS n FROM members WHERE vault_id=? AND status='active'",
            (vault_id,),
        ) as cur:
            if (await cur.fetchone())["n"] >= vault["max_members"]:
                raise HTTPException(400, "Vault is full")
        await db.execute(
            "UPDATE invites SET status='accepted', resolved_at=? WHERE id=?",
            (_now(), invite_id),
        )
        member_id = _new_id()
        await db.execute(
            "INSERT INTO members VALUES (?,?,?,?,?,?,?,?,?)",
            (
                member_id, vault_id, invite["peer_id"], invite["peer_name"],
                vault["buy_in"], vault["buy_in"], _now(), None, "active",
            ),
        )
        await db.execute(
            "UPDATE vaults SET pot_total=pot_total+? WHERE id=?",
            (vault["buy_in"], vault_id),
        )
        await db.commit()
        vault = await _get_vault(db, vault_id)
        member = {"peer_id": invite["peer_id"], "peer_name": invite["peer_name"], "id": member_id}
        events = await on_member_joined(db, vault, member)
        await db.commit()
        return {"ok": True, "member_id": member_id, "events_fired": len(events)}
    finally:
        await db.close()


@app.post("/vaults/{vault_id}/requests/{invite_id}/reject")
async def reject_request(vault_id: str, invite_id: str, body: InviteAction):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)
        if body.creator_id != vault["creator_id"]:
            raise HTTPException(403, "Only the vault creator can reject requests")
        async with db.execute(
            "SELECT * FROM invites WHERE id=? AND vault_id=? AND status='pending'",
            (invite_id, vault_id),
        ) as cur:
            if not await cur.fetchone():
                raise HTTPException(404, "Request not found or already resolved")
        await db.execute(
            "UPDATE invites SET status='rejected', resolved_at=? WHERE id=?",
            (_now(), invite_id),
        )
        await db.commit()
        return {"ok": True}
    finally:
        await db.close()


# ── trigger deadline (demo fast-forward) ───────────────────────────────────

@app.post("/vaults/{vault_id}/trigger")
async def trigger_deadline(vault_id: str):
    db = await get_db()
    try:
        vault = await _get_vault(db, vault_id)

        if vault["status"] not in ("filling", "active"):
            raise HTTPException(400, f"Vault is already {vault['status']}")

        events = await on_deadline_reached(db, vault)
        await db.commit()
        return {"ok": True, "events_fired": len(events)}
    finally:
        await db.close()


# ── feed ───────────────────────────────────────────────────────────────────

@app.get("/feed", response_model=list[ReactiveEventOut])
async def get_feed(limit: int = 50):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM reactive_events ORDER BY fired_at DESC LIMIT ?", (limit,)
        ) as cur:
            rows = [dict(r) for r in await cur.fetchall()]
        for r in rows:
            r["payload"] = json.loads(r["payload"])
        return rows
    finally:
        await db.close()


# ── leaderboard ────────────────────────────────────────────────────────────

@app.get("/leaderboard", response_model=list[PeerOut])
async def get_leaderboard(top: int = 20):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM peers "
            "ORDER BY vaults_survived DESC, total_earned DESC LIMIT ?",
            (top,),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]
    finally:
        await db.close()


# ── admin ─────────────────────────────────────────────────────────────────

@app.post("/admin/reseed")
async def admin_reseed():
    """Wipe all data and re-run seed. Use once to load fresh demo data."""
    db = await get_db()
    try:
        for table in ("messages", "invites", "reactive_events", "members", "vaults", "peers"):
            await db.execute(f"DELETE FROM {table}", ())
        await db.commit()
    finally:
        await db.close()
    from seed import seed
    await seed()
    return {"ok": True, "message": "Database wiped and reseeded with 16 vaults"}


# ── peers ──────────────────────────────────────────────────────────────────

@app.post("/peers", response_model=PeerOut)
async def upsert_peer(body: PeerUpsert):
    db = await get_db()
    try:
        await _ensure_peer(db, body.id, body.name)
        await db.commit()
        async with db.execute("SELECT * FROM peers WHERE id=?", (body.id,)) as cur:
            return dict(await cur.fetchone())
    finally:
        await db.close()


@app.get("/peers/{peer_id}", response_model=PeerOut)
async def get_peer(peer_id: str):
    db = await get_db()
    try:
        async with db.execute("SELECT * FROM peers WHERE id=?", (peer_id,)) as cur:
            row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Peer not found")
        return dict(row)
    finally:
        await db.close()


# ── chat ───────────────────────────────────────────────────────────────────

@app.post("/vaults/{vault_id}/chat", response_model=MessageOut, status_code=201)
async def post_message(vault_id: str, body: MessageCreate):
    db = await get_db()
    try:
        await _get_vault(db, vault_id)
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        await db.execute(
            "INSERT INTO messages VALUES (?,?,?,?,?,?)",
            (msg_id, vault_id, body.peer_id, body.peer_name, body.content, now),
        )
        await db.commit()
        return {"id": msg_id, "vault_id": vault_id, "peer_id": body.peer_id,
                "peer_name": body.peer_name, "content": body.content, "created_at": now}
    finally:
        await db.close()


@app.get("/vaults/{vault_id}/chat", response_model=list[MessageOut])
async def get_messages(vault_id: str, limit: int = 50):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM messages WHERE vault_id=? ORDER BY created_at ASC LIMIT ?",
            (vault_id, limit),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]
    finally:
        await db.close()


# ── notifications ──────────────────────────────────────────────────────────

@app.get("/notifications", response_model=list[ReactiveEventOut])
async def get_notifications(peer_id: str, limit: int = 30):
    """Return recent reactive events for vaults the peer is a member of."""
    db = await get_db()
    try:
        async with db.execute(
            "SELECT DISTINCT vault_id FROM members WHERE peer_id=?", (peer_id,)
        ) as cur:
            vault_ids = [r["vault_id"] for r in await cur.fetchall()]
        if not vault_ids:
            return []
        vault_id_set = set(vault_ids)
        # Fetch recent events and filter in Python — avoids DB-specific JSON functions
        async with db.execute(
            "SELECT * FROM reactive_events ORDER BY fired_at DESC LIMIT ?", (limit * 5,)
        ) as cur:
            rows = [dict(r) for r in await cur.fetchall()]
        result = []
        for r in rows:
            r["payload"] = json.loads(r["payload"])
            if r["payload"].get("vault_id") in vault_id_set:
                result.append(r)
            if len(result) >= limit:
                break
        return result
    finally:
        await db.close()
