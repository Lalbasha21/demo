/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Users, 
  Award, 
  BarChart3, 
  Smartphone, 
  Monitor, 
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'drives' | 'students' | 'placements' | 'analytics';
  setActiveTab: (tab: 'drives' | 'students' | 'placements' | 'analytics') => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMobileView,
  setIsMobileView,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-white">Placement Cell Portal</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                  AY 2026–27
                </span>
              </div>
              <p className="text-xs text-slate-400">Campus Recruitment & Round Automation System</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-tab-drives"
              onClick={() => setActiveTab('drives')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'drives'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Placement Drives</span>
            </button>

            <button
              id="nav-tab-students"
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'students'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Master DB</span>
            </button>

            <button
              id="nav-tab-placements"
              onClick={() => setActiveTab('placements')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'placements'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Placed Students</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Action: Mobile Coordinator View Switch & Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-mono">PostgreSQL Active</span>
            </div>

            <button
              id="btn-toggle-mobile-coordinator"
              onClick={() => setIsMobileView(!isMobileView)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                isMobileView
                  ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle Mobile Coordinator Workflow for on-ground drive rounds"
            >
              {isMobileView ? (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile Coordinator View</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sub-nav bar */}
        <div className="md:hidden flex items-center space-x-1 py-2 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('drives')}
            className={`px-3 py-1 text-xs rounded font-medium ${
              activeTab === 'drives' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Drives
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1 text-xs rounded font-medium ${
              activeTab === 'students' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`px-3 py-1 text-xs rounded font-medium ${
              activeTab === 'placements' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Placements
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 text-xs rounded font-medium ${
              activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>
    </header>
  );
};
