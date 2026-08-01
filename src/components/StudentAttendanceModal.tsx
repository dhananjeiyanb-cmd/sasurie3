import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAttendanceSummary } from '../types';
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
  const { dailyReport, updateDailyReport, classList } = useApp();

  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [customClassName, setCustomClassName] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('II Year');
  const [newTotal, setNewTotal] = useState<number>(60);
  const [newPresent, setNewPresent] = useState<number>(54);
  const [newAbsent, setNewAbsent] = useState<number>(3);
  const [newOd, setNewOd] = useState<number>(2);
  const [newOthers, setNewOthers] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      if (dailyReport.studentAttendanceSummaries && dailyReport.studentAttendanceSummaries.length > 0) {
        setSummaries(dailyReport.studentAttendanceSummaries);
      } else if (classList.length > 0) {
        // Auto-initialize II Year, III Year, IV Year
        const initial = classList.map((c) => {
          const total = 65;
          const present = 58;
          const absent = 4;
          const od = 2;
          const others = 1;
          const pct = Number((((present + od) / total) * 100).toFixed(1));

          return {
            classId: c.id,
            className: `${c.year} ${c.department.split(' ')[0]} - ${c.section}`,
            year: c.year,
            totalStudents: total,
            presentStudents: present,
            absentStudents: absent,
            odStudents: od,
            othersStudents: others,
            attendancePercentage: pct,
          };
        });
        setSummaries(initial);
      } else {
        // Fallback default for II Year, III Year, IV Year
        setSummaries([
          {
            classId: 'CLS-2ND-YR',
            className: 'II Year AI & DS - Sec A',
            year: 'II Year',
            totalStudents: 70,
            presentStudents: 62,
            absentStudents: 4,
            odStudents: 3,
            othersStudents: 1,
            attendancePercentage: 92.9,
          },
          {
            classId: 'CLS-3RD-YR',
            className: 'III Year AI & DS - Sec A',
            year: 'III Year',
            totalStudents: 65,
            presentStudents: 58,
            absentStudents: 3,
            odStudents: 3,
            othersStudents: 1,
            attendancePercentage: 93.8,
          },
          {
            classId: 'CLS-4TH-YR',
            className: 'IV Year AI & DS - Sec A',
            year: 'IV Year',
            totalStudents: 68,
            presentStudents: 63,
            absentStudents: 2,
            odStudents: 2,
            othersStudents: 1,
            attendancePercentage: 95.6,
          },
        ]);
      }
    }
  }, [isOpen, dailyReport.studentAttendanceSummaries, classList]);

  if (!isOpen) return null;

  const handleFieldChange = (
    index: number,
    field: keyof StudentAttendanceSummary,
    value: string | number
  ) => {
    setSummaries((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'totalStudents') {
        item.totalStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'presentStudents') {
        item.presentStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'absentStudents') {
        item.absentStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'odStudents') {
        item.odStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'othersStudents') {
        item.othersStudents = Math.max(0, Number(value) || 0);
      } else if (field === 'attendancePercentage') {
        item.attendancePercentage = Math.min(100, Math.max(0, Number(value) || 0));
      } else if (field === 'className') {
        item.className = String(value);
      } else if (field === 'year') {
        item.year = String(value);
      }

      // Auto compute percentage if total > 0
      if (field !== 'attendancePercentage' && item.totalStudents > 0) {
        const p = item.presentStudents || 0;
        const od = item.odStudents || 0;
        item.attendancePercentage = Number((((p + od) / item.totalStudents) * 100).toFixed(1));
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setSummaries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddClassSection = () => {
    let nameToAdd = '';
    let yearToAdd = selectedYear;
    let idToAdd = `CLS-MANUAL-${Date.now()}`;

    if (selectedClassId) {
      const foundCls = classList.find((c) => c.id === selectedClassId);
      if (foundCls) {
        nameToAdd = `${foundCls.year} ${foundCls.department.split(' ')[0]} - ${foundCls.section}`;
        yearToAdd = foundCls.year;
        idToAdd = foundCls.id;
      }
    }

    if (customClassName.trim()) {
      nameToAdd = customClassName.trim();
    }

    if (!nameToAdd) {
      nameToAdd = `${selectedYear} Section ${summaries.length + 1}`;
    }

    const total = Math.max(1, newTotal);
    const present = Math.max(0, newPresent);
    const absent = Math.max(0, newAbsent);
    const od = Math.max(0, newOd);
    const others = Math.max(0, newOthers);
    const pct = Number((((present + od) / total) * 100).toFixed(1));

    const newSummary: StudentAttendanceSummary = {
      classId: idToAdd,
      className: nameToAdd,
      year: yearToAdd,
      totalStudents: total,
      presentStudents: present,
      absentStudents: absent,
      odStudents: od,
      othersStudents: others,
      attendancePercentage: pct,
    };

    setSummaries((prev) => [...prev, newSummary]);
    setCustomClassName('');
    setSelectedClassId('');
  };

  const handleSaveAll = () => {
    updateDailyReport({
      studentAttendanceSummaries: summaries,
    });
    onClose();
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

        {/* Summary Stats Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Total Strength</div>
            <div className="text-base font-black text-slate-900 dark:text-white">{grandTotal}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Present</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{grandPresent}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Absent</div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400">{grandAbsent}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">OD (On Duty)</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400">{grandOd}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Others / Leave</div>
            <div className="text-base font-black text-purple-600 dark:text-purple-400">{grandOthers}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Overall %</div>
            <div className="text-base font-black text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
              {overallPercentage}%
            </div>
          </div>
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Year / Section</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">Total Strength</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-emerald-700">Present</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-rose-600">Absent</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-amber-600">OD</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center text-purple-600">Others</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">Attendance %</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No attendance summaries entered yet. Add class sections below.
                  </td>
                </tr>
              ) : (
                summaries.map((s, idx) => {
                  const absent = s.absentStudents ?? Math.max(0, s.totalStudents - s.presentStudents);
                  const od = s.odStudents ?? 0;
                  const others = s.othersStudents ?? 0;

                  return (
                    <tr key={s.classId + idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.className}
                          onChange={(e) => handleFieldChange(idx, 'className', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={s.totalStudents}
                          onChange={(e) => handleFieldChange(idx, 'totalStudents', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={s.presentStudents}
                          onChange={(e) => handleFieldChange(idx, 'presentStudents', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={absent}
                          onChange={(e) => handleFieldChange(idx, 'absentStudents', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded font-bold text-rose-700 dark:text-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={od}
                          onChange={(e) => handleFieldChange(idx, 'odStudents', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded font-bold text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={others}
                          onChange={(e) => handleFieldChange(idx, 'othersStudents', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded font-bold text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={100}
                            value={s.attendancePercentage}
                            onChange={(e) => handleFieldChange(idx, 'attendancePercentage', e.target.value)}
                            className="w-16 px-1 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                      </td>

                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Class Section Form */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            Add Year Attendance Entry (II, III, IV Year)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-end">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Class / Year Name
              </label>
              <input
                type="text"
                placeholder="e.g. II Year AI & DS - Sec A"
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
                Present
              </label>
              <input
                type="number"
                min={0}
                value={newPresent}
                onChange={(e) => setNewPresent(Number(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-emerald-600"
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

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>

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

