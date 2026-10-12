"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <RouteGuard permission="documents.view">
      <ModulePlaceholder 
        title="Documents" 
        subtitle="Manage architectural drawings, engineering submittals, specifications, and permits."
        icon={<FileText size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
