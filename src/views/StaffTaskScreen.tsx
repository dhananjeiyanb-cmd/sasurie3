import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, User } from '../types';
import { TaskStatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  Search,
  CheckSquare,
  Calendar,
  Clock,
  User as UserIcon,
  GraduationCap,
  Upload,
  Paperclip,
  CheckCircle2,
  X,
  Users,
  FileText,
  ExternalLink,
  BookOpen,
  Sparkles,
  Share2,
  MessageSquare,
} from 'lucide-react';

interface StaffTaskScreenProps {
  tasks: Task[];
  currentUser: User | null;
  onUpdateStatus: (
    id: string,
    status: TaskStatus,
    remarks?: string,
    attachmentUrl?: string,
    attachmentName?: string
  ) => void;
  onSyncWorkspace?: (task: Task) => void;
}

type StatusTab = 'all' | 'pending' | 'overdue' | 'submitted' | 'completed';

const todayStr = () => new Date().toISOString().split('T')[0];

const isOverdue = (t: Task) => {
  if (t.status === 'Overdue') return true;
  if (t.status !== 'Pending' && t.status !== 'In Progress') return false;
  const target = t.targetDate || t.assignedDate;
  return !!target && target < todayStr();
};

export const StaffTaskScreen: React.FC<StaffTaskScreenProps> = ({
  tasks,
  currentUser,
  onUpdateStatus,
  onSyncWorkspace,
}) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<StatusTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const tabCounts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length,
      overdue: tasks.filter((t) => isOverdue(t)).length,
      submitted: tasks.filter((t) => t.status === 'Submitted').length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
    }),
    [tasks]
  );

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tasks.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.className || '').toLowerCase().includes(q) ||
        (t.assignedByName || '').toLowerCase().includes(q)
      );
    });
    if (tab === 'pending') list = list.filter((t) => t.status === 'Pending' || t.status === 'In Progress');
    else if (tab === 'submitted') list = list.filter((t) => t.status === 'Submitted');
    else if (tab === 'completed') list = list.filter((t) => t.status === 'Completed');
    else if (tab === 'overdue') list = list.filter((t) => isOverdue(t));

    return [...list].sort((a, b) => {
      const ao = isOverdue(a) ? 0 : 1;
      const bo = isOverdue(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return (a.targetDate || a.assignedDate || '').localeCompare(b.targetDate || b.assignedDate || '');
    });
  }, [tasks, search, tab]);

  const selectedTask = useMemo(
    () => visibleTasks.find((t) => t.id === selectedId) || visibleTasks[0] || null,
    [visibleTasks, selectedId]
  );

  const openDetail = (t: Task) => {
    setSelectedId(t.id);
    if (window.innerWidth < 1024) setMobileDetailOpen(true);
  };

  const tabs: { key: StatusTab; label: string; count: number; active: string }[] = [
    { key: 'all', label: 'All', count: tabCounts.all, active: 'bg-blue-600 text-white border-transparent' },
    { key: 'pending', label: 'Pending', count: tabCounts.pending, active: 'bg-amber-600 text-white border-transparent' },
    { key: 'overdue', label: 'Overdue', count: tabCounts.overdue, active: 'bg-rose-600 text-white border-transparent' },
    { key: 'submitted', label: 'Submitted', count: tabCounts.submitted, active: 'bg-purple-600 text-white border-transparent' },
    { key: 'completed', label: 'Completed', count: tabCounts.completed, active: 'bg-emerald-600 text-white border-transparent' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            My Assigned Tasks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.name ? `Hi ${currentUser.name.split(' ')[0]}, ` : ''}track, update progress and submit proof for your duties.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onSyncWorkspace && (
            <button
              onClick={() => selectedTask && onSyncWorkspace(selectedTask)}
              disabled={!selectedTask}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              title="Sync selected task to Google Calendar / Tasks / Classroom"
            >
              <Sparkles className="w-4 h-4" />
              Sync to Google
            </button>
          )}
        </div>
      </div>

      {/* Search + status tabs */}
      <div className="mb-4 space-y-3 shrink-0">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks, class, assigner..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                tab === tb.key ? tb.active : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tb.label}
              <span className="opacity-70 ml-1">{tb.count}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Master-detail area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Task list */}
        <aside className="flex-1 lg:flex-none lg:w-[360px] min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">
              {visibleTasks.length} {visibleTasks.length === 1 ? 'Task' : 'Tasks'}
            </h3>
            <span className="text-[10px] text-slate-400">Tap to view details</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs text-slate-500">No tasks match here.</p>
                <p className="text-[10px] text-slate-400 mt-1">Try a different filter or search.</p>
              </div>
            ) : (
              visibleTasks.map((t) => {
                const sel = selectedTask?.id === t.id;
                const od = isOverdue(t);
                return (
                  <button
                    key={t.id}
                    onClick={() => openDetail(t)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${od ? 'border-l-4 border-l-rose-500' : ''} ${
                      sel
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 ring-1 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {t.id}
                      </span>
                      <TaskStatusBadge status={t.status} />
                    </div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white leading-snug mb-1.5 line-clamp-2">
                      {t.title}
                    </h4>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>
                        <PriorityBadge priority={t.priority} />
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {t.targetDate || t.assignedDate}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>


        {/* Detail (desktop) */}
        <section className="hidden lg:flex flex-1 min-h-0 flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {selectedTask ? (
            <TaskDetailBody
              task={selectedTask}
              onUpdateStatus={onUpdateStatus}
              onSyncWorkspace={onSyncWorkspace}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <CheckSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">Select a task to view its details</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mobile detail modal */}
      {mobileDetailOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white">Task Details</span>
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TaskDetailBody
                task={selectedTask}
                onUpdateStatus={onUpdateStatus}
                onSyncWorkspace={onSyncWorkspace}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TaskDetailBody — shared detail view used in the desktop panel & mobile modal
// ---------------------------------------------------------------------------
interface TaskDetailBodyProps {
  task: Task;
  onUpdateStatus: (
    id: string,
    status: TaskStatus,
    remarks?: string,
    attachmentUrl?: string,
    attachmentName?: string
  ) => void;
  onSyncWorkspace?: (task: Task) => void;
}

const TaskDetailBody: React.FC<TaskDetailBodyProps> = ({ task, onUpdateStatus, onSyncWorkspace }) => {
  const [statusVal, setStatusVal] = useState<TaskStatus>(
    task.status === 'Pending' ? 'In Progress' : task.status
  );
  const [remarks, setRemarks] = useState(task.completionRemarks || task.remarks || '');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Staff cannot mark Complete directly — route through Submitted for approval
    const target = statusVal === 'Completed' ? 'Submitted' : statusVal;
    onUpdateStatus(task.id, target, remarks, attachmentUrl, attachmentName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAttachmentName(f.name);
      setAttachmentUrl(URL.createObjectURL(f));
    }
  };


  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {task.id}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.groupName && (
            <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Users className="w-3 h-3 text-purple-600" />
              {task.groupName}
            </span>
          )}
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Delegation banner */}
      {task.assignedByRole && (
        <div
          className={`mb-3 p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
            task.assignedByRole === 'principal'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
          }`}
        >
          <span className="font-bold shrink-0">
            {task.assignedByRole === 'principal' ? '👑 Principal' : '🎓 HOD'}
          </span>
          <span className="truncate">→ {task.assignedToName || 'You'}</span>
        </div>
      )}

      <h2 className="font-bold text-base text-slate-900 dark:text-white leading-snug mb-2">{task.title}</h2>

      {/* Description */}
      <div className="mb-4">
        <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          Description &amp; Requirements
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <UserIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            Assigned By: <strong className="text-slate-800 dark:text-slate-200">{task.assignedByName || 'HOD'}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{task.className || 'General Dept.'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Assigned: {task.assignedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            Target: <strong className="text-slate-800 dark:text-slate-200">{task.targetDate}</strong>
          </span>
        </div>
      </div>

      {/* Submitted banner */}
      {task.status === 'Submitted' && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Submitted for approval{task.submittedDate ? ` on ${task.submittedDate}` : ''} — awaiting HOD review.
          </span>
        </div>
      )}


      {/* Remarks / attachment / approval */}
      {(task.remarks || task.completionRemarks || task.approvedBy || task.attachmentName) && (
        <div className="mb-4 space-y-1.5 text-xs p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          {task.remarks && (
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-blue-700 dark:text-blue-400">HOD Remarks:</strong> {task.remarks}
            </p>
          )}
          {task.completionRemarks && (
            <p className="text-slate-700 dark:text-slate-300">
              <strong className="text-emerald-700 dark:text-emerald-400">Completion Remarks:</strong> {task.completionRemarks}
            </p>
          )}
          {task.approvedBy && task.status === 'Completed' && (
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              ✓ Approved by {task.approvedBy}
              {task.approvedDate ? ` on ${task.approvedDate}` : ''}
            </p>
          )}
          {task.attachmentName && (
            <p className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> {task.attachmentName}
            </p>
          )}
        </div>
      )}

      {/* Google sync links */}
      {(task.googleCalendarLink || task.googleTasksLink || task.googleClassroomLink) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
          {task.googleCalendarLink && (
            <a href={task.googleCalendarLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <Calendar className="w-3.5 h-3.5" /> Calendar <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {task.googleTasksLink && (
            <a href={task.googleTasksLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              <CheckSquare className="w-3.5 h-3.5" /> Tasks <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {task.googleClassroomLink && (
            <a href={task.googleClassroomLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              <BookOpen className="w-3.5 h-3.5" /> Classroom <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {onSyncWorkspace && (
            <button
              onClick={() => onSyncWorkspace(task)}
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 font-semibold transition-colors"
            >
              <Share2 className="w-3 h-3" /> Sync Google Workspace
            </button>
          )}
        </div>
      )}


      {/* Inline status update form */}
      <form onSubmit={submit} className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          Update Progress
        </h4>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Status</label>
          <select
            value={statusVal}
            onChange={(e) => setStatusVal(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submit for Approval</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {statusVal === 'Submitted' && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Your submission will be sent to HOD for approval.</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Remarks / Proof Summary</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter work done summary, links, or progress remarks..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Upload Proof Document / Image</label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center hover:border-blue-500 transition-colors">
            <input type="file" onChange={onFile} className="hidden" id={`proof-${task.id}`} />
            <label htmlFor={`proof-${task.id}`} className="cursor-pointer flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400">
              <Upload className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">Click to choose proof document (PDF / Image)</span>
              <span className="text-[10px]">{attachmentName ? `Selected: ${attachmentName}` : 'Upload report, sign sheet, or output file'}</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Saved &amp; synced to database
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <MessageSquare className="w-3 h-3" /> Changes are saved to the system database.
            </span>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {statusVal === 'Submitted' ? 'Submit for Approval' : 'Save Progress'}
          </button>
        </div>
      </form>
    </div>
  );
};

