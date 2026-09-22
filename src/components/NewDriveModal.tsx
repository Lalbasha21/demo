/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { PlacementDrive } from '../types';

interface NewDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriveCreated: (drive: PlacementDrive) => void;
}

export const NewDriveModal: React.FC<NewDriveModalProps> = ({
  isOpen,
  onClose,
  onDriveCreated,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [packageCtc, setPackageCtc] = useState('8.5 LPA');
  const [location, setLocation] = useState('Hyderabad / Bengaluru');
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [driveDate, setDriveDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['CSE', 'IT', 'ECE']);

  // Dynamic child round pipeline
  const [rounds, setRounds] = useState<{ name: string; type: string }[]>([
    { name: 'Round 1 — Aptitude Assessment', type: 'Aptitude' },
    { name: 'Round 2 — Technical Interview', type: 'Technical' },
    { name: 'Round 3 — HR & Cultural Fit', type: 'HR' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const branchOptions = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  const toggleBranch = (b: string) => {
    if (selectedBranches.includes(b)) {
      if (selectedBranches.length > 1) {
        setSelectedBranches(selectedBranches.filter(item => item !== b));
      }
    } else {
      setSelectedBranches([...selectedBranches, b]);
    }
  };

  const handleAddRound = () => {
    const num = rounds.length + 1;
    setRounds([...rounds, { name: `Round ${num} — Evaluation`, type: 'Technical' }]);
  };

  const handleRemoveRound = (idx: number) => {
    if (rounds.length > 1) {
      setRounds(rounds.filter((_, i) => i !== idx));
    }
  };

  const handleRoundChange = (idx: number, field: 'name' | 'type', value: string) => {
    const next = [...rounds];
    next[idx][field] = value;
    setRounds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobRole.trim()) {
      setError('Company Name and Job Role are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          job_role: jobRole,
          package_ctc: packageCtc,
          location,
          eligibility_min_cgpa: parseFloat(minCgpa) || 6.5,
          eligible_branches: selectedBranches,
          drive_date: driveDate,
          initial_rounds: rounds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create placement drive');
      }

      onDriveCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating drive');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create New Placement Drive</h3>
              <p className="text-xs text-slate-500">
                Automated Google Form creation and recruitment rounds hierarchy
              </p>
            </div>
          </div>
          <button
            id="btn-close-new-drive-modal"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs border-b border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-company-name"
                type="text"
                required
                placeholder="e.g. Deloitte, Microsoft, TCS"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Job Role / Profile <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-job-role"
                type="text"
                required
                placeholder="e.g. Associate Analyst, SDE-1"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          {/* Package & Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Compensation (CTC) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 7.6 LPA"
                value={packageCtc}
                onChange={(e) => setPackageCtc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Drive Date</label>
              <input
                type="date"
                required
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Job Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          {/* Eligibility */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
            <h4 className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
              <span>Eligibility Criteria</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Minimum CGPA Required:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Eligible Branches:
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {branchOptions.map((b) => {
                    const isSelected = selectedBranches.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => toggleBranch(b)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Automated Google Form Creation Banner (Requirement 2 & 3) */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded flex items-start space-x-3">
            <FileText className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900 text-xs">
                Automatic Google Form Provisioning Enabled
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                The backend will automatically generate a dedicated Google Form linked ONLY to this drive
                with Roll Number, Name, Email, Phone, Branch, Section, CGPA, Resume URL, and Consent fields.
              </p>
            </div>
          </div>

          {/* Recruitment Rounds Pipeline Definition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Child Recruitment Rounds Pipeline</span>
              </label>
              <button
                type="button"
                onClick={handleAddRound}
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Round</span>
              </button>
            </div>

            <div className="space-y-2">
              {rounds.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200"
                >
                  <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center font-bold text-slate-700 font-mono text-[11px]">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1 border border-slate-300 rounded bg-white text-xs"
                    placeholder="Round Name"
                  />
                  <select
                    value={r.type}
                    onChange={(e) => handleRoundChange(idx, 'type', e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white text-xs font-medium"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Coding">Coding Test</option>
                    <option value="Technical">Technical</option>
                    <option value="Group Discussion">Group Discussion</option>
                    <option value="Managerial">Managerial</option>
                    <option value="HR">HR Interview</option>
                  </select>
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-drive"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Creating Drive & Google Form...' : 'Create Placement Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
