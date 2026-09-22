/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- Student Master Endpoints ---
  app.get('/api/students', (req, res) => {
    const students = db.getStudents();
    res.json(students);
  });

  app.get('/api/students/by-roll/:rollNo', (req, res) => {
    const student = db.findStudentByRollNo(req.params.rollNo);
    if (!student) {
      return res.status(404).json({ error: `Student with roll number ${req.params.rollNo} not found.` });
    }
    res.json(student);
  });

  // --- Placement Drives (Parent) Endpoints ---
  app.get('/api/drives', (req, res) => {
    const drives = db.getDrives();
    res.json(drives);
  });

  app.post('/api/drives', (req, res) => {
    try {
      const { company_name, job_role, package_ctc, location, eligibility_min_cgpa, eligible_branches, drive_date, initial_rounds } = req.body;
      if (!company_name || !job_role || !package_ctc) {
        return res.status(400).json({ error: 'Company name, job role, and package CTC are required.' });
      }

      const drive = db.createDrive({
        company_name,
        job_role,
        package_ctc,
        location: location || 'Campus / Virtual',
        eligibility_min_cgpa: Number(eligibility_min_cgpa) || 6.5,
        eligible_branches: eligible_branches && eligible_branches.length > 0 ? eligible_branches : ['CSE', 'IT', 'ECE'],
        drive_date: drive_date || new Date().toISOString().split('T')[0],
        initial_rounds,
      });

      res.status(201).json(drive);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create placement drive' });
    }
  });

  app.get('/api/drives/:driveId', (req, res) => {
    const drive = db.getDrive(req.params.driveId);
    if (!drive) {
      return res.status(404).json({ error: `Placement Drive ${req.params.driveId} not found.` });
    }
    res.json(drive);
  });

  // --- Google Form Integration Endpoints ---
  app.get('/api/drives/:driveId/google-form', (req, res) => {
    const drive = db.getDrive(req.params.driveId);
    if (!drive) {
      return res.status(404).json({ error: `Drive ${req.params.driveId} not found.` });
    }
    const form = db.googleForms.get(req.params.driveId);
    if (!form) {
      return res.status(404).json({ error: 'Google Form not configured for this drive.' });
    }
    res.json(form);
  });

  app.post('/api/drives/:driveId/google-form/retry-create', (req, res) => {
    const drive = db.getDrive(req.params.driveId);
    if (!drive) {
      return res.status(404).json({ error: `Drive ${req.params.driveId} not found.` });
    }
    const form = db.createGoogleFormForDrive(drive);
    res.json({ success: true, message: 'Google Form created successfully.', form });
  });

  app.post('/api/drives/:driveId/google-form/sync', (req, res) => {
    try {
      const result = db.syncGoogleFormResponses(req.params.driveId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Google Form synchronization failed.' });
    }
  });

  app.post('/api/drives/:driveId/google-form/submit', (req, res) => {
    try {
      const { roll_no, student_name, email, phone, branch, section, cgpa, resume_url, consent } = req.body;
      if (!roll_no) {
        return res.status(400).json({ error: 'Roll Number is required.' });
      }
      const result = db.submitGoogleFormResponse(req.params.driveId, {
        roll_no,
        student_name,
        email,
        phone,
        branch,
        section,
        cgpa: cgpa ? Number(cgpa) : undefined,
        resume_url,
        consent,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Registered Students Endpoints ---
  app.get('/api/drives/:driveId/registrations', (req, res) => {
    const regs = db.getRegistrations(req.params.driveId);
    res.json(regs);
  });

  app.post('/api/drives/:driveId/registrations/add-to-round-1', (req, res) => {
    try {
      const result = db.addRegisteredToRound1(req.params.driveId);
      res.json({
        success: true,
        message: `${result.added_count} registered students added to Round 1.${result.already_count > 0 ? ` (${result.already_count} were already present).` : ''}`,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Child Recruitment Rounds Endpoints ---
  app.get('/api/drives/:driveId/rounds', (req, res) => {
    const rounds = db.getRoundsForDrive(req.params.driveId);
    res.json(rounds);
  });

  app.post('/api/drives/:driveId/rounds', (req, res) => {
    try {
      const { round_name, round_type, round_date, location, is_final_round } = req.body;
      const allRounds = db.getRoundsForDrive(req.params.driveId);
      const roundNumber = allRounds.length + 1;
      const roundId = `RND-${req.params.driveId}-${roundNumber}`;

      const round = {
        id: roundId,
        drive_id: req.params.driveId,
        round_number: roundNumber,
        round_name: round_name || `Round ${roundNumber}`,
        round_type: round_type || 'Interview',
        round_date: round_date || new Date().toISOString().split('T')[0],
        location: location || 'Placement Cell Room',
        status: 'UPCOMING' as const,
        is_final_round: Boolean(is_final_round),
        created_at: new Date().toISOString(),
      };

      db.rounds.set(roundId, round);
      res.status(201).json(round);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/rounds/:roundId', (req, res) => {
    const round = db.getRound(req.params.roundId);
    if (!round) {
      return res.status(404).json({ error: `Round ${req.params.roundId} not found.` });
    }
    res.json(round);
  });

  app.put('/api/rounds/:roundId', (req, res) => {
    try {
      const updated = db.updateRound(req.params.roundId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/rounds/:roundId/participants', (req, res) => {
    const participants = db.getParticipants(req.params.roundId);
    res.json(participants);
  });

  // Attendance update
  app.put('/api/participants/:participantId/attendance', (req, res) => {
    try {
      const { attendance } = req.body;
      if (!attendance || !['PENDING', 'PRESENT', 'ABSENT'].includes(attendance)) {
        return res.status(400).json({ error: 'Valid attendance status (PENDING, PRESENT, ABSENT) is required.' });
      }
      const updated = db.updateParticipantAttendance(req.params.participantId, attendance);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Result update
  app.put('/api/participants/:participantId/result', (req, res) => {
    try {
      const { result, score, notes } = req.body;
      if (!result || !['PENDING', 'SELECTED', 'REJECTED', 'ON_HOLD'].includes(result)) {
        return res.status(400).json({ error: 'Valid result (PENDING, SELECTED, REJECTED, ON_HOLD) is required.' });
      }
      const updated = db.updateParticipantResult(req.params.participantId, result, score, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // CRITICAL FIX: Selected Students Endpoint (Section 9 & 19)
  app.get('/api/rounds/:roundId/selected-students', (req, res) => {
    try {
      const selected = db.getSelectedStudents(req.params.roundId);
      res.json({
        round_id: req.params.roundId,
        count: selected.length,
        students: selected,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // CRITICAL FIX: Advance Selected Students to Next Round (Section 10, 11, 12, 13, 20, 21)
  app.post('/api/rounds/:roundId/advance-selected', (req, res) => {
    try {
      const result = db.advanceSelectedStudents(req.params.roundId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Section 14: Final Placement Creation
  app.post('/api/rounds/:roundId/finalize-placements', (req, res) => {
    try {
      const result = db.finalizePlacements(req.params.roundId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Placements Endpoints ---
  app.get('/api/placements', (req, res) => {
    const driveId = req.query.drive_id as string | undefined;
    const records = db.getPlacements(driveId);
    res.json(records);
  });

  // --- Analytics Overview ---
  app.get('/api/analytics', (req, res) => {
    const drives = db.getDrives();
    const students = db.getStudents();
    const placements = db.getPlacements();
    const totalRegistrations = Array.from(db.registrations.values()).length;

    const branchPlacements: { [branch: string]: number } = {};
    placements.forEach(p => {
      branchPlacements[p.branch] = (branchPlacements[p.branch] || 0) + 1;
    });

    res.json({
      total_drives: drives.length,
      active_drives: drives.filter(d => d.status === 'ACTIVE').length,
      total_students: students.length,
      total_registrations: totalRegistrations,
      total_placements: placements.length,
      placement_percentage: Math.round((placements.length / Math.max(1, students.length)) * 100),
      branch_breakdown: branchPlacements,
    });
  });

async function configureApp() {
  // Local development: Vite serves the React app through its middleware.
  // Production/Vercel: Vercel serves files from /public, while Express handles /api/* routes.
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const publicPath = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        const indexPath = path.join(publicPath, 'index.html');
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
        return next();
      });
    }
  }

  // Always return JSON for API 404s instead of Vercel/Express HTML/text.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found.` });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });
}

export default app;

configureApp().then(() => {
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Placement Management Server running on port ${PORT}`);
    });
  }
}).catch((error) => {
  console.error('Failed to configure server:', error);
  process.exit(1);
});
