import { useState, useEffect } from 'react';
import { supabase, Attendance, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

type AttendanceWithStudent = Attendance & {
  student: Profile;
};

export const AttendanceTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithStudent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
        supabase
          .from('attendance')
          .select('*, student:profiles!student_id(*)')
          .eq('date', selectedDate),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data as any);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      const existing = attendance.find((a) => a.student_id === studentId);

      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance').insert({
          student_id: studentId,
          date: selectedDate,
          status,
          recorded_by: profile?.id,
        });
        if (error) throw error;
      }

      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Attendance Tracking</h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No students found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const record = attendance.find((a) => a.student_id === student.id);
            const status = record?.status;

            return (
              <div
                key={student.id}
                className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{student.full_name}</h3>
                  <p className="text-sm text-slate-600">{student.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                    {student.phase === 'phase1' ? 'Phase 1' : 'Phase 2'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => markAttendance(student.id, 'present')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      status === 'present'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Present</span>
                  </button>
                  <button
                    onClick={() => markAttendance(student.id, 'late')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      status === 'late'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-yellow-50 hover:text-yellow-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Late</span>
                  </button>
                  <button
                    onClick={() => markAttendance(student.id, 'absent')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      status === 'absent'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Absent</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
