import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatusBadge, PriorityBadge } from '../components/StatusBadge';
import { FacultyAttendanceModal } from '../components/FacultyAttendanceModal';
import { DEPARTMENTS, SASURIE_COLLEGES, PdtEntry } from '../types';
import { getGoogleAvatarUrl } from '../utils/avatarUtils';
import { isSameDept, getUserCollege, isStaffInCollege, getStudentsAssignedToMentor } from '../utils/departmentUtils';
import {
  Users,
  GraduationCap,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
  FileText,
  Calendar,
  Sparkles,
  Edit3,
  Percent,
  BookOpen,
  Layers,
  Shield,
  Hourglass,
  UserCheck,
  Building2,
  Activity,
  X,
} from 'lucide-react';

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
    hodAttendanceRecords,
    skillBankStudents,
    mentorMappings,
    pdtEntries,
  } = useApp();

  const [isFacultyAttendanceModalOpen, setIsFacultyAttendanceModalOpen] = useState(false);

  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [secListTab, setSecListTab] = useState<'staff' | 'tasks'>('staff');
  const [secSearchQuery, setSecSearchQuery] = useState('');

  const secFilteredStaff = useMemo(() => {
    let list = selectedCollege === 'all'
      ? staffList
      : staffList.filter((s) => isStaffInCollege(s, selectedCollege));

    if (secSearchQuery && secListTab === 'staff') {
      const q = secSearchQuery.toLowerCase();
      list = list.filter((s) =>
        (s.facultyName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.designation || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [staffList, selectedCollege, secSearchQuery, secListTab]);

  const secFilteredTasks = useMemo(() => {
    let list = selectedCollege === 'all'
      ? taskList
      : taskList.filter((t) => {
          if (t.institution) return t.institution === selectedCollege;
          const assignedStaff = staffList.find((s) => s.id === t.assignedToStaffId);
          return assignedStaff && isStaffInCollege(assignedStaff, selectedCollege);
        });

    if (secSearchQuery && secListTab === 'tasks') {
      const q = secSearchQuery.toLowerCase();
      list = list.filter((t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.assignedToName || '').toLowerCase().includes(q) ||
        (t.department || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [taskList, staffList, selectedCollege, secSearchQuery, secListTab]);

  const secFilteredPdt = useMemo(() => {
    return pdtEntries.filter((e) => {
      const matchesDate = e.date === selectedDate;
      const matchesCollege = selectedCollege === 'all' || e.institution === selectedCollege;
      return matchesDate && matchesCollege;
    });
  }, [pdtEntries, selectedDate, selectedCollege]);

  const secStats = useMemo(() => {
    const totalStaffCount = secFilteredStaff.length;
    const totalTasksCount = secFilteredTasks.length;
    const completedTasksCount = secFilteredTasks.filter((t) => t.status === 'Completed').length;
    const pendingTasksCount = secFilteredTasks.filter((t) => t.status === 'Pending').length;
    const inProgressTasksCount = secFilteredTasks.filter((t) => t.status === 'In Progress').length;
    const overdueTasksCount = secFilteredTasks.filter((t) => t.status === 'Overdue').length;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const activePdtCount = secFilteredPdt.length;
    
    return {
      totalStaffCount,
      totalTasksCount,
      completedTasksCount,
      pendingTasksCount,
      inProgressTasksCount,
      overdueTasksCount,
      completionRate,
      activePdtCount
    };
  }, [secFilteredStaff, secFilteredTasks, secFilteredPdt]);

  const isStaff = currentUser?.role === 'staff';
  const isHod = currentUser?.role === 'admin';
  const isPrincipal = currentUser?.role === 'principal' || currentUser?.role === 'principal_pa';
  const isSecretary = currentUser?.role === 'secretary' || currentUser?.role === 'secretary_pa';
  const isReadOnlyUser = isPrincipal || isSecretary;
  const principalCollege = getUserCollege(currentUser, dailyReport?.collegeName);
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const selectedDept = (isPrincipal || isSecretary)
    ? (filterState.department || dailyReport?.department || 'All Departments')
    : hodDepartment;

  const isDeptMatch = (targetDept?: string, selDept?: string) => {
    if (!selDept || selDept === 'all' || selDept === 'All Departments') return true;
    if (!targetDept) return false;
    return isSameDept(targetDept, selDept);
  };

  // Base staff pool: Principal sees ONLY their college staff; Secretary sees ALL staff
  const collegeStaffList = isPrincipal
    ? staffList.filter((s) => isStaffInCollege(s, principalCollege))
    : staffList;

  const displayStaffList = isHod || isStaff
    ? collegeStaffList.filter((s) => isDeptMatch(s.department, hodDepartment))
    : collegeStaffList.filter((s) => isDeptMatch(s.department, selectedDept));

  const displayClassList = isHod || isStaff
    ? classList.filter((c) => isDeptMatch(c.department, hodDepartment))
    : classList.filter((c) => isDeptMatch(c.department, selectedDept));

  const hodStaffIds = displayStaffList.map((s) => s.id);

  const displayTaskList = isStaff
    ? taskList.filter((t) =>
        t.assignedToStaffId === currentUser?.staffId ||
        (t.assignedToName && currentUser?.name && t.assignedToName.toLowerCase() === currentUser.name.toLowerCase())
      )
    : isHod
    ? taskList.filter((t) => {
        // Strict HOD visibility: show tasks assigned to staff within this HOD's department,
        // tasks whose department explicitly matches the HOD's department, or tasks assigned
        // directly to the HOD (their staffId). Avoid name-only matching to prevent cross-dept leaks.
        const assignedId = t.assignedToStaffId || '';
        const isAssignedToDeptStaff = assignedId && hodStaffIds.includes(assignedId);
        const isAssignedToThisHod = assignedId === (currentUser?.staffId || '');
        const taskDeptMatch = t.department ? isSameDept(t.department, hodDepartment) : false;
        const isGroupHodsForThisDept = (assignedId === 'GROUP_HODS' || t.groupName === 'HODs Group') && taskDeptMatch;
        return Boolean(isAssignedToDeptStaff || isAssignedToThisHod || taskDeptMatch || isGroupHodsForThisDept);
      })
    : taskList.filter((t) => {
        if (selectedDept === 'all' || selectedDept === 'All Departments') return true;
        const staffMatch = displayStaffList.some((s) => s.id === t.assignedToStaffId);
        const taskDeptMatch = t.department ? isDeptMatch(t.department, selectedDept) : false;
        const isGroupHods = t.assignedToStaffId === 'GROUP_HODS' || t.groupName === 'HODs Group';
        return staffMatch || taskDeptMatch || isGroupHods;
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
    const deptMatch = o.department ? isSameDept(o.department, selectedDept) : false;
    return facultyMatch || classMatch || deptMatch;
  });
  const todaysObservations = displayObservationList.filter((o) => o.date === todayStr).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mentor Mentee Data for staff dashboard
  const myMentees = useMemo(
    () => getStudentsAssignedToMentor(currentUser, skillBankStudents || []),
    [currentUser, skillBankStudents]
  );
  const myMentorMapping = useMemo(
    () => mentorMappings.find((m) => m.mentorStaffId === (currentUser?.staffId || '').trim()) || null,
    [mentorMappings, currentUser]
  );

  // Key Performance Indicator (KPI) Computed Metrics
  const totalPendingTasks = pendingTasks + inProgressTasks;
  const upcomingObservationsCount = displayObservationList.filter((o) => o.date >= todayStr).length;
  const activeFacultyCount = displayStaffList.filter((s) => s.status === 'Active').length;

  // Faculty Attendance: HODs submit per-department counts.
  // Principal sees the college-wide absence rate: total absent / total staff across HOD records.
  let facultyAttendancePct: number;
  let facCount: { present: number; absent: number; od: number; permission: number; total: number };
  let computedFacTotal: number;
  if (isPrincipal) {
    const principalCollege = getUserCollege(currentUser, dailyReport?.collegeName);
    const collegeHodRecords = hodAttendanceRecords.filter(
      (r) => r.collegeName === principalCollege || (currentUser?.institution && r.collegeName === currentUser.institution)
    );

    const totalAbsent = collegeHodRecords.reduce((sum, r) => sum + (r.facultyAttendanceCount.absent || 0), 0);
    const totalPresent = collegeHodRecords.reduce((sum, r) => sum + (r.facultyAttendanceCount.present || 0), 0);
    const totalOd = collegeHodRecords.reduce((sum, r) => sum + (r.facultyAttendanceCount.od || 0), 0);
    const totalPermission = collegeHodRecords.reduce((sum, r) => sum + (r.facultyAttendanceCount.permission || 0), 0);
    const totalStaff = collegeHodRecords.reduce((sum, r) => sum + (r.facultyAttendanceCount.total || 0), 0);

    facCount = { present: totalPresent, absent: totalAbsent, od: totalOd, permission: totalPermission, total: totalStaff };
    computedFacTotal = totalStaff || (totalStaff > 0 ? totalStaff : 10);
    facultyAttendancePct = totalStaff > 0 ? Number(((totalAbsent / totalStaff) * 100).toFixed(1)) : 0;
  } else {
    facCount = dailyReport?.facultyAttendanceCount || { present: 0, absent: 0, od: 0, permission: 0, total: 0 };
    const hasFacEntry = (facCount.total && facCount.total > 0) || facCount.present > 0 || facCount.absent > 0 || facCount.od > 0 || facCount.permission > 0;
    computedFacTotal = facCount.total && facCount.total > 0 ? facCount.total : (totalStaff > 0 ? totalStaff : 10);
    const effectiveFacPresent = (facCount.present || 0) + (facCount.od || 0);

    facultyAttendancePct = hasFacEntry && computedFacTotal > 0
      ? Math.min(100, Number(((effectiveFacPresent / computedFacTotal) * 100).toFixed(1)))
      : (totalStaff > 0 ? Math.round((activeFacultyCount / totalStaff) * 100) : 100);
  }

  if (isSecretary) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              College Secretary Central Administration
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {currentUser?.name}!
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
              Unified oversight of total staff, tasks compliance, and daily Principal trackers across all Sasurie campuses.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="bg-white/20 text-white border border-white/25 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
              Role: Management Secretariat
            </span>
          </div>
        </div>

        {/* Campus Filter Tab Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <label className="text-xs font-black text-slate-405 uppercase tracking-widest block">
            Select Sasurie Campus / Institution
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCollege('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                selectedCollege === 'all'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              🏢 All Colleges ({staffList.length} Staff)
            </button>
            {SASURIE_COLLEGES.map((col) => {
              const staffCount = staffList.filter((s) => isStaffInCollege(s, col)).length;
              return (
                <button
                  key={col}
                  onClick={() => setSelectedCollege(col)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    selectedCollege === col
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  🎓 {col.replace('Sasurie College of ', '').replace('Sasurie ', '')} ({staffCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Campus Staff</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {secStats.totalStaffCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Active Tasks</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {secStats.totalTasksCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Task Compliance</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {secStats.completionRate}%
                </p>
                <p className="text-xs text-slate-455 font-semibold">
                  ({secStats.completedTasksCount} / {secStats.totalTasksCount})
                </p>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">PDT Activities</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {secStats.activePdtCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Interactive Layout splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Principal Trackers Daily Timeline (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5.5 h-5.5 text-indigo-500" />
                  PDT Daily Reports (Principal Trackers)
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">
                  Principal diaries & meetings recorded date-wise
                </p>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[500px] space-y-6">
              {secFilteredPdt.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">No Principal schedules found</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    There are no tasks or meetings logged by Principals for this date.
                  </p>
                </div>
              ) : (
                (() => {
                  // Group PDT by college if "all" is selected
                  const grouped: Record<string, PdtEntry[]> = {};
                  if (selectedCollege === 'all') {
                    secFilteredPdt.forEach((e) => {
                      const college = e.institution || 'Sasurie College of Engineering';
                      if (!grouped[college]) grouped[college] = [];
                      grouped[college].push(e);
                    });
                  } else {
                    grouped[selectedCollege] = secFilteredPdt;
                  }

                  return Object.entries(grouped).map(([college, entries]) => (
                    <div key={college} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450">
                          {college} ({entries.length} items)
                        </h4>
                      </div>

                      <div className="space-y-3 pl-4">
                        {entries.map((e) => (
                          <div key={e.id} className="flex gap-4 items-start border-l border-slate-200 dark:border-slate-700 pl-4 relative py-1">
                            <span className="absolute -left-[4.5px] top-3.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            
                            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md min-w-[50px] text-center">
                              {e.time}
                            </span>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded-md ${
                                  e.type === 'Meeting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                                }`}>
                                  {e.type}
                                </span>
                                <h5 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                                  {e.title}
                                </h5>
                                <span className={`text-[10px] font-bold px-2 py-0.25 rounded-md ${
                                  e.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                  e.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                }`}>
                                  {e.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-605 dark:text-slate-300">{e.description}</p>
                              {e.remarks && (
                                <p className="text-[11px] text-slate-450 italic">
                                  <strong className="text-slate-600 dark:text-slate-350">Remarks:</strong> {e.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>

          {/* Directory Explorer (1/3 width) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-900">
                <button
                  onClick={() => { setSecListTab('staff'); setSecSearchQuery(''); }}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-colors ${
                    secListTab === 'staff'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Staff ({secFilteredStaff.length})
                </button>
                <button
                  onClick={() => { setSecListTab('tasks'); setSecSearchQuery(''); }}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-colors ${
                    secListTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Tasks ({secFilteredTasks.length})
                </button>
              </div>

              <div className="mt-3 relative">
                <input
                  type="text"
                  placeholder={secListTab === 'staff' ? "Search staff by name..." : "Search tasks by title..."}
                  value={secSearchQuery}
                  onChange={(e) => setSecSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                {secSearchQuery && (
                  <button
                    onClick={() => setSecSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-3 space-y-2 divide-y divide-slate-50 dark:divide-slate-800/45">
              {secListTab === 'staff' ? (
                secFilteredStaff.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No staff found matching criteria.</div>
                ) : (
                  secFilteredStaff.map((s) => (
                    <div key={s.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                          {s.facultyName}
                        </h4>
                        <p className="text-[10px] text-slate-450 leading-none">
                          {s.id} | {s.designation}
                        </p>
                        <p className="text-[10px] text-indigo-550 dark:text-indigo-400 font-semibold leading-none">
                          {s.department}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-md ${
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))
                )
              ) : (
                secFilteredTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No tasks found matching criteria.</div>
                ) : (
                  secFilteredTasks.map((t) => (
                    <div key={t.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-xs text-slate-805 dark:text-white leading-tight flex-1">
                          {t.title}
                        </h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-md ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                          t.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-405 leading-none">
                        Assignee: <span className="font-semibold text-slate-500">{t.assignedToName}</span>
                      </p>
                      <p className="text-[9px] text-indigo-550 dark:text-indigo-400 font-semibold leading-none">
                        Dept: {t.department || 'All'}
                      </p>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* KEY PERFORMANCE INDICATORS (KPIs) EXECUTIVE SECTION */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {/* HOD & Principal Official College Logo Emblem */}
            <div className="relative shrink-0">
              {dailyReport.collegeLogoUrl ? (
                <img
                  src={dailyReport.collegeLogoUrl}
                  alt="College Logo"
                  className="w-11 h-11 object-contain rounded-xl border border-amber-400 bg-white p-1 shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black flex flex-col items-center justify-center p-1 shadow-sm border border-amber-300">
                  <GraduationCap className="w-6 h-6 text-slate-950" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  KEY PERFORMANCE INDICATORS (KPIs)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  HOD & Principal Executive View
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time institutional snapshot for pending tasks, class observations, and faculty attendance
              </p>
            </div>
          </div>

          {/* Role Badge Seal */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-extrabold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isPrincipal ? 'Principal Executive Office' : 'HOD Leadership Office'}</span>
            </div>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Total Pending Tasks */}
          <div
            onClick={() => setActiveTab('tasks')}
            className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Total Pending Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 border border-amber-200 dark:border-amber-800">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {totalPendingTasks}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{pendingTasks} Pending • {inProgressTasks} In Progress</span>
                {overdueTasks > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded text-[10px]">
                    {overdueTasks} Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Compliance Rate:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{completionRate}%</strong>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Upcoming Class Observations */}
          <div
            onClick={() => setActiveTab('observations')}
            className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Upcoming Class Observations
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 border border-purple-200 dark:border-purple-800">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {upcomingObservationsCount}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{todaysObservations} Today</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/80 px-1.5 py-0.5 rounded text-[10px]">
                  {displayObservationList.length} Total Recorded
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Class Monitoring Scope:</span>
                <strong className="text-purple-600 dark:text-purple-400 font-extrabold">{totalClasses} Classes Monitored</strong>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${
                      totalClasses > 0
                        ? Math.min(100, Math.max(10, Math.round((upcomingObservationsCount / Math.max(1, totalClasses)) * 100)))
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Faculty Attendance Percentage */}
          <div
            className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Faculty Attendance Percentage
              </span>
              <div className="flex items-center gap-1.5">
                {!isReadOnlyUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFacultyAttendanceModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-200 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1 shadow-2xs"
                    title="Enter / Edit Faculty Attendance"
                  >
                    <Edit3 className="w-3 h-3" /> Entry
                  </button>
                )}
                <div
                  onClick={() => setActiveTab('staff')}
                  className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                >
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div onClick={() => setActiveTab('staff')} className="cursor-pointer">
              <div className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-baseline gap-1.5">
                <span>{facultyAttendancePct}%</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isPrincipal ? 'Absent' : 'Present'}
                </span>
              </div>

              {/* Counts Breakdown Badge Grid */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Present</span>
                  {facCount.present ?? Math.max(0, computedFacTotal - (facCount.absent || 0))}
                </div>
                <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <span className="block text-[9px] text-rose-600 dark:text-rose-400 uppercase font-medium">Absent</span>
                  {facCount.absent || 0}
                </div>
                <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <span className="block text-[9px] text-blue-600 dark:text-blue-400 uppercase font-medium">OD</span>
                  {facCount.od || 0}
                </div>
                <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="block text-[9px] text-amber-600 dark:text-amber-400 uppercase font-medium">Permission</span>
                  {facCount.permission || 0}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Total Faculty Count:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {computedFacTotal} Total
                </strong>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${facultyAttendancePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
            • {displayStaffList.filter((s) => s.status !== 'Active').length} Inactive
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
            UG / PG {selectedDept === 'all' || selectedDept === 'All Departments' ? 'All Departments' : selectedDept} Sections
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

      {/* Mentor Mentee Widget for Staff */}
      {isStaff && (
        <div className="mt-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              My Assigned Mentees
            </h3>
            <button
              onClick={() => setActiveTab('my_mentees')}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
            >
              View All ({myMentees.length})
            </button>
          </div>
          {myMentees.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-semibold">No mentees assigned yet</p>
              <p className="text-[11px] mt-1">Contact your HOD to allocate students under your mentorship.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myMentees.slice(0, 6).map((s) => {
                const prof = s.studentProfile;
                return (
                  <div
                    key={prof.registerNumber}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                        {(prof.studentName || 'S')[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {prof.studentName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {prof.registerNumber} • {prof.skillBankAccountNo}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sem {prof.semester} • Sec {prof.section} • {prof.academicYear || prof.batch}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {myMentees.length > 6 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setActiveTab('my_mentees')}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
              >
                View all {myMentees.length} mentees →
              </button>
            </div>
          )}
        </div>
      )}

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
            {displayTaskList.slice(0, 4).map((task, idx) => (
              <div
                key={task.id ? `${task.id}-${idx}` : `task-recent-${idx}`}
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
              {observationList.slice(0, 3).map((obs, idx) => (
                <div
                  key={obs.id ? `${obs.id}-${idx}` : `obs-recent-${idx}`}
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


      <FacultyAttendanceModal
        isOpen={isFacultyAttendanceModalOpen}
        onClose={() => setIsFacultyAttendanceModalOpen(false)}
      />

    </div>
  );
};
