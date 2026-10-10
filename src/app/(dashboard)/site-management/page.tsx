"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Building2 } from "lucide-react";

export default function SiteManagementPage() {
  return (
    <ModulePlaceholder 
      title="Site Management" 
      subtitle="Manage daily site logs, weather conditions, equipment usage, and safety incidents."
      icon={<Building2 size={32} className="text-amber-500" />}
    />
  );
}
