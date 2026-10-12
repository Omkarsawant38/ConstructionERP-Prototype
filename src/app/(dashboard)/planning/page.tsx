"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { ListTodo } from "lucide-react";

export default function PlanningPage() {
  return (
    <RouteGuard permission="planning.view">
      <ModulePlaceholder 
        title="Planning & Tasks" 
        subtitle="Manage cross-project task dependencies and global master schedules."
        icon={<ListTodo size={32} className="text-amber-500" />}
      />
    </RouteGuard>
  );
}
