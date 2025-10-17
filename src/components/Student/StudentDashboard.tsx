import { useState } from 'react';
import { StudentLayout } from './StudentLayout';
import { StudentAssignmentsTab } from './StudentAssignmentsTab';
import { StudentProjectsTab } from './StudentProjectsTab';
import { StudentAttendanceTab } from './StudentAttendanceTab';

export const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'projects' | 'attendance'>('assignments');

  return (
    <StudentLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'assignments' && <StudentAssignmentsTab />}
      {activeTab === 'projects' && <StudentProjectsTab />}
      {activeTab === 'attendance' && <StudentAttendanceTab />}
    </StudentLayout>
  );
};
