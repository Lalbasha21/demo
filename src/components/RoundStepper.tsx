/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  Award,
  Layers
} from 'lucide-react';
import { RecruitmentRound, PlacementDrive } from '../types';

interface RoundStepperProps {
  drive: PlacementDrive;
  rounds: RecruitmentRound[];
  activeRoundId: string | null;
  onSelectRound: (roundId: string) => void;
  activeTab: 'registration' | 'round' | 'placements';
  onSelectTab: (tab: 'registration' | 'round' | 'placements') => void;
}

export const RoundStepper: React.FC<RoundStepperProps> = ({
  drive,
  rounds,
  activeRoundId,
  onSelectRound,
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recruitment Pipeline Hierarchy (Parent Drive: {drive.company_name})
          </h4>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {rounds.length} Child Round{rounds.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Responsive Horizontal Stepper Flow */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* Step 0: Registration */}
        <button
          id="step-registration"
          onClick={() => onSelectTab('registration')}
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded border text-left flex-shrink-0 transition-all ${
            activeTab === 'registration'
              ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
            activeTab === 'registration' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">Registration</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {drive.registered_count ?? 0} Registered
            </p>
          </div>
        </button>

        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />

        {/* Child Rounds 1..N */}
        {rounds.map((round) => {
          const isSelected = activeTab === 'round' && activeRoundId === round.id;
          const isCompleted = round.status === 'COMPLETED';
          const isActive = round.status === 'ACTIVE';

          return (
            <React.Fragment key={round.id}>
              <button
                id={`step-round-${round.round_number}`}
                onClick={() => {
                  onSelectRound(round.id);
                  onSelectTab('round');
                }}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded border text-left flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-400/30'
                    : isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800 hover:bg-emerald-50'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isActive
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : round.round_number}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-semibold leading-tight">{round.round_name}</p>
                    {round.is_final_round && (
                      <span className="text-[10px] px-1 py-0.2 bg-purple-100 text-purple-700 rounded font-mono">
                        FINAL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {round.total_participants ?? 0} Cands ·{' '}
                    <span className="font-semibold text-emerald-700">
                      {round.selected_count ?? 0} Selected
                    </span>
                  </p>
                </div>
              </button>

              <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </React.Fragment>
          );
        })}

        {/* Final Step: Placements */}
        <button
          id="step-placements"
          onClick={() => onSelectTab('placements')}
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded border text-left flex-shrink-0 transition-all ${
            activeTab === 'placements'
              ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
            activeTab === 'placements' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">PLACED</p>
            <p className="text-[11px] text-emerald-700 font-mono font-medium">
              {drive.placed_count ?? 0} Offers
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
