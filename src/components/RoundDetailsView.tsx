/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Filter, 
  Search,
  CheckCircle2,
  Award,
  Edit2
} from 'lucide-react';
import { RecruitmentRound, RoundParticipant, AttendanceStatus, CandidateResult } from '../types';

interface RoundDetailsViewProps {
  round: RecruitmentRound;
  nextRound?: RecruitmentRound;
  participants: RoundParticipant[];
  onUpdateAttendance: (participantId: string, attendance: AttendanceStatus) => Promise<void>;
  onUpdateResult: (participantId: string, result: CandidateResult) => Promise<void>;
  onOpenSelectedModal: () => void;
  onAdvanceDirect: () => void;
  onFinalizePlacements: () => void;
  onUpdateRoundStatus: (status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED') => Promise<void>;
  loading: boolean;
}

export const RoundDetailsView: React.FC<RoundDetailsViewProps> = ({
  round,
  nextRound,
  participants,
  onUpdateAttendance,
  onUpdateResult,
  onOpenSelectedModal,
  onAdvanceDirect,
  onFinalizePlacements,
  onUpdateRoundStatus,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [filterAttendance, setFilterAttendance] = useState<string>('ALL');

  // Stats calculation
  const total = participants.length;
  const presentCount = participants.filter(p => p.attendance === 'PRESENT').length;
  const absentCount = participants.filter(p => p.attendance === 'ABSENT').length;
  const selectedCount = participants.filter(p => p.result === 'SELECTED').length;
  const rejectedCount = participants.filter(p => p.result === 'REJECTED').length;
  const onHoldCount = participants.filter(p => p.result === 'ON_HOLD').length;

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.branch.toLowerCase().includes(search.toLowerCase());
    
    const matchesResult = filterResult === 'ALL' || p.result === filterResult;
    const matchesAttendance = filterAttendance === 'ALL' || p.attendance === filterAttendance;

    return matchesSearch && matchesResult && matchesAttendance;
  });

  const isFinalRound = round.is_final_round || !nextRound;

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs mb-8">
      {/* Round Header & Meta */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-xs font-mono font-bold rounded">
                Round #{round.round_number}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{round.round_name}</h2>
              {round.is_final_round && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded border border-purple-200">
                  FINAL SELECTION ROUND
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center space-x-1">
                <span className="font-medium text-slate-500">ID:</span>
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{round.id}</code>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{round.round_date}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{round.location}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="font-medium text-slate-500">Type:</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{round.round_type}</span>
              </span>
            </div>
          </div>

          {/* Round Status Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              id={`select-round-status-${round.id}`}
              value={round.status}
              onChange={(e) => onUpdateRoundStatus(e.target.value as any)}
              className="text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Stats Metrics Cards (Section 16: e.g. 300 Present, 180 Selected) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="bg-white border border-slate-200 rounded p-3 text-center">
            <p className="text-xs text-slate-500">Candidates</p>
            <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded p-3 text-center">
            <p className="text-xs text-slate-500">Present</p>
            <p className="text-lg font-bold text-slate-700 font-mono mt-0.5">{presentCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded p-3 text-center">
            <p className="text-xs text-slate-500">Absent</p>
            <p className="text-lg font-bold text-slate-400 font-mono mt-0.5">{absentCount}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded p-3 text-center">
            <p className="text-xs text-emerald-800 font-semibold">SELECTED</p>
            <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{selectedCount}</p>
          </div>
          <div className="bg-rose-50/70 border border-rose-200 rounded p-3 text-center">
            <p className="text-xs text-rose-800 font-semibold">Rejected</p>
            <p className="text-lg font-bold text-rose-700 font-mono mt-0.5">{rejectedCount}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 rounded p-3 text-center">
            <p className="text-xs text-amber-800 font-semibold">On Hold</p>
            <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">{onHoldCount}</p>
          </div>
        </div>

        {/* Action Buttons Toolbar (Section 9, 10, 16) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Quick Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Candidates / Counter */}
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono rounded">
              {participants.length} Total Candidates
            </span>

            {/* CRITICAL FIX: Selected Students Button (Section 9) */}
            <button
              id={`btn-selected-students-${round.id}`}
              onClick={onOpenSelectedModal}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selected Students ({selectedCount})</span>
            </button>

            {/* Advance Selected Students or Final Placements */}
            {isFinalRound ? (
              <button
                id={`btn-finalize-placements-${round.id}`}
                onClick={onFinalizePlacements}
                disabled={selectedCount === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>Mark Selected as Placed</span>
              </button>
            ) : (
              <button
                id={`btn-advance-selected-${round.id}`}
                onClick={onAdvanceDirect}
                disabled={selectedCount === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Advance Selected Students</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants Table Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-filter-participants"
            type="text"
            placeholder="Search candidates by Roll No, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Attendance:</span>
            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="ALL">All</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Result:</span>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="ALL">All Results</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-mono">Roll No</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-3">Branch</th>
              <th className="py-3 px-3 font-mono">CGPA</th>
              <th className="py-3 px-4">Attendance</th>
              <th className="py-3 px-4">Evaluation Result</th>
              <th className="py-3 px-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  {participants.length === 0
                    ? 'No candidates enrolled in this round yet. Use Advance from previous round or push from Registered Students.'
                    : 'No candidates matched the current filter.'}
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {p.roll_no}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.branch}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {p.cgpa.toFixed(2)}
                    </td>

                    {/* Attendance quick toggle */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          id={`btn-att-present-${p.id}`}
                          onClick={() => onUpdateAttendance(p.id, 'PRESENT')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            p.attendance === 'PRESENT'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          id={`btn-att-absent-${p.id}`}
                          onClick={() => onUpdateAttendance(p.id, 'ABSENT')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            p.attendance === 'ABSENT'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Absent
                        </button>
                        {p.attendance === 'PENDING' && (
                          <span className="text-[10px] text-slate-400 italic ml-1">Pending</span>
                        )}
                      </div>
                    </td>

                    {/* Result quick toggle */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          id={`btn-res-selected-${p.id}`}
                          onClick={() => onUpdateResult(p.id, 'SELECTED')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                            p.result === 'SELECTED'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          Selected
                        </button>
                        <button
                          id={`btn-res-rejected-${p.id}`}
                          onClick={() => onUpdateResult(p.id, 'REJECTED')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                            p.result === 'REJECTED'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          Rejected
                        </button>
                        <button
                          id={`btn-res-hold-${p.id}`}
                          onClick={() => onUpdateResult(p.id, 'ON_HOLD')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                            p.result === 'ON_HOLD'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          Hold
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {p.score !== null && p.score !== undefined ? `${p.score}/100` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
