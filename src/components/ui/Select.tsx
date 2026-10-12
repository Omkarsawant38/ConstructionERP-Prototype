"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  color?: string; // Optional dot indicator color
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  id,
  name,
  disabled = false,
  error,
  size = "md",
  className = "",
  style,
  width,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Size specific styling
  const sizeStyles = {
    sm: {
      height: "34px",
      fontSize: "12.5px",
      padding: "0 10px",
      borderRadius: "8px",
    },
    md: {
      height: "40px",
      fontSize: "13.5px",
      padding: "0 12px",
      borderRadius: "10px",
    },
    lg: {
      height: "44px",
      fontSize: "14px",
      padding: "0 14px",
      borderRadius: "10px",
    },
  }[size];

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{
        width: width || "100%",
        ...style,
      }}
    >
      {label && (
        <label 
          htmlFor={id} 
          className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2"
        >
          {label}
        </label>
      )}

      {/* Hidden input for form integrations */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={value} 
          id={id} 
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          height: sizeStyles.height,
          padding: sizeStyles.padding,
          borderRadius: sizeStyles.borderRadius,
          fontSize: sizeStyles.fontSize,
          backgroundColor: disabled ? "#F8FAFC" : "#FFFFFF",
          color: selectedOption ? "#172033" : "#94A3B8",
          border: error 
            ? "1.5px solid #EF4444" 
            : isOpen 
            ? "1.5px solid #FFB000" 
            : "1px solid #E2E8F0",
          boxShadow: isOpen 
            ? "0 0 0 3px rgba(255, 176, 0, 0.18)" 
            : "0 1px 2px rgba(0, 0, 0, 0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen && !error) {
            e.currentTarget.style.borderColor = "#CBD5E1";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen && !error) {
            e.currentTarget.style.borderColor = "#E2E8F0";
          }
        }}
      >
        <div className="flex items-center truncate" style={{ gap: "8px" }}>
          {selectedOption?.color && (
            <span 
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: selectedOption.color,
                flexShrink: 0,
              }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </div>

        <ChevronDown 
          size={16} 
          style={{
            color: isOpen ? "#FFB000" : "#94A3B8",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 60,
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.05)",
            padding: "6px",
            maxHeight: "260px",
            overflowY: "auto",
            animation: "selectFadeIn 0.15s ease-out",
          }}
        >
          {options.length === 0 ? (
            <div 
              style={{ 
                padding: "12px", 
                textAlign: "center", 
                fontSize: "13px", 
                color: "#94A3B8" 
              }}
            >
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? "#92400E" : "#1E293B",
                    backgroundColor: isSelected ? "#FFF6DC" : "transparent",
                    cursor: opt.disabled ? "not-allowed" : "pointer",
                    opacity: opt.disabled ? 0.45 : 1,
                    transition: "all 0.12s ease",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => {
                    if (!opt.disabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = "#FFFBF0";
                      e.currentTarget.style.color = "#172033";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!opt.disabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#1E293B";
                    }
                  }}
                >
                  <div className="flex items-center truncate" style={{ gap: "9px" }}>
                    {opt.color && (
                      <span 
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: opt.color,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && <span className="shrink-0">{opt.badge}</span>}
                  </div>

                  {isSelected && (
                    <Check 
                      size={15} 
                      style={{ 
                        color: "#D97706", 
                        strokeWidth: 2.5,
                        flexShrink: 0,
                        marginLeft: "8px",
                      }} 
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <p className="form-error" style={{ marginTop: "4px", fontSize: "12px", color: "#EF4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
