/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Users, 
  Award, 
  TrendingUp, 
  Briefcase,
  Layers,
  PieChart
} from 'lucide-react';
import { PlacementDrive, PlacementRecord, Student } from '../types';

interface AnalyticsViewProps {
  drives: PlacementDrive[];
  students: Student[];
  placements: PlacementRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  drives,
  students,
  placements,
}) => {
  const activeDrives = drives.filter(d => d.status === 'ACTIVE').length;
  const completedDrives = drives.filter(d => d.status === 'COMPLETED').length;
  const totalRegistrations = drives.reduce((acc, d) => acc + (d.registered_count || 0), 0);

  // Branch Placements
  const branchMap: { [b: string]: number } = {};
  placements.forEach(p => {
    branchMap[p.branch] = (branchMap[p.branch] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Drives
            </span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{drives.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {activeDrives} Active · {completedDrives} Completed
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Student Master
            </span>
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            Batch 2023–2027 Eligible Cohort
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Registrations
            </span>
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalRegistrations}</p>
          <p className="text-xs text-slate-500 mt-1">
            Across all Google Form endpoints
          </p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Offers Generated
            </span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">{placements.length}</p>
          <p className="text-xs text-emerald-800 font-medium mt-1">
            From finalized final rounds
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch-wise Placements */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-slate-500" />
            <span>Branch-wise Confirmed Offers</span>
          </h3>

          {Object.keys(branchMap).length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No placement records registered yet.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(branchMap).map(([branch, count]) => {
                const pct = Math.round((count / Math.max(1, placements.length)) * 100);
                return (
                  <div key={branch} className="text-xs">
                    <div className="flex justify-between font-medium mb-1 text-slate-700">
                      <span>{branch}</span>
                      <span className="font-mono">{count} offer(s) ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drives Status Overview */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Recruitment Rounds Hierarchy Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            {drives.map((d) => (
              <div
                key={d.id}
                className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{d.company_name}</p>
                  <p className="text-slate-500">{d.job_role} · {d.package_ctc}</p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="block text-slate-700 font-semibold">
                    {d.rounds_count} Child Rounds
                  </span>
                  <span className="text-slate-500">
                    {d.registered_count} Reg · {d.placed_count} Placed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
