"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { DollarSign } from "lucide-react";

export default function FinancePage() {
  return (
    <ModulePlaceholder 
      title="Finance & Billing" 
      subtitle="Manage global budgets, client billing, payments, and financial reporting."
      icon={<DollarSign size={32} className="text-amber-500" />}
    />
  );
}
