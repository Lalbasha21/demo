/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PlacementDrive, GoogleForm, Student } from '../types';

interface GoogleFormTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  drive: PlacementDrive;
  form?: GoogleForm;
  studentsMaster: Student[];
  onSubmitSuccess: () => void;
}

export const GoogleFormTestModal: React.FC<GoogleFormTestModalProps> = ({
  isOpen,
  onClose,
  drive,
  form,
  studentsMaster,
  onSubmitSuccess,
}) => {
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('');
  const [rollNo, setRollNo] = useState('23N31A05J5');
  const [studentName, setStudentName] = useState('K. Lal Basha');
  const [email, setEmail] = useState('lalbasha.katika@gmail.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [branch, setBranch] = useState('CSE');
  const [section, setSection] = useState('A');
  const [cgpa, setCgpa] = useState('8.45');
  const [resumeUrl, setResumeUrl] = useState('https://drive.google.com/resume/lalbasha');
  const [consent, setConsent] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSelectMaster = (roll: string) => {
    setSelectedStudentRoll(roll);
    const stu = studentsMaster.find(s => s.roll_no === roll);
    if (stu) {
      setRollNo(stu.roll_no);
      setStudentName(stu.name);
      setEmail(stu.email);
      setPhone(stu.phone);
      setBranch(stu.branch);
      setSection(stu.section);
      setCgpa(stu.cgpa.toString());
      setResumeUrl(stu.resume_url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/drives/${drive.id}/google-form/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll_no: rollNo,
          student_name: studentName,
          email,
          phone,
          branch,
          section,
          cgpa: parseFloat(cgpa) || 7.0,
          resume_url: resumeUrl,
          consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setFeedback({
        success: true,
        message: data.message || 'Form response submitted and synchronized with PostgreSQL!',
      });
      onSubmitSuccess();
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Error submitting response',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header styling like Google Forms Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm text-white">Google Form Submission Preview</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
                  {drive.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {form?.form_title || `${drive.company_name} — ${drive.job_role} Registration`}
              </p>
            </div>
          </div>
          <button
            id="btn-close-google-form-modal"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Dropdown */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Quick Fill Student:</span>
          <select
            value={selectedStudentRoll}
            onChange={(e) => handleSelectMaster(e.target.value)}
            className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs font-mono"
          >
            <option value="">Select from Student Master DB...</option>
            {studentsMaster.map((s) => (
              <option key={s.id} value={s.roll_no}>
                {s.roll_no} — {s.name} ({s.branch}, CGPA: {s.cgpa})
              </option>
            ))}
          </select>
        </div>

        {feedback && (
          <div
            className={`p-3 text-xs border-b flex items-center space-x-2 ${
              feedback.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Roll Number (Primary Match ID) */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <label className="block font-semibold text-slate-800 mb-1">
              Roll Number <span className="text-rose-600">*</span>
              <span className="text-[11px] font-normal text-slate-500 ml-1">
                (Primary matching identifier against student master)
              </span>
            </label>
            <input
              id="input-form-rollno"
              type="text"
              required
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 23N31A05J5"
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Student Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Official College Email <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Branch <span className="text-rose-600">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                CGPA <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Resume / Resume Link <span className="text-rose-600">*</span>
            </label>
            <input
              type="url"
              required
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start space-x-2">
            <input
              type="checkbox"
              id="consent-check"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consent-check" className="text-[11px] text-slate-700 leading-tight">
              I hereby give my confirmation and consent to participate in the placement drive for{' '}
              <strong>{drive.company_name}</strong> and abide by all rules of the Placement Cell.
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              Responses are synchronized automatically with PostgreSQL.
            </p>
            <button
              id="btn-submit-google-form-response"
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Response'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
