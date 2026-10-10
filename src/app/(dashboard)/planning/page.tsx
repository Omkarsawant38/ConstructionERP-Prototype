"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { ListTodo } from "lucide-react";

export default function PlanningPage() {
  return (
    <ModulePlaceholder 
      title="Planning & Tasks" 
      subtitle="Manage cross-project task dependencies and global master schedules."
      icon={<ListTodo size={32} className="text-amber-500" />}
    />
  );
}
