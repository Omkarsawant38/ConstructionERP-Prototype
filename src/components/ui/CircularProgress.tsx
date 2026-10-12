"use client";

import React from "react";
import { getProgressColor } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showPercentageBelow?: boolean;
  color?: string;
  className?: string;
}

export function CircularProgress({
  value,
  size = 38,
  strokeWidth = 3.5,
  showPercentageBelow = true,
  color,
  className = "",
}: CircularProgressProps) {
  const clampedValue = Math.min(Math.max(Math.round(value), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  const strokeColor = color || getProgressColor(clampedValue);

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Fill Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
      </div>

      {showPercentageBelow && (
        <span
          className="text-[11px] font-bold text-gray-700 mt-1 leading-none tracking-tight"
          style={{ color: "var(--color-text-primary, #172033)" }}
        >
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
