import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getScopedStaff } from '../utils/departmentUtils';
import {
  X,
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Save,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

interface FacultyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacultyAttendanceModal: React.FC<FacultyAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dailyReport, updateDailyReport, staffList, currentUser, filterState, addHodAttendanceRecord } = useApp();

  const selectedDept = filterState.department;
  const hodDepartment = (selectedDept && selectedDept !== 'all' && selectedDept !== 'All Departments')
    ? selectedDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : (dailyReport.department || 'Artificial Intelligence & Data Science (AI & DS)'));

  const scopedStaff = getScopedStaff(staffList, currentUser, hodDepartment);
  const defaultTotalCount = scopedStaff.length || 10;

  const initialCount = dailyReport.facultyAttendanceCount || {
    present: 0,
    absent: 0,
    od: 0,
    permission: 0,
    total: defaultTotalCount,
    absentNames: 'None',
    remarks: '',
  };

  const [present, setPresent] = useState<number>(initialCount.present || 0);
  const [absent, setAbsent] = useState<number>(initialCount.absent || 0);
  const [od, setOd] = useState<number>(initialCount.od || 0);
  const [permission, setPermission] = useState<number>(initialCount.permission || 0);
  const [total, setTotal] = useState<number>(initialCount.total || defaultTotalCount);
  const [absentNames, setAbsentNames] = useState<string>(initialCount.absentNames || 'None');
  const [remarks, setRemarks] = useState<string>(initialCount.remarks || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const current = dailyReport.facultyAttendanceCount || {};
      const currentTotal = current.total && current.total > 0 ? current.total : (scopedStaff.length || 10);
      setPresent(current.present ?? Math.max(0, currentTotal - (current.absent || 0)));
      setAbsent(current.absent ?? 0);
      setOd(current.od ?? 0);
      setPermission(current.permission ?? 0);
      setTotal(currentTotal);
      setAbsentNames(current.absentNames || 'None');
      setRemarks(current.remarks || '');
      setSaveSuccess(false);
    }
  }, [isOpen, dailyReport.facultyAttendanceCount, scopedStaff.length]);

  if (!isOpen) return null;

  // Auto-calculated sum of counts
  const sumCounts = present + absent + od + permission;

  // Effective present = Present + OD
  const effectivePresent = present + od;
  const computedTotal = total > 0 ? total : Math.max(1, sumCounts);
  
  // Faculty Attendance Percentage calculation
  const attendancePct = computedTotal > 0
    ? Number(((effectivePresent / computedTotal) * 100).toFixed(1))
    : 100;

  const handleAutoFillFromStaffList = () => {
    const totalStaffCount = scopedStaff.length;
    setTotal(totalStaffCount);
    setPresent(totalStaffCount);
    setAbsent(0);
    setOd(0);
    setPermission(0);
    setAbsentNames('None');
  };

  const handleSetAllPresent = () => {
    setPresent(total);
    setAbsent(0);
    setOd(0);
    setPermission(0);
    setAbsentNames('None');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const attendanceCount = {
      present: Number(present) || 0,
      absent: Number(absent) || 0,
      od: Number(od) || 0,
      permission: Number(permission) || 0,
      total: Number(total) || 0,
      absentNames: absentNames.trim() || 'None',
      remarks: remarks.trim() || '',
    };

    updateDailyReport({ facultyAttendanceCount: attendanceCount });

    addHodAttendanceRecord({
      department: hodDepartment,
      collegeName: dailyReport?.collegeName || currentUser?.institution || 'Sasurie College of Engineering',
      hodName: currentUser?.name || 'Unknown HOD',
      date: new Date().toISOString().split('T')[0],
      facultyAttendanceCount: attendanceCount,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Faculty Attendance Entry</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  HOD Entry
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Department: <strong className="text-white">{hodDepartment}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick Actions:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillFromStaffList}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" /> Reset from Staff List ({scopedStaff.length})
              </button>
              <button
                type="button"
                onClick={handleSetAllPresent}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> All Present
              </button>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Present Count */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
              <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Present</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </label>
              <input
                type="number"
                min="0"
                value={present}
                onChange={(e) => setPresent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-lg font-black text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 text-center"
                required
              />
            </div>

            {/* Absent Count */}
            <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/80">
              <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Absent</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              </label>
              <input
                type="number"
                min="0"
                value={absent}
                onChange={(e) => setAbsent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg text-lg font-black text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 text-center"
                required
              />
            </div>

            {/* OD (On Duty) Count */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80">
              <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>On Duty (OD)</span>
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              </label>
              <input
                type="number"
                min="0"
                value={od}
                onChange={(e) => setOd(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-lg font-black text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 text-center"
                required
              />
            </div>

            {/* Permission Count */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Permission</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </label>
              <input
                type="number"
                min="0"
                value={permission}
                onChange={(e) => setPermission(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-lg font-black text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 text-center"
                required
              />
            </div>
          </div>

          {/* Total Staff Count Override / Verification */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Department Faculty Count:
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sum of Entered Counts: <strong className="text-slate-900 dark:text-white">{sumCounts}</strong> (Present + Absent + OD + Permission)
              </p>
            </div>
            <input
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-base font-extrabold text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Computed Percentage Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 text-white rounded-xl shadow-sm border border-emerald-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-300" />
                Calculated Dashboard Attendance Percentage
              </span>
              <div className="text-xs text-emerald-100">
                Effective Present: <strong>{effectivePresent}</strong> / {computedTotal} (Present {present} + OD {od})
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-300">{attendancePct}%</div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase">
                {attendancePct >= 90 ? 'Optimal' : attendancePct >= 75 ? 'Satisfactory' : 'Needs Review'}
              </span>
            </div>
          </div>

          {/* Absent / Leave / OD Staff Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Absent / On Leave / OD Faculty Names & Details:
            </label>
            <input
              type="text"
              value={absentNames}
              onChange={(e) => setAbsentNames(e.target.value)}
              placeholder="e.g. Prof. Sarah Jenkins (CL), Dr. M. Kaviyarasu (OD - Conference)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Additional Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              HOD Attendance Remarks (Optional):
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any additional details or notes regarding staff attendance today..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saveSuccess ? 'Saved Successfully!' : 'Save Attendance Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
