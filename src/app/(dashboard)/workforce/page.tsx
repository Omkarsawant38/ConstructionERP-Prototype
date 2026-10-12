"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { HardHat } from "lucide-react";

export default function WorkforcePage() {
  return (
    <RouteGuard permission="workforce.view">
      <ModulePlaceholder 
        title="Workforce Management" 
        subtitle="Track daily labor attendance, trade allocations, and contractor manpower."
        icon={<HardHat size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
