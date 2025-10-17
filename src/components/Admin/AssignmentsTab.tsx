import { useState, useEffect } from 'react';
import { supabase, Assignment, Quiz } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, FileText, Clock, Trash2, Edit2, BookOpen } from 'lucide-react';

export const AssignmentsTab = () => {
  const [view, setView] = useState<'list' | 'assignments' | 'quizzes'>('list');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'assignment' | 'quiz'>('assignment');
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    target_phase: 'both' as 'phase1' | 'phase2' | 'both',
    due_date: '',
    document_url: '',
    time_limit_minutes: 30,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, quizzesRes] = await Promise.all([
        supabase.from('assignments').select('*').order('created_at', { ascending: false }),
        supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      ]);

      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
      if (quizzesRes.data) setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formType === 'assignment') {
        const { error } = await supabase.from('assignments').insert({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions || null,
          target_phase: formData.target_phase,
          due_date: formData.due_date || null,
          document_url: formData.document_url || null,
          created_by: profile?.id,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('quizzes').insert({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions || null,
          target_phase: formData.target_phase,
          time_limit_minutes: formData.time_limit_minutes,
          created_by: profile?.id,
        });

        if (error) throw error;
      }

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        target_phase: 'both',
        due_date: '',
        document_url: '',
        time_limit_minutes: 30,
      });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string, type: 'assignment' | 'quiz') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const table = type === 'assignment' ? 'assignments' : 'quizzes';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading...</div>;
  }

  if (showForm) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Create {formType === 'assignment' ? 'Assignment' : 'Quiz'}
          </h2>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter instructions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Phase</label>
            <select
              value={formData.target_phase}
              onChange={(e) => setFormData({ ...formData, target_phase: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="both">Both Phases</option>
              <option value="phase1">Phase 1</option>
              <option value="phase2">Phase 2</option>
            </select>
          </div>

          {formType === 'assignment' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Document URL</label>
                <input
                  type="url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Limit (minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.time_limit_minutes}
                onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            Create {formType === 'assignment' ? 'Assignment' : 'Quiz'}
          </button>
        </form>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Assignments & Quizzes</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => setView('assignments')}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-8 text-left hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Assignments</h3>
                <p className="text-slate-600">Manage homework and projects</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{assignments.length}</div>
          </button>

          <button
            onClick={() => setView('quizzes')}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-8 text-left hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-500 p-3 rounded-xl group-hover:scale-110 transition">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quizzes</h3>
                <p className="text-slate-600">Timed coding exercises</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{quizzes.length}</div>
          </button>
        </div>
      </div>
    );
  }

  const isAssignmentView = view === 'assignments';
  const items = isAssignmentView ? assignments : quizzes;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">
            {isAssignmentView ? 'Assignments' : 'Quizzes'}
          </h2>
        </div>
        <button
          onClick={() => {
            setFormType(isAssignmentView ? 'assignment' : 'quiz');
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create {isAssignmentView ? 'Assignment' : 'Quiz'}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No {isAssignmentView ? 'assignments' : 'quizzes'} yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 mb-3">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      {item.target_phase === 'both' ? 'All Phases' : item.target_phase === 'phase1' ? 'Phase 1' : 'Phase 2'}
                    </span>
                    {isAssignmentView && (item as Assignment).due_date && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Due: {new Date((item as Assignment).due_date!).toLocaleDateString()}
                      </span>
                    )}
                    {!isAssignmentView && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {(item as Quiz).time_limit_minutes} minutes
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id, isAssignmentView ? 'assignment' : 'quiz')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
