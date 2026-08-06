import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportElementToPDF, exportToExcel, triggerPrint } from '../utils/exportUtils';
import { getDeptHodName, getScopedStaff, isSameDept } from '../utils/departmentUtils';
import { TaskStatusBadge, PriorityBadge, ObservationBadge } from '../components/StatusBadge';
import { FacultyAttendanceModal } from '../components/FacultyAttendanceModal';
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  User,
  CheckSquare,
  Clock,
  CheckCircle2,
  Eye,
  BarChart3,
  Calendar,
  Filter,
  Building2,
  GraduationCap,
  Edit3,
  UserCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { staffList, classList, taskList: rawTaskList, observationList, dailyReport, currentUser, filterState } = useApp();

  const isStaff = currentUser?.role === 'staff';
  const selectedDept = filterState.department;
  const hodDepartment = (selectedDept && selectedDept !== 'all' && selectedDept !== 'All Departments')
    ? selectedDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : (dailyReport.department || 'Artificial Intelligence & Data Science (AI & DS)'));

  const activeHodName = getDeptHodName(staffList, hodDepartment, currentUser, dailyReport.hodName);
  const scopedStaff = getScopedStaff(staffList, currentUser, hodDepartment);


  // Filter taskList for staff role
  const taskList = isStaff
    ? rawTaskList.filter(
        (t) =>
          t.assignedToStaffId === currentUser?.staffId ||
          t.assignedToName?.toLowerCase().includes(currentUser?.name?.toLowerCase() || '')
      )
    : rawTaskList;

  const [selectedReportType, setSelectedReportType] = useState<
    | 'daily_hod'
    | 'staff_individual'
    | 'task_assignment'
    | 'pending_tasks'
    | 'completed_tasks'
    | 'observations'
    | 'performance'
    | 'monthly_summary'
    | 'custom_filter'
  >(isStaff ? 'staff_individual' : 'daily_hod');

  // Custom filter states
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isFacultyAttendanceModalOpen, setIsFacultyAttendanceModalOpen] = useState<boolean>(false);
  
  const isHod = currentUser?.role === 'admin';

  const availableStaffList = (isHod || isStaff)
    ? staffList.filter((s) => isSameDept(s.department, currentUser?.department))
    : staffList;

  const currentStaffObj = staffList.find(
    (s) => s.id === currentUser?.staffId || s.facultyName.toLowerCase().includes(currentUser?.name.toLowerCase() || '')
  );

  const [selectedIndividualStaffId, setSelectedIndividualStaffId] = useState<string>(
    isStaff && currentStaffObj ? currentStaffObj.id : availableStaffList[0]?.id || 'STF001'
  );

  const reportMenu = isStaff
    ? [
        { id: 'staff_individual', label: '1. My Individual Staff Report', icon: User },
        { id: 'task_assignment', label: '2. My Task Assignment Sheet', icon: CheckSquare },
        { id: 'pending_tasks', label: '3. My Pending Tasks', icon: Clock },
        { id: 'completed_tasks', label: '4. My Completed Tasks', icon: CheckCircle2 },
        { id: 'performance', label: '5. My Performance Summary', icon: BarChart3 },
      ] as const
    : ([
        { id: 'daily_hod', label: '1. Daily HOD Report Card', icon: FileText },
        { id: 'staff_individual', label: '2. Individual Staff Report', icon: User },
        { id: 'task_assignment', label: '3. Task Assignment Sheet', icon: CheckSquare },
        { id: 'pending_tasks', label: '4. Pending Task Report', icon: Clock },
        { id: 'completed_tasks', label: '5. Completed Task Report', icon: CheckCircle2 },
        { id: 'observations', label: '6. Class Observation Report', icon: Eye },
        { id: 'performance', label: '7. Faculty Performance Report', icon: BarChart3 },
        { id: 'monthly_summary', label: '8. Monthly Department Summary', icon: Calendar },
        { id: 'custom_filter', label: '9. Custom Filtered Report', icon: Filter },
      ] as const);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleExcelExport = () => {
    let exportData: any[] = [];
    let filename = `Report_${selectedReportType}_${todayStr}`;

    if (selectedReportType === 'task_assignment') {
      exportData = taskList.map((t) => ({
        'Task ID': t.id,
        'Task Name': t.title,
        'Assigned Staff': t.assignedToName,
        Class: t.className || 'N/A',
        Priority: t.priority,
        'Assigned Date': t.assignedDate,
        'Due Date': t.targetDate,
        Status: t.status,
        Remarks: t.remarks || '',
      }));
    } else if (selectedReportType === 'pending_tasks') {
      exportData = taskList
        .filter((t) => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue')
        .map((t) => ({
          'Task ID': t.id,
          'Task Title': t.title,
          'Assigned Staff': t.assignedToName,
          Priority: t.priority,
          'Due Date': t.targetDate,
          Status: t.status,
          Remarks: t.remarks || '',
        }));
    } else if (selectedReportType === 'completed_tasks') {
      exportData = taskList
        .filter((t) => t.status === 'Completed')
        .map((t) => ({
          'Task ID': t.id,
          'Task Title': t.title,
          'Staff Name': t.assignedToName,
          'Completion Date': t.completionDate || todayStr,
          Remarks: t.completionRemarks || t.remarks || '',
        }));
    } else if (selectedReportType === 'observations') {
      exportData = observationList.map((o) => ({
        'Faculty Name': o.facultyName,
        Class: o.className,
        Subject: o.subject,
        Date: o.date,
        Hour: o.hour,
        Rating: o.observation,
        Remarks: o.remarks,
      }));
    } else {
      exportData = staffList.map((s) => {
        const assigned = taskList.filter((t) => t.assignedToStaffId === s.id);
        const completed = assigned.filter((t) => t.status === 'Completed').length;
        return {
          'Staff ID': s.id,
          Name: s.facultyName,
          Department: s.department,
          'Total Tasks': assigned.length,
          Completed: completed,
          'Pending/Overdue': assigned.length - completed,
          'Completion %': assigned.length > 0 ? `${Math.round((completed / assigned.length) * 100)}%` : 'N/A',
        };
      });
    }

    exportToExcel(exportData, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            Reports & Print Management Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate, preview, print, and export 9 specialized department reports with high-resolution A4 layout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerPrint}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> 🖨 Print A4
          </button>

          <button
            onClick={() => exportElementToPDF('printable-report-canvas', `Report_${selectedReportType}`)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> 📄 Export PDF
          </button>

          <button
            onClick={handleExcelExport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> 📊 Export Excel
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Menu & Report Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1 h-fit">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Report Types
          </div>

          {reportMenu.map((m) => {
            const Icon = m.icon;
            const isActive = selectedReportType === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedReportType(m.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Report Preview Canvas */}
        <div className="lg:col-span-3 flex justify-center">
          <div
            id="printable-report-canvas"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 border border-slate-300 shadow-lg rounded-xl font-serif print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-6 font-sans">
              <div className="flex items-center justify-center gap-3 mb-2">
                {dailyReport.collegeLogoUrl ? (
                  <img
                    src={dailyReport.collegeLogoUrl}
                    alt="College Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-slate-300 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-xs border border-amber-400">
                    {dailyReport.collegeLogoText || 'LOGO'}
                  </div>
                )}
                <div className="text-left">
                  <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 leading-tight">
                    {dailyReport.collegeName || 'ST. APEX INSTITUTE OF ENGINEERING & TECHNOLOGY'}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600">
                    {hodDepartment}
                  </p>
                </div>
              </div>
              <div className="mt-2 py-1 px-3 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase flex items-center justify-between">
                <span>REPORT: {selectedReportType.replace('_', ' ').toUpperCase()}</span>
                <span>DATE GENERATED: {todayStr}</span>
              </div>
            </div>

            {/* Render Selected Report View */}
            {selectedReportType === 'daily_hod' && (
              <div className="space-y-4 font-sans text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="block text-blue-900 font-bold mb-1">HOD Summary Overview:</strong>
                    <p className="font-semibold text-slate-800">Department: {hodDepartment}</p>
                    {(() => {
                      const facCount = dailyReport.facultyAttendanceCount || { present: 0, absent: 0, od: 0, permission: 0, total: 0 };
                      const facTotal = facCount.total > 0 ? facCount.total : scopedStaff.length;
                      const facPresent = facCount.present ?? Math.max(0, facTotal - (facCount.absent || 0));
                      const facAbsent = facCount.absent ?? 0;
                      const facOd = facCount.od ?? 0;
                      const facPermission = facCount.permission ?? 0;
                      const facEffectivePresent = facPresent + facOd;
                      const facPct = facTotal > 0 ? Number(((facEffectivePresent / facTotal) * 100).toFixed(1)) : 100;

                      return (
                        <p className="mt-1 text-slate-700">
                          <strong>Faculty Attendance:</strong> Present: <span className="font-bold text-emerald-700">{facPresent}</span> | Absent: <span className="font-bold text-rose-700">{facAbsent}</span> | On Duty (OD): <span className="font-bold text-blue-700">{facOd}</span> | Permission: <span className="font-bold text-amber-700">{facPermission}</span> (Total: {facTotal} Staff) — <strong className="text-blue-900 font-extrabold">{facPct}% Attendance</strong>
                        </p>
                      );
                    })()}
                  </div>
                  {currentUser?.role !== 'principal' && currentUser?.role !== 'secretary' && (
                    <button
                      onClick={() => setIsFacultyAttendanceModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-300 transition-colors flex items-center gap-1 shrink-0 text-xs shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Faculty Attendance Entry
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-blue-900 border-b border-slate-300 pb-1">Task Execution Summary</h3>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Task Title</th>
                      <th className="p-2 border border-slate-300">Assigned To</th>
                      <th className="p-2 border border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.map((t) => (
                      <tr key={t.id}>
                        <td className="p-2 border border-slate-300">{t.title}</td>
                        <td className="p-2 border border-slate-300">{t.assignedToName}</td>
                        <td className="p-2 border border-slate-300 font-bold">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReportType === 'staff_individual' && (
              <div className="space-y-4 font-sans text-xs">
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="font-bold">Select Staff Member:</span>
                  <select
                    value={selectedIndividualStaffId}
                    onChange={(e) => setSelectedIndividualStaffId(e.target.value)}
                    className="p-1 border border-slate-300 rounded bg-white text-xs font-bold"
                  >
                    {availableStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.facultyName} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const staff = staffList.find((s) => s.id === selectedIndividualStaffId) || staffList[0];
                  const staffTasks = taskList.filter((t) => t.assignedToStaffId === staff.id);
                  const staffObs = observationList.filter((o) => o.staffId === staff.id);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50/50 border border-blue-200 rounded">
                        <div>
                          <strong>Faculty Name:</strong> {staff.facultyName}
                        </div>
                        <div>
                          <strong>Staff ID:</strong> {staff.id}
                        </div>
                        <div>
                          <strong>Designation:</strong> {staff.designation}
                        </div>
                        <div>
                          <strong>Department:</strong> {staff.department}
                        </div>
                      </div>

                      <h4 className="font-bold text-blue-900 border-b border-slate-300 pb-1">
                        Assigned Tasks & Status
                      </h4>
                      <table className="w-full text-left border-collapse border border-slate-300">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="p-2 border border-slate-300">Title</th>
                            <th className="p-2 border border-slate-300">Priority</th>
                            <th className="p-2 border border-slate-300">Target Date</th>
                            <th className="p-2 border border-slate-300">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffTasks.map((t) => (
                            <tr key={t.id}>
                              <td className="p-2 border border-slate-300">{t.title}</td>
                              <td className="p-2 border border-slate-300">{t.priority}</td>
                              <td className="p-2 border border-slate-300">{t.targetDate}</td>
                              <td className="p-2 border border-slate-300 font-bold">{t.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <h4 className="font-bold text-blue-900 border-b border-slate-300 pb-1">
                        Class Observation History
                      </h4>
                      {staffObs.length === 0 ? (
                        <p className="text-slate-500 italic">No observation logs recorded yet.</p>
                      ) : (
                        <table className="w-full text-left border-collapse border border-slate-300">
                          <thead className="bg-slate-100 font-bold">
                            <tr>
                              <th className="p-2 border border-slate-300">Date</th>
                              <th className="p-2 border border-slate-300">Subject</th>
                              <th className="p-2 border border-slate-300">Rating</th>
                              <th className="p-2 border border-slate-300">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffObs.map((o) => (
                              <tr key={o.id}>
                                <td className="p-2 border border-slate-300">{o.date}</td>
                                <td className="p-2 border border-slate-300">{o.subject}</td>
                                <td className="p-2 border border-slate-300 font-bold">{o.observation}</td>
                                <td className="p-2 border border-slate-300">{o.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedReportType === 'task_assignment' && (
              <div className="font-sans text-xs">
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Task ID</th>
                      <th className="p-2 border border-slate-300">Task Name</th>
                      <th className="p-2 border border-slate-300">Assigned Staff</th>
                      <th className="p-2 border border-slate-300">Priority</th>
                      <th className="p-2 border border-slate-300">Due Date</th>
                      <th className="p-2 border border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.map((t) => (
                      <tr key={t.id}>
                        <td className="p-2 border border-slate-300 font-mono font-bold">{t.id}</td>
                        <td className="p-2 border border-slate-300 font-bold">{t.title}</td>
                        <td className="p-2 border border-slate-300">{t.assignedToName}</td>
                        <td className="p-2 border border-slate-300">{t.priority}</td>
                        <td className="p-2 border border-slate-300">{t.targetDate}</td>
                        <td className="p-2 border border-slate-300 font-bold">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReportType === 'pending_tasks' && (
              <div className="font-sans text-xs">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded font-bold mb-3 text-amber-900">
                  Showing Only Pending / In Progress / Overdue Tasks
                </div>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Task Title</th>
                      <th className="p-2 border border-slate-300">Assigned Staff</th>
                      <th className="p-2 border border-slate-300">Due Date</th>
                      <th className="p-2 border border-slate-300">Priority</th>
                      <th className="p-2 border border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList
                      .filter((t) => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue')
                      .map((t) => (
                        <tr key={t.id}>
                          <td className="p-2 border border-slate-300 font-bold">{t.title}</td>
                          <td className="p-2 border border-slate-300">{t.assignedToName}</td>
                          <td className="p-2 border border-slate-300">{t.targetDate}</td>
                          <td className="p-2 border border-slate-300">{t.priority}</td>
                          <td className="p-2 border border-slate-300 font-bold text-amber-700">{t.status}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReportType === 'completed_tasks' && (
              <div className="font-sans text-xs">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded font-bold mb-3 text-emerald-900">
                  Showing Only Completed Tasks with Completion Proof Details
                </div>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Task Title</th>
                      <th className="p-2 border border-slate-300">Staff Name</th>
                      <th className="p-2 border border-slate-300">Completion Date</th>
                      <th className="p-2 border border-slate-300">Remarks / Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList
                      .filter((t) => t.status === 'Completed')
                      .map((t) => (
                        <tr key={t.id}>
                          <td className="p-2 border border-slate-300 font-bold">{t.title}</td>
                          <td className="p-2 border border-slate-300">{t.assignedToName}</td>
                          <td className="p-2 border border-slate-300">{t.completionDate || t.targetDate}</td>
                          <td className="p-2 border border-slate-300">{t.completionRemarks || t.remarks || 'Completed'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReportType === 'performance' && (
              <div className="font-sans text-xs space-y-4">
                <h3 className="font-bold text-blue-900 border-b border-slate-300 pb-1">
                  Automated Faculty Performance Metrics
                </h3>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Staff ID</th>
                      <th className="p-2 border border-slate-300">Faculty Name</th>
                      <th className="p-2 border border-slate-300">Assigned</th>
                      <th className="p-2 border border-slate-300">Completed</th>
                      <th className="p-2 border border-slate-300">Completion %</th>
                      <th className="p-2 border border-slate-300">Performance Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((s) => {
                      const assigned = taskList.filter((t) => t.assignedToStaffId === s.id);
                      const completed = assigned.filter((t) => t.status === 'Completed').length;
                      const rate = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 100;
                      return (
                        <tr key={s.id}>
                          <td className="p-2 border border-slate-300 font-mono font-bold">{s.id}</td>
                          <td className="p-2 border border-slate-300 font-bold">{s.facultyName}</td>
                          <td className="p-2 border border-slate-300">{assigned.length}</td>
                          <td className="p-2 border border-slate-300 font-bold text-emerald-700">{completed}</td>
                          <td className="p-2 border border-slate-300 font-bold">{rate}%</td>
                          <td className="p-2 border border-slate-300 font-bold text-blue-800">
                            {rate >= 80 ? 'Grade A (Excellent)' : rate >= 60 ? 'Grade B (Good)' : 'Grade C (Average)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* General Signatures Footer */}
            <div className="pt-10 mt-8 border-t-2 border-slate-900 font-sans grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="h-8"></div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                  Head of Department Signature
                </div>
              </div>

              <div>
                <div className="h-8"></div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                  Principal Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FacultyAttendanceModal
        isOpen={isFacultyAttendanceModalOpen}
        onClose={() => setIsFacultyAttendanceModalOpen(false)}
      />
    </div>
  );
};
