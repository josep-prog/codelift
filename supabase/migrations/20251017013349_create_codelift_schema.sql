/*
  # CodeLift Student Dashboard Schema

  ## Overview
  This migration creates the complete database schema for the CodeLift Student Dashboard,
  a role-based platform for managing student learning, assessments, and accountability.

  ## New Tables

  ### 1. profiles
  Extends auth.users with additional user information and role management
  - `id` (uuid, pk, fk to auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text, not null)
  - `role` (text, not null) - 'admin' or 'student'
  - `phase` (text) - 'phase1' or 'phase2' for students
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. assignments
  Stores assignments created by administrators
  - `id` (uuid, pk)
  - `title` (text, not null)
  - `description` (text, not null)
  - `instructions` (text)
  - `target_phase` (text, not null) - 'phase1', 'phase2', or 'both'
  - `due_date` (timestamptz)
  - `document_url` (text) - URL to attached documents
  - `created_by` (uuid, fk to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. quizzes
  Stores timed coding quizzes with screen-sharing requirements
  - `id` (uuid, pk)
  - `title` (text, not null)
  - `description` (text, not null)
  - `instructions` (text)
  - `target_phase` (text, not null)
  - `time_limit_minutes` (integer, not null)
  - `start_time` (timestamptz)
  - `created_by` (uuid, fk to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. submissions
  Tracks student submissions with GitHub and video links
  - `id` (uuid, pk)
  - `assignment_id` (uuid, fk to assignments)
  - `student_id` (uuid, fk to profiles)
  - `github_url` (text, not null)
  - `video_url` (text, not null)
  - `submitted_at` (timestamptz)
  - `status` (text, default 'pending') - 'pending', 'graded'

  ### 5. quiz_submissions
  Tracks quiz completions and results
  - `id` (uuid, pk)
  - `quiz_id` (uuid, fk to quizzes)
  - `student_id` (uuid, fk to profiles)
  - `github_url` (text)
  - `video_url` (text)
  - `started_at` (timestamptz)
  - `submitted_at` (timestamptz)
  - `status` (text, default 'in_progress')

  ### 6. grades
  Stores grades for assignments and quizzes
  - `id` (uuid, pk)
  - `student_id` (uuid, fk to profiles)
  - `assignment_id` (uuid, fk to assignments, nullable)
  - `quiz_id` (uuid, fk to quizzes, nullable)
  - `submission_id` (uuid, fk to submissions, nullable)
  - `quiz_submission_id` (uuid, fk to quiz_submissions, nullable)
  - `grade` (numeric, not null)
  - `max_grade` (numeric, not null, default 100)
  - `feedback` (text)
  - `graded_by` (uuid, fk to profiles)
  - `graded_at` (timestamptz)

  ### 7. attendance
  Tracks student attendance records
  - `id` (uuid, pk)
  - `student_id` (uuid, fk to profiles)
  - `date` (date, not null)
  - `status` (text, not null) - 'present', 'absent', 'late'
  - `notes` (text)
  - `recorded_by` (uuid, fk to profiles)
  - `created_at` (timestamptz)

  ### 8. projects
  Stores project information with individual grading requirements
  - `id` (uuid, pk)
  - `title` (text, not null)
  - `description` (text, not null)
  - `guidelines` (text)
  - `target_phase` (text, not null)
  - `due_date` (timestamptz)
  - `is_collaborative` (boolean, default false)
  - `created_by` (uuid, fk to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. project_submissions
  Tracks individual project submissions
  - `id` (uuid, pk)
  - `project_id` (uuid, fk to projects)
  - `student_id` (uuid, fk to profiles)
  - `github_url` (text, not null)
  - `video_url` (text, not null)
  - `submitted_at` (timestamptz)
  - `status` (text, default 'pending')

  ## Security
  - Enable RLS on all tables
  - Admin policies: Full access to all tables
  - Student policies: Read own data, submit assignments/quizzes, view assigned content
  - Authentication required for all access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  phase text CHECK (phase IN ('phase1', 'phase2') OR phase IS NULL),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  target_phase text NOT NULL CHECK (target_phase IN ('phase1', 'phase2', 'both')),
  due_date timestamptz,
  document_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  target_phase text NOT NULL CHECK (target_phase IN ('phase1', 'phase2', 'both')),
  time_limit_minutes integer NOT NULL,
  start_time timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  github_url text NOT NULL,
  video_url text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'graded'))
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  github_url text,
  video_url text,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded'))
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  quiz_submission_id uuid REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  grade numeric NOT NULL,
  max_grade numeric NOT NULL DEFAULT 100,
  feedback text,
  graded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  guidelines text,
  target_phase text NOT NULL CHECK (target_phase IN ('phase1', 'phase2', 'both')),
  due_date timestamptz,
  is_collaborative boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_submissions table
CREATE TABLE IF NOT EXISTS project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  github_url text NOT NULL,
  video_url text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'graded'))
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;

-- Helper functions to check role/phase without causing RLS recursion
-- These functions run with SECURITY DEFINER so they can read `profiles` safely
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_profile_phase(uid uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT phase FROM profiles WHERE id = uid;
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Assignments policies
CREATE POLICY "Students can view assignments for their phase"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR target_phase = 'both'
    OR target_phase = get_profile_phase(auth.uid())
  );

CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Quizzes policies
CREATE POLICY "Students can view quizzes for their phase"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR target_phase = 'both'
    OR target_phase = get_profile_phase(auth.uid())
  );

CREATE POLICY "Admins can manage quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Submissions policies
CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Students can create own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Quiz submissions policies
CREATE POLICY "Students can view own quiz submissions"
  ON quiz_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all quiz submissions"
  ON quiz_submissions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Students can create own quiz submissions"
  ON quiz_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own quiz submissions"
  ON quiz_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update quiz submissions"
  ON quiz_submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Grades policies
CREATE POLICY "Students can view own grades"
  ON grades FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all grades"
  ON grades FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage grades"
  ON grades FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Attendance policies
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Projects policies
CREATE POLICY "Students can view projects for their phase"
  ON projects FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR target_phase = 'both'
    OR target_phase = get_profile_phase(auth.uid())
  );

CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Project submissions policies
CREATE POLICY "Students can view own project submissions"
  ON project_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all project submissions"
  ON project_submissions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Students can create own project submissions"
  ON project_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update project submissions"
  ON project_submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));