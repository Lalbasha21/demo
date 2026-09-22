/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Award,
  Users
} from 'lucide-react';
import { RoundParticipant, RecruitmentRound } from '../types';

interface SelectedStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRound: RecruitmentRound;
  nextRound?: RecruitmentRound;
  selectedStudents: RoundParticipant[];
  onAdvance: () => Promise<void>;
  onFinalizePlacements: () => Promise<void>;
  advancing: boolean;
  advanceFeedback?: {
    success: boolean;
    message: string;
    advanced_count?: number;
    already_exists?: number;
  } | null;
}

export const SelectedStudentsModal: React.FC<SelectedStudentsModalProps> = ({
  isOpen,
  onClose,
  currentRound,
  nextRound,
  selectedStudents,
  onAdvance,
  onFinalizePlacements,
  advancing,
  advanceFeedback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const filteredStudents = selectedStudents.filter(
    (s) =>
      s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFinalRound = currentRound.is_final_round || !nextRound;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                Selected Students — {currentRound.round_name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 font-mono border border-emerald-200">
                {selectedStudents.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidates who cleared {currentRound.round_name} and qualify for progression
            </p>
          </div>
          <button
            id="btn-close-selected-modal"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {advanceFeedback && (
          <div
            className={`px-6 py-3 text-xs border-b flex items-center space-x-2 ${
              advanceFeedback.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            {advanceFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span>{advanceFeedback.message}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-search-selected-students"
              type="text"
              placeholder="Search selected students by Roll Number, Name, or Branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono whitespace-nowrap">
            Showing {filteredStudents.length} of {selectedStudents.length}
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No selected students in this round yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Mark participants as "SELECTED" in the round candidate table to advance them.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No selected students matching "{searchTerm}".
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">Roll No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3 font-mono">CGPA</th>
                    <th className="py-2.5 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {stu.roll_no}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">{stu.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{stu.branch}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{stu.cgpa.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          SELECTED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Advance Confirmation Overlay or Footer */}
        {showConfirm ? (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-900">
                Advance {selectedStudents.length} selected candidates to{' '}
                {nextRound?.round_name || 'Next Round'}?
              </p>
              <p className="text-[11px] text-amber-700">
                Only candidates not already present will be inserted. Unique constraints will be enforced.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                id="btn-cancel-advance-confirm"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-advance-students"
                onClick={async () => {
                  setShowConfirm(false);
                  await onAdvance();
                }}
                disabled={advancing}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {advancing ? 'Advancing...' : 'Advance Students'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              id="btn-footer-close-selected"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            {isFinalRound ? (
              <button
                id="btn-mark-selected-as-placed"
                onClick={onFinalizePlacements}
                disabled={selectedStudents.length === 0 || advancing}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>Mark Selected as Placed / Create Placements</span>
              </button>
            ) : (
              <button
                id="btn-modal-advance-selected-students"
                onClick={() => setShowConfirm(true)}
                disabled={selectedStudents.length === 0 || advancing}
                className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                <span>ADVANCE SELECTED STUDENTS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
