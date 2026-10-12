"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { Package } from "lucide-react";

export default function MaterialsPage() {
  return (
    <RouteGuard permission="inventory.view">
      <ModulePlaceholder 
        title="Materials & Inventory" 
        subtitle="Manage warehouse inventory, material batches, and stock movements."
        icon={<Package size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
