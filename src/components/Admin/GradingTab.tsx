import { useState, useEffect } from 'react';
import { supabase, Submission, ProjectSubmission, Profile, Grade } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, CheckCircle } from 'lucide-react';

type SubmissionWithDetails = Submission & {
  student: Profile;
  assignment: { title: string };
  grades?: Grade[];
};

type ProjectSubmissionWithDetails = ProjectSubmission & {
  student: Profile;
  project: { title: string };
  grades?: Grade[];
};

export const GradingTab = () => {
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'assignments' | 'projects'>('assignments');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', max_grade: '100', feedback: '' });
  const { profile } = useAuth();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const [assignmentRes, projectRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('*, student:profiles!student_id(*), assignment:assignments!assignment_id(title), grades(*)')
          .order('submitted_at', { ascending: false }),
        supabase
          .from('project_submissions')
          .select('*, student:profiles!student_id(*), project:projects!project_id(title), grades:grades!grades_submission_id_fkey(*)')
          .order('submitted_at', { ascending: false }),
      ]);

      if (assignmentRes.data) setAssignmentSubmissions(assignmentRes.data as any);
      if (projectRes.data) setProjectSubmissions(projectRes.data as any);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const gradeData: any = {
        student_id: selectedSubmission.student_id,
        grade: parseFloat(gradeForm.grade),
        max_grade: parseFloat(gradeForm.max_grade),
        feedback: gradeForm.feedback || null,
        graded_by: profile?.id,
      };

      if (view === 'assignments') {
        gradeData.assignment_id = selectedSubmission.assignment_id;
        gradeData.submission_id = selectedSubmission.id;
      } else {
        gradeData.submission_id = selectedSubmission.id;
      }

      const { error: gradeError } = await supabase.from('grades').insert(gradeData);
      if (gradeError) throw gradeError;

      const table = view === 'assignments' ? 'submissions' : 'project_submissions';
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'graded' })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      setSelectedSubmission(null);
      setGradeForm({ grade: '', max_grade: '100', feedback: '' });
      loadSubmissions();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading...</div>;
  }

  if (selectedSubmission) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Grade Submission</h2>
          <button
            onClick={() => setSelectedSubmission(null)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-2">
            {view === 'assignments'
              ? selectedSubmission.assignment.title
              : selectedSubmission.project.title}
          </h3>
          <p className="text-slate-600 mb-4">
            Student: {selectedSubmission.student.full_name} ({selectedSubmission.student.email})
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={selectedSubmission.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
            >
              View GitHub Repository
            </a>
            <a
              href={selectedSubmission.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              Watch Demonstration Video
            </a>
          </div>
        </div>

        <form onSubmit={handleGradeSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={gradeForm.grade}
                onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="85.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Grade</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={gradeForm.max_grade}
                onChange={(e) => setGradeForm({ ...gradeForm, max_grade: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Feedback</label>
            <textarea
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Provide constructive feedback for the student..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            Submit Grade
          </button>
        </form>
      </div>
    );
  }

  const currentSubmissions = view === 'assignments' ? assignmentSubmissions : projectSubmissions;
  const pendingSubmissions = currentSubmissions.filter((s) => s.status === 'pending');

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Grading</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('assignments')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'assignments'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Assignments ({pendingSubmissions.length} pending)
        </button>
        <button
          onClick={() => setView('projects')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'projects'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Projects ({projectSubmissions.filter((s) => s.status === 'pending').length} pending)
        </button>
      </div>

      {pendingSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-slate-600">All submissions have been graded!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSubmissions.map((submission: any) => (
            <div
              key={submission.id}
              className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {view === 'assignments'
                      ? (submission as SubmissionWithDetails).assignment.title
                      : (submission as ProjectSubmissionWithDetails).project.title}
                  </h3>
                  <p className="text-slate-600">
                    {submission.student.full_name} ({submission.student.email})
                  </p>
                  <p className="text-sm text-slate-500">
                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(submission)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  <Award className="w-4 h-4" />
                  <span>Grade</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
