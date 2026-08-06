import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CCMMeeting, CCMAgendaItem } from '../types/ccm';
import { isSameDept, isSuperAdmin, normalizeDept, getDeptHodDetail } from '../utils/departmentUtils';
import { exportElementToPDF } from '../utils/exportUtils';
import {
  CCM_ACADEMIC_YEARS,
  CCM_SEMESTERS,
  CCM_PROGRAMMES,
  CCM_DEPARTMENTS,
  CCM_SECTIONS,
} from '../data/ccmData';
import {
  Plus, X, Calendar, ClipboardList, CheckCircle2, Clock, FileText, Trash2, Save, ArrowLeft, Building2, MonitorCheck, ChevronUp, ChevronDown, UserCheck,
} from 'lucide-react';

const meetingStatusColor: Record<string, string> = {
  Draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  Scheduled: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Approved: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
};

const agendaStatusColor: Record<string, string> = {
  Completed: 'text-emerald-600 dark:text-emerald-400',
  'In Progress': 'text-amber-600 dark:text-amber-400',
  Pending: 'text-rose-600 dark:text-rose-400',
  Overdue: 'text-red-600 dark:text-red-500',
};

const barColor = (status: string) =>
  status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-rose-500';

const parseNameList = (raw: string) =>
  raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

// Map a logged-in HOD's department to a CCM department option value.
const ccmDeptFromHod = (dept?: string): string => {
  const n = normalizeDept(dept);
  if (n.includes('cyber')) return 'Cyber Security';
  if (n.includes('computer science') || n.includes('cse')) return 'CSE';
  if (n.includes('ece') || n.includes('electronics')) return 'ECE';
  if (n.includes('eee') || n.includes('electrical')) return 'EEE';
  if (n.includes('mech') || n.includes('mechanical')) return 'Mechanical';
  if (n.includes('civil')) return 'Civil';
  return 'AI&DS';
};

// Row used inside the college-format report table.
const ReportRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <tr>
    <td className="border border-slate-300 p-1.5 font-bold w-32">{label}</td>
    <td className="border border-slate-300 p-1.5">{value}</td>
  </tr>
);

export const CCMView: React.FC = () => {
  const { ccmMeetings, addCCMMeeting, updateCCMMeeting, deleteCCMMeeting, currentUser, dailyReport } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Department scoping: only show CCMs for the logged-in HOD's department.
  // Principal / super-admins can see all departments.
  const isGlobal = isSuperAdmin(currentUser) || (!!currentUser && ['principal', 'secretary', 'secretary_pa', 'principal_pa'].includes(currentUser.role));
  const hodDept = currentUser?.department || dailyReport?.department || '';
  const scopedMeetings = isGlobal ? ccmMeetings : ccmMeetings.filter((m) => isSameDept(m.department, hodDept));
  const defaultDept = ccmDeptFromHod(hodDept);

  const selected = scopedMeetings.find((m) => m.id === selectedId) || null;

  const total = scopedMeetings.length;
  const pending = scopedMeetings.filter((m) => m.status === 'Pending' || m.status === 'Draft').length;
  const completed = scopedMeetings.filter((m) => m.status === 'Completed' || m.status === 'Approved').length;
  const upcoming = scopedMeetings.filter((m) => m.status === 'Scheduled').length;
  const openActions = scopedMeetings.reduce((acc, m) => acc + m.agenda.filter((a) => a.status !== 'Completed').length, 0);

  const stats = [
    { label: 'Total Meetings', value: total, color: 'text-slate-900 dark:text-white', icon: ClipboardList },
    { label: 'Held / Approved', value: completed, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    { label: 'Upcoming', value: upcoming, color: 'text-blue-600 dark:text-blue-400', icon: Calendar },
    { label: 'Pending / Draft', value: pending, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
    { label: 'Open Actions', value: openActions, color: 'text-rose-600 dark:text-rose-400', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MonitorCheck className="w-6 h-6 text-blue-600" /> IQAC — CCM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Class Committee Meetings. Assign meetings, track agenda, attendance, minutes &amp; action items.{isGlobal ? ' • All departments' : ` • ${hodDept || 'Your department'} — you can add Chief Mentor & Students manually.`}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md">
          <Plus className="w-4 h-4" /> Assign New CCM
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className={`flex items-center gap-2 ${s.color}`}>
                <Icon className="w-5 h-5" />
                <span className="text-2xl font-black">{s.value}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {selected ? (
        <MeetingDetail meeting={selected} onBack={() => setSelectedId(null)} onUpdate={(u) => updateCCMMeeting(selected.id, u)} onDelete={() => { if (confirm(`Delete meeting ${selected.meetingNumber}?`)) { deleteCCMMeeting(selected.id); setSelectedId(null); } }} />
      ) : (
        <MeetingList meetings={scopedMeetings} onSelect={(id) => setSelectedId(id)} />
      )}

      {showCreate && <CreateCCMForm defaultDepartment={defaultDept} lockDepartment={!isGlobal} onClose={() => setShowCreate(false)} onCreate={(data) => { addCCMMeeting(data); setShowCreate(false); }} />}
    </div>
  );
};
/* ---------------- Meeting List ---------------- */
const MeetingList: React.FC<{ meetings: CCMMeeting[]; onSelect: (id: string) => void }> = ({ meetings, onSelect }) => {
  if (meetings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No CCM meetings yet</p>
        <p className="text-xs text-slate-500">Click &quot;Assign New CCM&quot; to create your first class committee meeting.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {meetings.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{m.meetingNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meetingStatusColor[m.status] || ''}`}>{m.status}</span>
          </div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">{m.className}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {m.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {m.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            <Building2 className="w-3.5 h-3.5" /> {m.department} • {m.semester} {m.academicYear}
          </div>
        </button>
      ))}
    </div>
  );
};

/* ---------------- Meeting Detail ---------------- */
const MeetingDetail: React.FC<{
  meeting: CCMMeeting;
  onBack: () => void;
  onUpdate: (updates: Partial<CCMMeeting>) => void;
  onDelete: () => void;
}> = ({ meeting, onBack, onUpdate, onDelete }) => {
  const [tab, setTab] = useState<'agenda' | 'attendance' | 'atr'>('agenda');
  const [reportOpen, setReportOpen] = useState(false);
  const { dailyReport, staffList, currentUser } = useApp();
  const hod = getDeptHodDetail(staffList, meeting.department, currentUser, dailyReport?.hodName);
  const facPresent = (meeting.facultyMembers || []).filter((m) => m.present !== false).length;
  const stuPresent = (meeting.studentReps || []).filter((m) => m.present !== false).length;

  const tabs = [
    { id: 'agenda' as const, label: 'Agenda & Minutes', icon: ClipboardList },
    { id: 'attendance' as const, label: 'Attendance', icon: UserCheck },
    { id: 'atr' as const, label: 'Action Taken Report', icon: FileText },
  ];

  const advance = () => {
    if (meeting.status === 'Draft') onUpdate({ status: 'Scheduled' });
    else if (meeting.status === 'Scheduled') onUpdate({ status: 'Completed' });
    else if (meeting.status === 'Completed') onUpdate({ status: 'Approved', approvedBy: 'HOD' });
    else onUpdate({ status: 'Completed' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to list
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {meeting.meetingNumber}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meetingStatusColor[meeting.status] || ''}`}>{meeting.status}</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{meeting.className} — {meeting.department}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{meeting.date} • {meeting.time} • {meeting.venue} • Chief Mentor: {meeting.chiefMentor}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setReportOpen(true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Download Report (PDF)
          </button>
          <button onClick={advance} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Advance Status</button>
          <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === 'agenda' && <AgendaEditor agenda={meeting.agenda} onUpdate={(a) => onUpdate({ agenda: a })} />}
        {tab === 'attendance' && <AttendancePanel meeting={meeting} onUpdate={onUpdate} />}
        {tab === 'atr' && <ATRPanel agenda={meeting.agenda} onUpdate={(a) => onUpdate({ agenda: a })} />}
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-800">CCM Report — {meeting.meetingNumber}</h3>
              <div className="flex gap-2">
                <button onClick={() => exportElementToPDF(`ccm-report-${meeting.id}`, `CCM_Report_${meeting.meetingNumber}`)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button onClick={() => setReportOpen(false)} className="px-3 py-1.5 rounded-lg bg-slate-300 text-slate-700 text-xs font-semibold">Close</button>
              </div>
            </div>

            <div id={`ccm-report-${meeting.id}`} className="bg-white text-slate-900 p-8 rounded-lg border border-slate-300">
              <div className="border-b-4 border-double border-slate-400 pb-3 mb-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  {dailyReport?.collegeLogoUrl ? (
                    <img src={dailyReport.collegeLogoUrl} alt="college logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-800 text-white flex items-center justify-center font-bold text-lg rounded">{dailyReport?.collegeLogoText?.[0] || 'S'}</div>
                  )}
                  <div className="text-left">
                    <h2 className="text-lg font-black uppercase tracking-wide leading-tight">{dailyReport?.collegeName || 'Sasurie College of Engineering'}</h2>
                    <p className="text-[11px] text-slate-600">Department of {hod.department}</p>
                    <p className="text-[11px] font-semibold text-slate-700">Head of Department: {hod.name}</p>
                  </div>
                </div>
              </div>
              <h3 className="text-center font-bold text-sm uppercase mb-1">Class Committee Meeting — Minutes &amp; Action Taken Report</h3>
              <p className="text-center text-[11px] text-slate-600 mb-4">Meeting No: {meeting.meetingNumber} • Academic Year: {meeting.academicYear} • Semester: {meeting.semester}</p>

              <table className="w-full text-[11px] mb-4 border border-slate-300">
                <tbody>
                  <ReportRow label="Class" value={`${meeting.className} — Section ${meeting.section} (${meeting.programme})`} />
                  <ReportRow label="Date & Time" value={`${meeting.date} • ${meeting.time}`} />
                  <ReportRow label="Venue" value={meeting.venue || '—'} />
                  <ReportRow label="Chief Mentor" value={meeting.chiefMentor || '—'} />
                  <ReportRow label="Status" value={meeting.status} />
                </tbody>
              </table>

              <h4 className="font-bold text-[12px] mb-1">Agenda, Minutes &amp; Action Taken</h4>
              <table className="w-full text-[10px] border border-slate-300 mb-4">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1">#</th>
                    <th className="border border-slate-300 p-1">Agenda / Discussion</th>
                    <th className="border border-slate-300 p-1">Decision</th>
                    <th className="border border-slate-300 p-1">Action / Responsible / Target</th>
                    <th className="border border-slate-300 p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.agenda.map((a) => (
                    <tr key={a.id}>
                      <td className="border border-slate-300 p-1">{a.order}</td>
                      <td className="border border-slate-300 p-1">{a.title}{a.discussion ? ` — ${a.discussion}` : ''}</td>
                      <td className="border border-slate-300 p-1">{a.decision || a.actionPlan || '—'}</td>
                      <td className="border border-slate-300 p-1">{`${a.actionPlan || '—'}`}{a.responsible ? ` / ${a.responsible}` : ''}{a.targetDate ? ` / ${a.targetDate}` : ''}</td>
                      <td className="border border-slate-300 p-1">{a.status} ({a.completionPct || 0}%)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
                            <div className="text-[11px] mb-4">
                <p className="font-bold mb-1">Attendance:</p>
                <p>Faculty present: {facPresent}/{meeting.facultyMembers?.length || 0} — {(meeting.facultyMembers || []).filter((f) => f.present !== false).map((f) => f.name).join(', ') || 'N/A'}</p>
                <p>Student Reps present: {stuPresent}/{meeting.studentReps?.length || 0} — {(meeting.studentReps || []).filter((s) => s.present !== false).map((s) => s.name).join(', ') || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 text-center text-[11px]">
                <div className="border-t border-slate-400 pt-1">Chief Mentor<br /><span className="text-slate-500">({meeting.chiefMentor || '—'})</span></div>
                <div className="border-t border-slate-400 pt-1">Head of Department<br /><span className="text-slate-500">({hod.name})</span></div>
                <div className="border-t border-slate-400 pt-1">Principal<br /><span className="text-slate-500">({dailyReport?.principalName || 'Principal'})</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
/* ---------------- Agenda & Minutes Editor ---------------- */
const AgendaEditor: React.FC<{ agenda: CCMAgendaItem[]; onUpdate: (a: CCMAgendaItem[]) => void }> = ({ agenda, onUpdate }) => {
  const [newTitle, setNewTitle] = useState('');
  const [extended, setExtended] = useState<string | null>(null);

  const updateItem = (id: string, patch: Partial<CCMAgendaItem>) => {
    onUpdate(agenda.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...agenda];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate(next.map((a, i) => ({ ...a, order: i + 1 })));
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return;
    onUpdate([...agenda, { id: `AG-${Date.now()}`, title, order: agenda.length + 1, status: 'Pending' as const, completionPct: 0 }]);
    setNewTitle('');
  };

  const removeItem = (id: string) => {
    onUpdate(agenda.filter((a) => a.id !== id).map((a, i) => ({ ...a, order: i + 1 })));
  };

  const cycleStatus = (old: string) => (old === 'Pending' ? 'In Progress' : old === 'In Progress' ? 'Completed' : 'Pending');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add custom agenda item…"
          className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
        />
        <button onClick={addItem} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>{agenda.length} agenda items</span>
        <span>Expand an item (▾) to record discussion &amp; minutes.</span>
      </div>

      {agenda.map((a, i) => {
        const open = extended === a.id;
        const pct = Math.min(100, Math.max(0, a.completionPct ?? 0));
        return (
          <div key={a.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className={`flex items-center gap-2 p-2.5 ${open ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
              <span className="w-6 text-right text-xs text-slate-400 font-bold">{a.order}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div className={`h-1.5 rounded-full ${barColor(a.status)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold ${agendaStatusColor[a.status] || ''}`}>{a.status}</span>
                  <span className="text-[10px] text-slate-500">{pct}%</span>
                </div>
              </div>
              <button onClick={() => setExtended(open ? null : a.id)} className="p-1 text-slate-400 hover:text-blue-600">
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => move(i, -1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(i, 1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => removeItem(a.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>

            {open && (
              <div className="p-3 space-y-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Status</label>
                    <button onClick={() => updateItem(a.id, { status: cycleStatus(a.status) as CCMAgendaItem['status'] })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${agendaStatusColor[a.status] || 'text-slate-500'}`}>
                      {a.status}
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Completion % — {pct}%</label>
                    <input type="range" min={0} max={100} value={pct} onChange={(e) => updateItem(a.id, { completionPct: Number(e.target.value) })} className="w-full" />
                  </div>
                </div>
                <Field label="Discussion" value={a.discussion || ''} onChange={(v) => updateItem(a.id, { discussion: v })} textarea />
                <Field label="Decision Taken" value={a.decision || ''} onChange={(v) => updateItem(a.id, { decision: v })} textarea />
                <Field label="Action Plan" value={a.actionPlan || ''} onChange={(v) => updateItem(a.id, { actionPlan: v })} textarea />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Responsible Person" value={a.responsible || ''} onChange={(v) => updateItem(a.id, { responsible: v })} />
                  <Field label="Target Date" value={a.targetDate || ''} onChange={(v) => updateItem(a.id, { targetDate: v })} type="date" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
}> = ({ label, value, onChange, textarea, type = 'text' }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
    )}
  </div>
);

/* ---------------- Attendance Panel ---------------- */
const AttendancePanel: React.FC<{ meeting: CCMMeeting; onUpdate: (u: Partial<CCMMeeting>) => void }> = ({ meeting, onUpdate }) => {
  const toggle = (listKey: 'facultyMembers' | 'studentReps', id: string, present: boolean) => {
    const next = (meeting[listKey] || []).map((m) => (m.id === id ? { ...m, present } : m));
    onUpdate({ [listKey]: next } as Partial<CCMMeeting>);
  };

  const presentF = (meeting.facultyMembers || []).filter((m) => m.present !== false).length;
  const presentS = (meeting.studentReps || []).filter((m) => m.present !== false).length;

  const Section: React.FC<{
    title: string;
    listKey: 'facultyMembers' | 'studentReps';
    members: { id: string; name: string; present?: boolean }[];
  }> = ({ title, listKey, members }) => (
    <div className="mb-5">
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h4>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
            <div className="flex gap-2">
              <button onClick={() => toggle(listKey, m.id, true)} className={`px-3 py-1 rounded-lg text-[11px] font-bold ${m.present === false ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500 text-white'}`}>Present</button>
              <button onClick={() => toggle(listKey, m.id, false)} className={`px-3 py-1 rounded-lg text-[11px] font-bold ${m.present === true ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-rose-500 text-white'}`}>Absent</button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="text-xs text-slate-400">No members added.</p>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Faculty Attendance: <span className="text-emerald-600 font-black">{presentF}/{meeting.facultyMembers?.length || 0}</span></span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Student Rep Attendance: <span className="text-emerald-600 font-black">{presentS}/{meeting.studentReps?.length || 0}</span></span>
      </div>
      <Section title="Faculty Members" listKey="facultyMembers" members={meeting.facultyMembers || []} />
      <Section title="Student Representatives" listKey="studentReps" members={meeting.studentReps || []} />
    </div>
  );
};
/* ---------------- Action Taken Report ---------------- */
const ATRPanel: React.FC<{ agenda: CCMAgendaItem[]; onUpdate: (a: CCMAgendaItem[]) => void }> = ({ agenda, onUpdate }) => {
  const rows = agenda.filter((a) => a.actionPlan || a.status !== 'Pending');
  const cycle = (old: string) => (old === 'Pending' ? 'In Progress' : old === 'In Progress' ? 'Completed' : 'Pending');

  const bgColor = (s: string) =>
    s === 'Completed'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : s === 'In Progress'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <th className="py-2 pr-2">Agenda</th>
            <th className="py-2 pr-2">Action</th>
            <th className="py-2 pr-2">Responsible</th>
            <th className="py-2 pr-2">Deadline</th>
            <th className="py-2 pr-2">Status</th>
            <th className="py-2 pr-2">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-slate-400">No action items yet. Fill &quot;Action Plan&quot; in Agenda &amp; Minutes.</td></tr>
          )}
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 pr-2 font-semibold text-slate-700 dark:text-slate-300">{a.title}</td>
              <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{a.actionPlan || '—'}</td>
              <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{a.responsible || '—'}</td>
              <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{a.targetDate || '—'}</td>
              <td className="py-2 pr-2">
                <button onClick={() => onUpdate(agenda.map((x) => (x.id === a.id ? { ...x, status: cycle(x.status) as CCMAgendaItem['status'] } : x)))} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${bgColor(a.status)}`}>
                  {a.status}
                </button>
              </td>
              <td className="py-2 text-slate-600 dark:text-slate-400">{a.completionPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
/* ---------------- Create CCM Form ---------------- */
const emptyForm = {
  meetingNumber: '',
  className: '',
  department: 'CSE',
  programme: 'B.E.',
  semester: 'Odd',
  academicYear: '2026-2027',
  section: 'A',
  venue: '',
  date: '',
  time: '',
  chiefMentor: '',
  faculty: '',
  students: '',
};

const inputCls = 'w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white';
const labelCls = 'block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1';

const CreateCCMForm: React.FC<{ onClose: () => void; onCreate: (data: any) => void; defaultDepartment?: string; lockDepartment?: boolean }> = ({ onClose, onCreate, defaultDepartment, lockDepartment }) => {
  const [form, setForm] = useState({ ...emptyForm, department: defaultDepartment || emptyForm.department });
  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.className || !form.date || !form.chiefMentor) {
      alert('Please fill Class, Chief Mentor and Meeting Date.');
      return;
    }
    const facultyMembers = parseNameList(form.faculty).map((name, i) => ({ id: `FAC-${Date.now()}-${i}`, name, role: 'faculty' as const }));
    const studentReps = parseNameList(form.students).map((name, i) => ({ id: `STU-${Date.now()}-${i}`, name, role: 'student_rep' as const }));
    onCreate({
      meetingNumber: form.meetingNumber || `CCM-${Date.now()}`,
      className: form.className,
      department: form.department,
      programme: form.programme,
      semester: form.semester,
      academicYear: form.academicYear,
      section: form.section,
      venue: form.venue,
      date: form.date,
      time: form.time,
      chiefMentor: form.chiefMentor,
      facultyMembers,
      studentReps,
      status: 'Draft',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Assign New CCM</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Meeting Number</label>
            <input className={inputCls} value={form.meetingNumber} onChange={(e) => set('meetingNumber', e.target.value)} placeholder="CCM-2026-01" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Class *</label>
            <input className={inputCls} value={form.className} onChange={(e) => set('className', e.target.value)} placeholder="II Year CSE Section A" />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <select className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)} disabled={lockDepartment}>
              {CCM_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Programme</label>
            <select className={inputCls} value={form.programme} onChange={(e) => set('programme', e.target.value)}>
              {CCM_PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <select className={inputCls} value={form.semester} onChange={(e) => set('semester', e.target.value)}>
              {CCM_SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Academic Year</label>
            <select className={inputCls} value={form.academicYear} onChange={(e) => set('academicYear', e.target.value)}>
              {CCM_ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Section</label>
            <select className={inputCls} value={form.section} onChange={(e) => set('section', e.target.value)}>
              {CCM_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Chief Mentor *</label>
            <input className={inputCls} value={form.chiefMentor} onChange={(e) => set('chiefMentor', e.target.value)} placeholder="Dr. V. Henderson" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Faculty Members (comma separated)</label>
            <textarea className={inputCls} rows={2} value={form.faculty} onChange={(e) => set('faculty', e.target.value)} placeholder="M. Kaviyarasu, Dhananjeiyan B" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Student Representatives (comma separated)</label>
            <textarea className={inputCls} rows={2} value={form.students} onChange={(e) => set('students', e.target.value)} placeholder="Arun Kumar, Priya Sharma" />
          </div>
          <div>
            <label className={labelCls}>Meeting Date *</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Meeting Time</label>
            <input type="time" className={inputCls} value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Venue</label>
            <input className={inputCls} value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="CSE Seminar Hall" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Save Meeting
          </button>
        </div>
      </div>
    </div>
  );
};


