"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Building2 } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export function ModulePlaceholder({ title, subtitle, icon }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6" style={{ gap: "24px" }}>
      <PageHeader title={title} description={subtitle} />
      
      <div className="premium-card py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100">
          {icon || <Building2 size={32} className="text-amber-500" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title} Module</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
          This module is scheduled for implementation in Phase 2. The core data structures and routing are already established.
        </p>
        
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-600 font-medium">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
