export interface Member {
  id: string;
  vault_id: string;
  peer_id: string;
  peer_name: string;
  amount_locked: number;
  amount_expected: number;
  joined_at: string;
  quit_at: string | null;
  status: "active" | "quit" | "paid";
}

export interface Vault {
  id: string;
  name: string;
  description: string;
  type: "savings" | "accountability" | "dao" | "vesting";
  buy_in: number;
  max_members: number;
  penalty_pct: number;
  min_lock_hours: number;
  deadline: string;
  status: "filling" | "active" | "completed" | "dead";
  creator_id: string;
  creator_name: string;
  pot_total: number;
  created_at: string;
  members: Member[];
}

export interface Peer {
  id: string;
  name: string;
  total_earned: number;
  total_lost: number;
  vaults_survived: number;
  vaults_quit: number;
  vaults_created: number;
  joined_at: string;
}

export interface ReactiveEvent {
  id: string;
  rule_name: string;
  event_type: string;
  summary: string;
  payload: Record<string, unknown>;
  fired_at: string;
}

export interface ReactiveRule {
  name: string;
  trigger: string;
  condition: string;
  action: string;
}

export interface Stats {
  total_vaults: number;
  active_vaults: number;
  total_locked: number;
  total_rage_quits: number;
  total_survivors: number;
  total_peers: number;
}

export interface Message {
  id: string;
  vault_id: string;
  peer_id: string;
  peer_name: string;
  content: string;
  created_at: string;
}

export interface Invite {
  id: string;
  vault_id: string;
  peer_id: string;
  peer_name: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  resolved_at: string | null;
}
