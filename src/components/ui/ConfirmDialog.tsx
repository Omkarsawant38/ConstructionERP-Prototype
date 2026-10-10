"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmStyle =
    variant === "danger"
      ? { background: "var(--color-error)", color: "white" }
      : variant === "warning"
      ? { background: "var(--color-warning)", color: "var(--color-text-primary)" }
      : { background: "var(--color-primary)", color: "var(--color-text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X size={18} color="var(--color-text-muted)" />
        </button>

        <div className="flex items-start gap-4">
          {variant !== "default" && (
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
              style={{
                background:
                  variant === "danger" ? "var(--color-error-light)" : "var(--color-warning-light)",
              }}
            >
              <AlertTriangle
                size={20}
                color={variant === "danger" ? "var(--color-error)" : "var(--color-warning)"}
              />
            </div>
          )}
          <div>
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={confirmStyle}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
