import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAttendanceSummary } from '../types';
import { isSameDept, getDepartmentAttendanceSummaries, getDeptTag } from '../utils/departmentUtils';
import {
  X,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dailyReport, updateDailyReport, classList, currentUser, attendanceRecords, clearAllAttendance, deleteAttendanceRecord, addAttendanceRecord } = useApp();

  const userDept = currentUser?.department;
  const isFacultyOrHod = currentUser?.role === 'staff' || currentUser?.role === 'admin';

  const scopedClassList = React.useMemo(() => {
    if (isFacultyOrHod && userDept) {
      return classList.filter((c) => isSameDept(c.department, userDept));
    }
    return classList;
  }, [classList, isFacultyOrHod, userDept]);

  const isHodOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'hod' ||
    currentUser?.designation?.toLowerCase().includes('hod') ||
    currentUser?.designation?.toLowerCase().includes('head of department');

  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [customClassName, setCustomClassName] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('II Year');
  const [newTotal, setNewTotal] = useState<number>(0);
  const [newMorPresent, setNewMorPresent] = useState<number>(0);
  const [newEvePresent, setNewEvePresent] = useState<number>(0);
  const [newAbsent, setNewAbsent] = useState<number>(0);
  const [newOd, setNewOd] = useState<number>(0);
  const [newOthers, setNewOthers] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const activeDept = userDept || 'Artificial Intelligence & Data Science (AI & DS)';
      const summariesForDept = getDepartmentAttendanceSummaries(
        dailyReport.studentAttendanceSummaries || [],
        classList,
        activeDept,
        attendanceRecords
      );
      setSummaries(summariesForDept);
    }
  }, [isOpen, dailyReport.studentAttendanceSummaries, classList, userDept, attendanceRecords]);

  if (!isOpen) return null;

  const handleFieldChange = (
    index: number,
    field: keyof StudentAttendanceSummary,
    value: string | number
  ) => {
    setSummaries((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      const numVal = Math.max(0, Number(value) || 0);

      if (field === 'totalStudents') {
        item.totalStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'presentStudents' || field === 'eveningPresent') {
        item.eveningPresent = numVal;
        item.presentStudents = numVal;
      } else if (field === 'morningPresent') {
        item.morningPresent = numVal;
      } else if (field === 'absentStudents' || field === 'eveningAbsent') {
        item.eveningAbsent = numVal;
        item.absentStudents = numVal;
      } else if (field === 'morningAbsent') {
        item.morningAbsent = numVal;
      } else if (field === 'odStudents' || field === 'eveningOd') {
        item.eveningOd = numVal;
        item.odStudents = numVal;
      } else if (field === 'morningOd') {
        item.morningOd = numVal;
      } else if (field === 'othersStudents') {
        item.othersStudents = numVal;
      } else if (field === 'className') {
        item.className = String(value);
      } else if (field === 'year') {
        item.year = String(value);
      }

      // Auto compute morning & evening percentage & variation if total > 0
      // Recalculate morning percentage
      const morningTotal = (item.morningPresent || 0) + (item.morningAbsent || 0) + (item.morningOd || 0) + (item.morningOthers || 0);
      item.morningPercentage = morningTotal > 0 ? Number(((item.morningPresent || 0) / morningTotal) * 100).toFixed(1) : 0;

      // Recalculate evening percentage
      const eveningTotal = (item.eveningPresent || 0) + (item.eveningAbsent || 0) + (item.eveningOd || 0) + (item.eveningOthers || 0);
      item.eveningPercentage = eveningTotal > 0 ? Number(((item.eveningPresent || 0) / eveningTotal) * 100).toFixed(1) : 0;

      const total = item.totalStudents || 1;
      const mPres = item.morningPresent ?? item.presentStudents ?? 0;
      const ePres = item.eveningPresent ?? item.presentStudents ?? 0;
      const mOd = item.morningOd ?? item.odStudents ?? 0;
      const eOd = item.eveningOd ?? item.odStudents ?? 0;

      item.morningPercentage = Number((((mPres + mOd) / total) * 100).toFixed(1));
      item.eveningPercentage = Number((((ePres + eOd) / total) * 100).toFixed(1));
      item.attendancePercentage = item.eveningPercentage; // Default overall to evening
      item.variation = mPres - ePres;

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    const itemToRemove = summaries[index];
    if (itemToRemove && itemToRemove.classId) {
      deleteAttendanceRecord(itemToRemove.classId);
    }
    setSummaries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddClassSection = () => {
    let nameToAdd = '';
    let yearToAdd = selectedYear;
    let idToAdd = `CLS-MANUAL-${Date.now()}`;

    const activeDept = userDept || 'Artificial Intelligence & Data Science (AI & DS)';
    const deptTag = getDeptTag(activeDept);

    if (customClassName.trim()) {
      nameToAdd = customClassName.trim();
    } else {
      nameToAdd = `${selectedYear} ${deptTag} - Sec A`;
    }

    const total = Math.max(1, newTotal);
    const mPres = Math.max(0, newMorPresent);
    const ePres = Math.max(0, newEvePresent);
    const absent = Math.max(0, newAbsent);
    const od = Math.max(0, newOd);
    const others = Math.max(0, newOthers);
    const mPct = Number((((mPres + od) / total) * 100).toFixed(1));
    const ePct = Number((((ePres + od) / total) * 100).toFixed(1));

    const newSummary: StudentAttendanceSummary = {
      classId: idToAdd,
      className: nameToAdd,
      year: yearToAdd,
      department: activeDept,
      totalStudents: total,
      presentStudents: ePres,
      absentStudents: absent,
      odStudents: od,
      othersStudents: others,
      attendancePercentage: ePct,
      morningPresent: mPres,
      morningAbsent: absent,
      morningOd: od,
      morningOthers: others,
      morningPercentage: mPct,
      eveningPresent: ePres,
      eveningAbsent: absent,
      eveningOd: od,
      eveningOthers: others,
      eveningPercentage: ePct,
      variation: mPres - ePres,
    };

    setSummaries((prev) => [...prev, newSummary]);
    setCustomClassName('');
    setSelectedClassId('');
    setNewTotal(60);
    setNewMorPresent(0);
    setNewEvePresent(0);
    setNewAbsent(0);
    setNewOd(0);
  };

  const handleSaveAll = () => {
    const activeDept = userDept || 'Artificial Intelligence & Data Science (AI & DS)';
    const todayStr = new Date().toISOString().split('T')[0];
    const mentorName = currentUser?.name || '';
    const mentorStaffId = currentUser?.staffId || currentUser?.username || '';
    const now = new Date().toISOString();

    const updatedSummariesWithDept = summaries.map((s) => ({
      ...s,
      department: s.department || activeDept,
      enteredByName: mentorName,
      enteredById: mentorStaffId,
      enteredAt: now,
      date: todayStr,
    }));

    // Identify which classIds were removed from activeDept summaries and purge from DB
    const initialDeptSummaries = (dailyReport.studentAttendanceSummaries || []).filter((s) => {
      if (s.department) return isSameDept(s.department, activeDept);
      const classObj = classList.find((c) => c.id === s.classId);
      if (classObj) return isSameDept(classObj.department, activeDept);
      return isSameDept(s.className, activeDept);
    });

    const keptClassIds = new Set(updatedSummariesWithDept.map((s) => s.classId));
    initialDeptSummaries.forEach((oldSum) => {
      if (oldSum.classId && !keptClassIds.has(oldSum.classId)) {
        deleteAttendanceRecord(oldSum.classId);
      }
    });

    // Keep summaries belonging to OTHER departments intact
    const existingOtherDeptSummaries = (dailyReport.studentAttendanceSummaries || []).filter((s) => {
      if (s.department) return !isSameDept(s.department, activeDept);
      const classObj = classList.find((c) => c.id === s.classId);
      if (classObj) return !isSameDept(classObj.department, activeDept);
      return !isSameDept(s.className, activeDept);
    });

    const mergedSummaries = [...existingOtherDeptSummaries, ...updatedSummariesWithDept];

    // Persist each summary as a StudentAttendanceRecord so it shows up
    // in "Student Attendance Management & Reports" and survives dailyReport sync
    updatedSummariesWithDept.forEach((s) => {
      addAttendanceRecord({
        date: todayStr,
        department: s.department || activeDept,
        classId: s.classId,
        className: s.className,
        year: s.year,
        section: s.section,
        totalStudents: s.totalStudents,
        presentStudents: s.presentStudents,
        absentStudents: s.absentStudents,
        odStudents: s.odStudents,
        othersStudents: s.othersStudents,
        attendancePercentage: s.attendancePercentage,
        morningPresent: s.morningPresent,
        morningAbsent: s.morningAbsent,
        morningOd: s.morningOd,
        morningOthers: s.morningOthers,
        morningPercentage: s.morningPercentage,
        eveningPresent: s.eveningPresent,
        eveningAbsent: s.eveningAbsent,
        eveningOd: s.eveningOd,
        eveningOthers: s.eveningOthers,
        eveningPercentage: s.eveningPercentage,
        variation: s.variation,
        variationNote: s.variationNote,
        markedBy: mentorName,
        markedById: mentorStaffId,
        markedAt: now,
        remarks: '',
      });
    });

    updateDailyReport({
      studentAttendanceSummaries: mergedSummaries,
    });
    onClose();
  };

  const handleClearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all student attendance data for today? This cannot be undone.")) {
      const activeDept = userDept || 'Artificial Intelligence & Data Science (AI & DS)';
      const currentDeptSummaries = (dailyReport.studentAttendanceSummaries || []).filter((s) => {
        if (s.department) return isSameDept(s.department, activeDept);
        const classObj = classList.find((c) => c.id === s.classId);
        if (classObj) return isSameDept(classObj.department, activeDept);
        return isSameDept(s.className, activeDept);
      });

      currentDeptSummaries.forEach((s) => {
        if (s.classId) deleteAttendanceRecord(s.classId);
      });

      setSummaries([]);
      const existingOtherDeptSummaries = (dailyReport.studentAttendanceSummaries || []).filter((s) => {
        if (s.department) return !isSameDept(s.department, activeDept);
        const classObj = classList.find((c) => c.id === s.classId);
        if (classObj) return !isSameDept(classObj.department, activeDept);
        return !isSameDept(s.className, activeDept);
      });
      updateDailyReport({ studentAttendanceSummaries: existingOtherDeptSummaries });
      await clearAllAttendance();
    }
  };



  // Overall calculations
  const grandTotal = summaries.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const grandPresent = summaries.reduce((acc, curr) => acc + curr.presentStudents, 0);
  const grandAbsent = summaries.reduce((acc, curr) => acc + (curr.absentStudents ?? Math.max(0, curr.totalStudents - curr.presentStudents)), 0);
  const grandOd = summaries.reduce((acc, curr) => acc + (curr.odStudents || 0), 0);
  const grandOthers = summaries.reduce((acc, curr) => acc + (curr.othersStudents || 0), 0);
  const overallPercentage = grandTotal > 0 ? Number((((grandPresent + grandOd) / grandTotal) * 100).toFixed(1)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Attendance Entry (II, III, IV Year)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter daily attendance data for HOD Daily Report: Total Strength, Present, Absent, OD, and Others
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for Mentors & HODs */}
        <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] uppercase tracking-wider">
              {isHodOrAdmin ? 'HOD / Admin Mode' : 'Mentor / Staff Mode'}
            </span>
            <span>
              {isHodOrAdmin
                ? 'You can set fixed Class Sections and Total Strength. Mentors enter Morning & Evening attendance.'
                : 'Class Section and Total Strength are fixed by HOD. Enter Morning & Evening mentor hour attendance below.'}
            </span>
          </div>
          {!isHodOrAdmin && (
            <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              🔒 Total Strength Fixed
            </span>
          )}
        </div>

        {/* Summary Stats Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Total Strength</div>
            <div className="text-base font-black text-slate-900 dark:text-white">{grandTotal}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Morning Pres</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {summaries.reduce((a, b) => a + (b.morningPresent ?? b.presentStudents ?? 0), 0)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Evening Pres</div>
            <div className="text-base font-black text-blue-600 dark:text-blue-400">
              {summaries.reduce((a, b) => a + (b.eveningPresent ?? b.presentStudents ?? 0), 0)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">OD (On Duty)</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400">{grandOd}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Variation</div>
            <div className="text-base font-black text-purple-600 dark:text-purple-400">
              {summaries.reduce((a, b) => a + Math.abs((b.morningPresent ?? b.presentStudents ?? 0) - (b.eveningPresent ?? b.presentStudents ?? 0)), 0)} Student(s)
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Overall %</div>
            <div className="text-base font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
              {overallPercentage}%
            </div>
          </div>
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Year / Class Section</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">
                  Total Strength <span className="text-[10px] font-normal text-slate-500 block">(Fixed)</span>
                </th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                  Morning Session <span className="text-[10px] font-normal text-emerald-600 block">(Pres / Abs / OD)</span>
                </th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                  Evening Session <span className="text-[10px] font-normal text-blue-600 block">(Pres / Abs / OD)</span>
                </th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-amber-700">
                  Variation <span className="text-[10px] font-normal text-amber-600 block">(Mor vs Eve)</span>
                </th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">Overall %</th>
                {isHodOrAdmin && <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No attendance summaries entered yet.
                  </td>
                </tr>
              ) : (
                summaries.map((s, idx) => {
                  const mPres = s.morningPresent ?? s.presentStudents ?? 0;
                  const ePres = s.eveningPresent ?? s.presentStudents ?? 0;
                  const mAbs = s.morningAbsent ?? Math.max(0, s.totalStudents - mPres);
                  const eAbs = s.eveningAbsent ?? Math.max(0, s.totalStudents - ePres);
                  const mOd = s.morningOd ?? s.odStudents ?? 0;
                  const eOd = s.eveningOd ?? s.odStudents ?? 0;

                  const varVal = mPres - ePres;
                  const hasVar = varVal !== 0;

                  return (
                    <tr key={s.classId + idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="p-2">
                        {isHodOrAdmin ? (
                          <input
                            type="text"
                            value={s.className}
                            onChange={(e) => handleFieldChange(idx, 'className', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white focus:outline-none text-xs"
                          />
                        ) : (
                          <div className="font-bold text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                            {s.className}
                          </div>
                        )}
                      </td>

                      <td className="p-2 text-center">
                        {isHodOrAdmin ? (
                          <input
                            type="number"
                            min={1}
                            value={s.totalStudents}
                            onChange={(e) => handleFieldChange(idx, 'totalStudents', e.target.value)}
                            className="w-16 px-1.5 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white text-xs"
                          />
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded text-xs border border-slate-200 dark:border-slate-700">
                            {s.totalStudents}
                          </span>
                        )}
                      </td>

                      {/* Morning Session */}
                      <td className="p-2 bg-emerald-50/30 dark:bg-emerald-950/10">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">Pres</span>
                            <input
                              type="number"
                              min={0}
                              value={mPres}
                              onChange={(e) => handleFieldChange(idx, 'morningPresent', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded font-bold text-emerald-800 dark:text-emerald-300 text-xs"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">Abs</span>
                            <input
                              type="number"
                              min={0}
                              value={mAbs}
                              onChange={(e) => handleFieldChange(idx, 'morningAbsent', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded font-bold text-rose-700 dark:text-rose-300 text-xs"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">OD</span>
                            <input
                              type="number"
                              min={0}
                              value={mOd}
                              onChange={(e) => handleFieldChange(idx, 'morningOd', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded font-bold text-amber-700 dark:text-amber-300 text-xs"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Evening Session */}
                      <td className="p-2 bg-blue-50/30 dark:bg-blue-950/10">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-blue-700 dark:text-blue-400 font-bold">Pres</span>
                            <input
                              type="number"
                              min={0}
                              value={ePres}
                              onChange={(e) => handleFieldChange(idx, 'eveningPresent', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 rounded font-bold text-blue-800 dark:text-blue-300 text-xs"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">Abs</span>
                            <input
                              type="number"
                              min={0}
                              value={eAbs}
                              onChange={(e) => handleFieldChange(idx, 'eveningAbsent', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded font-bold text-rose-700 dark:text-rose-300 text-xs"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">OD</span>
                            <input
                              type="number"
                              min={0}
                              value={eOd}
                              onChange={(e) => handleFieldChange(idx, 'eveningOd', e.target.value)}
                              className="w-12 px-1 py-1 text-center bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded font-bold text-amber-700 dark:text-amber-300 text-xs"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Variation Column */}
                      <td className="p-2 text-center">
                        {hasVar ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black ${
                            varVal > 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          }`}>
                            {varVal > 0 ? `+${varVal} (Mor > Eve)` : `${varVal} (Eve > Mor)`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            0 (No Var)
                          </span>
                        )}
                      </td>

                      {/* Overall Percentage */}
                      <td className="p-2 text-center font-bold text-slate-900 dark:text-white">
                        {s.eveningPercentage || s.attendancePercentage}%
                      </td>

                      {isHodOrAdmin && (
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Remove Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Class Section Form (HOD Only) */}
        {isHodOrAdmin && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Add Year Attendance Entry (II, III, IV Year - HOD Action)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-8 gap-2 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                  <option value="I Year">I Year</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Class / Section Name
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${selectedYear} ${getDeptTag(userDept || '')} - Sec A`}
                  value={customClassName}
                  onChange={(e) => setCustomClassName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Total
                </label>
                <input
                  type="number"
                  min={1}
                  value={newTotal}
                  onChange={(e) => setNewTotal(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-600 mb-1">
                  Mor Pres
                </label>
                <input
                  type="number"
                  min={0}
                  value={newMorPresent}
                  onChange={(e) => setNewMorPresent(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 mb-1">
                  Eve Pres
                </label>
                <input
                  type="number"
                  min={0}
                  value={newEvePresent}
                  onChange={(e) => setNewEvePresent(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rose-600 mb-1">
                  Absent
                </label>
                <input
                  type="number"
                  min={0}
                  value={newAbsent}
                  onChange={(e) => setNewAbsent(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-rose-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-600 mb-1">
                  OD
                </label>
                <input
                  type="number"
                  min={0}
                  value={newOd}
                  onChange={(e) => setNewOd(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-amber-600"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddClassSection}
                  className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {isHodOrAdmin && (
              <button
                type="button"
                onClick={handleClearAllData}
                className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl transition-colors flex items-center gap-1"
                title="Remove all rows for a fresh start"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Entries
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Attendance Summary
          </button>
        </div>
      </div>
    </div>
  );
};

