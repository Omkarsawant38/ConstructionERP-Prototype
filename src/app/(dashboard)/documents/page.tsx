"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <ModulePlaceholder 
      title="Documents" 
      subtitle="Centralized document management for blueprints, permits, contracts, and reports."
      icon={<FileText size={32} className="text-amber-500" />}
    />
  );
}
