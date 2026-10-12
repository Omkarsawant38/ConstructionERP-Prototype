"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { DollarSign } from "lucide-react";

export default function FinancePage() {
  return (
    <RouteGuard permission="finance.view">
      <ModulePlaceholder 
        title="Finance & Billing" 
        subtitle="Manage client invoices, accounts payable, payment certificates, and project cash flow."
        icon={<DollarSign size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
