"use client";
import { useState, useEffect, useCallback } from "react";

export interface Profile {
  displayName: string;
  bio: string;
  avatarColor: string;
}

export const AVATAR_COLORS = [
  "#059669", "#7C3AED", "#2563EB", "#D97706",
  "#DC2626", "#0891B2", "#EA580C", "#000000",
];

const KEY = "lockbox_profile";

function defaults(): Profile {
  return { displayName: "", bio: "", avatarColor: AVATAR_COLORS[0] };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(defaults());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch {}
    }
    setLoaded(true);
  }, []);

  const save = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { profile, save, loaded };
}
