import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAttendanceRecord, DEPARTMENTS } from '../types';
import { isSameDept, checkIsHodOrAdmin, getMentorAssignedClasses } from '../utils/departmentUtils';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Edit,
  Printer,
  Download,
  Filter,
  Plus,
  BarChart3,
  Save,
  GraduationCap,
  Calendar,
  Building2,
  Trash2,
  FileSpreadsheet,
  Search,
} from 'lucide-react';

export const StudentAttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    classList,
    currentUser,
    dailyReport,
    skillBankStudents,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate default From Date (30 days ago)
  const defaultFromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Main View Mode: 'daily' | 'range_report'
  const [activeViewTab, setActiveViewTab] = useState<'daily' | 'range_report'>('daily');

  // Filters for Date Range Report
  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily Mode Filters & State
  const [entryDate, setEntryDate] = useState<string>(todayStr);
  const [editingRecord, setEditingRecord] = useState<StudentAttendanceRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Record Form State
  const [newDate, setNewDate] = useState<string>(todayStr);
  const [newDept, setNewDept] = useState<string>(
    currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)'
  );
  const [newClassId, setNewClassId] = useState<string>(classList[0]?.id || 'CLS-104');
  const [newPresent, setNewPresent] = useState<number>(0);
  const [newAbsent, setNewAbsent] = useState<number>(0);
  const [newOd, setNewOd] = useState<number>(0);
  const [newOthers, setNewOthers] = useState<number>(0);
  const [newRemarks, setNewRemarks] = useState<string>('');

  // Morning Mentor Hour
  const [newMorPresent, setNewMorPresent] = useState<number>(0);
  const [newMorAbsent, setNewMorAbsent] = useState<number>(0);
  const [newMorOd, setNewMorOd] = useState<number>(0);
  const [newMorOthers, setNewMorOthers] = useState<number>(0);

  // Evening Mentor Hour
  const [newEvePresent, setNewEvePresent] = useState<number>(0);
  const [newEveAbsent, setNewEveAbsent] = useState<number>(0);
  const [newEveOd, setNewEveOd] = useState<number>(0);
  const [newEveOthers, setNewEveOthers] = useState<number>(0);

  // Edit Form State
  const [editPresent, setEditPresent] = useState<number>(0);
  const [editAbsent, setEditAbsent] = useState<number>(0);
  const [editOd, setEditOd] = useState<number>(0);
  const [editOthers, setEditOthers] = useState<number>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');

  const isHodOrAdmin = checkIsHodOrAdmin(currentUser);
  const isManagement = currentUser?.role === 'admin' || currentUser?.role === 'principal';
  const isMentor = currentUser?.role === 'staff' && !isHodOrAdmin;

  // Classes assigned to the logged-in mentor (for scoping add form)
  const mentorClasses = useMemo(() => {
    return getMentorAssignedClasses(currentUser, classList, skillBankStudents || []);
  }, [currentUser, classList, skillBankStudents]);

  // Available classes for selected department in add modal
  const modalClasses = useMemo(() => {
    if (isMentor && mentorClasses.length > 0) {
      return mentorClasses.filter((c) => {
        if (!newDept || newDept === 'all') return true;
        return isSameDept(c.department, newDept);
      });
    }
    return classList.filter((c) => {
      if (!newDept || newDept === 'all') return true;
      return isSameDept(c.department, newDept);
    });
  }, [classList, newDept, isMentor, mentorClasses]);

  // Auto-lock class/department for mentors when modal opens
  React.useEffect(() => {
    if (!showAddModal || !isMentor || mentorClasses.length === 0) return;
    const assignedClass = mentorClasses[0];
    if (assignedClass) {
      setNewClassId(assignedClass.id);
      setNewDept(assignedClass.department);
    }
  }, [showAddModal, isMentor, mentorClasses]);

  // Handle Submit New Attendance Record
  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classList.find((c) => c.id === newClassId) || classList[0];
    const total = newPresent + newAbsent + newOd + newOthers;
    const pct = total > 0 ? Number(((newPresent / total) * 100).toFixed(1)) : 0;

    const morningTotal = newMorPresent + newMorAbsent + newMorOd + newMorOthers;
    const morningPct = morningTotal > 0 ? Number(((newMorPresent / morningTotal) * 100).toFixed(1)) : 0;

    const eveningTotal = newEvePresent + newEveAbsent + newEveOd + newEveOthers;
    const eveningPct = eveningTotal > 0 ? Number(((newEvePresent / eveningTotal) * 100).toFixed(1)) : 0;

    const variation = newMorPresent - newEvePresent;

    const classNameStr = targetClass
      ? `${targetClass.year} ${targetClass.department.includes('AI & DS') ? 'AI & DS' : targetClass.department} - Sec ${targetClass.section}`
      : 'Class Attendance';

    addAttendanceRecord({
      date: newDate,
      department: targetClass ? targetClass.department : newDept,
      classId: targetClass ? targetClass.id : newClassId,
      className: classNameStr,
      year: targetClass ? targetClass.year : 'II Year',
      section: targetClass ? targetClass.section : 'A',
      totalStudents: total,
      presentStudents: newPresent,
      absentStudents: newAbsent,
      odStudents: newOd,
      othersStudents: newOthers,
      attendancePercentage: pct,
      markedBy: currentUser?.name || 'Faculty Staff',
      markedById: currentUser?.staffId || currentUser?.username,
      markedAt: new Date().toISOString(),
      remarks: newRemarks,

      // Morning Mentor Hour
      morningPresent: newMorPresent,
      morningAbsent: newMorAbsent,
      morningOd: newMorOd,
      morningOthers: newMorOthers,
      morningPercentage: morningPct,

      // Evening Mentor Hour
      eveningPresent: newEvePresent,
      eveningAbsent: newEveAbsent,
      eveningOd: newEveOd,
      eveningOthers: newEveOthers,
      eveningPercentage: eveningPct,

      variation,
      variationNote: variation > 0 ? 'Morning higher' : variation < 0 ? 'Evening higher' : 'Equal',
    });

    setShowAddModal(false);
    setNewRemarks('');
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: StudentAttendanceRecord) => {
    setEditingRecord(rec);
    setEditPresent(rec.presentStudents);
    setEditAbsent(rec.absentStudents || 0);
    setEditOd(rec.odStudents || 0);
    setEditOthers(rec.othersStudents || 0);
    setEditRemarks(rec.remarks || '');
  };

  // Save Edit Record
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const total = editPresent + editAbsent + editOd + editOthers;
    const pct = total > 0 ? Number(((editPresent / total) * 100).toFixed(1)) : 0;

    updateAttendanceRecord(editingRecord.id, {
      presentStudents: editPresent,
      absentStudents: editAbsent,
      odStudents: editOd,
      othersStudents: editOthers,
      totalStudents: total,
      attendancePercentage: pct,
      remarks: editRemarks,
    });

    setEditingRecord(null);
  };

  // User Department Scoping
  const userDept = currentUser?.department;
  const isFacultyOrHod = currentUser?.role === 'staff' || currentUser?.role === 'admin';

  // Mentor scoping: class IDs assigned to the logged-in mentor
  const mentorClassIds = useMemo(() => {
    if (currentUser?.role !== 'staff') return new Set<string>();
    const assigned = getMentorAssignedClasses(currentUser, classList, skillBankStudents || []);
    return new Set(assigned.map((c) => c.id));
  }, [currentUser, classList, skillBankStudents]);

  // Daily Mode: Filter records for selected entry date and department
  const dailyRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (r.date !== entryDate) return false;
      // Role scoping: HOD/Faculty see only their department
      if (isFacultyOrHod && userDept) {
        if (!isSameDept(r.department, userDept)) return false;
      }
      // Mentor scoping: only show records for mentor's assigned classes
      if (isMentor && mentorClassIds.size > 0) {
        if (!mentorClassIds.has(r.classId)) return false;
      }
      // Department filter dropdown selection
      if (selectedDepartmentFilter !== 'all') {
        if (!isSameDept(r.department, selectedDepartmentFilter)) return false;
      }
      return true;
    });
  }, [attendanceRecords, entryDate, isFacultyOrHod, userDept, selectedDepartmentFilter, isMentor, mentorClassIds]);

  // Date-Range Report Filtered Records
  const rangeRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      // Date range check
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;

      // Role scoping: HOD/Faculty see only their department
      if (isFacultyOrHod && userDept) {
        if (!isSameDept(r.department, userDept)) return false;
      }

      // Mentor scoping: only show records for mentor's assigned classes
      if (isMentor && mentorClassIds.size > 0) {
        if (!mentorClassIds.has(r.classId)) return false;
      }

      // Department filter check
      if (selectedDepartmentFilter !== 'all') {
        if (!isSameDept(r.department, selectedDepartmentFilter)) return false;
      }

      // Class check
      if (selectedClassFilter !== 'all' && r.classId !== selectedClassFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (r.className || '').toLowerCase().includes(q) ||
          (r.department || '').toLowerCase().includes(q) ||
          (r.markedBy ? r.markedBy.toLowerCase().includes(q) : false) ||
          (r.date || '').includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [attendanceRecords, fromDate, toDate, isFacultyOrHod, userDept, selectedDepartmentFilter, selectedClassFilter, searchQuery, isMentor, mentorClassIds]);

  // Aggregated Department-wise Summary for Date Range
  const departmentWiseReport = useMemo(() => {
    const map: Record<
      string,
      {
        department: string;
        totalLogs: number;
        presentDays: number;
        absentDays: number;
        odDays: number;
        othersDays: number;
      }
    > = {};

    rangeRecords.forEach((r) => {
      const dept = r.department || 'General';
      if (!map[dept]) {
        map[dept] = {
          department: dept,
          totalLogs: 0,
          presentDays: 0,
          absentDays: 0,
          odDays: 0,
          othersDays: 0,
        };
      }
      map[dept].totalLogs += 1;
      map[dept].presentDays += Number(r.presentStudents || 0);
      map[dept].absentDays += Number(r.absentStudents || 0);
      map[dept].odDays += Number(r.odStudents || 0);
      map[dept].othersDays += Number(r.othersStudents || 0);
    });

    return Object.values(map).map((item) => {
      const pct =
        item.presentDays + item.absentDays + item.odDays + item.othersDays > 0
          ? Number(
              ((item.presentDays / (item.presentDays + item.absentDays + item.odDays + item.othersDays)) * 100).toFixed(1)
            )
          : 0;
      return { ...item, attendancePercentage: pct };
    });
  }, [rangeRecords]);

  // Aggregated Class-wise Summary for Date Range
  const classWiseReport = useMemo(() => {
    const map: Record<
      string,
      {
        classId: string;
        className: string;
        department: string;
        totalLogs: number;
        presentDays: number;
        absentDays: number;
        odDays: number;
        othersDays: number;
      }
    > = {};

    rangeRecords.forEach((r) => {
      const key = r.classId || r.className;
      if (!map[key]) {
        map[key] = {
          classId: r.classId,
          className: r.className,
          department: r.department,
          totalLogs: 0,
          presentDays: 0,
          absentDays: 0,
          odDays: 0,
          othersDays: 0,
        };
      }
      map[key].totalLogs += 1;
      map[key].presentDays += Number(r.presentStudents || 0);
      map[key].absentDays += Number(r.absentStudents || 0);
      map[key].odDays += Number(r.odStudents || 0);
      map[key].othersDays += Number(r.othersStudents || 0);
    });

    return Object.values(map).map((item) => {
      const pct =
        item.presentDays + item.absentDays + item.odDays + item.othersDays > 0
          ? Number(
              ((item.presentDays / (item.presentDays + item.absentDays + item.odDays + item.othersDays)) * 100).toFixed(1)
            )
          : 0;
      return { ...item, attendancePercentage: pct };
    });
  }, [rangeRecords]);

  // Overall Range Metrics
  const totalRangePresent = rangeRecords.reduce((acc, curr) => acc + Number(curr.presentStudents || 0), 0);
  const totalRangeAbsent = rangeRecords.reduce((acc, curr) => acc + Number(curr.absentStudents || 0), 0);
  const totalRangeOd = rangeRecords.reduce((acc, curr) => acc + Number(curr.odStudents || 0), 0);
  const totalRangeOthers = rangeRecords.reduce((acc, curr) => acc + Number(curr.othersStudents || 0), 0);
  const totalRangeTotal = totalRangePresent + totalRangeAbsent + totalRangeOd + totalRangeOthers;
  const overallRangePct =
    totalRangeTotal > 0 ? Number(((totalRangePresent / totalRangeTotal) * 100).toFixed(1)) : 0;

  // CSV Export Handler
  const handleExportCSV = () => {
    if (rangeRecords.length === 0) {
      alert('No attendance records to export for selected filters.');
      return;
    }

    const headers = [
      'Date',
      'Department',
      'Class Name',
      'Year',
      'Present',
      'Absent',
      'On Duty (OD)',
      'Others',
      'Attendance %',
      'Marked By',
      'Remarks',
    ];

    const rows = rangeRecords.map((r) => [
      r.date,
      `"${r.department}"`,
      `"${r.className}"`,
      r.year || '',
      r.presentStudents,
      r.absentStudents || 0,
      r.odStudents || 0,
      r.othersStudents || 0,
      `${r.attendancePercentage}%`,
      `"${r.markedBy || ''}"`,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable PDF Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
          {dailyReport?.collegeName || 'Sasurie College of Engineering'}
        </h1>
        <p className="text-xs font-bold text-slate-700 uppercase">
          DEPARTMENT OF {userDept.toUpperCase()} — STUDENT ATTENDANCE REPORT
        </p>
        <p className="text-[10px] text-slate-500 font-semibold">
          Printed on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Attendance Management & Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record date-wise student attendance and generate class-wise & department-wise attendance reports
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveViewTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'daily'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Date-Wise Entry
            </button>
            <button
              onClick={() => setActiveViewTab('range_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'range_report'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> From - To Date Reports
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Attendance by Date
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DAILY ATTENDANCE ENTRY BY DATE */}
      {activeViewTab === 'daily' && (
        <div className="space-y-6">
          {/* Entry Date Selector Card */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Select Attendance Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="mt-0.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Filter Department
                </label>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  className="mt-0.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{dailyRecords.length}</span> class attendance log(s) for{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{entryDate}</span>
            </div>
          </div>

          {/* Daily Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Present Students
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {dailyRecords.reduce((acc, r) => acc + Number(r.presentStudents || 0), 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Absent Students
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {dailyRecords.reduce((acc, r) => acc + Number(r.absentStudents || 0), 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Attendance Rate
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {(() => {
                  const totalPresent = dailyRecords.reduce((acc, r) => acc + Number(r.presentStudents || 0), 0);
                  const totalAbsent = dailyRecords.reduce((acc, r) => acc + Number(r.absentStudents || 0), 0);
                  const totalOd = dailyRecords.reduce((acc, r) => acc + Number(r.odStudents || 0), 0);
                  const totalOthers = dailyRecords.reduce((acc, r) => acc + Number(r.othersStudents || 0), 0);
                  const total = totalPresent + totalAbsent + totalOd + totalOthers;
                  return total > 0 ? ((totalPresent / total) * 100).toFixed(1) : '0';
                })}
                %
              </div>
            </div>
          </div>

          {/* Daily Records List Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Attendance Entries for {entryDate}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Department & Class</th>
                    <th className="p-3.5 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="p-3.5 text-center text-rose-600 dark:text-rose-400">Absent</th>
                    <th className="p-3.5 text-center text-purple-600 dark:text-purple-400">OD</th>
                    <th className="p-3.5 text-center text-amber-600 dark:text-amber-400">Others</th>
                    <th className="p-3.5 text-center">Attendance %</th>
                    <th className="p-3.5">Marked By</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {dailyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        No student attendance logged for <span className="font-bold">{entryDate}</span>. Click
                        &quot;Add Attendance by Date&quot; above to log entries.
                      </td>
                    </tr>
                  ) : (
                    dailyRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{r.className}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.department}</div>
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {r.presentStudents}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                          {r.absentStudents || 0}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20">
                          {r.odStudents || 0}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-amber-600 dark:text-amber-400">
                          {r.othersStudents || 0}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              r.attendancePercentage >= 92
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : r.attendancePercentage >= 85
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {r.attendancePercentage}%
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {r.markedBy || 'Staff'}
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isHodOrAdmin && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this attendance record?')) {
                                  deleteAttendanceRecord(r.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Delete Record (HOD Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DATE RANGE ATTENDANCE REPORTS (FROM DATE TO TO DATE) */}
      {activeViewTab === 'range_report' && (
        <div className="space-y-6">
          {/* Filter Bar for Date Range */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Date Range & Scope Filters
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel / CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* From Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  From Date *
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  To Date *
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Class
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Classes</option>
                  {classList
                    .filter((c) => selectedDepartmentFilter === 'all' || isSameDept(c.department, selectedDepartmentFilter))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.year} {c.department} - Sec {c.section}
                      </option>
                    ))}
                </select>
              </div>

              {/* Search Query */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Class, staff name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Range Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Total Logs Recorded
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {rangeRecords.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Classes x Days</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Cumulative Present
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalRangePresent}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">{overallRangePct}% Rate</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Cumulative Absent
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {totalRangeAbsent}
              </div>
              <div className="text-[11px] text-rose-500 mt-0.5">
                {totalRangeTotal > 0 ? ((totalRangeAbsent / totalRangeTotal) * 100).toFixed(1) : 0}% Absent Rate
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Cumulative On Duty (OD)
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {totalRangeOd}
              </div>
              <div className="text-[11px] text-purple-500 mt-0.5">Sports / Symposiums</div>
            </div>
          </div>

          {/* DEPARTMENT-WISE ATTENDANCE REPORT TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  1. Department-Wise Attendance Summary ({fromDate} to {toDate})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aggregated attendance percentage per department across the selected date range
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Department Name</th>
                    <th className="p-3.5 text-center">Class Logs</th>
                    <th className="p-3.5 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="p-3.5 text-center text-rose-600 dark:text-rose-400">Absent</th>
                    <th className="p-3.5 text-center text-purple-600 dark:text-purple-400">OD</th>
                    <th className="p-3.5 text-center">Attendance %</th>
                    <th className="p-3.5 text-center">Progress Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {departmentWiseReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                        No department attendance records found for this date range.
                      </td>
                    </tr>
                  ) : (
                    departmentWiseReport.map((dept) => (
                      <tr key={dept.department} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {dept.department}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {dept.totalLogs} logs
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                          {dept.presentDays}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-rose-600 dark:text-rose-400">
                          {dept.absentDays}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-purple-600 dark:text-purple-400">
                          {dept.odDays}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-black ${
                              dept.attendancePercentage >= 92
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : dept.attendancePercentage >= 85
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {dept.attendancePercentage}%
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden inline-block border border-slate-200 dark:border-slate-600">
                            <div
                              className={`h-full ${
                                dept.attendancePercentage >= 92
                                  ? 'bg-emerald-500'
                                  : dept.attendancePercentage >= 85
                                  ? 'bg-blue-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${dept.attendancePercentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CLASS-WISE ATTENDANCE REPORT TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  2. Class-Wise Attendance Summary ({fromDate} to {toDate})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual class performance metrics for the selected duration
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Class Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5 text-center">Total Sessions</th>
                    <th className="p-3.5 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="p-3.5 text-center text-rose-600 dark:text-rose-400">Absent</th>
                    <th className="p-3.5 text-center text-purple-600 dark:text-purple-400">OD</th>
                    <th className="p-3.5 text-center">Overall Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {classWiseReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                        No class records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    classWiseReport.map((cls) => (
                      <tr key={cls.classId || cls.className} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {cls.className}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {cls.department}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          {cls.totalLogs} logs
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                          {cls.presentDays}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-rose-600 dark:text-rose-400">
                          {cls.absentDays}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-purple-600 dark:text-purple-400">
                          {cls.odDays}
                        </td>
                        <td className="p-3.5 text-center font-black text-slate-900 dark:text-white">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              cls.attendancePercentage >= 92
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : cls.attendancePercentage >= 85
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {cls.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED DATE-BY-DATE RECORDS LOG TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  3. Detailed Day-by-Day Attendance Logs ({rangeRecords.length} Records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual logs recorded by staff members between {fromDate} and {toDate}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Class & Department</th>
                    <th className="p-3.5 text-center text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="p-3.5 text-center text-rose-600 dark:text-rose-400">Absent</th>
                    <th className="p-3.5 text-center text-purple-600 dark:text-purple-400">OD</th>
                    <th className="p-3.5 text-center">Percentage</th>
                    <th className="p-3.5">Marked By</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {rangeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        No detailed logs found matching the date range and filters.
                      </td>
                    </tr>
                  ) : (
                    rangeRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{r.className}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.department}</div>
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{r.presentStudents}</td>
                        <td className="p-3.5 text-center font-bold text-rose-600 dark:text-rose-400">{r.absentStudents || 0}</td>
                        <td className="p-3.5 text-center font-bold text-purple-600 dark:text-purple-400">{r.odStudents || 0}</td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900 dark:text-white">
                          {r.attendancePercentage}%
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {r.markedBy || 'Staff'}
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isHodOrAdmin && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this attendance record?')) {
                                  deleteAttendanceRecord(r.id);
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Record (HOD Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD ATTENDANCE BY DATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Add Student Attendance by Date
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAttendance} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attendance Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department {isMentor ? '' : '*'}
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  disabled={isMentor}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {isMentor && mentorClasses.length > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    🔒 Locked to your assigned class department
                  </p>
                )}
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Class *
                </label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isMentor && mentorClasses.length === 1}
                >
                  {modalClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.year} {c.department} - Sec {c.section} (Room: {c.roomNumber})
                    </option>
                  ))}
                </select>
                {isMentor && mentorClasses.length > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    🔒 Showing only your assigned mentor class(es)
                  </p>
                )}
              </div>

              {/* Attendance Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Present Count *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPresent}
                    onChange={(e) => setNewPresent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/60 rounded-lg text-sm font-black text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                    Absent Count *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newAbsent}
                    onChange={(e) => setNewAbsent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700/60 rounded-lg text-sm font-black text-rose-600 dark:text-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                    On Duty (OD) Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newOd}
                    onChange={(e) => setNewOd(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700/60 rounded-lg text-sm font-black text-purple-600 dark:text-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                    Others / Leave Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newOthers}
                    onChange={(e) => setNewOthers(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-lg text-sm font-black text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Morning Mentor Hour Attendance */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-indigo-50/60 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700/70">
                <div className="col-span-2">
                  <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Morning Mentor Hour Attendance
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-600 mb-1">Present</label>
                  <input type="number" min={0} value={newMorPresent} onChange={(e) => setNewMorPresent(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-center text-emerald-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-600 mb-1">Absent</label>
                  <input type="number" min={0} value={newMorAbsent} onChange={(e) => setNewMorAbsent(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-center text-rose-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-600 mb-1">OD</label>
                  <input type="number" min={0} value={newMorOd} onChange={(e) => setNewMorOd(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-center text-purple-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-600 mb-1">Others</label>
                  <input type="number" min={0} value={newMorOthers} onChange={(e) => setNewMorOthers(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-center text-amber-600" />
                </div>
              </div>

              {/* Evening Mentor Hour Attendance */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-orange-50/70 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700/70">
                <div className="col-span-2">
                  <span className="text-[11px] font-black text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                    Evening Mentor Hour Attendance
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-600 mb-1">Present</label>
                  <input type="number" min={0} value={newEvePresent} onChange={(e) => setNewEvePresent(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-center text-emerald-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-600 mb-1">Absent</label>
                  <input type="number" min={0} value={newEveAbsent} onChange={(e) => setNewEveAbsent(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-center text-rose-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-600 mb-1">OD</label>
                  <input type="number" min={0} value={newEveOd} onChange={(e) => setNewEveOd(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-center text-purple-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-600 mb-1">Others</label>
                  <input type="number" min={0} value={newEveOthers} onChange={(e) => setNewEveOthers(Number(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-center text-amber-600" />
                </div>
              </div>

              {/* Calculated Rate Summary */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between border border-blue-200 dark:border-blue-800">
                <span>Calculated Total: {newPresent + newAbsent + newOd + newOthers}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Attendance Rate:{' '}
                  {newPresent + newAbsent + newOd + newOthers > 0
                    ? ((newPresent / (newPresent + newAbsent + newOd + newOthers)) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Leave Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2 students on symposium OD, 1 sports leave"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Attendance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDANCE MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Record: {editingRecord.className} ({editingRecord.date})
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Present
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPresent}
                    onChange={(e) => setEditPresent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                    Absent
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAbsent}
                    onChange={(e) => setEditAbsent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                    On Duty (OD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editOd}
                    onChange={(e) => setEditOd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    Others / Leave
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editOthers}
                    onChange={(e) => setEditOthers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
