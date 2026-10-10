"use client";

import React from "react";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div
            className="h-4 rounded skeleton-shimmer"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
          <div
            className="h-4 rounded skeleton-shimmer"
            style={{ width: `${20 + Math.random() * 20}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="premium-card p-6">
      <div className="space-y-4">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-2/3 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="h-3 rounded skeleton-shimmer" style={{ width: 80 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j}>
                    <div
                      className="h-3 rounded skeleton-shimmer"
                      style={{ width: `${50 + Math.random() * 50}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
