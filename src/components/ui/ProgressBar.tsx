"use client";

import React from "react";
import { getProgressColor } from "@/lib/utils";
import { CircularProgress } from "@/components/ui/CircularProgress";

export { CircularProgress };

interface ProgressBarProps {
  value: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
  variant?: "bar" | "circular";
  size?: number;
}

export function ProgressBar({
  value,
  height = 6,
  showLabel = false,
  color,
  variant = "bar",
  size = 38,
}: ProgressBarProps) {
  if (variant === "circular") {
    return (
      <CircularProgress
        value={value}
        size={size}
        showPercentageBelow={showLabel}
        color={color}
      />
    );
  }

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

