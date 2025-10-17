import { useState, useEffect } from 'react';
import { supabase, Submission, ProjectSubmission, Profile } from '../../lib/supabase';
import { ExternalLink, Github, Video } from 'lucide-react';

type SubmissionWithDetails = Submission & {
  student: Profile;
  assignment: { title: string };
};

type ProjectSubmissionWithDetails = ProjectSubmission & {
  student: Profile;
  project: { title: string };
};

export const SubmissionsTab = () => {
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'assignments' | 'projects'>('assignments');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const [assignmentRes, projectRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('*, student:profiles!student_id(*), assignment:assignments!assignment_id(title)')
          .order('submitted_at', { ascending: false }),
        supabase
          .from('project_submissions')
          .select('*, student:profiles!student_id(*), project:projects!project_id(title)')
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

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading submissions...</div>;
  }

  const currentSubmissions = view === 'assignments' ? assignmentSubmissions : projectSubmissions;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Submissions</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('assignments')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'assignments'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Assignment Submissions ({assignmentSubmissions.length})
        </button>
        <button
          onClick={() => setView('projects')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'projects'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Project Submissions ({projectSubmissions.length})
        </button>
      </div>

      {currentSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSubmissions.map((submission: any) => (
            <div
              key={submission.id}
              className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {view === 'assignments'
                      ? (submission as SubmissionWithDetails).assignment.title
                      : (submission as ProjectSubmissionWithDetails).project.title}
                  </h3>
                  <p className="text-slate-600">
                    Student: {submission.student.full_name} ({submission.student.email})
                  </p>
                  <p className="text-sm text-slate-500">
                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    submission.status === 'graded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {submission.status === 'graded' ? 'Graded' : 'Pending'}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <Github className="w-4 h-4" />
                  <span>View GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={submission.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Watch Video</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
