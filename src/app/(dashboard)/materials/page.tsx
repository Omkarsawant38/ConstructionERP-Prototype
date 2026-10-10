"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Package } from "lucide-react";

export default function MaterialsPage() {
  return (
    <ModulePlaceholder 
      title="Materials & Inventory" 
      subtitle="Track construction materials, manage stock levels across all sites, and monitor usage."
      icon={<Package size={32} className="text-amber-500" />}
    />
  );
}
