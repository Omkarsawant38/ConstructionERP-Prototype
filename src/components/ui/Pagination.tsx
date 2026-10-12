"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select } from "./Select";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 10, 20],
  itemName = "items",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between"
      style={{
        gap: "16px",
        padding: "16px 20px",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        marginTop: "16px",
      }}
    >
      {/* Information & Page Size Selector */}
      <div className="flex flex-wrap items-center" style={{ gap: "16px" }}>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
          Showing <span style={{ fontWeight: 600, color: "#0F172A" }}>{startItem}</span> to{" "}
          <span style={{ fontWeight: 600, color: "#0F172A" }}>{endItem}</span> of{" "}
          <span style={{ fontWeight: 600, color: "#0F172A" }}>{totalItems}</span> {itemName}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center" style={{ gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Show:</span>
            <Select
              size="sm"
              width="125px"
              value={String(pageSize)}
              onChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1);
              }}
              options={pageSizeOptions.map((opt) => ({
                value: String(opt),
                label: `${opt} / page`,
              }))}
            />
          </div>
        )}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center" style={{ gap: "6px" }}>
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            color: currentPage === 1 ? "#CBD5E1" : "#475569",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
          style={{
            height: "32px",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            color: currentPage === 1 ? "#CBD5E1" : "#475569",
            fontSize: "12px",
            fontWeight: 500,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center" style={{ gap: "4px" }}>
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span 
                  key={`ellipsis-${idx}`}
                  style={{ 
                    width: "28px", 
                    height: "32px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "#94A3B8",
                    fontSize: "13px"
                  }}
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                style={{
                  minWidth: "32px",
                  height: "32px",
                  padding: "0 8px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? "#FFB000" : "#FFFFFF",
                  color: isActive ? "#172033" : "#475569",
                  border: isActive ? "1px solid #FFB000" : "1px solid #E2E8F0",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 2px 6px rgba(255, 176, 0, 0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
          style={{
            height: "32px",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            color: currentPage === totalPages ? "#CBD5E1" : "#475569",
            fontSize: "12px",
            fontWeight: 500,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            color: currentPage === totalPages ? "#CBD5E1" : "#475569",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
