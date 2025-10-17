import { useState, useEffect } from 'react';
import { supabase, Assignment, Quiz, Submission, QuizSubmission, Grade } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Clock, ExternalLink, Upload, CheckCircle, Award } from 'lucide-react';

type AssignmentWithGrade = Assignment & {
  submission?: (Submission & { grades?: Grade[] })[];
};

type QuizWithGrade = Quiz & {
  submission?: (QuizSubmission & { grades?: Grade[] })[];
};

export const StudentAssignmentsTab = () => {
  const [assignments, setAssignments] = useState<AssignmentWithGrade[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitType, setSubmitType] = useState<'assignment' | 'quiz'>('assignment');
  const [formData, setFormData] = useState({ github_url: '', video_url: '' });
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const phaseFilter = profile.phase;

      const [assignmentsRes, quizzesRes] = await Promise.all([
        supabase
          .from('assignments')
          .select('*, submission:submissions(*, grades(*))')
          .or(`target_phase.eq.both,target_phase.eq.${phaseFilter}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('quizzes')
          .select('*, submission:quiz_submissions(*, grades(*))')
          .or(`target_phase.eq.both,target_phase.eq.${phaseFilter}`)
          .order('created_at', { ascending: false }),
      ]);

      if (assignmentsRes.data) {
        const withSubmissions = assignmentsRes.data.map((a: any) => ({
          ...a,
          submission: a.submission?.filter((s: any) => s.student_id === profile.id),
        }));
        setAssignments(withSubmissions);
      }

      if (quizzesRes.data) {
        const withSubmissions = quizzesRes.data.map((q: any) => ({
          ...q,
          submission: q.submission?.filter((s: any) => s.student_id === profile.id),
        }));
        setQuizzes(withSubmissions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (submitType === 'assignment') {
        const { error } = await supabase.from('submissions').insert({
          assignment_id: selectedItem.id,
          student_id: profile?.id,
          github_url: formData.github_url,
          video_url: formData.video_url,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('quiz_submissions').insert({
          quiz_id: selectedItem.id,
          student_id: profile?.id,
          github_url: formData.github_url,
          video_url: formData.video_url,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      setSelectedItem(null);
      setFormData({ github_url: '', video_url: '' });
      loadData();
      alert('Submission successful!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading assignments...</div>;
  }

  if (selectedItem) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Submit {submitType === 'assignment' ? 'Assignment' : 'Quiz'}</h2>
          <button
            onClick={() => setSelectedItem(null)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedItem.title}</h3>
          <p className="text-slate-700 mb-4">{selectedItem.description}</p>
          {selectedItem.instructions && (
            <div className="mb-4">
              <h4 className="font-semibold text-slate-900 mb-2">Instructions:</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedItem.instructions}</p>
            </div>
          )}
          {selectedItem.document_url && (
            <a
              href={selectedItem.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Attached Document
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Submission Requirements:</h4>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li>Public GitHub repository with your code</li>
              <li>YouTube video showing you coding with voice explanation</li>
              <li>Video must not exceed 5 minutes</li>
              <li>Screen share must be visible throughout</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/repository"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Submit {submitType === 'assignment' ? 'Assignment' : 'Quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">My Assignments & Quizzes</h2>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Assignments
        </h3>
        {assignments.length === 0 ? (
          <p className="text-slate-600">No assignments available</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const mySubmission = assignment.submission?.[0];
              const grade = mySubmission?.grades?.[0];

              return (
                <div
                  key={assignment.id}
                  className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900">{assignment.title}</h4>
                      <p className="text-slate-600 mt-1">{assignment.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {assignment.due_date && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {mySubmission && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Submitted
                          </span>
                        )}
                        {grade && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            Grade: {grade.grade}/{grade.max_grade}
                          </span>
                        )}
                      </div>
                    </div>
                    {!mySubmission && (
                      <button
                        onClick={() => {
                          setSelectedItem(assignment);
                          setSubmitType('assignment');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition whitespace-nowrap ml-4"
                      >
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    )}
                  </div>
                  {grade?.feedback && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Feedback:</h5>
                      <p className="text-slate-700">{grade.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Quizzes
        </h3>
        {quizzes.length === 0 ? (
          <p className="text-slate-600">No quizzes available</p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const mySubmission = quiz.submission?.[0];
              const grade = mySubmission?.grades?.[0];

              return (
                <div
                  key={quiz.id}
                  className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900">{quiz.title}</h4>
                      <p className="text-slate-600 mt-1">{quiz.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                          Time Limit: {quiz.time_limit_minutes} minutes
                        </span>
                        {mySubmission && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Submitted
                          </span>
                        )}
                        {grade && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            Grade: {grade.grade}/{grade.max_grade}
                          </span>
                        )}
                      </div>
                    </div>
                    {!mySubmission && (
                      <button
                        onClick={() => {
                          setSelectedItem(quiz);
                          setSubmitType('quiz');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition whitespace-nowrap ml-4"
                      >
                        <Upload className="w-4 h-4" />
                        Start Quiz
                      </button>
                    )}
                  </div>
                  {grade?.feedback && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Feedback:</h5>
                      <p className="text-slate-700">{grade.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
