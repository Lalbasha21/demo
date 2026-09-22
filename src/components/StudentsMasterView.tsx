/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  GraduationCap
} from 'lucide-react';
import { Student } from '../types';

interface StudentsMasterViewProps {
  students: Student[];
}

export const StudentsMasterView: React.FC<StudentsMasterViewProps> = ({ students }) => {
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');

  const branches = Array.from(new Set(students.map(s => s.branch)));

  const filtered = students.filter(s => {
    const matchesSearch =
      s.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'ALL' || s.branch === filterBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Student Master Records</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {students.length} Verified Students
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Primary college student database used for identity resolution and verification on Google Form submissions
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Roll Number Index: UNIQUE & Indexed
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-student-master"
            type="text"
            placeholder="Search verified student by Roll No, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span className="font-medium">Branch:</span>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-2.5 py-1 border border-slate-300 rounded text-xs bg-white"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-mono">Roll Number</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-3">Branch</th>
              <th className="py-3 px-3">Sec</th>
              <th className="py-3 px-3 font-mono">CGPA</th>
              <th className="py-3 px-4">College Email</th>
              <th className="py-3 px-3 font-mono">Phone</th>
              <th className="py-3 px-3">Resume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {s.roll_no}
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">
                  {s.name}
                </td>
                <td className="py-3 px-3 text-slate-600 font-medium">
                  {s.branch}
                </td>
                <td className="py-3 px-3 text-slate-600 font-mono">
                  {s.section}
                </td>
                <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                  {s.cgpa.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono">
                  {s.email}
                </td>
                <td className="py-3 px-3 font-mono text-slate-500">
                  {s.phone}
                </td>
                <td className="py-3 px-3">
                  <a
                    href={s.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span>Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
