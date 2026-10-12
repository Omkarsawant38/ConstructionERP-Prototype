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
    <div 
      className={`inline-flex flex-col items-center justify-center ${className}`}
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <div 
        style={{ 
          width: size, 
          height: size, 
          position: "relative", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block", overflow: "visible" }}
        >
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
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
          </g>
        </svg>
      </div>

      {showPercentageBelow && (
        <span
          className="text-[11px] font-bold tracking-tight"
          style={{ 
            color: "var(--color-text-primary, #172033)",
            marginTop: "6px",
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "center",
            display: "block",
            whiteSpace: "nowrap"
          }}
        >
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
