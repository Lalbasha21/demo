/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Layers, 
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

import { 
  PlacementDrive, 
  RecruitmentRound, 
  RoundParticipant, 
  Registration, 
  Student, 
  PlacementRecord,
  AttendanceStatus,
  CandidateResult 
} from './types';

import { Navbar } from './components/Navbar';
import { DriveCard } from './components/DriveCard';
import { GoogleFormCard } from './components/GoogleFormCard';
import { RoundStepper } from './components/RoundStepper';
import { RoundDetailsView } from './components/RoundDetailsView';
import { RegisteredStudentsSection } from './components/RegisteredStudentsSection';
import { SelectedStudentsModal } from './components/SelectedStudentsModal';
import { GoogleFormTestModal } from './components/GoogleFormTestModal';
import { NewDriveModal } from './components/NewDriveModal';
import { MobileCoordinatorView } from './components/MobileCoordinatorView';
import { PlacementsView } from './components/PlacementsView';
import { StudentsMasterView } from './components/StudentsMasterView';
import { AnalyticsView } from './components/AnalyticsView';

export default function App() {
  // Navigation & Views
  const [activeTab, setActiveTab] = useState<'drives' | 'students' | 'placements' | 'analytics'>('drives');
  const [isMobileView, setIsMobileView] = useState(false);
  const [driveSubTab, setDriveSubTab] = useState<'round' | 'registration' | 'placements'>('round');

  // Core Data State
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [rounds, setRounds] = useState<RecruitmentRound[]>([]);
  const [activeRound, setActiveRound] = useState<RecruitmentRound | null>(null);
  const [participants, setParticipants] = useState<RoundParticipant[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentsMaster, setStudentsMaster] = useState<Student[]>([]);
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);

  // Modals
  const [isNewDriveModalOpen, setIsNewDriveModalOpen] = useState(false);
  const [isSelectedStudentsModalOpen, setIsSelectedStudentsModalOpen] = useState(false);
  const [isGoogleFormTestModalOpen, setIsGoogleFormTestModalOpen] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [advanceFeedback, setAdvanceFeedback] = useState<{
    success: boolean;
    message: string;
    advanced_count?: number;
    already_exists?: number;
  } | null>(null);
  const [addingToRound1, setAddingToRound1] = useState(false);
  const [addRound1Feedback, setAddRound1Feedback] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Search in drives list
  const [driveSearch, setDriveSearch] = useState('');

  // 1. Initial Data Load
  const fetchDrives = useCallback(async () => {
    try {
      const res = await fetch('/api/drives');
      const data = await res.json();
      setDrives(data);
      return data;
    } catch (err) {
      console.error('Error fetching drives:', err);
      return [];
    }
  }, []);

  const fetchStudentsMaster = useCallback(async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudentsMaster(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, []);

  const fetchPlacements = useCallback(async () => {
    try {
      const res = await fetch('/api/placements');
      const data = await res.json();
      setPlacements(data);
    } catch (err) {
      console.error('Error fetching placements:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const drivesList = await fetchDrives();
      await fetchStudentsMaster();
      await fetchPlacements();

      // Auto select first drive (Deloitte — Analyst) if available
      if (drivesList.length > 0 && !selectedDrive) {
        handleSelectDrive(drivesList[0]);
      }
      setLoading(false);
    }
    init();
  }, [fetchDrives, fetchStudentsMaster, fetchPlacements]);

  // 2. Select Drive and load child rounds and registrations
  const handleSelectDrive = async (drive: PlacementDrive) => {
    setSelectedDrive(drive);
    setDriveSubTab('round');
    setAdvanceFeedback(null);
    setSyncResultMsg(null);
    setAddRound1Feedback(null);

    try {
      // Fetch fresh drive details
      const driveRes = await fetch(`/api/drives/${drive.id}`);
      if (driveRes.ok) {
        const freshDrive = await driveRes.json();
        setSelectedDrive(freshDrive);
      }

      // Fetch child rounds for drive
      const roundsRes = await fetch(`/api/drives/${drive.id}/rounds`);
      const roundsData = await roundsRes.json();
      setRounds(roundsData);

      // Fetch registrations for drive
      const regRes = await fetch(`/api/drives/${drive.id}/registrations`);
      const regData = await regRes.json();
      setRegistrations(regData);

      // Default active round: first active or round 1
      if (roundsData.length > 0) {
        const activeOne = roundsData.find((r: RecruitmentRound) => r.status === 'ACTIVE') || roundsData[0];
        handleSelectRound(activeOne);
      } else {
        setActiveRound(null);
        setParticipants([]);
      }
    } catch (err) {
      console.error('Error loading drive details:', err);
    }
  };

  // 3. Select Child Round and load participants
  const handleSelectRound = async (round: RecruitmentRound) => {
    setActiveRound(round);
    try {
      const res = await fetch(`/api/rounds/${round.id}/participants`);
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error('Error fetching round participants:', err);
    }
  };

  // 4. Refresh current drive data without full reload
  const refreshCurrentDrive = async () => {
    if (!selectedDrive) return;
    try {
      const [dRes, rRes, regRes, plcRes] = await Promise.all([
        fetch(`/api/drives/${selectedDrive.id}`),
        fetch(`/api/drives/${selectedDrive.id}/rounds`),
        fetch(`/api/drives/${selectedDrive.id}/registrations`),
        fetch('/api/placements'),
      ]);

      if (dRes.ok) {
        const dData = await dRes.json();
        setSelectedDrive(dData);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRounds(rData);
        if (activeRound) {
          const updatedActive = rData.find((r: RecruitmentRound) => r.id === activeRound.id);
          if (updatedActive) {
            setActiveRound(updatedActive);
            const partRes = await fetch(`/api/rounds/${updatedActive.id}/participants`);
            if (partRes.ok) {
              const partData = await partRes.json();
              setParticipants(partData);
            }
          }
        }
      }
      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData);
      }
      if (plcRes.ok) {
        const plcData = await plcRes.json();
        setPlacements(plcData);
      }

      // Also refresh list of all drives for summary
      fetchDrives();
    } catch (err) {
      console.error('Error refreshing drive data:', err);
    }
  };

  // 5. Synchronize Google Form Responses (Section 5 & 7)
  const handleGoogleFormSync = async () => {
    if (!selectedDrive) return;
    setSyncing(true);
    setSyncResultMsg(null);

    try {
      const res = await fetch(`/api/drives/${selectedDrive.id}/google-form/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Synchronization failed');
      }

      setSyncResultMsg(data.message);
      await refreshCurrentDrive();
    } catch (err: any) {
      setSyncResultMsg(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // 6. Retry Google Form Creation if failed
  const handleRetryGoogleFormCreate = async () => {
    if (!selectedDrive) return;
    try {
      const res = await fetch(`/api/drives/${selectedDrive.id}/google-form/retry-create`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry creation failed');
      await refreshCurrentDrive();
      setGlobalBanner({ type: 'success', message: 'Google Form created successfully.' });
      setTimeout(() => setGlobalBanner(null), 4000);
    } catch (err: any) {
      setGlobalBanner({ type: 'error', message: err.message });
    }
  };

  // 7. Update Participant Attendance
  const handleUpdateAttendance = async (participantId: string, attendance: AttendanceStatus) => {
    try {
      const res = await fetch(`/api/participants/${participantId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance }),
      });
      if (!res.ok) throw new Error('Failed to update attendance');

      // Optimistic/direct state update
      setParticipants(prev =>
        prev.map(p => (p.id === participantId ? { ...p, attendance } : p))
      );
      // Refresh rounds counts
      refreshCurrentDrive();
    } catch (err: any) {
      console.error(err);
    }
  };

  // 8. Update Participant Result (SELECTED, REJECTED, ON_HOLD, PENDING)
  const handleUpdateResult = async (participantId: string, result: CandidateResult) => {
    try {
      const res = await fetch(`/api/participants/${participantId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error('Failed to update evaluation result');

      // Direct state update
      setParticipants(prev =>
        prev.map(p => (p.id === participantId ? { ...p, result } : p))
      );
      // Refresh rounds counts
      refreshCurrentDrive();
    } catch (err: any) {
      console.error(err);
    }
  };

  // 9. Update Round Status (DRAFT, UPCOMING, ACTIVE, COMPLETED)
  const handleUpdateRoundStatus = async (status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED') => {
    if (!activeRound) return;
    try {
      const res = await fetch(`/api/rounds/${activeRound.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update round status');
      await refreshCurrentDrive();
    } catch (err: any) {
      console.error(err);
    }
  };

  // 10. Enroll Registered Candidates in Round 1
  const handleAddToRound1 = async () => {
    if (!selectedDrive) return;
    setAddingToRound1(true);
    setAddRound1Feedback(null);

    try {
      const res = await fetch(`/api/drives/${selectedDrive.id}/registrations/add-to-round-1`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll in Round 1');

      setAddRound1Feedback(data.message);
      await refreshCurrentDrive();
    } catch (err: any) {
      setAddRound1Feedback(`Error: ${err.message}`);
    } finally {
      setAddingToRound1(false);
    }
  };

  // 11. CRITICAL FUNCTIONALITY: Advance Selected Students to Next Round (Section 10, 11, 12, 18, 20, 21, 22)
  const handleAdvanceSelected = async () => {
    if (!activeRound || !selectedDrive) return;
    setAdvancing(true);
    setAdvanceFeedback(null);

    try {
      const res = await fetch(`/api/rounds/${activeRound.id}/advance-selected`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setAdvanceFeedback({
          success: false,
          message: data.message || data.error || 'Failed to advance selected students',
        });
        return;
      }

      setAdvanceFeedback({
        success: true,
        message: data.message,
        advanced_count: data.advanced_count,
        already_exists: data.already_exists,
      });

      // Section 22: Immediately refresh frontend state without full browser reload
      await refreshCurrentDrive();

      // Show temporary global notification
      setGlobalBanner({
        type: 'success',
        message: data.message,
      });
      setTimeout(() => setGlobalBanner(null), 5000);
    } catch (err: any) {
      setAdvanceFeedback({
        success: false,
        message: err.message || 'Error executing candidate advance',
      });
    } finally {
      setAdvancing(false);
    }
  };

  // 12. Final Placement Creation for Final Round (Section 13 & 14)
  const handleFinalizePlacements = async () => {
    if (!activeRound) return;
    setAdvancing(true);

    try {
      const res = await fetch(`/api/rounds/${activeRound.id}/finalize-placements`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Failed to finalize placements');
      }

      setAdvanceFeedback({
        success: true,
        message: data.message,
      });

      await refreshCurrentDrive();
      setGlobalBanner({
        type: 'success',
        message: data.message,
      });
      setTimeout(() => setGlobalBanner(null), 6000);
    } catch (err: any) {
      setAdvanceFeedback({
        success: false,
        message: err.message,
      });
    } finally {
      setAdvancing(false);
    }
  };

  // Compute next round in hierarchy
  const nextRound = activeRound
    ? rounds.find(r => r.round_number === activeRound.round_number + 1)
    : undefined;

  const selectedStudents = participants.filter(p => p.result === 'SELECTED');

  const filteredDrives = drives.filter(d =>
    d.company_name.toLowerCase().includes(driveSearch.toLowerCase()) ||
    d.job_role.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
      />

      {/* Global Success / Info / Error Notification Banner */}
      {globalBanner && (
        <div
          className={`px-4 py-3 text-xs font-semibold flex items-center justify-between border-b ${
            globalBanner.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : globalBanner.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-blue-600 text-white border-blue-700'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center space-x-2 w-full">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{globalBanner.message}</span>
          </div>
          <button onClick={() => setGlobalBanner(null)} className="text-white hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Coordinator View Mode (Section 23) */}
        {isMobileView ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3.5 rounded border border-slate-200">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Mobile Coordinator Execution Engine
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Streamlined on-ground workflow: Drive → Round → Selected Students → Advance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileView(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium border border-slate-300"
              >
                Switch to Desktop
              </button>
            </div>

            <MobileCoordinatorView
              drives={drives}
              selectedDrive={selectedDrive}
              onSelectDrive={handleSelectDrive}
              rounds={rounds}
              activeRound={activeRound}
              onSelectRound={handleSelectRound}
              participants={participants}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateResult={handleUpdateResult}
              onOpenSelectedModal={() => setIsSelectedStudentsModalOpen(true)}
              onAdvanceDirect={() => setIsSelectedStudentsModalOpen(true)}
              onFinalizePlacements={handleFinalizePlacements}
            />
          </div>
        ) : (
          <>
            {/* TAB 1: PLACEMENT DRIVES (Parent & Child Hierarchy) */}
            {activeTab === 'drives' && (
              <div className="space-y-6">
                {/* Drives Bar: List & Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-2xs">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                      Placement Drives & Recruitment Pipeline
                    </h1>
                    <p className="text-xs text-slate-500">
                      Parent Drives · Automated Google Form Sync · Child Recruitment Rounds
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      id="btn-create-new-drive"
                      onClick={() => setIsNewDriveModalOpen(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Placement Drive</span>
                    </button>
                  </div>
                </div>

                {/* Drives Horizontal Switcher / Carousel */}
                <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin">
                  {drives.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDrive(d)}
                      className={`px-4 py-3 rounded border text-left flex-shrink-0 transition-all ${
                        selectedDrive?.id === d.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs">{d.company_name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          selectedDrive?.id === d.id
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {d.job_role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{d.package_ctc}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">
                          {d.registered_count ?? 0} Reg
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Parent Drive View */}
                {selectedDrive ? (
                  <div className="space-y-6">
                    {/* Section 1 & 7: Google Form Integration Card */}
                    <GoogleFormCard
                      drive={selectedDrive}
                      form={selectedDrive.google_form}
                      onSync={handleGoogleFormSync}
                      onRetryCreate={handleRetryGoogleFormCreate}
                      onOpenTestSubmit={() => setIsGoogleFormTestModalOpen(true)}
                      syncing={syncing}
                      syncResultMsg={syncResultMsg}
                    />

                    {/* Section 1 & 16: Pipeline Hierarchy Stepper */}
                    <RoundStepper
                      drive={selectedDrive}
                      rounds={rounds}
                      activeRoundId={activeRound?.id || null}
                      onSelectRound={(rId) => {
                        const r = rounds.find(item => item.id === rId);
                        if (r) handleSelectRound(r);
                      }}
                      activeTab={driveSubTab}
                      onSelectTab={setDriveSubTab}
                    />

                    {/* Sub-view switcher based on Stepper or Navigation */}
                    {driveSubTab === 'registration' && (
                      <RegisteredStudentsSection
                        drive={selectedDrive}
                        registrations={registrations}
                        onAddToRound1={handleAddToRound1}
                        addingToRound1={addingToRound1}
                        addFeedback={addRound1Feedback}
                      />
                    )}

                    {driveSubTab === 'round' && activeRound && (
                      <RoundDetailsView
                        round={activeRound}
                        nextRound={nextRound}
                        participants={participants}
                        onUpdateAttendance={handleUpdateAttendance}
                        onUpdateResult={handleUpdateResult}
                        onOpenSelectedModal={() => {
                          setAdvanceFeedback(null);
                          setIsSelectedStudentsModalOpen(true);
                        }}
                        onAdvanceDirect={() => {
                          setAdvanceFeedback(null);
                          setIsSelectedStudentsModalOpen(true);
                        }}
                        onFinalizePlacements={handleFinalizePlacements}
                        onUpdateRoundStatus={handleUpdateRoundStatus}
                        loading={loading}
                      />
                    )}

                    {driveSubTab === 'placements' && (
                      <div className="space-y-4">
                        <div className="bg-white p-5 border border-slate-200 rounded flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Placements for {selectedDrive.company_name} ({selectedDrive.job_role})
                            </h3>
                            <p className="text-xs text-slate-500">
                              Offers generated from the final round
                            </p>
                          </div>
                          <span className="font-mono font-bold text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded">
                            {selectedDrive.package_ctc}
                          </span>
                        </div>
                        <PlacementsView
                          placements={placements.filter(p => p.drive_id === selectedDrive.id)}
                          onRefresh={refreshCurrentDrive}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-12 border border-slate-200 rounded text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No Placement Drive Selected</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Select an existing placement drive above or create a new drive to automatically provision Google Forms and recruitment rounds.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STUDENT MASTER DB */}
            {activeTab === 'students' && (
              <StudentsMasterView students={studentsMaster} />
            )}

            {/* TAB 3: PLACED STUDENTS */}
            {activeTab === 'placements' && (
              <PlacementsView placements={placements} onRefresh={fetchPlacements} />
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                drives={drives}
                students={studentsMaster}
                placements={placements}
              />
            )}
          </>
        )}
      </main>

      {/* MODAL 1: Create New Placement Drive (Section 2 & 3) */}
      <NewDriveModal
        isOpen={isNewDriveModalOpen}
        onClose={() => setIsNewDriveModalOpen(false)}
        onDriveCreated={async (newDrive) => {
          await fetchDrives();
          handleSelectDrive(newDrive);
          setGlobalBanner({
            type: 'success',
            message: `Placement Drive for ${newDrive.company_name} created with automatic Google Form and recruitment pipeline!`,
          });
          setTimeout(() => setGlobalBanner(null), 5000);
        }}
      />

      {/* MODAL 2: CRITICAL FIX — Selected Students Modal (Section 9, 17, 18) */}
      {activeRound && (
        <SelectedStudentsModal
          isOpen={isSelectedStudentsModalOpen}
          onClose={() => setIsSelectedStudentsModalOpen(false)}
          currentRound={activeRound}
          nextRound={nextRound}
          selectedStudents={selectedStudents}
          onAdvance={handleAdvanceSelected}
          onFinalizePlacements={handleFinalizePlacements}
          advancing={advancing}
          advanceFeedback={advanceFeedback}
        />
      )}

      {/* MODAL 3: Interactive Google Form Test Submission Preview (Section 3, 4, 5) */}
      {selectedDrive && (
        <GoogleFormTestModal
          isOpen={isGoogleFormTestModalOpen}
          onClose={() => setIsGoogleFormTestModalOpen(false)}
          drive={selectedDrive}
          form={selectedDrive.google_form}
          studentsMaster={studentsMaster}
          onSubmitSuccess={async () => {
            await refreshCurrentDrive();
          }}
        />
      )}
    </div>
  );
}
