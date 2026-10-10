"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { ShoppingCart } from "lucide-react";

export default function ProcurementPage() {
  return (
    <ModulePlaceholder 
      title="Procurement" 
      subtitle="Manage suppliers, purchase orders, approvals, and material deliveries."
      icon={<ShoppingCart size={32} className="text-amber-500" />}
    />
  );
}
