import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StaffManagementView } from './views/StaffManagementView';
import { ClassManagementView } from './views/ClassManagementView';
import { TaskManagementView } from './views/TaskManagementView';
import { ClassObservationView } from './views/ClassObservationView';
import { FacultyMonitoringView } from './views/FacultyMonitoringView';
import { DailyReportView } from './views/DailyReportView';
import { ReportsView } from './views/ReportsView';
import { StudentAttendanceView } from './views/StudentAttendanceView';
import { LessonPlanView } from './views/LessonPlanView';
import { SkillBankView } from './views/SkillBankView';
import { MentorMappingView } from './views/MentorMappingView';
import { LibrarianPortalView } from './views/LibrarianPortalView';
import { EventsView } from './views/EventsView';

const MainContent: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Trigger states for quick modals
  const [isQuickAddTaskOpen, setIsQuickAddTaskOpen] = useState(false);
  const [isQuickAddStaffOpen, setIsQuickAddStaffOpen] = useState(false);
  const [isQuickAddClassOpen, setIsQuickAddClassOpen] = useState(false);

  // Redirect staff users away from unauthorized coordinator tabs or HOD-only tabs
  React.useEffect(() => {
    if (!currentUser) return;
    const isStaffUser = currentUser.role === 'staff';
    const isLibrarianUser = currentUser.role === 'librarian';
    
    if (currentUser.role === 'principal' && ['events', 'classes', 'mentor_mapping'].includes(activeTab)) {
      setActiveTab('dashboard');
      return;
    }

    if (isStaffUser) {
      const hodOnlyTabs = ['staff', 'observations', 'monitoring', 'daily_report', 'mentor_mapping'];

      // Events tab only accessible if Event Coordinator
      if (activeTab === 'events' && currentUser.coordinatorRole !== 'Event Coordinator') {
        setActiveTab('dashboard');
        return;
      }

      // Classes tab only accessible if Timetable Coordinator
      if (activeTab === 'classes' && currentUser.coordinatorRole !== 'Timetable Coordinator') {
        setActiveTab('dashboard');
        return;
      }

      if (hodOnlyTabs.includes(activeTab)) {
        setActiveTab('dashboard');
        return;
      }
    } else if (isLibrarianUser && !['librarian_portal', 'skill_bank', 'dashboard', 'events'].includes(activeTab)) {
      setActiveTab('librarian_portal');
    } else if (!isLibrarianUser && activeTab === 'librarian_portal') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab, setActiveTab]);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenQuickAddTask = () => {
    setActiveTab('tasks');
    setIsQuickAddTaskOpen(true);
  };

  const handleOpenQuickAddStaff = () => {
    setActiveTab('staff');
    setIsQuickAddStaffOpen(true);
  };

  const handleOpenQuickAddClass = () => {
    setActiveTab('classes');
    setIsQuickAddClassOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenQuickAddStaff={handleOpenQuickAddStaff}
        onOpenQuickAddTask={handleOpenQuickAddTask}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddTask={handleOpenQuickAddTask}
              onOpenAddStaff={handleOpenQuickAddStaff}
              onOpenAddClass={handleOpenQuickAddClass}
            />
          )}

          {activeTab === 'events' && <EventsView />}

          {activeTab === 'staff' && (
            <StaffManagementView
              isAddModalOpen={isQuickAddStaffOpen}
              onCloseAddModal={() => setIsQuickAddStaffOpen(false)}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManagementView
              isAddModalOpen={isQuickAddClassOpen}
              onCloseAddModal={() => setIsQuickAddClassOpen(false)}
            />
          )}

          {activeTab === 'mentor_mapping' && <MentorMappingView />}

          {activeTab === 'librarian_portal' && <LibrarianPortalView />}

          {activeTab === 'tasks' && (
            <TaskManagementView
              isAssignModalOpen={isQuickAddTaskOpen}
              onCloseAssignModal={() => setIsQuickAddTaskOpen(false)}
            />
          )}

          {activeTab === 'student_attendance' && <StudentAttendanceView />}

          {activeTab === 'skill_bank' && <SkillBankView />}

          {activeTab === 'observations' && <ClassObservationView />}

          {activeTab === 'monitoring' && <FacultyMonitoringView />}

          {activeTab === 'daily_report' && <DailyReportView />}

          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
