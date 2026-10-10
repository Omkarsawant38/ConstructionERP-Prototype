import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (currency === "INR") {
    return formatIndianCurrency(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatIndianCurrency(amount: number): string {
  const crore = 10000000;
  const lakh = 100000;

  if (Math.abs(amount) >= crore) {
    const value = amount / crore;
    return `₹ ${value.toFixed(value % 1 === 0 ? 0 : 1)} Cr`;
  }
  if (Math.abs(amount) >= lakh) {
    const value = amount / lakh;
    return `₹ ${value.toFixed(value % 1 === 0 ? 0 : 1)} L`;
  }
  return `₹ ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹ ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return "var(--color-success)";
  if (progress >= 50) return "var(--color-primary)";
  if (progress >= 25) return "var(--color-warning)";
  return "var(--color-error)";
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const statusMap: Record<string, { bg: string; text: string; dot: string }> = {
    planning: { bg: "#DBEAFE", text: "#2563EB", dot: "#3B82F6" },
    active: { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
    "on-hold": { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" },
    completed: { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
    cancelled: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    delayed: { bg: "#FFF7ED", text: "#C2410C", dot: "#EA580C" },
    "on-track": { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
    "at-risk": { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
    "not-started": { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    "in-progress": { bg: "#DBEAFE", text: "#2563EB", dot: "#3B82F6" },
    blocked: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    approved: { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
    pending: { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" },
    rejected: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    draft: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    "low-stock": { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
    "in-stock": { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" },
  };

  return statusMap[status.toLowerCase()] || { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" };
}

export function generateProjectCode(prefix: string = "PRJ", num: number): string {
  return `${prefix}-${String(num).padStart(3, "0")}`;
}

export function calculateDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
}

export function isOverdue(endDate: string | Date): boolean {
  return calculateDaysRemaining(endDate) < 0;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
