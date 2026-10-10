"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-amber-600 transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <Home size={14} />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight
            size={14}
            style={{ color: "var(--color-text-muted)" }}
          />
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-amber-600 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="font-medium"
              style={{
                color:
                  index === items.length - 1
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
              }}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
