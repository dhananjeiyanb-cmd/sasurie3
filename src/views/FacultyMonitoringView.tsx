import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FacultyDailyMonitoring } from '../types';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Edit2,
  Save,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  CheckSquare,
  Activity,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const FacultyMonitoringView: React.FC = () => {
  const { monitoringList, updateMonitoring, staffList, taskList, observationList, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'tasks' | 'observations'>('all');

  // Temporary edit states
  const [tempClassesHandled, setTempClassesHandled] = useState('');
  const [tempDuties, setTempDuties] = useState('');
  const [tempRemarks, setTempRemarks] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const startEdit = (m: FacultyDailyMonitoring) => {
    setEditingId(m.id);
    setTempClassesHandled(m.classesHandled);
    setTempDuties(m.assignedDuties);
    setTempRemarks(m.remarks);
  };

  const saveEdit = (id: string) => {
    updateMonitoring(id, {
      classesHandled: tempClassesHandled,
      assignedDuties: tempDuties,
      remarks: tempRemarks,
    });
    setEditingId(null);
  };

  const isHod = currentUser?.role === 'admin';
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const deptStaffNames = staffList
    .filter((s) => {
      const staffDept = s.department.toLowerCase();
      const userDept = hodDepartment.toLowerCase();
      return staffDept === userDept || (staffDept.includes('ai & ds') && userDept.includes('ai & ds'));
    })
    .map((s) => s.facultyName.toLowerCase());

  const filteredMonitoring = monitoringList.filter((m) => {
    if (isHod) {
      const isMyDeptStaff = deptStaffNames.some((name) => m.facultyName.toLowerCase().includes(name));
      if (!isMyDeptStaff) return false;
    }

    const q = search.toLowerCase();
    return (
      m.facultyName.toLowerCase().includes(q) ||
      m.classesHandled.toLowerCase().includes(q) ||
      m.assignedDuties.toLowerCase().includes(q) ||
      m.remarks.toLowerCase().includes(q)
    );
  });

  // Map rating string to numeric rating score out of 100
  const getRatingScore = (rating: string): number => {
    switch (rating) {
      case 'Excellent':
        return 95;
      case 'Good':
        return 80;
      case 'Average':
        return 65;
      case 'Needs Improvement':
        return 50;
      default:
        return 70;
    }
  };

  // Process data for charts
  const facultyChartData = filteredMonitoring.map((m) => {
    const facultyTasks = taskList.filter((t) => t.assignedToStaffId === m.staffId);
    const totalTasks = facultyTasks.length;
    const completedTasks = facultyTasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = facultyTasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasks = facultyTasks.filter((t) => t.status === 'Pending').length;
    const overdueTasks = facultyTasks.filter((t) => t.status === 'Overdue').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const facultyObs = observationList.filter((o) => o.staffId === m.staffId);
    const obsCount = facultyObs.length;
    const avgObsScore =
      obsCount > 0
        ? Math.round(facultyObs.reduce((acc, o) => acc + getRatingScore(o.observation), 0) / obsCount)
        : m.classObservationDone
        ? 85
        : 60;

    // Short display name for X-axis
    const cleanName = m.facultyName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '');
    const firstName = cleanName.split(' ')[0] || m.staffId;

    return {
      staffId: m.staffId,
      facultyName: m.facultyName,
      shortName: `${firstName} (${m.staffId})`,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      obsCount,
      avgObsScore,
      attendanceUpdated: m.attendanceUpdated,
      syllabusUpdated: m.syllabusUpdated,
      classObservationDone: m.classObservationDone,
    };
  });

  // Task status distribution across filtered faculty
  const totalCompleted = facultyChartData.reduce((acc, f) => acc + f.completedTasks, 0);
  const totalInProgress = facultyChartData.reduce((acc, f) => acc + f.inProgressTasks, 0);
  const totalPending = facultyChartData.reduce((acc, f) => acc + f.pendingTasks, 0);
  const totalOverdue = facultyChartData.reduce((acc, f) => acc + f.overdueTasks, 0);

  const taskStatusDistribution = [
    { name: 'Completed', value: totalCompleted, color: '#10b981' },
    { name: 'In Progress', value: totalInProgress, color: '#3b82f6' },
    { name: 'Pending', value: totalPending, color: '#f59e0b' },
    { name: 'Overdue', value: totalOverdue, color: '#f43f5e' },
  ].filter((item) => item.value > 0);

  const pieTaskData =
    taskStatusDistribution.length > 0 ? taskStatusDistribution : [{ name: 'Completed', value: 1, color: '#10b981' }];

  // Observation Ratings breakdown
  const monitoredStaffIds = new Set(filteredMonitoring.map((m) => m.staffId));
  const relevantObservations = observationList.filter((o) => monitoredStaffIds.has(o.staffId));

  const excellentCount = relevantObservations.filter((o) => o.observation === 'Excellent').length;
  const goodCount = relevantObservations.filter((o) => o.observation === 'Good').length;
  const averageCount = relevantObservations.filter((o) => o.observation === 'Average').length;
  const needsImpCount = relevantObservations.filter((o) => o.observation === 'Needs Improvement').length;

  const observationRatingDistribution = [
    { name: 'Excellent (95%)', count: excellentCount, score: 95, color: '#10b981' },
    { name: 'Good (80%)', count: goodCount, score: 80, color: '#3b82f6' },
    { name: 'Average (65%)', count: averageCount, score: 65, color: '#f59e0b' },
    { name: 'Needs Imp. (50%)', count: needsImpCount, score: 50, color: '#f43f5e' },
  ];

  // High-level KPI summary calculations
  const overallAvgCompletionRate =
    facultyChartData.length > 0
      ? Math.round(facultyChartData.reduce((acc, f) => acc + f.completionRate, 0) / facultyChartData.length)
      : 0;

  const overallAvgObsScore =
    facultyChartData.length > 0
      ? Math.round(facultyChartData.reduce((acc, f) => acc + f.avgObsScore, 0) / facultyChartData.length)
      : 0;

  const fullComplianceCount = facultyChartData.filter((f) => f.attendanceUpdated && f.syllabusUpdated).length;
  const fullComplianceRate =
    facultyChartData.length > 0 ? Math.round((fullComplianceCount / facultyChartData.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Faculty Daily Monitoring Matrix & Performance Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily class logs, task completion rates, classroom observation scores, and syllabus compliance for date {todayStr}.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
          Monitoring Date: {todayStr}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Task Completion Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Avg Task Completion Rate</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {overallAvgCompletionRate}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>{totalCompleted} tasks completed across monitored faculty</span>
          </p>
        </div>

        {/* Card 2: Average Observation Score */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Avg Observation Score</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl border border-purple-200 dark:border-purple-800">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {overallAvgObsScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>{relevantObservations.length} classroom observations evaluated</span>
          </p>
        </div>

        {/* Card 3: Portal & Syllabus Compliance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Portal Update Compliance</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {fullComplianceRate}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {fullComplianceCount} of {facultyChartData.length} faculty updated both attendance & syllabus
          </p>
        </div>

        {/* Card 4: Total Monitored Faculty */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Monitored Faculty</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl border border-amber-200 dark:border-amber-800">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {facultyChartData.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Active monitoring logs in scope
          </p>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION DASHBOARD SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-5">
        {/* Chart View Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Visual Analytics & Comparative Charts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive recharts for task completion rates, observation scores, and compliance metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setActiveChartTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeChartTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveChartTab('tasks')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeChartTab === 'tasks'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Task Completion Rates
            </button>
            <button
              onClick={() => setActiveChartTab('observations')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeChartTab === 'observations'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Observation Scores
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHART 1: Faculty Task Completion Rates (% Bar Chart) */}
          {(activeChartTab === 'all' || activeChartTab === 'tasks') && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Faculty Task Completion Rates (%)
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Target: 100%
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any) => [
                        name === 'completionRate' ? `${value}%` : value,
                        name === 'completionRate' ? 'Task Completion Rate' : name,
                      ]}
                      labelFormatter={(label, payload) => payload[0]?.payload?.facultyName || label}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="completionRate"
                      name="Completion Rate (%)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CHART 2: Faculty Observation Scores (Score out of 100) */}
          {(activeChartTab === 'all' || activeChartTab === 'observations') && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Faculty Observation Ratings & Score (out of 100)
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  Rating Metric
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${value} / 100`, 'Observation Score']}
                      labelFormatter={(label, payload) => payload[0]?.payload?.facultyName || label}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="avgObsScore"
                      name="Observation Score"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CHART 3: Overall Task Status Breakdown (Pie Chart) */}
          {(activeChartTab === 'all' || activeChartTab === 'tasks') && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Overall Task Status Breakdown
                </h4>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieTaskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {pieTaskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${value} Tasks`, 'Count']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CHART 4: Classroom Observation Rating Categories (Bar Chart) */}
          {(activeChartTab === 'all' || activeChartTab === 'observations') && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Observation Rating Tier Breakdown
                </h4>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={observationRatingDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} Observations`,
                        `Tier Rating (Score: ${props.payload.score}%)`,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="count" name="Evaluations Count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {observationRatingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty name, classes handled, duties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Classes Handled</th>
                <th className="p-3 text-center">Attendance Updated</th>
                <th className="p-3 text-center">Syllabus Updated</th>
                <th className="p-3">Assigned Duties & Tasks</th>
                <th className="p-3 text-center">Observation Score</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredMonitoring.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No daily monitoring logs found.
                  </td>
                </tr>
              ) : (
                filteredMonitoring.map((m) => {
                  const isEditing = editingId === m.id;
                  const facultyTasks = taskList.filter((t) => t.assignedToStaffId === m.staffId);
                  const pendingCount = facultyTasks.filter(
                    (t) => t.status === 'Pending' || t.status === 'In Progress'
                  ).length;
                  const overdueCount = facultyTasks.filter((t) => t.status === 'Overdue').length;
                  const completedCount = facultyTasks.filter((t) => t.status === 'Completed').length;
                  const totalTasks = facultyTasks.length;
                  const taskCompletionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

                  const facultyObs = observationList.filter((o) => o.staffId === m.staffId);
                  const obsScore =
                    facultyObs.length > 0
                      ? Math.round(facultyObs.reduce((acc, o) => acc + getRatingScore(o.observation), 0) / facultyObs.length)
                      : m.classObservationDone
                      ? 85
                      : 60;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      {/* Faculty Name */}
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                            {m.staffId}
                          </div>
                          <div>
                            <div>{m.facultyName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {staffList.find((s) => s.id === m.staffId)?.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classes Handled */}
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempClassesHandled}
                            onChange={(e) => setTempClassesHandled(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                          />
                        ) : (
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {m.classesHandled}
                          </span>
                        )}
                      </td>

                      {/* Attendance Updated Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => updateMonitoring(m.id, { attendanceUpdated: !m.attendanceUpdated })}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            m.attendanceUpdated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {m.attendanceUpdated ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> No
                            </>
                          )}
                        </button>
                      </td>

                      {/* Syllabus Updated Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => updateMonitoring(m.id, { syllabusUpdated: !m.syllabusUpdated })}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            m.syllabusUpdated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {m.syllabusUpdated ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Yes
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> No
                            </>
                          )}
                        </button>
                      </td>

                      {/* Assigned Duties & Tasks */}
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempDuties}
                            onChange={(e) => setTempDuties(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                          />
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {m.assignedDuties}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${taskCompletionPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {taskCompletionPct}% Rate
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Tasks: <span className="text-emerald-600 font-bold">{completedCount} Done</span> •{' '}
                              <span className="text-amber-600 font-bold">{pendingCount} Pending</span> •{' '}
                              <span className="text-rose-600 font-bold">{overdueCount} Overdue</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Class Observation Rating Score */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => updateMonitoring(m.id, { classObservationDone: !m.classObservationDone })}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                              m.classObservationDone
                                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {m.classObservationDone ? 'Done (Yes)' : 'Not Done'}
                          </button>
                          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                            Score: {obsScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="p-3 max-w-xs">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={tempRemarks}
                            onChange={(e) => setTempRemarks(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                          />
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 line-clamp-2">
                            {m.remarks}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => saveEdit(m.id)}
                            className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(m)}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            title="Edit row"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
