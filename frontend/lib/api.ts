import type { Vault, Peer, ReactiveEvent, ReactiveRule, Stats, Invite, Message } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  stats:    ()             => get<Stats>("/stats"),
  rules:    ()             => get<{ rules: ReactiveRule[]; count: number }>("/rules"),
  vaults:   (p?: object)  => get<Vault[]>("/vaults", p as Record<string, unknown>),
  vault:    (id: string)   => get<Vault>(`/vaults/${id}`),
  create:   (body: object) => post<Vault>("/vaults", body),
  join:     (id: string, body: object) => post(`/vaults/${id}/join`, body),
  quit:     (id: string, body: object) => post(`/vaults/${id}/quit`, body),
  trigger:  (id: string)  => post(`/vaults/${id}/trigger`),
  feed:     (limit = 50)  => get<ReactiveEvent[]>("/feed", { limit }),
  leaderboard: (top = 20) => get<Peer[]>("/leaderboard", { top }),
  upsertPeer:     (body: object)                   => post<Peer>("/peers", body),
  requestJoin:    (id: string, body: object)       => post(`/vaults/${id}/requests`, body),
  getRequests:    (id: string)                     => get<Invite[]>(`/vaults/${id}/requests`),
  acceptRequest:   (id: string, rid: string, body: object) => post(`/vaults/${id}/requests/${rid}/accept`, body),
  rejectRequest:   (id: string, rid: string, body: object) => post(`/vaults/${id}/requests/${rid}/reject`, body),
  getMessages:     (id: string)                            => get<Message[]>(`/vaults/${id}/chat`),
  postMessage:     (id: string, body: object)              => post<Message>(`/vaults/${id}/chat`, body),
  notifications:   (peerId: string)                        => get<ReactiveEvent[]>("/notifications", { peer_id: peerId }),
};
