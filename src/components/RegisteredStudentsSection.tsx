/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  UserPlus, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Registration, PlacementDrive } from '../types';

interface RegisteredStudentsSectionProps {
  drive: PlacementDrive;
  registrations: Registration[];
  onAddToRound1: () => Promise<void>;
  addingToRound1: boolean;
  addFeedback?: string | null;
}

export const RegisteredStudentsSection: React.FC<RegisteredStudentsSectionProps> = ({
  drive,
  registrations,
  onAddToRound1,
  addingToRound1,
  addFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = registrations.filter((r) => {
    const matchesSearch =
      r.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'ALL' || r.branch === filterBranch;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const branches = Array.from(new Set(registrations.map(r => r.branch)));

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs mb-8">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">
              Registered Students — {drive.company_name}
            </h3>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {registrations.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PostgreSQL source of truth populated via automated Google Form synchronization
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-add-registered-to-round1"
            onClick={onAddToRound1}
            disabled={addingToRound1 || registrations.length === 0}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{addingToRound1 ? 'Enrolling...' : 'Enroll Candidates in Round 1'}</span>
          </button>
        </div>
      </div>

      {addFeedback && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{addFeedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-registered"
            type="text"
            placeholder="Search by roll number, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Branch:</span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="ALL">All</option>
              <option value="Eligible">Eligible</option>
              <option value="Registered">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table (Section 6) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-mono">Roll No</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-3">Branch</th>
              <th className="py-3 px-3 font-mono">CGPA</th>
              <th className="py-3 px-3">Section</th>
              <th className="py-3 px-4">Email / Phone</th>
              <th className="py-3 px-3">Registration Status</th>
              <th className="py-3 px-3">Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  {registrations.length === 0
                    ? 'No students registered yet. Share the Google Form link or submit test responses.'
                    : 'No matching registered students found.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {r.roll_no}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {r.student_name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {r.branch}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {r.cgpa.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {r.section}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div>{r.email}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{r.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        r.status === 'Eligible'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {r.status === 'Eligible' && <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-600 font-medium">Confirmed</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
