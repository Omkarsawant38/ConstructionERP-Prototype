"use client";

import React from "react";
import { getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const label = status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <span
      className="badge"
      style={{
        background: colors.bg,
        color: colors.text,
        fontSize: size === "sm" ? "11px" : "12px",
        padding: size === "sm" ? "1px 8px" : "2px 10px",
      }}
    >
      {showDot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ background: colors.dot }}
        />
      )}
      {label}
    </span>
  );
}
