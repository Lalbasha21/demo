/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Student,
  PlacementDrive,
  GoogleForm,
  Registration,
  RecruitmentRound,
  RoundParticipant,
  PlacementRecord,
  AdvanceSelectedResponse,
  SyncResponseResult,
} from '../src/types';

// In-memory relational state with atomic transaction safety and unique constraints
class RelationalPlacementDB {
  public students: Map<string, Student> = new Map();
  public drives: Map<string, PlacementDrive> = new Map();
  public googleForms: Map<string, GoogleForm> = new Map(); // drive_id -> form
  public rawFormResponses: Map<string, any[]> = new Map(); // drive_id -> responses
  public registrations: Map<string, Registration> = new Map(); // id -> reg
  public rounds: Map<string, RecruitmentRound> = new Map(); // id -> round
  public participants: Map<string, RoundParticipant> = new Map(); // id -> participant
  public placements: Map<string, PlacementRecord> = new Map(); // id -> placement

  // Indices and Unique Constraints
  // roll_no -> student_id
  public studentRollIndex: Map<string, string> = new Map();
  // drive_id + ":" + student_id -> registration_id
  public driveStudentRegUnique: Set<string> = new Set();
  // round_id + ":" + student_id -> participant_id
  public roundStudentParticipantUnique: Set<string> = new Set();
  // student_id + ":" + drive_id -> placement_id
  public studentDrivePlacementUnique: Set<string> = new Set();

  constructor() {
    this.seedInitialData();
  }

  // --- Student Master Methods ---
  public getStudents(): Student[] {
    return Array.from(this.students.values());
  }

  public findStudentByRollNo(rollNo: string): Student | undefined {
    const cleanRoll = rollNo.trim().toUpperCase();
    const id = this.studentRollIndex.get(cleanRoll);
    if (!id) return undefined;
    return this.students.get(id);
  }

  public addStudent(student: Student): Student {
    const cleanRoll = student.roll_no.trim().toUpperCase();
    if (this.studentRollIndex.has(cleanRoll)) {
      throw new Error(`Student with Roll Number ${cleanRoll} already exists.`);
    }
    this.students.set(student.id, student);
    this.studentRollIndex.set(cleanRoll, student.id);
    return student;
  }

  // --- Placement Drive Methods ---
  public getDrives(): PlacementDrive[] {
    const list = Array.from(this.drives.values());
    return list.map(d => this.enrichDrive(d));
  }

  public getDrive(driveId: string): PlacementDrive | undefined {
    const drive = this.drives.get(driveId);
    if (!drive) return undefined;
    return this.enrichDrive(drive);
  }

  private enrichDrive(drive: PlacementDrive): PlacementDrive {
    const form = this.googleForms.get(drive.id);
    const registeredCount = Array.from(this.registrations.values()).filter(r => r.drive_id === drive.id).length;
    const roundsCount = Array.from(this.rounds.values()).filter(r => r.drive_id === drive.id).length;
    const placedCount = Array.from(this.placements.values()).filter(p => p.drive_id === drive.id).length;

    return {
      ...drive,
      google_form: form,
      registered_count: registeredCount,
      rounds_count: roundsCount,
      placed_count: placedCount,
    };
  }

  public createDrive(data: {
    company_name: string;
    job_role: string;
    package_ctc: string;
    location: string;
    eligibility_min_cgpa: number;
    eligible_branches: string[];
    max_backlogs?: number;
    drive_date: string;
    initial_rounds?: { name: string; type: string }[];
  }): PlacementDrive {
    const driveId = `DRIVE-${Date.now().toString().slice(-4)}`;
    const newDrive: PlacementDrive = {
      id: driveId,
      company_id: `COMP-${Date.now().toString().slice(-4)}`,
      company_name: data.company_name,
      job_role: data.job_role,
      package_ctc: data.package_ctc,
      location: data.location || 'Campus / Virtual',
      eligibility_min_cgpa: data.eligibility_min_cgpa || 6.5,
      eligible_branches: data.eligible_branches || ['CSE', 'IT', 'ECE'],
      max_backlogs: data.max_backlogs ?? 0,
      drive_date: data.drive_date || new Date().toISOString().split('T')[0],
      status: 'UPCOMING',
      created_at: new Date().toISOString(),
    };

    this.drives.set(driveId, newDrive);

    // Rule 2 & 3: Automatically create Google Form associated with ONLY this Placement Drive
    this.createGoogleFormForDrive(newDrive);

    // Create child recruitment rounds
    const defaultRounds = data.initial_rounds && data.initial_rounds.length > 0
      ? data.initial_rounds
      : [
          { name: 'Round 1 — Aptitude Assessment', type: 'Aptitude' },
          { name: 'Round 2 — Technical Interview', type: 'Technical' },
          { name: 'Round 3 — HR & Cultural Fit', type: 'HR' },
        ];

    defaultRounds.forEach((r, idx) => {
      const roundNumber = idx + 1;
      const isFinal = roundNumber === defaultRounds.length;
      const roundId = `RND-${driveId}-${roundNumber}`;
      const round: RecruitmentRound = {
        id: roundId,
        drive_id: driveId,
        round_number: roundNumber,
        round_name: r.name,
        round_type: r.type,
        round_date: newDrive.drive_date,
        location: 'Online / Placement Cell',
        status: roundNumber === 1 ? 'ACTIVE' : 'UPCOMING',
        is_final_round: isFinal,
        created_at: new Date().toISOString(),
      };
      this.rounds.set(roundId, round);
    });

    return this.enrichDrive(newDrive);
  }

  // --- Google Form Creation & Management ---
  public createGoogleFormForDrive(drive: PlacementDrive): GoogleForm {
    const formId = `FORM-${drive.id}`;
    const slug = drive.company_name.replace(/[^a-zA-Z0-9]/g, '_');
    const formUrl = `https://forms.google.com/d/e/1FAIpQLSc_${slug}_${drive.id}/viewform`;
    const sheetUrl = `https://docs.google.com/spreadsheets/d/1Spreadsheet_${drive.id}_Responses/edit`;

    const form: GoogleForm = {
      id: formId,
      drive_id: drive.id,
      form_title: `${drive.company_name} — ${drive.job_role} Registration`,
      form_id: formId,
      form_url: formUrl,
      sheet_url: sheetUrl,
      status: 'CONNECTED',
      last_synced_at: new Date().toISOString(),
      response_count: 0,
      error_message: null,
      fields: [
        { id: 'f_roll', label: 'Roll Number', type: 'text', required: true },
        { id: 'f_name', label: 'Student Full Name', type: 'text', required: true },
        { id: 'f_email', label: 'Official College Email', type: 'email', required: true },
        { id: 'f_phone', label: 'Contact Phone Number', type: 'phone', required: true },
        { id: 'f_branch', label: 'Engineering Branch', type: 'select', required: true, options: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'] },
        { id: 'f_section', label: 'Section', type: 'select', required: true, options: ['A', 'B', 'C'] },
        { id: 'f_cgpa', label: 'Current CGPA (up to current sem)', type: 'number', required: true },
        { id: 'f_resume', label: 'Resume Drive Link (Public Viewable)', type: 'url', required: true },
        { id: 'f_consent', label: 'I agree to strictly attend all interview rounds and accept the placement cell guidelines', type: 'checkbox', required: true },
      ],
    };

    this.googleForms.set(drive.id, form);
    if (!this.rawFormResponses.has(drive.id)) {
      this.rawFormResponses.set(drive.id, []);
    }

    return form;
  }

  // Submit test response to Google Form
  public submitGoogleFormResponse(driveId: string, responseData: {
    roll_no: string;
    student_name?: string;
    email?: string;
    phone?: string;
    branch?: string;
    section?: string;
    cgpa?: number;
    resume_url?: string;
    consent?: boolean;
  }): { success: boolean; message: string; auto_synced: boolean } {
    const drive = this.drives.get(driveId);
    if (!drive) {
      throw new Error(`Placement Drive ${driveId} not found.`);
    }

    const form = this.googleForms.get(driveId);
    if (!form) {
      throw new Error(`Google Form for drive ${driveId} not found.`);
    }

    const responses = this.rawFormResponses.get(driveId) || [];
    const cleanRoll = responseData.roll_no.trim().toUpperCase();

    // Check if student exists in master DB
    const student = this.findStudentByRollNo(cleanRoll);

    const submission = {
      response_id: `RESP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      submitted_at: new Date().toISOString(),
      roll_no: cleanRoll,
      student_name: student ? student.name : (responseData.student_name || 'Student ' + cleanRoll),
      email: student ? student.email : (responseData.email || `${cleanRoll.toLowerCase()}@college.edu`),
      phone: student ? student.phone : (responseData.phone || '+91 98765 00000'),
      branch: student ? student.branch : (responseData.branch || 'CSE'),
      section: student ? student.section : (responseData.section || 'A'),
      cgpa: student ? student.cgpa : (responseData.cgpa || 7.5),
      resume_url: student ? student.resume_url : (responseData.resume_url || 'https://drive.google.com/resume'),
      consent: responseData.consent !== false,
    };

    responses.push(submission);
    this.rawFormResponses.set(driveId, responses);
    form.response_count = responses.length;

    // Synchronize immediately
    const syncResult = this.syncGoogleFormResponses(driveId);

    return {
      success: true,
      message: `Google Form response submitted successfully for Roll No ${cleanRoll}.`,
      auto_synced: syncResult.success,
    };
  }

  // Synchronize Google Form responses into PostgreSQL registrations (Section 5)
  public syncGoogleFormResponses(driveId: string): SyncResponseResult {
    const drive = this.drives.get(driveId);
    if (!drive) {
      throw new Error(`Placement Drive ${driveId} not found.`);
    }

    const form = this.googleForms.get(driveId);
    if (!form) {
      throw new Error(`Google Form not found for Drive ${driveId}.`);
    }

    const rawList = this.rawFormResponses.get(driveId) || [];
    let newlySynced = 0;
    let duplicates = 0;

    // Transactional sync
    try {
      for (const item of rawList) {
        const cleanRoll = item.roll_no.trim().toUpperCase();
        let student = this.findStudentByRollNo(cleanRoll);

        // If not in master, auto-register student record
        if (!student) {
          const studentId = `STU-${cleanRoll}`;
          student = {
            id: studentId,
            roll_no: cleanRoll,
            name: item.student_name,
            email: item.email,
            phone: item.phone,
            branch: item.branch,
            section: item.section || 'A',
            cgpa: Number(item.cgpa) || 7.0,
            backlogs: 0,
            resume_url: item.resume_url || 'https://drive.google.com/resume',
            created_at: new Date().toISOString(),
          };
          this.students.set(studentId, student);
          this.studentRollIndex.set(cleanRoll, studentId);
        }

        // Check unique constraint UNIQUE(drive_id, student_id)
        const uniqueKey = `${driveId}:${student.id}`;
        if (this.driveStudentRegUnique.has(uniqueKey)) {
          duplicates++;
          continue;
        }

        // Validate eligibility
        const isBranchEligible = drive.eligible_branches.includes(student.branch);
        const isCgpaEligible = student.cgpa >= drive.eligibility_min_cgpa;
        const status: 'Registered' | 'Eligible' | 'Not Eligible' =
          (isBranchEligible && isCgpaEligible) ? 'Eligible' : 'Registered';

        const regId = `REG-${driveId}-${student.id}`;
        const reg: Registration = {
          id: regId,
          drive_id: driveId,
          student_id: student.id,
          roll_no: student.roll_no,
          student_name: student.name,
          branch: student.branch,
          cgpa: student.cgpa,
          section: student.section,
          email: student.email,
          phone: student.phone,
          resume_url: student.resume_url,
          status,
          consent: item.consent,
          registered_at: item.submitted_at || new Date().toISOString(),
        };

        this.registrations.set(regId, reg);
        this.driveStudentRegUnique.add(uniqueKey);
        newlySynced++;
      }

      form.status = 'CONNECTED';
      form.last_synced_at = new Date().toISOString();
      form.response_count = rawList.length;
      form.error_message = null;

      return {
        success: true,
        synced_count: newlySynced,
        duplicate_count: duplicates,
        total_responses: rawList.length,
        last_synced_at: form.last_synced_at,
        message: newlySynced > 0
          ? `Successfully synchronized ${newlySynced} registration(s) from Google Form.${duplicates > 0 ? ` (${duplicates} duplicate responses skipped).` : ''}`
          : `All ${rawList.length} responses are already synchronized with PostgreSQL.${duplicates > 0 ? ` (${duplicates} duplicate submissions ignored).` : ''}`,
      };
    } catch (err: any) {
      form.status = 'SYNC_FAILED';
      form.error_message = err.message || 'Google Form synchronization failed';
      throw err;
    }
  }

  // --- Registrations ---
  public getRegistrations(driveId: string): Registration[] {
    return Array.from(this.registrations.values())
      .filter(r => r.drive_id === driveId)
      .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
  }

  // Populate Round 1 from Registered Students
  public addRegisteredToRound1(driveId: string): { added_count: number; already_count: number } {
    const rounds = this.getRoundsForDrive(driveId);
    if (rounds.length === 0) {
      throw new Error(`No rounds found for Drive ${driveId}`);
    }

    const round1 = rounds[0];
    const registrations = this.getRegistrations(driveId);

    let added = 0;
    let already = 0;

    for (const reg of registrations) {
      const uniqueKey = `${round1.id}:${reg.student_id}`;
      if (this.roundStudentParticipantUnique.has(uniqueKey)) {
        already++;
        continue;
      }

      const participantId = `PART-${round1.id}-${reg.student_id}`;
      const participant: RoundParticipant = {
        id: participantId,
        round_id: round1.id,
        student_id: reg.student_id,
        roll_no: reg.roll_no,
        name: reg.student_name,
        branch: reg.branch,
        cgpa: reg.cgpa,
        email: reg.email,
        phone: reg.phone,
        attendance: 'PENDING',
        result: 'PENDING',
        updated_at: new Date().toISOString(),
      };

      this.participants.set(participantId, participant);
      this.roundStudentParticipantUnique.add(uniqueKey);
      added++;
    }

    return { added_count: added, already_count: already };
  }

  // --- Child Rounds & Participants ---
  public getRoundsForDrive(driveId: string): RecruitmentRound[] {
    const list = Array.from(this.rounds.values())
      .filter(r => r.drive_id === driveId)
      .sort((a, b) => a.round_number - b.round_number);

    return list.map(r => {
      const parts = Array.from(this.participants.values()).filter(p => p.round_id === r.id);
      const selected = parts.filter(p => p.result === 'SELECTED').length;
      const present = parts.filter(p => p.attendance === 'PRESENT').length;
      const rejected = parts.filter(p => p.result === 'REJECTED').length;

      return {
        ...r,
        total_participants: parts.length,
        selected_count: selected,
        present_count: present,
        rejected_count: rejected,
      };
    });
  }

  public getRound(roundId: string): RecruitmentRound | undefined {
    const r = this.rounds.get(roundId);
    if (!r) return undefined;
    const parts = Array.from(this.participants.values()).filter(p => p.round_id === r.id);
    return {
      ...r,
      total_participants: parts.length,
      selected_count: parts.filter(p => p.result === 'SELECTED').length,
      present_count: parts.filter(p => p.attendance === 'PRESENT').length,
      rejected_count: parts.filter(p => p.result === 'REJECTED').length,
    };
  }

  public updateRound(roundId: string, updates: Partial<RecruitmentRound>): RecruitmentRound {
    const r = this.rounds.get(roundId);
    if (!r) throw new Error(`Round ${roundId} not found.`);
    const updated = { ...r, ...updates };
    this.rounds.set(roundId, updated);
    return this.getRound(roundId)!;
  }

  public getParticipants(roundId: string): RoundParticipant[] {
    return Array.from(this.participants.values())
      .filter(p => p.round_id === roundId)
      .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
  }

  public updateParticipantResult(participantId: string, result: 'PENDING' | 'SELECTED' | 'REJECTED' | 'ON_HOLD', score?: number, notes?: string): RoundParticipant {
    const p = this.participants.get(participantId);
    if (!p) throw new Error(`Participant ${participantId} not found.`);
    p.result = result;
    if (score !== undefined) p.score = score;
    if (notes !== undefined) p.notes = notes;
    p.updated_at = new Date().toISOString();
    this.participants.set(participantId, p);
    return p;
  }

  public updateParticipantAttendance(participantId: string, attendance: 'PENDING' | 'PRESENT' | 'ABSENT'): RoundParticipant {
    const p = this.participants.get(participantId);
    if (!p) throw new Error(`Participant ${participantId} not found.`);
    p.attendance = attendance;
    p.updated_at = new Date().toISOString();
    this.participants.set(participantId, p);
    return p;
  }

  // CRITICAL FIX: Selected Students (Section 9)
  public getSelectedStudents(roundId: string): RoundParticipant[] {
    return Array.from(this.participants.values())
      .filter(p => p.round_id === roundId && p.result === 'SELECTED')
      .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
  }

  // CRITICAL WORKFLOW: Advance Selected Students to Next Round (Section 10, 11, 12, 13, 20, 21)
  public advanceSelectedStudents(roundId: string): AdvanceSelectedResponse {
    const currentRound = this.rounds.get(roundId);
    if (!currentRound) {
      throw new Error(`Round ${roundId} not found.`);
    }

    const driveId = currentRound.drive_id;
    const parentDrive = this.drives.get(driveId);
    if (!parentDrive) {
      throw new Error(`Parent drive ${driveId} not found.`);
    }

    // Automatic Next Round Detection using drive_id + (round_number + 1)
    const nextRoundNumber = currentRound.round_number + 1;
    const allDriveRounds = this.getRoundsForDrive(driveId);
    const nextRound = allDriveRounds.find(r => r.round_number === nextRoundNumber);

    // Section 13: Final round behavior
    if (!nextRound || currentRound.is_final_round) {
      return {
        success: false,
        is_final_round: true,
        current_round: currentRound.round_name,
        next_round: 'None (Final Round)',
        selected_count: this.getSelectedStudents(roundId).length,
        advanced_count: 0,
        already_exists: 0,
        message: 'This is the final round. No further child rounds exist. You can now finalize and create placement records.',
      };
    }

    // Step 7: Fetch selected participants from current round
    const selectedStudents = this.getSelectedStudents(roundId);
    if (selectedStudents.length === 0) {
      return {
        success: false,
        current_round: currentRound.round_name,
        next_round: nextRound.round_name,
        selected_count: 0,
        advanced_count: 0,
        already_exists: 0,
        message: 'No selected students are available to advance in this round.',
      };
    }

    // Step 10 & 21: Database transaction simulation with rollback safety
    const stagedInserts: RoundParticipant[] = [];
    const stagedUniqueKeys: string[] = [];
    let alreadyExists = 0;

    for (const student of selectedStudents) {
      // Step 8 & 11: Check existing participants in next round UNIQUE(round_id, student_id)
      const nextRoundUniqueKey = `${nextRound.id}:${student.student_id}`;

      if (this.roundStudentParticipantUnique.has(nextRoundUniqueKey)) {
        alreadyExists++;
        continue;
      }

      // Prepare insertion
      const newParticipantId = `PART-${nextRound.id}-${student.student_id}`;
      const newParticipant: RoundParticipant = {
        id: newParticipantId,
        round_id: nextRound.id,
        student_id: student.student_id,
        roll_no: student.roll_no,
        name: student.name,
        branch: student.branch,
        cgpa: student.cgpa,
        email: student.email,
        phone: student.phone,
        attendance: 'PENDING',
        result: 'PENDING',
        updated_at: new Date().toISOString(),
      };

      stagedInserts.push(newParticipant);
      stagedUniqueKeys.push(nextRoundUniqueKey);
    }

    // If all students already present
    if (stagedInserts.length === 0 && alreadyExists > 0) {
      return {
        success: true,
        current_round: currentRound.round_name,
        next_round: nextRound.round_name,
        selected_count: selectedStudents.length,
        advanced_count: 0,
        already_exists: alreadyExists,
        message: `All ${alreadyExists} selected students are already present in ${nextRound.round_name}. 0 new candidates added.`,
      };
    }

    // Commit transaction atomically
    try {
      for (let i = 0; i < stagedInserts.length; i++) {
        const item = stagedInserts[i];
        const key = stagedUniqueKeys[i];
        this.participants.set(item.id, item);
        this.roundStudentParticipantUnique.add(key);
      }

      // Update round status if needed
      if (nextRound.status === 'UPCOMING') {
        nextRound.status = 'ACTIVE';
        this.rounds.set(nextRound.id, nextRound);
      }
      currentRound.status = 'COMPLETED';
      this.rounds.set(currentRound.id, currentRound);

      return {
        success: true,
        current_round: currentRound.round_name,
        next_round: nextRound.round_name,
        selected_count: selectedStudents.length,
        advanced_count: stagedInserts.length,
        already_exists: alreadyExists,
        message: `${stagedInserts.length} students successfully advanced to ${nextRound.round_name}.${alreadyExists > 0 ? ` (${alreadyExists} were already present).` : ''}`,
      };
    } catch (err: any) {
      // Rollback on any failure
      for (const item of stagedInserts) {
        this.participants.delete(item.id);
      }
      for (const key of stagedUniqueKeys) {
        this.roundStudentParticipantUnique.delete(key);
      }
      throw new Error(`Atomic candidate advance failed: ${err.message}`);
    }
  }

  // Section 14: Final Placement Creation
  public finalizePlacements(roundId: string): { success: boolean; placed_count: number; already_placed_count: number; message: string } {
    const round = this.rounds.get(roundId);
    if (!round) throw new Error(`Round ${roundId} not found.`);

    const drive = this.drives.get(round.drive_id);
    if (!drive) throw new Error(`Drive ${round.drive_id} not found.`);

    const selectedStudents = this.getSelectedStudents(roundId);
    if (selectedStudents.length === 0) {
      throw new Error('No selected students found in this final round.');
    }

    let newlyPlaced = 0;
    let alreadyPlaced = 0;

    for (const stu of selectedStudents) {
      // UNIQUE(student_id, drive_id)
      const uniqueKey = `${stu.student_id}:${drive.id}`;
      if (this.studentDrivePlacementUnique.has(uniqueKey)) {
        alreadyPlaced++;
        continue;
      }

      const placementId = `PLC-${drive.id}-${stu.student_id}`;
      const record: PlacementRecord = {
        id: placementId,
        student_id: stu.student_id,
        drive_id: drive.id,
        company_id: drive.company_id,
        company_name: drive.company_name,
        roll_no: stu.roll_no,
        student_name: stu.name,
        branch: stu.branch,
        job_role: drive.job_role,
        package_ctc: drive.package_ctc,
        placement_date: new Date().toISOString().split('T')[0],
        status: 'OFFERED',
      };

      this.placements.set(placementId, record);
      this.studentDrivePlacementUnique.add(uniqueKey);
      newlyPlaced++;
    }

    round.status = 'COMPLETED';
    this.rounds.set(round.id, round);
    drive.status = 'COMPLETED';
    this.drives.set(drive.id, drive);

    return {
      success: true,
      placed_count: newlyPlaced,
      already_placed_count: alreadyPlaced,
      message: `${newlyPlaced} students successfully marked as placed with ${drive.company_name} for the role of ${drive.job_role}!${alreadyPlaced > 0 ? ` (${alreadyPlaced} had existing placement records).` : ''}`,
    };
  }

  public getPlacements(driveId?: string): PlacementRecord[] {
    const list = Array.from(this.placements.values());
    if (driveId) {
      return list.filter(p => p.drive_id === driveId);
    }
    return list;
  }

  // Seed realistic placement cell records matching user scenario (Deloitte, TCS, etc.)
  private seedInitialData() {
    // 1. Master Students
    const studentSeeds: Omit<Student, 'id' | 'created_at'>[] = [
      { roll_no: '23N31A05J5', name: 'K. Lal Basha', email: 'lalbasha.katika@gmail.com', phone: '+91 98765 43210', branch: 'CSE', section: 'A', cgpa: 8.45, backlogs: 0, resume_url: 'https://drive.google.com/resume/lalbasha' },
      { roll_no: '23N31A05K0', name: 'Ananth Kumar', email: 'ananth.k@college.edu', phone: '+91 98765 43211', branch: 'CSE', section: 'A', cgpa: 7.82, backlogs: 0, resume_url: 'https://drive.google.com/resume/ananth' },
      { roll_no: '23N31A05A1', name: 'Sneha Reddy', email: 'sneha.r@college.edu', phone: '+91 98765 43212', branch: 'CSE', section: 'B', cgpa: 8.91, backlogs: 0, resume_url: 'https://drive.google.com/resume/sneha' },
      { roll_no: '23N31A05B3', name: 'Rahul Sharma', email: 'rahul.s@college.edu', phone: '+91 98765 43213', branch: 'IT', section: 'A', cgpa: 8.12, backlogs: 0, resume_url: 'https://drive.google.com/resume/rahul' },
      { roll_no: '23N31A05C7', name: 'Priya Dharshini', email: 'priya.d@college.edu', phone: '+91 98765 43214', branch: 'ECE', section: 'A', cgpa: 7.64, backlogs: 0, resume_url: 'https://drive.google.com/resume/priya' },
      { roll_no: '23N31A05D2', name: 'Vikram Aditya', email: 'vikram.a@college.edu', phone: '+91 98765 43215', branch: 'CSE', section: 'C', cgpa: 8.35, backlogs: 0, resume_url: 'https://drive.google.com/resume/vikram' },
      { roll_no: '23N31A05E9', name: 'Meghana Rao', email: 'meghana.r@college.edu', phone: '+91 98765 43216', branch: 'IT', section: 'B', cgpa: 7.95, backlogs: 0, resume_url: 'https://drive.google.com/resume/meghana' },
      { roll_no: '23N31A05F4', name: 'Sai Krishna', email: 'sai.k@college.edu', phone: '+91 98765 43217', branch: 'ECE', section: 'B', cgpa: 8.10, backlogs: 0, resume_url: 'https://drive.google.com/resume/saikrishna' },
      { roll_no: '23N31A05G1', name: 'Divya Sree', email: 'divya.s@college.edu', phone: '+91 98765 43218', branch: 'CSE', section: 'B', cgpa: 9.02, backlogs: 0, resume_url: 'https://drive.google.com/resume/divya' },
      { roll_no: '23N31A05H6', name: 'Harsha Vardhan', email: 'harsha.v@college.edu', phone: '+91 98765 43219', branch: 'EEE', section: 'A', cgpa: 7.42, backlogs: 0, resume_url: 'https://drive.google.com/resume/harsha' },
      { roll_no: '23N31A05M8', name: 'Tanvi Patel', email: 'tanvi.p@college.edu', phone: '+91 98765 43220', branch: 'CSE', section: 'C', cgpa: 8.78, backlogs: 0, resume_url: 'https://drive.google.com/resume/tanvi' },
      { roll_no: '23N31A05P2', name: 'Karthik Raja', email: 'karthik.r@college.edu', phone: '+91 98765 43221', branch: 'IT', section: 'A', cgpa: 8.24, backlogs: 0, resume_url: 'https://drive.google.com/resume/karthik' },
    ];

    studentSeeds.forEach((s, idx) => {
      const id = `STU-${(idx + 1).toString().padStart(3, '0')}`;
      const student: Student = {
        id,
        ...s,
        created_at: '2026-08-01T09:00:00.000Z',
      };
      this.students.set(id, student);
      this.studentRollIndex.set(student.roll_no.toUpperCase(), id);
    });

    // 2. Deloitte Placement Drive (Parent Drive)
    const deloitteDrive: PlacementDrive = {
      id: 'DRIVE-001',
      company_id: 'COMP-DELOITTE',
      company_name: 'Deloitte',
      job_role: 'Analyst',
      package_ctc: '7.6 LPA',
      location: 'Hyderabad / Bengaluru',
      eligibility_min_cgpa: 7.0,
      eligible_branches: ['CSE', 'IT', 'ECE', 'EEE'],
      max_backlogs: 0,
      drive_date: '2026-09-22',
      status: 'ACTIVE',
      created_at: '2026-09-15T10:00:00.000Z',
    };
    this.drives.set(deloitteDrive.id, deloitteDrive);

    // Google Form for Deloitte (Associated with ONLY DRIVE-001)
    const deloitteForm: GoogleForm = {
      id: 'FORM-DRIVE-001',
      drive_id: 'DRIVE-001',
      form_title: 'Deloitte Analyst Registration',
      form_id: 'FORM-DRIVE-001',
      form_url: 'https://forms.google.com/d/e/1FAIpQLSf_Deloitte_Analyst_DRIVE001/viewform',
      sheet_url: 'https://docs.google.com/spreadsheets/d/1Sheets_Deloitte_DRIVE001/edit',
      status: 'CONNECTED',
      last_synced_at: '2026-09-22T01:35:00.000Z',
      response_count: 12,
      error_message: null,
      fields: [
        { id: 'f_roll', label: 'Roll Number', type: 'text', required: true },
        { id: 'f_name', label: 'Student Full Name', type: 'text', required: true },
        { id: 'f_email', label: 'College Email ID', type: 'email', required: true },
        { id: 'f_phone', label: 'Phone Number', type: 'phone', required: true },
        { id: 'f_branch', label: 'Branch', type: 'select', required: true, options: ['CSE', 'IT', 'ECE', 'EEE'] },
        { id: 'f_section', label: 'Section', type: 'select', required: true, options: ['A', 'B', 'C'] },
        { id: 'f_cgpa', label: 'CGPA', type: 'number', required: true },
        { id: 'f_resume', label: 'Resume Link', type: 'url', required: true },
        { id: 'f_consent', label: 'Consent to participate in drive', type: 'checkbox', required: true },
      ],
    };
    this.googleForms.set(deloitteDrive.id, deloitteForm);

    // Populate registered students for Deloitte
    const allStudents = Array.from(this.students.values());
    allStudents.forEach(stu => {
      const regId = `REG-DRIVE-001-${stu.id}`;
      const reg: Registration = {
        id: regId,
        drive_id: 'DRIVE-001',
        student_id: stu.id,
        roll_no: stu.roll_no,
        student_name: stu.name,
        branch: stu.branch,
        cgpa: stu.cgpa,
        section: stu.section,
        email: stu.email,
        phone: stu.phone,
        resume_url: stu.resume_url,
        status: stu.cgpa >= 7.0 ? 'Eligible' : 'Registered',
        consent: true,
        registered_at: '2026-09-20T14:30:00.000Z',
      };
      this.registrations.set(regId, reg);
      this.driveStudentRegUnique.add(`DRIVE-001:${stu.id}`);
    });

    // Deloitte Child Recruitment Rounds
    // Hierarchy: Round 1 (Aptitude) -> Round 2 (Technical) -> Round 3 (HR)
    const deloitteRound1: RecruitmentRound = {
      id: 'RND-001',
      drive_id: 'DRIVE-001',
      round_number: 1,
      round_name: 'Round 1 — Aptitude',
      round_type: 'Aptitude',
      round_date: '2026-09-22',
      location: 'Online Portal / Lab 3 & 4',
      status: 'ACTIVE',
      is_final_round: false,
      created_at: '2026-09-20T16:00:00.000Z',
    };

    const deloitteRound2: RecruitmentRound = {
      id: 'RND-002',
      drive_id: 'DRIVE-001',
      round_number: 2,
      round_name: 'Round 2 — Technical',
      round_type: 'Technical',
      round_date: '2026-09-23',
      location: 'Seminar Hall 2 / Virtual',
      status: 'UPCOMING',
      is_final_round: false,
      created_at: '2026-09-20T16:00:00.000Z',
    };

    const deloitteRound3: RecruitmentRound = {
      id: 'RND-003',
      drive_id: 'DRIVE-001',
      round_number: 3,
      round_name: 'Round 3 — HR',
      round_type: 'HR',
      round_date: '2026-09-24',
      location: 'Placement Cell Boardroom',
      status: 'UPCOMING',
      is_final_round: true,
      created_at: '2026-09-20T16:00:00.000Z',
    };

    this.rounds.set(deloitteRound1.id, deloitteRound1);
    this.rounds.set(deloitteRound2.id, deloitteRound2);
    this.rounds.set(deloitteRound3.id, deloitteRound3);

    // Candidates in Round 1:
    // To match user prompt: "Results: 320 SELECTED, 150 REJECTED, 30 ON HOLD"
    // Here we seed our 12 students with clear states: Lal Basha (SELECTED), Ananth (SELECTED), Sneha (SELECTED), Rahul (SELECTED), Priya (SELECTED), Vikram (SELECTED), Sai Krishna (SELECTED), Divya Sree (SELECTED), etc.
    const round1Results: { [roll: string]: { att: 'PRESENT' | 'ABSENT'; res: 'SELECTED' | 'REJECTED' | 'ON_HOLD' | 'PENDING'; score: number } } = {
      '23N31A05J5': { att: 'PRESENT', res: 'SELECTED', score: 92 }, // K. Lal Basha
      '23N31A05K0': { att: 'PRESENT', res: 'SELECTED', score: 85 }, // Ananth Kumar
      '23N31A05A1': { att: 'PRESENT', res: 'SELECTED', score: 96 }, // Sneha Reddy
      '23N31A05B3': { att: 'PRESENT', res: 'SELECTED', score: 88 }, // Rahul Sharma
      '23N31A05C7': { att: 'PRESENT', res: 'SELECTED', score: 81 }, // Priya Dharshini
      '23N31A05D2': { att: 'PRESENT', res: 'SELECTED', score: 89 }, // Vikram Aditya
      '23N31A05E9': { att: 'PRESENT', res: 'REJECTED', score: 54 }, // Meghana Rao
      '23N31A05F4': { att: 'PRESENT', res: 'SELECTED', score: 84 }, // Sai Krishna
      '23N31A05G1': { att: 'PRESENT', res: 'SELECTED', score: 98 }, // Divya Sree
      '23N31A05H6': { att: 'PRESENT', res: 'ON_HOLD', score: 68 },  // Harsha Vardhan
      '23N31A05M8': { att: 'PRESENT', res: 'SELECTED', score: 91 }, // Tanvi Patel
      '23N31A05P2': { att: 'ABSENT', res: 'REJECTED', score: 0 },   // Karthik Raja
    };

    allStudents.forEach(stu => {
      const pId = `PART-RND-001-${stu.id}`;
      const conf = round1Results[stu.roll_no] || { att: 'PRESENT', res: 'SELECTED', score: 80 };
      const participant: RoundParticipant = {
        id: pId,
        round_id: 'RND-001',
        student_id: stu.id,
        roll_no: stu.roll_no,
        name: stu.name,
        branch: stu.branch,
        cgpa: stu.cgpa,
        email: stu.email,
        phone: stu.phone,
        attendance: conf.att,
        result: conf.res,
        score: conf.score,
        notes: conf.res === 'SELECTED' ? 'Strong quantitative & logical score' : undefined,
        updated_at: '2026-09-22T01:30:00.000Z',
      };
      this.participants.set(pId, participant);
      this.roundStudentParticipantUnique.add(`RND-001:${stu.id}`);
    });

    // 3. Additional Drive: TCS Digital
    const tcsDrive: PlacementDrive = {
      id: 'DRIVE-002',
      company_id: 'COMP-TCS',
      company_name: 'Tata Consultancy Services',
      job_role: 'Digital Developer & Prime',
      package_ctc: '9.0 LPA',
      location: 'Pan India',
      eligibility_min_cgpa: 7.5,
      eligible_branches: ['CSE', 'IT', 'ECE'],
      max_backlogs: 0,
      drive_date: '2026-09-28',
      status: 'UPCOMING',
      created_at: '2026-09-18T11:00:00.000Z',
    };
    this.drives.set(tcsDrive.id, tcsDrive);
    this.createGoogleFormForDrive(tcsDrive);

    // 4. Additional Drive: Amazon (Final Placements completed example)
    const amazonDrive: PlacementDrive = {
      id: 'DRIVE-003',
      company_id: 'COMP-AMAZON',
      company_name: 'Amazon',
      job_role: 'Software Development Engineer - 1',
      package_ctc: '28.0 LPA',
      location: 'Hyderabad / Bengaluru',
      eligibility_min_cgpa: 8.0,
      eligible_branches: ['CSE', 'IT'],
      max_backlogs: 0,
      drive_date: '2026-09-10',
      status: 'COMPLETED',
      created_at: '2026-09-01T08:00:00.000Z',
    };
    this.drives.set(amazonDrive.id, amazonDrive);
    this.createGoogleFormForDrive(amazonDrive);

    // Placements for Amazon
    const amazonStu = this.findStudentByRollNo('23N31A05G1'); // Divya Sree
    if (amazonStu) {
      const plcId = `PLC-${amazonDrive.id}-${amazonStu.id}`;
      this.placements.set(plcId, {
        id: plcId,
        student_id: amazonStu.id,
        drive_id: amazonDrive.id,
        company_id: amazonDrive.company_id,
        company_name: amazonDrive.company_name,
        roll_no: amazonStu.roll_no,
        student_name: amazonStu.name,
        branch: amazonStu.branch,
        job_role: amazonDrive.job_role,
        package_ctc: amazonDrive.package_ctc,
        placement_date: '2026-09-14',
        status: 'ACCEPTED',
      });
      this.studentDrivePlacementUnique.add(`${amazonStu.id}:${amazonDrive.id}`);
    }
  }
}

export const db = new RelationalPlacementDB();
