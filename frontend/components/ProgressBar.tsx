"use client";
import { motion } from "motion/react";

interface ProgressBarProps {
  progress: number;
  color?: string;
  showLabel?: boolean;
  delay?: number;
}

export function ProgressBar({ progress, color = "#10B981", showLabel = false, delay = 0 }: ProgressBarProps) {
  return (
    <div style={{ width: "100%" }}>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", fontFamily: '"Space Mono", "Courier New", monospace', letterSpacing: "0.05em", textTransform: "uppercase" }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#000000", fontFamily: '"Space Mono", "Courier New", monospace' }}>{progress}%</span>
        </div>
      )}
      <div style={{ height: 4, borderRadius: 99, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 99, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
