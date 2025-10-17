import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AssignmentsTab } from './AssignmentsTab';
import { SubmissionsTab } from './SubmissionsTab';
import { GradingTab } from './GradingTab';
import { AttendanceTab } from './AttendanceTab';
import { StudentsTab } from './StudentsTab';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions' | 'grading' | 'attendance' | 'students'>('assignments');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'assignments' && <AssignmentsTab />}
      {activeTab === 'submissions' && <SubmissionsTab />}
      {activeTab === 'grading' && <GradingTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'students' && <StudentsTab />}
    </AdminLayout>
  );
};
