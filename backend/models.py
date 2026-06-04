from pydantic import BaseModel, Field
from typing import Optional, Literal


class VaultCreate(BaseModel):
    name: str
    description: str
    type: Literal["savings", "accountability", "dao", "vesting"]
    buy_in: int = Field(gt=0)
    max_members: int = Field(ge=2, le=20)
    penalty_pct: int = Field(default=20, ge=1, le=50)
    min_lock_hours: int = Field(default=48, ge=0)
    deadline: str
    creator_id: str
    creator_name: str


class MemberOut(BaseModel):
    id: str
    vault_id: str
    peer_id: str
    peer_name: str
    amount_locked: int
    amount_expected: int
    joined_at: str
    quit_at: Optional[str]
    status: str


class VaultOut(BaseModel):
    id: str
    name: str
    description: str
    type: str
    buy_in: int
    max_members: int
    penalty_pct: int
    min_lock_hours: int
    deadline: str
    status: str
    creator_id: str
    creator_name: str
    pot_total: int
    created_at: str
    members: list[MemberOut] = []


class JoinRequest(BaseModel):
    peer_id: str
    peer_name: str


class QuitRequest(BaseModel):
    peer_id: str


class PeerUpsert(BaseModel):
    id: str
    name: str


class PeerOut(BaseModel):
    id: str
    name: str
    total_earned: int
    total_lost: int
    vaults_survived: int
    vaults_quit: int
    vaults_created: int
    joined_at: str


class ReactiveEventOut(BaseModel):
    id: str
    rule_name: str
    event_type: str
    summary: str
    payload: dict
    fired_at: str


class StatsOut(BaseModel):
    total_vaults: int
    active_vaults: int
    total_locked: int
    total_rage_quits: int
    total_survivors: int
    total_peers: int


class InviteCreate(BaseModel):
    peer_id: str
    peer_name: str


class InviteAction(BaseModel):
    creator_id: str


class InviteOut(BaseModel):
    id: str
    vault_id: str
    peer_id: str
    peer_name: str
    status: str
    created_at: str
    resolved_at: Optional[str]


class MessageCreate(BaseModel):
    peer_id: str
    peer_name: str
    content: str = Field(min_length=1, max_length=500)


class MessageOut(BaseModel):
    id: str
    vault_id: str
    peer_id: str
    peer_name: str
    content: str
    created_at: str
