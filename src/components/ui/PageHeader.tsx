"use client";

import React from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs,
  action, 
  actions,
  eyebrow,
  icon,
  className = "",
  children 
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-start md:justify-between gap-4 w-full ${className}`}>
      <div className="flex-1 min-w-0 flex items-start gap-5">
        {icon && (
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border mt-1" 
            style={{ 
              background: "var(--color-card)", 
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)"
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          
          {eyebrow && (
            <div className="text-sm font-semibold tracking-wide uppercase text-amber-600 mb-2">
              {eyebrow}
            </div>
          )}

          <h1 
            className="text-2xl md:text-[28px] font-bold leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h1>
          
          {description && (
            <p 
              className="mt-2 text-sm leading-[22px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {description}
            </p>
          )}
          
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>

      {(action || actions) && (
        <div className="flex items-center flex-wrap gap-2 md:gap-3 shrink-0 md:mt-0 mt-2">
          {action}
          {actions}
        </div>
      )}
    </div>
  );
}
