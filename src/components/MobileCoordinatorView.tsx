/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Search, 
  ChevronRight,
  Sparkles,
  Award
} from 'lucide-react';
import { 
  PlacementDrive, 
  RecruitmentRound, 
  RoundParticipant, 
  AttendanceStatus, 
  CandidateResult 
} from '../types';

interface MobileCoordinatorViewProps {
  drives: PlacementDrive[];
  selectedDrive: PlacementDrive | null;
  onSelectDrive: (drive: PlacementDrive) => void;
  rounds: RecruitmentRound[];
  activeRound: RecruitmentRound | null;
  onSelectRound: (round: RecruitmentRound) => void;
  participants: RoundParticipant[];
  onUpdateAttendance: (participantId: string, attendance: AttendanceStatus) => Promise<void>;
  onUpdateResult: (participantId: string, result: CandidateResult) => Promise<void>;
  onOpenSelectedModal: () => void;
  onAdvanceDirect: () => void;
  onFinalizePlacements: () => void;
}

export const MobileCoordinatorView: React.FC<MobileCoordinatorViewProps> = ({
  drives,
  selectedDrive,
  onSelectDrive,
  rounds,
  activeRound,
  onSelectRound,
  participants,
  onUpdateAttendance,
  onUpdateResult,
  onOpenSelectedModal,
  onAdvanceDirect,
  onFinalizePlacements,
}) => {
  const [step, setStep] = useState<'drive' | 'round' | 'candidates'>('drive');
  const [search, setSearch] = useState('');

  const selectedParticipants = participants.filter(p => p.result === 'SELECTED');

  const filteredParticipants = participants.filter(p =>
    p.roll_no.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl my-4 text-white">
      {/* Mobile Top Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
            MC
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Coordinator On-Ground View</h2>
            <p className="text-[10px] text-slate-400">Drive → Round → Selected → Advance</p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Mobile Mode
        </div>
      </div>

      {/* Breadcrumb Steps Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-850 border-b border-slate-800 text-xs">
        <button
          onClick={() => setStep('drive')}
          className={`font-medium ${step === 'drive' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          1. Drive
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button
          onClick={() => selectedDrive && setStep('round')}
          disabled={!selectedDrive}
          className={`font-medium ${step === 'round' ? 'text-amber-400 font-bold' : 'text-slate-400 disabled:opacity-40'}`}
        >
          2. Round
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button
          onClick={() => activeRound && setStep('candidates')}
          disabled={!activeRound}
          className={`font-medium ${step === 'candidates' ? 'text-amber-400 font-bold' : 'text-slate-400 disabled:opacity-40'}`}
        >
          3. Candidates
        </button>
      </div>

      {/* Screen 1: Select Drive */}
      {step === 'drive' && (
        <div className="p-4 space-y-3 min-h-[480px]">
          <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Select Active Placement Drive
          </h3>

          <div className="space-y-2">
            {drives.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  onSelectDrive(d);
                  setStep('round');
                }}
                className={`w-full p-3.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  selectedDrive?.id === d.id
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{d.company_name}</span>
                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono text-slate-300">
                      {d.package_ctc}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{d.job_role}</p>
                  <p className="text-[11px] text-amber-400/80 font-mono mt-1">
                    {d.registered_count ?? 0} Registered · {d.rounds_count ?? 0} Rounds
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 2: Select Child Round */}
      {step === 'round' && selectedDrive && (
        <div className="p-4 space-y-3 min-h-[480px]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('drive')}
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Drives</span>
            </button>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {selectedDrive.company_name}
            </span>
          </div>

          <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Select Recruitment Round
          </h3>

          <div className="space-y-2">
            {rounds.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelectRound(r);
                  setStep('candidates');
                }}
                className={`w-full p-3.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  activeRound?.id === r.id
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center font-bold font-mono text-xs text-white">
                      {r.round_number}
                    </span>
                    <span className="font-bold text-sm text-white">{r.round_name}</span>
                    {r.is_final_round && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 py-0.2 rounded font-mono">
                        FINAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {r.round_type} · {r.location}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-1">
                    {r.total_participants ?? 0} Candidates · {r.selected_count ?? 0} Selected
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 3: Round Candidates & Advance Selected */}
      {step === 'candidates' && activeRound && selectedDrive && (
        <div className="p-4 space-y-3 min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('round')}
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rounds</span>
            </button>
            <span className="text-xs font-bold text-amber-400">
              {activeRound.round_name}
            </span>
          </div>

          {/* Prominent Action Banner for "Selected Students" */}
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Round Selected</p>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {selectedParticipants.length} Candidates
              </p>
            </div>
            <button
              id="mobile-btn-selected-students"
              onClick={onOpenSelectedModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors shadow-xs"
            >
              Selected Students
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roll no or candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Candidates Touch-Friendly Cards */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[340px] pr-1">
            {filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No candidates found in this round.
              </div>
            ) : (
              filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-800/90 border border-slate-700 p-3 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {p.roll_no}
                      </span>
                      <p className="text-xs font-medium text-white">{p.name}</p>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400">
                      {p.branch} · {p.cgpa.toFixed(1)}
                    </div>
                  </div>

                  {/* Attendance & Result Quick Actions (Touch friendly 44px min-height targets) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Attendance:</label>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onUpdateAttendance(p.id, 'PRESENT')}
                          className={`flex-1 py-1.5 rounded text-xs font-bold ${
                            p.attendance === 'PRESENT'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => onUpdateAttendance(p.id, 'ABSENT')}
                          className={`flex-1 py-1.5 rounded text-xs font-bold ${
                            p.attendance === 'ABSENT'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Evaluation:</label>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onUpdateResult(p.id, 'SELECTED')}
                          className={`flex-1 py-1.5 rounded text-xs font-bold ${
                            p.result === 'SELECTED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Select
                        </button>
                        <button
                          onClick={() => onUpdateResult(p.id, 'REJECTED')}
                          className={`flex-1 py-1.5 rounded text-xs font-bold ${
                            p.result === 'REJECTED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Advance button in coordinator mobile view */}
          <div className="pt-2 border-t border-slate-800">
            {activeRound.is_final_round ? (
              <button
                id="mobile-btn-finalize-placements"
                onClick={onFinalizePlacements}
                disabled={selectedParticipants.length === 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 shadow-lg"
              >
                <Award className="w-4 h-4" />
                <span>Mark Selected as Placed ({selectedParticipants.length})</span>
              </button>
            ) : (
              <button
                id="mobile-btn-advance-selected"
                onClick={onAdvanceDirect}
                disabled={selectedParticipants.length === 0}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Advance {selectedParticipants.length} Selected to Next Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
