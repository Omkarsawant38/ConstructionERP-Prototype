"use client";

import React from "react";
import { getProgressColor } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({
  value,
  height = 6,
  showLabel = false,
  color,
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const barColor = color || getProgressColor(clampedValue);

  return (
    <div className="flex items-center gap-2">
      <div
        className="progress-bar flex-1"
        style={{ height }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedValue}%`,
            background: barColor,
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs font-medium whitespace-nowrap"
          style={{ color: "var(--color-text-secondary)", minWidth: 32 }}
        >
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
