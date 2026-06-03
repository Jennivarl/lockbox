"use client";
import { useState, useEffect, useCallback } from "react";

const KEY = "lockbox_riao_balance";
const DEFAULT = 50_000;

export function useBalance() {
  const [balance, setBalance] = useState<number>(DEFAULT);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) setBalance(Number(stored));
  }, []);

  const deduct = useCallback((amount: number) => {
    setBalance(prev => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem(KEY, String(next));
      return next;
    });
  }, []);

  const add = useCallback((amount: number) => {
    setBalance(prev => {
      const next = prev + amount;
      localStorage.setItem(KEY, String(next));
      return next;
    });
  }, []);

  return { balance, deduct, add };
}
