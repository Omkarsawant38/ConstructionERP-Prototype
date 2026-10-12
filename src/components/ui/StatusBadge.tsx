"use client";

import React from "react";
import { getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const safeStatus = status || "pending";
  const colors = getStatusColor(safeStatus);
  const label = safeStatus
    .replace(/_/g, " ")
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
