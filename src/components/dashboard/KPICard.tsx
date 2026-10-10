"use client";

import React from "react";
import { formatCurrency, formatCurrencyFull } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  iconBgColor = "var(--color-primary-light)",
  iconColor = "var(--color-primary)",
}: KPICardProps) {
  return (
    <div className="premium-card h-full flex flex-col" style={{ padding: "20px" }}>
      <div className="flex justify-between items-start" style={{ marginBottom: "16px" }}>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>
            {title}
          </p>
          <h3 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {value}
          </h3>
        </div>
        <div
          className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBgColor, color: iconColor, width: "40px", height: "40px" }}
        >
          {icon}
        </div>
      </div>
      
      {(subtitle || trendValue) && (
        <div 
          className="flex flex-col border-t" 
          style={{ 
            borderColor: "var(--color-border-light)", 
            marginTop: "auto", 
            paddingTop: "12px",
            gap: "4px"
          }}
        >
          {trendValue && (
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={{
                color:
                  trend === "up"
                    ? "var(--color-success)"
                    : trend === "down"
                    ? "var(--color-error)"
                    : "var(--color-text-secondary)",
              }}
            >
              {trend === "up" && <TrendingUp size={14} />}
              {trend === "down" && <TrendingDown size={14} />}
              {trend === "neutral" && <Minus size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
