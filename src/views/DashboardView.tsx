import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatusBadge, PriorityBadge } from '../components/StatusBadge';
import { StudentAttendanceModal } from '../components/StudentAttendanceModal';
import { DailyRemarksModal } from '../components/DailyRemarksModal';
import { DEPARTMENTS } from '../types';
import { getGoogleAvatarUrl } from '../utils/avatarUtils';
import {
  Users,
  GraduationCap,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles,
  Edit3,
  Percent,
  BookOpen,
  Layers,
  Shield,
  Activity,
  BarChart3,
  CalendarDays,
  Hourglass,
  ChevronRight,
  Building2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

interface DashboardViewProps {
  onOpenAddTask?: () => void;
  onOpenAddStaff?: () => void;
  onOpenAddClass?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTask,
  onOpenAddStaff,
  onOpenAddClass,
}) => {
  const {
    currentUser,
    loginAsDemo,
    staffList,
    classList,
    taskList,
    observationList,
    lessonPlanList,
    setActiveTab,
    dailyReport,
    filterState,
    setFilterState,
    updateDailyReport,
  } = useApp();

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [remarksTab, setRemarksTab] = useState<'events' | 'discipline' | 'hod'>('discipline');

  const isStaff = currentUser?.role === 'staff';
  const isHod = currentUser?.role === 'admin';
  const isPrincipal = currentUser?.role === 'principal';
  const hodDepartment = currentUser?.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const selectedDept = isPrincipal
    ? (filterState.department || dailyReport?.department || 'All Departments')
    : hodDepartment;

  const isDeptMatch = (targetDept?: string, selDept?: string) => {
    if (!selDept || selDept === 'all' || selDept === 'All Departments') return true;
    if (!targetDept) return false;
    const t = targetDept.toLowerCase().trim();
    const s = selDept.toLowerCase().trim();
    if (t === s) return true;
    if (s.includes('ai & ds') || s.includes('artificial intelligence')) {
      return t.includes('ai & ds') || t.includes('artificial intelligence');
    }
    if (s.includes('cyber')) return t.includes('cyber');
    if (s.includes('computer science') || s.includes('cse')) return t.includes('computer science') || t.includes('cse');
    if (s.includes('information technology') || s.includes('it')) return t.includes('information technology') || t.includes('it');
    if (s.includes('electronics') || s.includes('ece')) return t.includes('electronics & communication') || t.includes('ece');
    if (s.includes('electrical') || s.includes('eee')) return t.includes('electrical & electronics') || t.includes('eee');
    if (s.includes('mechanical') || s.includes('mech')) return t.includes('mechanical') || t.includes('mech');
    if (s.includes('civil')) return t.includes('civil');
    return t.includes(s) || s.includes(t);
  };

  const displayStaffList = isHod || isStaff
    ? staffList.filter((s) => isDeptMatch(s.department, hodDepartment))
    : staffList.filter((s) => isDeptMatch(s.department, selectedDept));

  const displayClassList = isHod || isStaff
    ? classList.filter((c) => isDeptMatch(c.department, hodDepartment))
    : classList.filter((c) => isDeptMatch(c.department, selectedDept));

  const hodStaffIds = displayStaffList.map((s) => s.id);

  const displayTaskList = isStaff
    ? taskList.filter(
        (t) =>
          t.assignedToStaffId === currentUser?.staffId ||
          (t.assignedToName && currentUser?.name && t.assignedToName.toLowerCase().includes(currentUser.name.toLowerCase()))
      )
    : isHod
    ? taskList.filter(
        (t) =>
          hodStaffIds.includes(t.assignedToStaffId) ||
          displayStaffList.some((s) => s.facultyName && t.assignedToName && s.facultyName.toLowerCase() === t.assignedToName.toLowerCase())
      )
    : taskList.filter((t) => {
        if (selectedDept === 'all' || selectedDept === 'All Departments') return true;
        const staffMatch = displayStaffList.some(
          (s) => s.id === t.assignedToStaffId || (s.facultyName && t.assignedToName && s.facultyName.toLowerCase() === t.assignedToName.toLowerCase())
        );
        const taskDeptMatch = t.department ? isDeptMatch(t.department, selectedDept) : false;
        return staffMatch || taskDeptMatch;
      });

  const totalStaff = displayStaffList.length;
  const totalClasses = displayClassList.length;
  const totalTasks = displayTaskList.length;

  const completedTasks = displayTaskList.filter((t) => t.status === 'Completed').length;
  const pendingTasks = displayTaskList.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = displayTaskList.filter((t) => t.status === 'In Progress').length;
  const overdueTasks = displayTaskList.filter((t) => t.status === 'Overdue').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const displayObservationList = observationList.filter((o) => {
    if (!isPrincipal || selectedDept === 'all' || selectedDept === 'All Departments') return true;
    const facultyMatch = displayStaffList.some(
      (s) =>
        (s.facultyName && o.facultyObserved && s.facultyName.toLowerCase() === o.facultyObserved.toLowerCase()) ||
        (s.facultyName && o.observerName && s.facultyName.toLowerCase() === o.observerName.toLowerCase())
    );
    const classMatch = displayClassList.some((c) => c.className && o.className && c.className.toLowerCase() === o.className.toLowerCase());
    return facultyMatch || classMatch;
  });
  const todaysObservations = displayObservationList.filter((o) => o.date === todayStr).length;

  // Student Attendance Calculations
  const rawStudentAttendanceList = dailyReport.studentAttendanceSummaries || [];
  const studentAttendanceList = rawStudentAttendanceList.filter((sa) => {
    if (!isPrincipal || selectedDept === 'all' || selectedDept === 'All Departments') return true;
    const classObj = classList.find((c) => c.id === sa.classId || c.className === sa.className);
    if (classObj) return isDeptMatch(classObj.department, selectedDept);
    return isDeptMatch(sa.className, selectedDept);
  });
  const totalStudentsCount = studentAttendanceList.reduce((acc, curr) => acc + Number(curr.totalStudents || 0), 0);
  const totalPresentCount = studentAttendanceList.reduce((acc, curr) => acc + Number(curr.presentStudents || 0), 0);
  const totalAbsentCount = Math.max(0, totalStudentsCount - totalPresentCount);
  const overallStudentAttendancePct = totalStudentsCount > 0 ? Number(((totalPresentCount / totalStudentsCount) * 100).toFixed(1)) : 0;

  // Pie Chart Data
  const pieData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' }, // Emerald
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' }, // Blue
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' }, // Amber
    { name: 'Overdue', value: overdueTasks, color: '#f43f5e' }, // Rose
  ].filter((d) => d.value > 0);

  // Faculty Task completion breakdown for bar chart
  const facultyChartData = displayStaffList.slice(0, 5).map((staff) => {
    const assigned = displayTaskList.filter((t) => t.assignedToStaffId === staff.id);
    const completed = assigned.filter((t) => t.status === 'Completed').length;
    const pending = assigned.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
    const overdue = assigned.filter((t) => t.status === 'Overdue').length;

    return {
      name: staff.facultyName.split(' ')[1] || staff.facultyName,
      Completed: completed,
      Pending: pending,
      Overdue: overdue,
    };
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority Completion Breakdown for Task Completion Rate Visualization
  const highPriorityTasks = displayTaskList.filter((t) => t.priority === 'High');
  const highPriorityDone = highPriorityTasks.filter((t) => t.status === 'Completed').length;
  const highPriorityPct = highPriorityTasks.length > 0 ? Math.round((highPriorityDone / highPriorityTasks.length) * 100) : 0;

  const medPriorityTasks = displayTaskList.filter((t) => t.priority === 'Medium');
  const medPriorityDone = medPriorityTasks.filter((t) => t.status === 'Completed').length;
  const medPriorityPct = medPriorityTasks.length > 0 ? Math.round((medPriorityDone / medPriorityTasks.length) * 100) : 0;

  const lowPriorityTasks = displayTaskList.filter((t) => t.priority === 'Low');
  const lowPriorityDone = lowPriorityTasks.filter((t) => t.status === 'Completed').length;
  const lowPriorityPct = lowPriorityTasks.length > 0 ? Math.round((lowPriorityDone / lowPriorityTasks.length) * 100) : 0;

  // Faculty & Student Attendance Trends Data (Past 6 days + Today)
  const attendanceTrendData = React.useMemo(() => {
    const activeStaffPct = displayStaffList.length > 0
      ? Math.round((displayStaffList.filter((s) => s.status === 'Active').length / displayStaffList.length) * 100)
      : 95;

    const baseStudentPct = overallStudentAttendancePct > 0 ? overallStudentAttendancePct : 92.0;

    return [
      { day: 'Mon', facultyAttendance: 96, studentAttendance: 89.5 },
      { day: 'Tue', facultyAttendance: 98, studentAttendance: 92.0 },
      { day: 'Wed', facultyAttendance: 94, studentAttendance: 88.5 },
      { day: 'Thu', facultyAttendance: 97, studentAttendance: 94.0 },
      { day: 'Fri', facultyAttendance: 99, studentAttendance: 91.0 },
      { day: 'Sat', facultyAttendance: 92, studentAttendance: 85.0 },
      { day: 'Today', facultyAttendance: activeStaffPct, studentAttendance: baseStudentPct },
    ];
  }, [displayStaffList, overallStudentAttendancePct]);

  // Upcoming Deadlines Breakdown Data (Proximity to targetDate)
  const upcomingDeadlinesData = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let overdue = 0;
    let dueToday = 0;
    let due3Days = 0;
    let due7Days = 0;
    let dueLater = 0;

    let overdueHigh = 0;
    let dueTodayHigh = 0;
    let due3DaysHigh = 0;
    let due7DaysHigh = 0;
    let dueLaterHigh = 0;

    displayTaskList.forEach((t) => {
      if (!t.targetDate) return;
      const target = new Date(t.targetDate);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));

      if (t.status === 'Completed') return; // Only open/pending tasks for deadlines

      if (diffDays < 0 || t.status === 'Overdue') {
        overdue++;
        if (t.priority === 'High') overdueHigh++;
      } else if (diffDays === 0) {
        dueToday++;
        if (t.priority === 'High') dueTodayHigh++;
      } else if (diffDays <= 3) {
        due3Days++;
        if (t.priority === 'High') due3DaysHigh++;
      } else if (diffDays <= 7) {
        due7Days++;
        if (t.priority === 'High') due7DaysHigh++;
      } else {
        dueLater++;
        if (t.priority === 'High') dueLaterHigh++;
      }
    });

    return [
      { window: 'Overdue', Tasks: overdue, HighPriority: overdueHigh, fill: '#f43f5e' },
      { window: 'Due Today', Tasks: dueToday, HighPriority: dueTodayHigh, fill: '#ef4444' },
      { window: 'Next 3 Days', Tasks: due3Days, HighPriority: due3DaysHigh, fill: '#f59e0b' },
      { window: 'Next 7 Days', Tasks: due7Days, HighPriority: due7DaysHigh, fill: '#3b82f6' },
      { window: '8+ Days', Tasks: dueLater, HighPriority: dueLaterHigh, fill: '#10b981' },
    ];
  }, [displayTaskList]);

  // Urgent upcoming deadline tasks for preview list
  const sortedUpcomingTasks = React.useMemo(() => {
    return displayTaskList
      .filter((t) => t.status !== 'Completed')
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 4);
  }, [displayTaskList]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {isPrincipal ? 'College Principal Institutional Dashboard' : 'HOD Departmental Dashboard'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {currentUser?.name}!
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            {isPrincipal
              ? 'Complete institutional oversight of faculty assignments, remaining tasks, class observations, NAAC accreditation work, and student attendance.'
              : 'Real-time monitoring of faculty assignments, daily class observations, and department task compliance.'}
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenAddTask}
              className="px-3.5 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Assign Task
            </button>

            <button
              onClick={onOpenAddStaff}
              className="px-3.5 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>

            <button
              onClick={() => setActiveTab('daily_report')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Daily Report Card
            </button>
          </div>
        )}
      </div>



      {/* Principal Department Selector Bar */}
      {isPrincipal && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Principal Institutional View:
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Filter Data By Department:</span>
                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {selectedDept === 'all' || selectedDept === 'All Departments'
                    ? '🏢 All Departments (Overall View)'
                    : selectedDept}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Filter Department"
              value={selectedDept}
              onChange={(e) => {
                const val = e.target.value;
                setFilterState((prev) => ({ ...prev, department: val }));
                updateDailyReport({ department: val });
              }}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="All Departments">🏢 All Departments (Overall View)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div
          onClick={() => setActiveTab('staff')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Staff
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalStaff}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {displayStaffList.filter((s) => s.status === 'Active').length} Active
            </span>
            • 1 Inactive
          </div>
        </div>

        {/* Total Classes */}
        <div
          onClick={() => setActiveTab('classes')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Classes
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalClasses}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            UG / PG {dailyReport.department} Sections
          </div>
        </div>

        {/* Total Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Tasks
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Compliance rate: <strong className="text-blue-600 dark:text-blue-400">{completionRate}%</strong>
          </div>
        </div>

        {/* Completed Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed Tasks
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {completedTasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Verified with remarks
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Tasks
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingTasks + inProgressTasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {pendingTasks} Pending • {inProgressTasks} In Progress
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Overdue Tasks
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {overdueTasks}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
            Requires immediate action
          </div>
        </div>

        {/* Today's Class Observations */}
        <div
          onClick={() => setActiveTab('observations')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group col-span-2 sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Today's Class Observations
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {todaysObservations}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Observations recorded for {todayStr}
          </div>
        </div>
      </div>

      {/* EXECUTIVE RECHARTS ANALYTICS DASHBOARD SUMMARY */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                EXECUTIVE ANALYTICS DASHBOARD SUMMARY
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive Recharts visualization for task completion rates, faculty attendance trends, and upcoming deadlines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Live Visual Sync
            </span>
          </div>
        </div>

        {/* 3 Core Summary Visual Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. TASK COMPLETION RATES VISUALIZATION */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  1. Task Completion Rates
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300">
                  {completionRate}% Completed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Overall task execution status & priority compliance rates
              </p>
            </div>

            {/* Recharts Pie Donut Chart */}
            <div className="h-48 w-full relative flex items-center justify-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`completion-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                          border: '1px solid #334155',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={32} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-8 text-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white block">
                      {completedTasks}/{totalTasks}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Tasks Done
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 text-center italic">No task data recorded</div>
              )}
            </div>

            {/* Priority Progress Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">High Priority Completion</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">{highPriorityDone}/{highPriorityTasks.length} ({highPriorityPct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-rose-500 h-1.5 rounded-full transition-all" style={{ width: `${highPriorityPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Medium Priority Completion</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{medPriorityDone}/{medPriorityTasks.length} ({medPriorityPct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${medPriorityPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. FACULTY & STUDENT ATTENDANCE TRENDS VISUALIZATION */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  2. Faculty Attendance Trends
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black border border-indigo-300">
                  Daily Presence Log
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tracking faculty & student presence percentage over time
              </p>
            </div>

            {/* Recharts Area Chart for Attendance Trends */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="facultyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: '1px solid #334155',
                    }}
                    formatter={(val: any) => [`${val}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="facultyAttendance"
                    name="Faculty Presence %"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#facultyGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="studentAttendance"
                    name="Student Attendance %"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#studentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Quick Metrics Footer */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">Today's Faculty</span>
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  {displayStaffList.filter(s => s.status === 'Active').length} Active ({attendanceTrendData[6].facultyAttendance}%)
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Today's Students</span>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  {overallStudentAttendancePct}% Present
                </span>
              </div>
            </div>
          </div>

          {/* 3. UPCOMING DEADLINES VISUALIZATION */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  3. Upcoming Deadlines
                </h4>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                >
                  Tasks Tab <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tasks grouped by upcoming target date proximity
              </p>
            </div>

            {/* Recharts Composed Bar Chart for Deadline Proximity */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upcomingDeadlinesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="window" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Tasks" name="Open Tasks" radius={[4, 4, 0, 0]}>
                    {upcomingDeadlinesData.map((entry, index) => (
                      <Cell key={`deadline-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Bar dataKey="HighPriority" name="High Priority" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Upcoming Deadline Task Preview List */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Urgent Upcoming Tasks:</span>
              {sortedUpcomingTasks.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">No upcoming pending tasks.</div>
              ) : (
                sortedUpcomingTasks.slice(0, 2).map((t) => (
                  <div key={t.id} onClick={() => setActiveTab('tasks')} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs cursor-pointer hover:border-blue-400 transition-all">
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">{t.title}</span>
                      <span className="text-[10px] text-slate-400">{t.assignedToName}</span>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                      {t.targetDate}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* FACULTY WORKLOAD BREAKDOWN BAR CHART */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                Faculty Workload & Task Execution Comparison
              </h4>
              <p className="text-[11px] text-slate-500">
                Individual task assignments and progress per faculty member
              </p>
            </div>
            <button
              onClick={() => setActiveTab('staff')}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1"
            >
              View All Faculty <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: '1px solid #334155',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FACULTY 5-UNIT LESSON PLAN COMPLETION CARD (FOR HOD, PRINCIPAL & STAFF) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                FACULTY LESSON PLAN 5-UNIT SYLLABUS STATUS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStaff
                  ? 'Track your 5-unit syllabus progress'
                  : isHod
                  ? `${hodDepartment} Faculty 5-Unit Progress`
                  : 'Track completion across 5 units per department'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPrincipal && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterState((prev) => ({ ...prev, department: val }));
                    updateDailyReport({ department: val });
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="All Departments">🏢 All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setActiveTab('lesson_plan')}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1"
            >
              Manage Lesson Plans <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList
            .filter((staff) => {
              if (isStaff) {
                return (
                  (staff.facultyName && currentUser?.name && staff.facultyName.toLowerCase() === currentUser.name.toLowerCase()) ||
                  staff.id === currentUser?.staffId ||
                  (currentUser?.email && staff.email && staff.email.toLowerCase() === currentUser.email.toLowerCase())
                );
              }
              if (isHod) {
                return (staff.department || '').toLowerCase() === hodDepartment.toLowerCase();
              }
              if (isPrincipal) {
                return isDeptMatch(staff.department, selectedDept);
              }
              return true;
            })
            .slice(0, 6)
            .map((staff) => {
              const staffPlans = lessonPlanList.filter(
                (lp) =>
                  (lp.staffName && staff.facultyName && lp.staffName.toLowerCase().includes(staff.facultyName.toLowerCase())) ||
                  lp.staffId === staff.id
              );

              const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'] as const;
              const completedCount = staffPlans.filter((lp) => lp.status === 'Completed').length;
              const totalCount = staffPlans.length;
              const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={staff.id}
                  onClick={() => setActiveTab('lesson_plan')}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{staff.facultyName}</h4>
                      <p className="text-[10px] text-slate-500">{staff.designation}</p>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300">
                      {overallPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {units.map((u) => {
                      const uItems = staffPlans.filter((lp) => lp.unitNo === u);
                      const uDone = uItems.length > 0 && uItems.every((lp) => lp.status === 'Completed');
                      const uProg = uItems.some((lp) => lp.status === 'In Progress' || lp.status === 'Completed');

                      return (
                        <div key={u} className="text-center">
                          <div
                            className={`h-2 rounded-full mb-1 ${
                              uDone ? 'bg-emerald-500' : uProg ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          />
                          <span className="text-[9px] font-bold text-slate-500">{u.replace('Unit ', 'U')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* STUDENT ATTENDANCE SUMMARY (TODAY) CARD */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                STUDENT ATTENDANCE SUMMARY (TODAY)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live section-wise student attendance log for {todayStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {totalPresentCount} / {totalStudentsCount} Present ({overallStudentAttendancePct}%)
              </div>
              <div className="text-[10px] text-slate-500">{totalAbsentCount} Students Absent Today</div>
            </div>

            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" /> Enter / Update Attendance
            </button>
          </div>
        </div>

        {/* Section Table Grid */}
        {studentAttendanceList.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-xl">
            No attendance summaries entered yet.{' '}
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 font-bold underline"
            >
              Click here to manually enter student attendance.
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Year / Class Section</th>
                  <th className="p-3 text-center">Total Strength</th>
                  <th className="p-3 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                  <th className="p-3 text-center text-rose-600 dark:text-rose-400">Absent</th>
                  <th className="p-3 text-center text-amber-600 dark:text-amber-400">OD</th>
                  <th className="p-3 text-center text-purple-600 dark:text-purple-400">Others</th>
                  <th className="p-3 text-center">Attendance %</th>
                  <th className="p-3 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {studentAttendanceList.map((sa, idx) => {
                  const absent = sa.absentStudents ?? Math.max(0, sa.totalStudents - sa.presentStudents);
                  const od = sa.odStudents ?? 0;
                  const others = sa.othersStudents ?? 0;
                  const pct = sa.attendancePercentage;
                  const isHigh = pct >= 90;
                  const isMed = pct >= 75 && pct < 90;

                  return (
                    <tr key={sa.classId + idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {sa.className}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {sa.totalStudents}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {sa.presentStudents}
                      </td>
                      <td className="p-3 text-center font-semibold text-rose-500 dark:text-rose-400">
                        {absent}
                      </td>
                      <td className="p-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                        {od}
                      </td>
                      <td className="p-3 text-center font-semibold text-purple-600 dark:text-purple-400">
                        {others}
                      </td>
                      <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isHigh
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isMed
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="p-3 text-center min-w-[120px]">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DISCIPLINE ISSUES, SPECIAL REMARKS & HOD OVERALL REMARKS CARD */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                DISCIPLINE ISSUES, SPECIAL REMARKS & HOD OVERALL REMARKS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official daily department log entries for {todayStr}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setRemarksTab('discipline');
              setIsRemarksModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Enter / Update Remarks
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              6. Discipline Issues
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {dailyReport.disciplineIssues || 'None reported.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              6. Special Remarks
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {dailyReport.specialRemarks || 'No special remarks recorded.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              7. HOD Overall Remarks
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold italic">
              "{dailyReport.hodRemarks || 'Satisfactory academic progress across all classes today.'}"
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Tasks & Class Observations */}
      <div className={`grid grid-cols-1 ${!isStaff ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              {isStaff ? "Your Assigned Tasks" : "Recent Task Assignments"}
            </h3>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              View All Tasks ({displayTaskList.length})
            </button>
          </div>

          <div className="space-y-3">
            {displayTaskList.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => setActiveTab('tasks')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {task.title}
                  </span>
                  <TaskStatusBadge status={task.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <span>Assigned to: <strong className="text-slate-700 dark:text-slate-200">{task.assignedToName}</strong></span>
                  <span>Target: <strong className="text-slate-700 dark:text-slate-200">{task.targetDate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Observations (Only visible to HOD / Principal, hidden for Staff) */}
        {!isStaff && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Class Observation Log
              </h3>
              <button
                onClick={() => setActiveTab('observations')}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                View All ({observationList.length})
              </button>
            </div>

            <div className="space-y-3">
              {observationList.slice(0, 3).map((obs) => (
                <div
                  key={obs.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {obs.facultyName} • {obs.subject}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                      {obs.observation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    "{obs.remarks}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{obs.className} • {obs.hour}</span>
                    <span>Observed: {obs.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StudentAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />

      <DailyRemarksModal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        initialTab={remarksTab}
      />
    </div>
  );
};
