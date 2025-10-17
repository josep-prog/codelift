import { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Users, Edit2, Trash2, UserPlus } from 'lucide-react';

export const StudentsTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phase: 'phase1' as 'phase1' | 'phase2',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'student',
          phase: formData.phase,
        });

        if (profileError) throw profileError;
      }

      setShowAddForm(false);
      setFormData({ email: '', password: '', full_name: '', phase: 'phase1' });
      loadStudents();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdatePhase = async (studentId: string, newPhase: 'phase1' | 'phase2') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phase: newPhase })
        .eq('id', studentId);

      if (error) throw error;
      loadStudents();
      setEditingStudent(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', studentId);
      if (error) throw error;
      loadStudents();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading students...</div>;
  }

  if (showAddForm) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add New Student</h2>
          <button
            onClick={() => setShowAddForm(false)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleAddStudent} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="student@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phase</label>
            <select
              value={formData.phase}
              onChange={(e) => setFormData({ ...formData, phase: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="phase1">Phase 1</option>
              <option value="phase2">Phase 2</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            Add Student
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Student Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No students registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">{student.full_name}</h3>
                <p className="text-slate-600">{student.email}</p>
                <div className="mt-2">
                  {editingStudent?.id === student.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={student.phase || 'phase1'}
                        onChange={(e) =>
                          handleUpdatePhase(student.id, e.target.value as 'phase1' | 'phase2')
                        }
                        className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="phase1">Phase 1</option>
                        <option value="phase2">Phase 2</option>
                      </select>
                      <button
                        onClick={() => setEditingStudent(null)}
                        className="text-sm text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        student.phase === 'phase1'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {student.phase === 'phase1' ? 'Phase 1' : 'Phase 2'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingStudent(student)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteStudent(student.id)}
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
