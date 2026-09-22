/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Building2, 
  Download, 
  CheckCircle2, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { PlacementRecord } from '../types';

interface PlacementsViewProps {
  placements: PlacementRecord[];
  onRefresh: () => void;
}

export const PlacementsView: React.FC<PlacementsViewProps> = ({ placements }) => {
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');

  const companies = Array.from(new Set(placements.map(p => p.company_name)));

  const filtered = placements.filter(p => {
    const matchesSearch =
      p.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      p.student_name.toLowerCase().includes(search.toLowerCase()) ||
      p.job_role.toLowerCase().includes(search.toLowerCase());
    const matchesComp = filterCompany === 'ALL' || p.company_name === filterCompany;
    return matchesSearch && matchesComp;
  });

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Campus Placements & Offers</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {placements.length} Total Offers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed placement offers generated from finalized recruitment rounds
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-mono">
            Source: PostgreSQL placements table
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-placements"
            type="text"
            placeholder="Search placed candidate, roll number, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span className="font-medium">Company:</span>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-2.5 py-1 border border-slate-300 rounded text-xs bg-white"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
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
              <th className="py-3 px-4 font-mono">Roll No</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-3">Branch</th>
              <th className="py-3 px-4">Recruiting Company</th>
              <th className="py-3 px-4">Job Role</th>
              <th className="py-3 px-3 font-mono">Package (CTC)</th>
              <th className="py-3 px-3">Offer Date</th>
              <th className="py-3 px-3">Offer Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  No placement records found yet. Advance candidates through rounds and finalize in the final round.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {p.roll_no}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {p.student_name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {p.branch}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {p.company_name}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {p.job_role}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {p.package_ctc}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {p.placement_date}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      {p.status}
                    </span>
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
