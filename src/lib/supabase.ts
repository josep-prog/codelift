import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  phase: 'phase1' | 'phase2' | null;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  target_phase: 'phase1' | 'phase2' | 'both';
  due_date: string | null;
  document_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  target_phase: 'phase1' | 'phase2' | 'both';
  time_limit_minutes: number;
  start_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  github_url: string;
  video_url: string;
  submitted_at: string;
  status: 'pending' | 'graded';
};

export type QuizSubmission = {
  id: string;
  quiz_id: string;
  student_id: string;
  github_url: string | null;
  video_url: string | null;
  started_at: string;
  submitted_at: string | null;
  status: 'in_progress' | 'submitted' | 'graded';
};

export type Grade = {
  id: string;
  student_id: string;
  assignment_id: string | null;
  quiz_id: string | null;
  submission_id: string | null;
  quiz_submission_id: string | null;
  grade: number;
  max_grade: number;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string;
};

export type Attendance = {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  guidelines: string | null;
  target_phase: 'phase1' | 'phase2' | 'both';
  due_date: string | null;
  is_collaborative: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectSubmission = {
  id: string;
  project_id: string;
  student_id: string;
  github_url: string;
  video_url: string;
  submitted_at: string;
  status: 'pending' | 'graded';
};
