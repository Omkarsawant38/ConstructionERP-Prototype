"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { ShoppingCart } from "lucide-react";

export default function ProcurementPage() {
  return (
    <RouteGuard permission="procurement.view">
      <ModulePlaceholder 
        title="Procurement" 
        subtitle="Manage vendor purchase orders, material quotations, and approval workflows."
        icon={<ShoppingCart size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
