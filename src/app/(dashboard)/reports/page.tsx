"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <ModulePlaceholder 
      title="Reports & Analytics" 
      subtitle="Generate comprehensive reports on project progress, financials, and resource utilization."
      icon={<BarChart3 size={32} className="text-amber-500" />}
    />
  );
}
