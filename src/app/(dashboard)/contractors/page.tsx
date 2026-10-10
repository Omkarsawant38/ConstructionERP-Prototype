"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Users } from "lucide-react";

export default function ContractorsPage() {
  return (
    <ModulePlaceholder 
      title="Contractors & Vendors" 
      subtitle="Manage contractor profiles, contracts, compliance, and performance."
      icon={<Users size={32} className="text-amber-500" />}
    />
  );
}
