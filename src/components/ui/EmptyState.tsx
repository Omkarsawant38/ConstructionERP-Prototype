"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: "var(--color-primary-light)" }}
        >
          {icon}
        </div>
      )}
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm max-w-sm mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
