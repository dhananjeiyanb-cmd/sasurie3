import React from 'react';
import { useApp } from '../context/AppContext';
import { getGoogleAvatarUrl } from '../utils/avatarUtils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CheckSquare,
  Eye,
  CalendarCheck,
  Calendar,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  User,
  LogOut,
  ChevronRight,
  AlertCircle,
  UserCheck,
  BookOpen,
  Award,
  Coins,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeTab, setActiveTab, taskList, logout, dailyReport } = useApp();

  const overdueCount = taskList.filter((t) => t.status === 'Overdue').length;
  const pendingCount = taskList.filter((t) => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Submitted').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['principal', 'admin', 'staff', 'librarian', 'incucula'],
    },
    {
      id: 'events',
      label: 'Events & Activities',
      icon: Calendar,
      roles: ['principal', 'admin', 'staff', 'incucula'],
      badge: 'EVENTS',
      badgeColor: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 'librarian_portal',
      label: 'Librarian Skill Bank (Dim 4.2 & 4.3)',
      icon: BookOpen,
      roles: ['librarian'],
      badge: 'Central Library',
      badgeColor: 'bg-teal-600 text-white font-bold',
    },
    {
      id: 'staff',
      label: 'Faculty Management',
      icon: Users,
      roles: ['principal', 'admin'],
    },
    {
      id: 'classes',
      label: 'Class Management',
      icon: GraduationCap,
      roles: ['principal', 'admin'],
    },
    {
      id: 'mentor_mapping',
      label: 'Mentor-Mentee Mapping',
      icon: UserPlus,
      roles: ['principal', 'admin'],
      badge: 'HOD Only',
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
    {
      id: 'tasks',
      label: 'Task Management',
      icon: CheckSquare,
      roles: ['principal', 'admin', 'staff', 'incucula'],
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : pendingCount > 0 ? `${pendingCount} Pending` : undefined,
      badgeColor: overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
    },
    {
      id: 'student_attendance',
      label: 'Student Attendance Today',
      icon: UserCheck,
      roles: ['principal', 'admin', 'staff', 'incucula'],
    },
    {
      id: 'skill_bank',
      label: 'Skill Bank (SSB) Grade Coins',
      icon: Coins,
      roles: ['principal', 'admin', 'staff', 'librarian', 'incucula'],
      badge: 'AY 2026-27',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'lesson_plan',
      label: 'Faculty Lesson Plan',
      icon: BookOpen,
      roles: ['principal', 'admin', 'staff'],
    },
    {
      id: 'observations',
      label: 'Class Observations',
      icon: Eye,
      roles: ['principal', 'admin'],
    },
    {
      id: 'monitoring',
      label: 'Daily Faculty Monitoring',
      icon: CalendarCheck,
      roles: ['principal', 'admin'],
    },
    {
      id: 'daily_report',
      label: 'HOD Daily Report Card',
      icon: FileSpreadsheet,
      roles: ['principal', 'admin'],
    },
    {
      id: 'reports',
      label: 'Reports & Print Center',
      icon: Printer,
      roles: ['principal', 'admin', 'staff'],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentUser?.role || 'staff'));

  return (
    <>
      {/* Mobile overlay background */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-60 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Branding Header in Sidebar */}
        <div className="p-5 flex items-center gap-3 bg-blue-700">
          {dailyReport?.collegeLogoUrl ? (
            <img
              src={dailyReport.collegeLogoUrl}
              alt="College Logo"
              className="w-9 h-9 object-contain bg-white rounded-lg p-0.5 shadow-sm shrink-0 border border-white/20"
            />
          ) : (
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-blue-700 font-bold text-xl shadow-sm shrink-0">
              {dailyReport?.collegeLogoText?.[0] || 'H'}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold tracking-tight uppercase text-sm text-white block truncate">
              HOD Monitor
            </span>
            <span className="text-[10px] text-blue-100 font-medium block truncate opacity-90">
              {dailyReport?.collegeName || 'Sasuri College of Engineering'}
            </span>
          </div>
        </div>

        {/* User Quick Info Banner */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
            currentUser?.role === 'principal' ? 'bg-amber-500/20 text-amber-400' : currentUser?.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {currentUser?.role === 'principal' ? <GraduationCap className="w-4 h-4" /> : currentUser?.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              {currentUser?.googleConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="Google Gmail Connected"></span>}
              {currentUser?.role === 'principal' ? 'College Principal' : currentUser?.role === 'admin' ? 'Head of Department' : `ID: ${currentUser?.staffId || 'Staff'}`}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </div>
          {visibleNavItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-6 py-3 text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {visibleNavItems.length > 6 && (
            <>
              <div className="px-6 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Reporting
              </div>
              {visibleNavItems.slice(6).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-6 py-3 text-xs font-medium transition-colors group ${
                      isActive
                        ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer in Sidebar */}
        <div className="p-3.5 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 mb-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <img
              src={currentUser?.avatarUrl || getGoogleAvatarUrl(currentUser?.email, currentUser?.name, currentUser?.role)}
              alt={currentUser?.name}
              className="w-9 h-9 rounded-full border border-amber-400/80 object-cover shrink-0 bg-slate-900"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0284c7&color=fff`;
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-[11px] truncate leading-tight">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser?.email || currentUser?.department}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
