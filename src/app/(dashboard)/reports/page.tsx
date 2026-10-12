"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <RouteGuard permission="reports.view">
      <ModulePlaceholder 
        title="Reports & Analytics" 
        subtitle="Generate executive project summaries, financial variance analysis, and schedule forecast reports."
        icon={<BarChart3 size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
