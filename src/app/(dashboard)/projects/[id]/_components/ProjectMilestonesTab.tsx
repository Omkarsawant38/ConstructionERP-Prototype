"use client";

import React from "react";
import { formatDateShort } from "@/lib/utils";
import { Plus, CheckCircle2, Circle, MoreHorizontal, Calendar } from "lucide-react";
import type { Project } from "@/types";
import { demoMilestones } from "@/lib/demo-data";

export default function ProjectMilestonesTab({ project }: { project: Project }) {
  const projectMilestones = demoMilestones
    .filter(m => m.project_id === project.id)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const completedCount = projectMilestones.filter(m => m.is_completed).length;
  const totalCount = projectMilestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="premium-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Project Milestones</h2>
          <p className="text-gray-500 mt-1">Track major phases and deliverables for this project.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <div className="text-sm font-medium text-gray-500 mb-1">{completedCount} of {totalCount} Completed</div>
             <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPercent}%` }} />
             </div>
          </div>
          <button className="btn btn-primary">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Milestone</span>
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Vertical Line for Timeline */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />
        
        <div className="space-y-4 relative z-10">
          {projectMilestones.length > 0 ? (
            projectMilestones.map((milestone, index) => {
              const isPastDue = !milestone.is_completed && new Date(milestone.due_date) < new Date();
              
              return (
                <div key={milestone.id} className="flex gap-6 premium-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 flex items-center justify-center bg-white">
                    {milestone.is_completed ? (
                      <CheckCircle2 size={32} className="text-green-500 bg-white" />
                    ) : (
                      <Circle size={32} className={`bg-white ${isPastDue ? 'text-red-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className={`text-lg font-bold ${milestone.is_completed ? 'text-gray-700' : 'text-gray-900'}`}>
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="text-gray-600 mt-1">{milestone.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                         <div className={`flex items-center gap-1.5 text-sm font-medium ${isPastDue ? 'text-red-600' : 'text-gray-500'}`}>
                           <Calendar size={16} />
                           Due: {formatDateShort(milestone.due_date)}
                           {isPastDue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-2">Overdue</span>}
                         </div>
                         {milestone.completed_date && (
                           <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                             <CheckCircle2 size={16} />
                             Completed: {formatDateShort(milestone.completed_date)}
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      {!milestone.is_completed && (
                        <button className="btn btn-secondary btn-sm bg-white">Mark Complete</button>
                      )}
                      <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="premium-card py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Milestones</h3>
              <p className="text-gray-500 max-w-sm mb-6">
                This project doesn't have any milestones yet. Add milestones to track key phases.
              </p>
              <button className="btn btn-primary">Add Milestone</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
