"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ModulePlaceholder 
      title="Settings" 
      subtitle="Configure application settings, user roles, organization details, and integrations."
      icon={<Settings size={32} className="text-amber-500" />}
    />
  );
}
