/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  Layers, 
  Award, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PlacementDrive } from '../types';

interface DriveCardProps {
  drive: PlacementDrive;
  onSelect: (drive: PlacementDrive) => void;
  isSelected: boolean;
}

export const DriveCard: React.FC<DriveCardProps> = ({
  drive,
  onSelect,
  isSelected,
}) => {
  const isCompleted = drive.status === 'COMPLETED';
  const isActive = drive.status === 'ACTIVE';

  return (
    <div
      onClick={() => onSelect(drive)}
      className={`bg-white border rounded p-5 cursor-pointer transition-all duration-150 hover:shadow-md ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-sm">
            {drive.company_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                {drive.company_name}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">({drive.id})</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{drive.job_role}</p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider font-mono ${
            isActive
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : isCompleted
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {drive.status}
        </span>
      </div>

      {/* Meta Pills */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
        <div>
          <span className="text-slate-400 block text-[11px]">Compensation</span>
          <span className="font-bold font-mono text-slate-900">{drive.package_ctc}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Drive Date</span>
          <span className="font-medium text-slate-700">{drive.drive_date}</span>
        </div>
      </div>

      {/* Google Form & Rounds Indicators */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-slate-600">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>{drive.registered_count ?? 0} Reg</span>
          </div>

          <div className="flex items-center space-x-1 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{drive.rounds_count ?? 0} Rounds</span>
          </div>

          {(drive.placed_count ?? 0) > 0 && (
            <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{drive.placed_count} Placed</span>
            </div>
          )}
        </div>

        <button
          id={`btn-open-drive-${drive.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(drive);
          }}
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
        >
          <span>Manage</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
