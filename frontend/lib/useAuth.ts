"use client";
import { usePrivy } from "@privy-io/react-auth";

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const wallet   = user?.wallet?.address ?? user?.linkedAccounts?.find(a => a.type === "wallet")?.address;
  const peerId   = wallet ?? "peer-you";
  const short    = wallet ? wallet.slice(0, 6) + "…" + wallet.slice(-4) : "you.eth";
  const peerName = user?.email?.address ?? short;

  return { ready, authenticated, login, logout, peerId, peerName, user };
}
