/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoundStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
export type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT';
export type CandidateResult = 'PENDING' | 'SELECTED' | 'REJECTED' | 'ON_HOLD';
export type DriveStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
export type GoogleFormStatus = 'CONNECTED' | 'SYNC_FAILED' | 'FAILED';
export type PlacementStatus = 'OFFERED' | 'ACCEPTED';

export interface Student {
  id: string;
  roll_no: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  section: string;
  cgpa: number;
  backlogs: number;
  resume_url: string;
  created_at: string;
}

export interface GoogleFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'url' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface GoogleForm {
  id: string;
  drive_id: string;
  form_title: string;
  form_id: string;
  form_url: string;
  sheet_url: string;
  status: GoogleFormStatus;
  last_synced_at: string;
  response_count: number;
  error_message: string | null;
  fields: GoogleFormField[];
}

export interface Registration {
  id: string;
  drive_id: string;
  student_id: string;
  roll_no: string;
  student_name: string;
  branch: string;
  cgpa: number;
  section: string;
  email: string;
  phone: string;
  resume_url: string;
  status: 'Registered' | 'Eligible' | 'Not Eligible';
  consent: boolean;
  registered_at: string;
}

export interface RecruitmentRound {
  id: string;
  drive_id: string;
  round_number: number;
  round_name: string;
  round_type: string;
  round_date: string;
  location: string;
  status: RoundStatus;
  is_final_round: boolean;
  created_at: string;
  total_participants?: number;
  selected_count?: number;
  present_count?: number;
  rejected_count?: number;
}

export interface RoundParticipant {
  id: string;
  round_id: string;
  student_id: string;
  roll_no: string;
  name: string;
  branch: string;
  cgpa: number;
  email: string;
  phone: string;
  attendance: AttendanceStatus;
  result: CandidateResult;
  score?: number | null;
  notes?: string | null;
  updated_at: string;
}

export interface PlacementDrive {
  id: string;
  company_id: string;
  company_name: string;
  job_role: string;
  package_ctc: string;
  location: string;
  eligibility_min_cgpa: number;
  eligible_branches: string[];
  max_backlogs: number;
  drive_date: string;
  status: DriveStatus;
  created_at: string;
  google_form?: GoogleForm;
  registered_count?: number;
  rounds_count?: number;
  placed_count?: number;
}

export interface PlacementRecord {
  id: string;
  student_id: string;
  drive_id: string;
  company_id: string;
  company_name: string;
  roll_no: string;
  student_name: string;
  branch: string;
  job_role: string;
  package_ctc: string;
  placement_date: string;
  status: PlacementStatus;
}

export interface AdvanceSelectedResponse {
  success: boolean;
  current_round: string;
  next_round: string;
  selected_count: number;
  advanced_count: number;
  already_exists: number;
  message: string;
  is_final_round?: boolean;
}

export interface SyncResponseResult {
  success: boolean;
  synced_count: number;
  duplicate_count: number;
  total_responses: number;
  last_synced_at: string;
  message: string;
  error?: string;
}
