"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { HardHat } from "lucide-react";

export default function WorkforcePage() {
  return (
    <ModulePlaceholder 
      title="Workforce Management" 
      subtitle="Track labor attendance, shifts, productivity, and safety compliance across sites."
      icon={<HardHat size={32} className="text-amber-500" />}
    />
  );
}
