import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportElementToPDF, exportToExcel, triggerPrint } from '../utils/exportUtils';
import { getDeptHodName, getScopedStaff } from '../utils/departmentUtils';
import { SettingsModal } from '../components/SettingsModal';
import { StudentAttendanceModal } from '../components/StudentAttendanceModal';
import { DailyRemarksModal } from '../components/DailyRemarksModal';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  Edit2,
  Save,
  Building2,
  Calendar,
  CheckCircle,
  Eye,
  CheckSquare,
  Users,
  Settings,
  Edit3,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const { dailyReport, updateDailyReport, staffList, taskList, observationList, currentUser } = useApp();

  const activeHodName = getDeptHodName(staffList, dailyReport.department, currentUser, dailyReport.hodName);
  const scopedStaff = getScopedStaff(staffList, currentUser, dailyReport.department);

  const [isEditing, setIsEditing] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [remarksTab, setRemarksTab] = useState<'events' | 'discipline' | 'hod' | 'naac'>('naac');
  const [eventsConducted, setEventsConducted] = useState(dailyReport.eventsConducted);
  const [naacWorkDone, setNaacWorkDone] = useState(dailyReport.naacWorkDone || '');
  const [disciplineIssues, setDisciplineIssues] = useState(dailyReport.disciplineIssues);
  const [specialRemarks, setSpecialRemarks] = useState(dailyReport.specialRemarks);
  const [hodRemarks, setHodRemarks] = useState(dailyReport.hodRemarks);

  const handleSave = () => {
    updateDailyReport({
      eventsConducted,
      naacWorkDone,
      disciplineIssues,
      specialRemarks,
      hodRemarks,
    });
    setIsEditing(false);
  };

  const completedTasks = taskList.filter((t) => t.status === 'Completed').length;
  const pendingTasks = taskList.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
  const overdueTasks = taskList.filter((t) => t.status === 'Overdue').length;

  const handleExportExcel = () => {
    const excelData = [
      { Category: 'Department', Details: dailyReport.department },
      { Category: 'HOD Name', Details: activeHodName },
      { Category: 'Report Date', Details: dailyReport.date },
      { Category: 'Faculty Attendance', Details: `${dailyReport.facultyAttendanceCount.present}/${dailyReport.facultyAttendanceCount.total} Present` },
      { Category: 'Completed Tasks', Details: completedTasks },
      { Category: 'Pending Tasks', Details: pendingTasks },
      { Category: 'Overdue Tasks', Details: overdueTasks },
      { Category: 'Class Observations', Details: observationList.length },
      { Category: 'Events Conducted', Details: dailyReport.eventsConducted },
      { Category: 'NAAC / Accreditation Work', Details: dailyReport.naacWorkDone || 'None' },
      { Category: 'HOD Remarks', Details: dailyReport.hodRemarks },
    ];
    exportToExcel(excelData, `HOD_Daily_Report_${dailyReport.date}`);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            HOD Daily Reporting Card
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official daily department summary document formatted for A4 printing and archiving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-600"
          >
            <Settings className="w-4 h-4" /> College & HOD Settings
          </button>

          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Report Remarks
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" /> Edit Remarks
            </button>
          )}

          <button
            onClick={triggerPrint}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> 🖨 Print A4
          </button>

          <button
            onClick={() => exportElementToPDF('hod-report-card-a4', `HOD_Daily_Report_${dailyReport.date}`)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> 📄 Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> 📊 Export Excel
          </button>
        </div>
      </div>

      {/* A4 Printable Document Container */}
      <div className="flex justify-center">
        <div
          id="hod-report-card-a4"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 border border-slate-300 shadow-xl rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 font-serif"
        >
          {/* Header Banner with College Logo */}
          <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              {dailyReport.collegeLogoUrl ? (
                <img
                  src={dailyReport.collegeLogoUrl}
                  alt="College Logo"
                  className="w-12 h-12 object-contain rounded-xl border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm border-2 border-amber-400 shadow-md">
                  {dailyReport.collegeLogoText || 'SCE'}
                </div>
              )}
              <div className="text-left">
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                  {dailyReport.collegeName}
                </h1>
                <p className="text-xs font-sans font-semibold text-slate-600">
                  Approved by AICTE & Affiliated to State Technological University
                </p>
              </div>
            </div>

            <div className="bg-slate-100 py-1.5 px-4 rounded-md border border-slate-300 mt-2 font-sans flex items-center justify-between text-xs font-bold">
              <span>{dailyReport.department}</span>
              <span className="text-blue-900 uppercase">HOD DAILY REPORTING CARD</span>
              <span>DATE: {dailyReport.date}</span>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-600">Department:</span>{' '}
              <strong className="text-slate-900">{dailyReport.department}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-600">Total Department Staff:</span>{' '}
              <strong>{scopedStaff.length} Faculty Members</strong>
            </div>
          </div>

          {/* Section 1: Faculty Attendance */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center gap-1.5">
              1. FACULTY ATTENDANCE SUMMARY
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">Total Staff</th>
                  <th className="p-2 border border-slate-300">Present</th>
                  <th className="p-2 border border-slate-300">Absent / On Leave</th>
                  <th className="p-2 border border-slate-300">Leave Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">{scopedStaff.length}</td>
                  <td className="p-2 border border-slate-300 font-bold text-emerald-700">
                    {scopedStaff.filter((s) => s.status === 'Active').length}
                  </td>
                  <td className="p-2 border border-slate-300 font-bold text-amber-700">
                    {scopedStaff.filter((s) => s.status === 'Inactive').length}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-700">
                    {dailyReport.facultyAttendanceCount.absentNames || 'Prof. Sarah Jenkins (CL)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Assigned Tasks & Status */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              2. ASSIGNED FACULTY TASKS & COMPLIANCE SUMMARY
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">Task Title</th>
                  <th className="p-2 border border-slate-300">Assigned Faculty</th>
                  <th className="p-2 border border-slate-300">Target Date</th>
                  <th className="p-2 border border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {taskList.slice(0, 5).map((task) => (
                  <tr key={task.id}>
                    <td className="p-2 border border-slate-300 font-medium">{task.title}</td>
                    <td className="p-2 border border-slate-300">{task.assignedToName}</td>
                    <td className="p-2 border border-slate-300">{task.targetDate}</td>
                    <td className="p-2 border border-slate-300 font-bold">{task.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Student Attendance Summary */}
          <div className="mb-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                3. STUDENT ATTENDANCE SUMMARY (TODAY)
              </h3>
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit / Enter Attendance
              </button>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">YEAR / CLASS SECTION</th>
                  <th className="p-2 border border-slate-300 text-center">TOTAL STRENGTH</th>
                  <th className="p-2 border border-slate-300 text-center text-emerald-800">PRESENT</th>
                  <th className="p-2 border border-slate-300 text-center text-rose-700">ABSENT</th>
                  <th className="p-2 border border-slate-300 text-center text-amber-800">OD</th>
                  <th className="p-2 border border-slate-300 text-center text-purple-800">OTHERS</th>
                  <th className="p-2 border border-slate-300 text-center">ATTENDANCE %</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.studentAttendanceSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                      No attendance summaries added for today.{' '}
                      <button
                        onClick={() => setIsAttendanceModalOpen(true)}
                        className="text-blue-600 font-bold underline"
                      >
                        Click to enter attendance for II, III, IV Year.
                      </button>
                    </td>
                  </tr>
                ) : (
                  <>
                    {dailyReport.studentAttendanceSummaries.map((sa) => {
                      const absent = sa.absentStudents ?? Math.max(0, sa.totalStudents - sa.presentStudents);
                      const od = sa.odStudents ?? 0;
                      const others = sa.othersStudents ?? 0;

                      return (
                        <tr key={sa.classId}>
                          <td className="p-2 border border-slate-300 font-bold">{sa.className}</td>
                          <td className="p-2 border border-slate-300 text-center font-semibold">{sa.totalStudents}</td>
                          <td className="p-2 border border-slate-300 text-center text-emerald-700 font-bold">{sa.presentStudents}</td>
                          <td className="p-2 border border-slate-300 text-center text-rose-600 font-medium">{absent}</td>
                          <td className="p-2 border border-slate-300 text-center text-amber-600 font-medium">{od}</td>
                          <td className="p-2 border border-slate-300 text-center text-purple-600 font-medium">{others}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-blue-900">{sa.attendancePercentage}%</td>
                        </tr>
                      );
                    })}

                    {/* Total Summary Row */}
                    {(() => {
                      const totStr = dailyReport.studentAttendanceSummaries.reduce((a, b) => a + b.totalStudents, 0);
                      const totPres = dailyReport.studentAttendanceSummaries.reduce((a, b) => a + b.presentStudents, 0);
                      const totAbs = dailyReport.studentAttendanceSummaries.reduce((a, b) => a + (b.absentStudents ?? Math.max(0, b.totalStudents - b.presentStudents)), 0);
                      const totOd = dailyReport.studentAttendanceSummaries.reduce((a, b) => a + (b.odStudents || 0), 0);
                      const totOth = dailyReport.studentAttendanceSummaries.reduce((a, b) => a + (b.othersStudents || 0), 0);
                      const overallPct = totStr > 0 ? Number((((totPres + totOd) / totStr) * 100).toFixed(1)) : 0;

                      return (
                        <tr className="bg-slate-100 font-bold">
                          <td className="p-2 border border-slate-300 text-slate-900 uppercase">OVERALL TOTAL</td>
                          <td className="p-2 border border-slate-300 text-center text-slate-900">{totStr}</td>
                          <td className="p-2 border border-slate-300 text-center text-emerald-800">{totPres}</td>
                          <td className="p-2 border border-slate-300 text-center text-rose-700">{totAbs}</td>
                          <td className="p-2 border border-slate-300 text-center text-amber-800">{totOd}</td>
                          <td className="p-2 border border-slate-300 text-center text-purple-800">{totOth}</td>
                          <td className="p-2 border border-slate-300 text-center text-blue-900">{overallPct}%</td>
                        </tr>
                      );
                    })()}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Section 4: Class Observations */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              4. CLASSROOM OBSERVATIONS & AUDITS
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">Faculty Observed</th>
                  <th className="p-2 border border-slate-300">Class & Hour</th>
                  <th className="p-2 border border-slate-300">Subject</th>
                  <th className="p-2 border border-slate-300">Rating & Remarks</th>
                </tr>
              </thead>
              <tbody>
                {observationList.slice(0, 3).map((obs) => (
                  <tr key={obs.id}>
                    <td className="p-2 border border-slate-300 font-bold">{obs.facultyName}</td>
                    <td className="p-2 border border-slate-300">{obs.className} ({obs.hour})</td>
                    <td className="p-2 border border-slate-300">{obs.subject}</td>
                    <td className="p-2 border border-slate-300">
                      <strong>[{obs.observation}]</strong> {obs.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 5: Events, Discipline & Remarks */}
          <div className="mb-8 font-sans space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  5. EVENTS CONDUCTED & DEPARTMENTAL ACTIVITIES
                </h3>
                <button
                  onClick={() => {
                    setRemarksTab('events');
                    setIsRemarksModalOpen(true);
                  }}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit / Enter
                </button>
              </div>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={eventsConducted}
                  onChange={(e) => setEventsConducted(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              ) : (
                <p className="text-xs text-slate-800 whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-200">
                  {dailyReport.eventsConducted || 'No departmental events recorded today.'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  6. NAAC / NBA ACCREDITATION WORK DONE
                </h3>
                <button
                  onClick={() => {
                    setRemarksTab('naac');
                    setIsRemarksModalOpen(true);
                  }}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit / Enter NAAC Work
                </button>
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={naacWorkDone}
                  onChange={(e) => setNaacWorkDone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  placeholder="Enter NAAC & NBA criteria work completed today..."
                />
              ) : (
                <div className="text-xs text-slate-900 whitespace-pre-line bg-amber-50/50 p-2.5 rounded border border-amber-200/80 font-medium">
                  {dailyReport.naacWorkDone || 'No NAAC accreditation activities logged today.'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  7. DISCIPLINE ISSUES / SPECIAL REMARKS
                </h3>
                <button
                  onClick={() => {
                    setRemarksTab('discipline');
                    setIsRemarksModalOpen(true);
                  }}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit / Enter
                </button>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Discipline Issues:</label>
                    <textarea
                      rows={2}
                      value={disciplineIssues}
                      onChange={(e) => setDisciplineIssues(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Special Remarks:</label>
                    <textarea
                      rows={2}
                      value={specialRemarks}
                      onChange={(e) => setSpecialRemarks(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-xs text-slate-800">
                  <div>
                    <strong className="text-slate-900 font-bold">Discipline Issues: </strong>
                    <span className="text-slate-700">{dailyReport.disciplineIssues || 'None reported.'}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/80">
                    <strong className="text-slate-900 font-bold">Special Remarks: </strong>
                    <span className="text-slate-700">{dailyReport.specialRemarks || 'No special remarks recorded.'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  8. HOD OVERALL REMARKS
                </h3>
                <button
                  onClick={() => {
                    setRemarksTab('hod');
                    setIsRemarksModalOpen(true);
                  }}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit / Enter
                </button>
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={hodRemarks}
                  onChange={(e) => setHodRemarks(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-semibold"
                />
              ) : (
                <p className="text-xs text-slate-900 font-semibold italic bg-blue-50/70 p-3 rounded border border-blue-200">
                  "{dailyReport.hodRemarks || 'Satisfactory academic progress across all classes today.'}"
                </p>
              )}
            </div>
          </div>

          {/* Signatures Section */}
          <div className="pt-12 mt-8 border-t-2 border-slate-900 font-sans grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-8"></div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                Head of Department Signature
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Date: {dailyReport.date}</div>
            </div>

            <div>
              <div className="h-8"></div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                Principal Signature
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{dailyReport.collegeName}</div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

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
