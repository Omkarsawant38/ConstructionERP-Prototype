"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { Users } from "lucide-react";

export default function ContractorsPage() {
  return (
    <RouteGuard permission="contractors.view">
      <ModulePlaceholder 
        title="Contractors & Vendors" 
        subtitle="Manage contractor profiles, contracts, compliance, and performance."
        icon={<Users size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
