"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { Building2 } from "lucide-react";

export default function SiteManagementPage() {
  return (
    <RouteGuard permission="site_progress.view">
      <ModulePlaceholder 
        title="Site Management" 
        subtitle="Record daily site progress logs, weather conditions, safety incidents, and site photos."
        icon={<Building2 size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
