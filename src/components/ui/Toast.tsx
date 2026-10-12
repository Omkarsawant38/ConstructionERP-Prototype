"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const toastConfig = {
  success: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    color: "#059669",
    icon: <CheckCircle size={16} strokeWidth={2.5} color="#059669" />,
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#DC2626",
    icon: <AlertCircle size={16} strokeWidth={2.5} color="#DC2626" />,
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    color: "#D97706",
    icon: <AlertTriangle size={16} strokeWidth={2.5} color="#D97706" />,
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    color: "#2563EB",
    icon: <Info size={16} strokeWidth={2.5} color="#2563EB" />,
  },
};

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed z-50 flex flex-col pointer-events-none"
      style={{
        bottom: "24px",
        right: "24px",
        gap: "10px",
        maxWidth: "380px",
        width: "calc(100vw - 32px)",
      }}
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type] || toastConfig.info;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
              border: "1px solid #E2E8F0",
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            {/* Status Icon Badge */}
            <div 
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {config.icon}
            </div>

            {/* Toast Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p 
                style={{ 
                  fontSize: "14px", 
                  fontWeight: 600, 
                  color: "#0F172A", 
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                {toast.title}
              </p>
              {toast.description && (
                <p 
                  style={{ 
                    fontSize: "13px", 
                    color: "#64748B", 
                    marginTop: "3px", 
                    lineHeight: "18px",
                    margin: "3px 0 0 0",
                  }}
                >
                  {toast.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="cursor-pointer"
              style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: "#94A3B8",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#94A3B8";
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
