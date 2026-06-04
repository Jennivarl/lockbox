"use client";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import type { ReactiveEvent } from "@/lib/types";

const font = '"Space Mono", "Courier New", monospace';
const SEEN_KEY = "lockbox_seen_notif";

const EVENT_COLOR: Record<string, string> = {
  rage_quit: "#DC2626",
  payout: "#059669",
  announcement: "#2563EB",
  notification: "#7C3AED",
};

function timeAgo(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ peerId }: { peerId: string }) {
  const [events, setEvents] = useState<ReactiveEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await api.notifications(peerId);
      setEvents(data);
      const seen = localStorage.getItem(SEEN_KEY) ?? "";
      setUnread(data.filter(e => e.fired_at > seen).length);
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [peerId]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      const latest = events[0]?.fired_at ?? new Date().toISOString();
      localStorage.setItem(SEEN_KEY, latest);
      setUnread(0);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={handleOpen} style={{
        width: 38, height: 38, borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: open ? "rgba(0,0,0,0.1)" : "transparent",
        border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", position: "relative",
      }}>
        <Bell style={{ width: 16, height: 16, color: "#444444" }} strokeWidth={1.8} />
        {unread > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            width: 16, height: 16, borderRadius: "50%",
            background: "#DC2626", border: "2px solid #C2C8D4",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: font, fontSize: 8, fontWeight: 900, color: "#FFFFFF" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 46, right: 0, width: 320, zIndex: 100,
          borderRadius: 14, background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#000000" }}>
              Notifications
            </span>
            <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>your vaults</span>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {events.length === 0 ? (
              <div style={{ padding: "24px 16px", fontFamily: font, fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
                No activity yet
              </div>
            ) : events.map(e => (
              <div key={e.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR[e.event_type] ?? "#9B9B9B", flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#000000", margin: "0 0 3px", lineHeight: 1.5 }}>
                    {e.summary.replace(/^💀 /, "").replace(/^🎉 /, "")}
                  </p>
                  <span style={{ fontFamily: font, fontSize: 10, color: "#9B9B9B" }}>{timeAgo(e.fired_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
