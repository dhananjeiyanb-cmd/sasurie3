import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CCMMeeting, CCMAgendaItem } from '../types/ccm';
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

export const CCMView: React.FC = () => {
  const { ccmMeetings, addCCMMeeting, updateCCMMeeting, deleteCCMMeeting } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const selected = ccmMeetings.find((m) => m.id === selectedId) || null;

  const total = ccmMeetings.length;
  const pending = ccmMeetings.filter((m) => m.status === 'Pending' || m.status === 'Draft').length;
  const completed = ccmMeetings.filter((m) => m.status === 'Completed' || m.status === 'Approved').length;
  const upcoming = ccmMeetings.filter((m) => m.status === 'Scheduled').length;
  const openActions = ccmMeetings.reduce((acc, m) => acc + m.agenda.filter((a) => a.status !== 'Completed').length, 0);

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
          <p className="text-xs text-slate-500 dark:text-slate-400">Class Committee Meetings. Assign meetings, track agenda, attendance, minutes &amp; action items.</p>
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
        <MeetingList meetings={ccmMeetings} onSelect={(id) => setSelectedId(id)} />
      )}

      {showCreate && <CreateCCMForm onClose={() => setShowCreate(false)} onCreate={(data) => { addCCMMeeting(data); setShowCreate(false); }} />}
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
//__END__


