import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import { TaskStatusBadge, PriorityBadge } from '../components/StatusBadge';
import { GoogleWorkspaceModal } from '../components/GoogleWorkspaceModal';
import { isSameDept } from '../utils/departmentUtils';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Users,
  Sparkles,
  GraduationCap,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  ExternalLink,
  BookOpen,
  Share2,
} from 'lucide-react';

interface TaskManagementViewProps {
  isAssignModalOpen?: boolean;
  onCloseAssignModal?: () => void;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({
  isAssignModalOpen = false,
  onCloseAssignModal,
}) => {
  const {
    taskList,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    staffList,
    classList,
    currentUser,
    filterState,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [dateQuickFilter, setDateQuickFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [showAssignModal, setShowAssignModal] = useState(isAssignModalOpen);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Google Workspace Modal State
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceModalTask, setWorkspaceModalTask] = useState<Task | null>(null);

  // Status update modal state
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<TaskStatus>('Completed');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Form states for assign task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'group_hods' | 'group_faculty'>('individual');
  const [assignedToStaffId, setAssignedToStaffId] = useState(staffList[0]?.id || 'STF001');
  const [classId, setClassId] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  React.useEffect(() => {
    if (isAssignModalOpen) setShowAssignModal(true);
  }, [isAssignModalOpen]);

  const openAssignModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setAssignmentMode('individual');
    setAssignedToStaffId(staffList[0]?.id || '');
    setClassId('');
    setCustomClassName('');
    setPriority('Medium');
    setTargetDate(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
    setShowAssignModal(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description);
    setAssignmentMode(t.groupName === 'HODs Group' ? 'group_hods' : t.groupName === 'All Faculty' ? 'group_faculty' : 'individual');
    setAssignedToStaffId(t.assignedToStaffId);
    setClassId(t.classId || '');
    setCustomClassName(t.className || '');
    setPriority(t.priority);
    setTargetDate(t.targetDate);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    if (onCloseAssignModal) onCloseAssignModal();
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedStaff = staffList.find((s) => s.id === assignedToStaffId);
    const assignedClass = classList.find((c) => c.id === classId);
    let resolvedClassName = customClassName.trim();
    if (!resolvedClassName && assignedClass) {
      resolvedClassName = `${assignedClass.year} ${assignedClass.department.slice(0, 3)}-${assignedClass.section}`;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title,
        description,
        assignedToStaffId,
        assignedToName: assignedStaff?.facultyName || 'Staff Member',
        classId,
        className: resolvedClassName || undefined,
        priority,
        targetDate,
      });
    } else {
      if (isPrincipal && assignmentMode === 'group_hods') {
        // Find all HOD staff members
        const hodsList = staffList.filter(
          (s) =>
            s.role === 'admin' ||
            s.id.startsWith('HOD') ||
            (s.designation && s.designation.toLowerCase().includes('hod')) ||
            (s.designation && s.designation.toLowerCase().includes('head of department'))
        );

        if (hodsList.length > 0) {
          hodsList.forEach((hod) => {
            addTask({
              title,
              description,
              assignedToStaffId: hod.id,
              assignedToName: `${hod.facultyName} (HOD - ${hod.department})`,
              classId,
              className: resolvedClassName || undefined,
              priority,
              targetDate,
              status: 'Pending',
              groupName: 'HODs Group',
              isGroupTask: true,
              department: hod.department,
            });
          });
        }

        // Always add master group task for GROUP_HODS
        addTask({
          title: `${title} [HODs Group Broadcast]`,
          description,
          assignedToStaffId: 'GROUP_HODS',
          assignedToName: 'HODs Group (All Department HODs)',
          classId,
          className: resolvedClassName || undefined,
          priority,
          targetDate,
          status: 'Pending',
          groupName: 'HODs Group',
          isGroupTask: true,
        });
      } else if (isPrincipal && assignmentMode === 'group_faculty') {
        staffList.forEach((s) => {
          addTask({
            title,
            description,
            assignedToStaffId: s.id,
            assignedToName: `${s.facultyName} (${s.department})`,
            classId,
            className: resolvedClassName || undefined,
            priority,
            targetDate,
            status: 'Pending',
            groupName: 'All Faculty',
            isGroupTask: true,
            department: s.department,
          });
        });
      } else {
        addTask({
          title,
          description,
          assignedToStaffId,
          assignedToName: assignedStaff
            ? `${assignedStaff.facultyName} (${assignedStaff.department})`
            : 'Staff Member',
          classId,
          className: resolvedClassName || undefined,
          priority,
          targetDate,
          status: 'Pending',
          department: assignedStaff?.department,
        });
      }
    }

    handleCloseAssignModal();
  };

  const openStatusUpdateModal = (task: Task, defaultStatus?: TaskStatus) => {
    setStatusModalTask(task);
    setUpdateStatusVal(defaultStatus || task.status);
    setUpdateRemarks(task.completionRemarks || task.remarks || '');
    setAttachmentName(task.attachmentName || '');
    setAttachmentUrl(task.attachmentUrl || '');
  };

  const isPrincipal = currentUser?.role === 'principal';
  const isHod = currentUser?.role === 'admin';
  const isSupervisor = isPrincipal || isHod;
  const isStaff = currentUser?.role === 'staff';
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const handleApproveTask = (task: Task) => {
    const approverLabel = isPrincipal ? 'Principal' : 'HOD';
    updateTaskStatus(
      task.id,
      'Completed',
      updateRemarks || task.completionRemarks || `Approved by ${approverLabel}.`,
      attachmentUrl || task.attachmentUrl,
      attachmentName || task.attachmentName
    );
    setStatusModalTask(null);
  };

  const handleRejectTask = (task: Task) => {
    const approverLabel = isPrincipal ? 'Principal' : 'HOD';
    updateTaskStatus(
      task.id,
      'In Progress',
      updateRemarks ? `${approverLabel} Feedback: ${updateRemarks}` : `Returned by ${approverLabel} for revisions.`,
      attachmentUrl || task.attachmentUrl,
      attachmentName || task.attachmentName
    );
    setStatusModalTask(null);
  };

  const handleStatusUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTask) return;

    // Faculty members cannot mark complete directly without Principal/HOD approval
    let targetStatus = updateStatusVal;
    if (!isSupervisor && targetStatus === 'Completed') {
      targetStatus = 'Submitted';
    }

    updateTaskStatus(
      statusModalTask.id,
      targetStatus,
      updateRemarks,
      attachmentUrl,
      attachmentName
    );

    setStatusModalTask(null);
  };

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setAttachmentUrl(URL.createObjectURL(file));
    }
  };

  const handleDeleteTask = (id: string, taskTitle: string) => {
    if (confirm(`Are you sure you want to delete task "${taskTitle}"?`)) {
      deleteTask(id);
    }
  };

  // Principal can assign tasks to ALL faculty across ALL departments
  // HOD can assign tasks to faculty in their department
  const availableStaffList = isPrincipal
    ? staffList
    : isHod
    ? staffList.filter((s) => isSameDept(s.department, hodDepartment))
    : staffList;

  const deptStaffIds = availableStaffList.map((s) => s.id);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const filteredTasks = taskList.filter((t) => {
    // If staff role, strictly enforce viewing only their assigned tasks
    if (currentUser?.role === 'staff') {
      const isMyTask =
        t.assignedToStaffId === currentUser.staffId ||
        t.assignedToName?.toLowerCase().includes(currentUser.name?.toLowerCase() || '');
      if (!isMyTask) return false;
    }

    // If HOD role (and not Principal), enforce department filter
    if (isHod && !isPrincipal) {
      const isDeptTask =
        deptStaffIds.includes(t.assignedToStaffId) ||
        availableStaffList.some((s) => s.facultyName.toLowerCase() === t.assignedToName?.toLowerCase());
      if (!isDeptTask) return false;
    }

    const q = (search || filterState.searchQuery).toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.assignedToName.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      (t.className && t.className.toLowerCase().includes(q));

    const matchesStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'remaining'
        ? t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue'
        : t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesStaff =
      currentUser?.role === 'staff'
        ? true
        : selectedStaffFilter === 'all' ||
          selectedStaffFilter === 'my' ||
          t.assignedToStaffId === selectedStaffFilter;

    let matchesDate = true;
    if (dateQuickFilter === 'today') {
      matchesDate = t.assignedDate === todayStr || t.targetDate === todayStr;
    } else if (dateQuickFilter === 'week') {
      matchesDate = t.targetDate >= weekStart;
    } else if (dateQuickFilter === 'month') {
      matchesDate = t.targetDate >= monthStart;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Faculty Task Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign duties, track completion workflow, upload proof documents, and monitor due dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setWorkspaceModalTask(null);
              setShowWorkspaceModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
            title="Sync All Tasks to Google Calendar & Google Classroom"
          >
            <Calendar className="w-4 h-4" />
            <BookOpen className="w-4 h-4" />
            <span>Sync Tasks to HOD Google Calendar</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
            <button
              onClick={openAssignModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, faculty, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Statuses ({taskList.length})</option>
              <option value="Submitted">⚡ Submitted for Approval ({taskList.filter((t) => t.status === 'Submitted').length})</option>
              <option value="remaining">⏳ Remaining Tasks ({taskList.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length})</option>
              <option value="Pending">Pending (Orange)</option>
              <option value="In Progress">In Progress (Blue)</option>
              <option value="Completed">Completed / Approved (Green)</option>
              <option value="Overdue">Overdue (Red)</option>
              <option value="Cancelled">Cancelled (Grey)</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            {currentUser?.role === 'staff' ? (
              <div className="w-full px-3 py-2 text-xs bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-900 dark:text-blue-300 font-bold truncate">
                📌 My Assigned Tasks ({currentUser.name})
              </div>
            ) : (
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Faculty & Group Assignments</option>
                <option value="group_hods">👥 HODs Group Tasks ({taskList.filter((t) => t.groupName === 'HODs Group' || t.assignedToStaffId === 'GROUP_HODS').length})</option>
                <option value="group_all">🏛️ All Group Broadcast Tasks ({taskList.filter((t) => t.isGroupTask || t.groupName).length})</option>
                {availableStaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.facultyName} ({s.id})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Date Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium shrink-0">Timeframe:</span>
          {(['all', 'today', 'week', 'month'] as const).map((df) => (
            <button
              key={df}
              onClick={() => setDateQuickFilter(df)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-colors shrink-0 ${
                dateQuickFilter === df
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {df === 'all' ? 'All Dates' : df === 'today' ? "Today's Tasks" : `This ${df}`}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            No tasks found matching current filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                task.status === 'Submitted'
                  ? 'border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                  : task.status === 'Overdue'
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : 'border-slate-200 dark:border-slate-700/80'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {task.id}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    {(task.isGroupTask || task.groupName || task.assignedToStaffId === 'GROUP_HODS') && (
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 shrink-0">
                        <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        {task.groupName || 'HODs Group'}
                      </span>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>

                {/* Staff Submitted Banner */}
                {task.status === 'Submitted' && (
                  <div className="mb-3 p-2.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Submitted by Staff — Awaiting HOD Approval</span>
                    </div>
                    {task.submittedDate && (
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono font-semibold shrink-0">
                        {task.submittedDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Title & Description */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  {task.description}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      Assigned: <strong className="text-slate-800 dark:text-slate-200">{task.assignedToName}</strong>
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
                    <span>Target: <strong className="text-slate-800 dark:text-slate-200">{task.targetDate}</strong></span>
                  </div>
                </div>

                {/* Remarks / Attachment block */}
                {(task.remarks || task.completionRemarks || task.attachmentName || task.approvedBy) && (
                  <div className="space-y-1.5 text-xs p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 mb-3">
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
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                        ✓ Approved by {task.approvedBy} {task.approvedDate ? `on ${task.approvedDate}` : ''}
                      </p>
                    )}
                    {task.attachmentName && (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold pt-1">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Attachment: {task.attachmentName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Calendar & Classroom Sync Badges */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 mb-3">
                  <div className="flex items-center gap-2">
                    {task.googleCalendarLink ? (
                      <a
                        href={task.googleCalendarLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        title="View event in Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Calendar Event <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Calendar
                      </span>
                    )}

                    {task.googleTasksId ? (
                      <a
                        href="https://tasks.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                        title="View task in Google Tasks"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Google Tasks <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5" /> Tasks
                      </span>
                    )}

                    {task.googleClassroomLink ? (
                      <a
                        href={task.googleClassroomLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        title="View assignment in Google Classroom"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Classroom <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Classroom
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setWorkspaceModalTask(task);
                      setShowWorkspaceModal(true);
                    }}
                    className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3 h-3" /> Sync Google Workspace
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                {isHod ? (
                  <>
                    <div className="flex items-center gap-2">
                      {task.status === 'Submitted' ? (
                        <button
                          onClick={() => openStatusUpdateModal(task, 'Completed')}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Check & Approve Task
                        </button>
                      ) : (
                        <button
                          onClick={() => openStatusUpdateModal(task)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Update Status / Remarks
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Edit Task Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1 transition-colors"
                        title="Delete Task (HOD)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    {task.status === 'Submitted' ? (
                      <button
                        onClick={() => openStatusUpdateModal(task)}
                        className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        Submitted (Awaiting HOD Approval)
                      </button>
                    ) : task.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> HOD Approved & Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => openStatusUpdateModal(task, 'Submitted')}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Submit Task for HOD Approval
                      </button>
                    )}

                    <button
                      onClick={() => openStatusUpdateModal(task)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      View / Upload Proof
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign / Edit Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingTask
                  ? 'Edit Task Assignment'
                  : isPrincipal
                  ? 'Assign New Faculty Task (Principal Portal)'
                  : 'Assign New Faculty Task (HOD Portal)'}
              </h3>
              <button onClick={handleCloseAssignModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              {isPrincipal && !editingTask && (
                <div className="bg-gradient-to-r from-amber-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      Principal Assignment Target:
                    </label>
                    <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                      Principal Exclusive
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('individual')}
                      className={`px-2 py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 border ${
                        assignmentMode === 'individual'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Individual
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignmentMode('group_hods')}
                      className={`px-2 py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 border ${
                        assignmentMode === 'group_hods'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-400/40'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      HODs Group
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignmentMode('group_faculty')}
                      className={`px-2 py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 border ${
                        assignmentMode === 'group_faculty'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      All Faculty
                    </button>
                  </div>

                  {assignmentMode === 'group_hods' && (
                    <div className="p-2 rounded-lg bg-purple-100/90 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">👥 HODs Group Broadcast Active:</strong>
                        This task will be automatically dispatched to ALL Department HODs simultaneously. Every HOD login (AI&DS, ECE, CSE, EEE, MECH, Civil, MBA, S&H, etc.) will see and execute this task in their portal!
                      </div>
                    </div>
                  )}

                  {assignmentMode === 'group_faculty' && (
                    <div className="p-2 rounded-lg bg-indigo-100/90 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">🏛️ All Faculty Broadcast Active:</strong>
                        This task will be dispatched to every active faculty member across all departments in the institution.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Semester Question Paper Submission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Description & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide clear details and instructions for the assigned faculty..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign To * {isPrincipal && assignmentMode === 'individual' && <span className="text-[10px] text-amber-600 font-bold">(All Departments)</span>}
                  </label>
                  {assignmentMode === 'group_hods' ? (
                    <div className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>HODs Group (All Department HODs)</span>
                    </div>
                  ) : assignmentMode === 'group_faculty' ? (
                    <div className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 rounded-lg text-indigo-900 dark:text-indigo-200 font-bold text-xs flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>All Faculty Members (Institution Wide)</span>
                    </div>
                  ) : (
                    <select
                      value={assignedToStaffId}
                      onChange={(e) => setAssignedToStaffId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    >
                      {availableStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.facultyName} — {s.department} ({s.designation || s.id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Associated Class (Optional)</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Select or type class</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClassId(val);
                      if (val === 'custom') {
                        setCustomClassName('');
                      } else {
                        const foundClass = classList.find((c) => c.id === val);
                        if (foundClass) {
                          setCustomClassName(`${foundClass.year} ${foundClass.department.slice(0, 3)}-${foundClass.section}`);
                        } else {
                          setCustomClassName('');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none mb-1.5"
                  >
                    <option value="">General Department Duty (No specific class)</option>
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.year} {c.department.slice(0, 3)}-{c.section} (Room {c.roomNumber})
                      </option>
                    ))}
                    <option value="custom">✏️ Custom Class / Other...</option>
                  </select>

                  {(classId === 'custom' || (!classId && customClassName)) && (
                    <input
                      type="text"
                      placeholder="e.g. I CSE-A, II AI&DS, III CSE, IV ECE..."
                      value={customClassName}
                      onChange={(e) => setCustomClassName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none text-xs font-medium"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md"
                >
                  {editingTask ? 'Save Task Updates' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status & Upload Proof Modal */}
      {statusModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isPrincipal
                    ? 'Principal Task Review & Approval'
                    : isHod
                    ? 'HOD Task Review & Approval'
                    : 'Submit Task & Upload Proof'}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">Task ID: {statusModalTask.id}</p>
              </div>
              <button
                onClick={() => setStatusModalTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {statusModalTask.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {statusModalTask.description}
                </p>
                <div className="flex items-center justify-between pt-1.5 text-[11px] text-slate-500 font-medium">
                  <span>Faculty: <strong className="text-slate-800 dark:text-slate-200">{statusModalTask.assignedToName}</strong></span>
                  <span>Target Date: <strong className="text-slate-800 dark:text-slate-200">{statusModalTask.targetDate}</strong></span>
                </div>
              </div>

              {/* Highlight Banner if Submitted */}
              {statusModalTask.status === 'Submitted' && (
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Staff Submitted Task — Awaiting {isPrincipal ? 'Principal' : 'HOD'} Approval</span>
                  </div>
                  <p className="text-[11px] text-purple-800 dark:text-purple-300 leading-relaxed">
                    {isSupervisor
                      ? 'Review the staff completion notes & proof document below. Approve to mark completed or reject to request revision.'
                      : `Your submission is recorded. Waiting for ${isPrincipal ? 'Principal' : 'HOD'} review & final approval.`}
                  </p>
                  {statusModalTask.submittedDate && (
                    <p className="text-[10px] font-mono text-purple-700 dark:text-purple-400">
                      Submitted on: {statusModalTask.submittedDate}
                    </p>
                  )}
                </div>
              )}

              {/* Supervisor Quick Approval Actions */}
              {isSupervisor && statusModalTask.status === 'Submitted' && (
                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs block">
                    ⚡ {isPrincipal ? 'Principal' : 'HOD'} Decision Actions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveTask(statusModalTask)}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectTask(statusModalTask)}
                      className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Reject / Request Revision
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Status
                </label>
                <select
                  value={updateStatusVal}
                  onChange={(e) => setUpdateStatusVal(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Pending">Pending (Orange)</option>
                  <option value="In Progress">In Progress (Blue)</option>
                  <option value="Submitted">Submitted (Awaiting Approval - Purple)</option>
                  {isSupervisor && <option value="Completed">Completed / Approved (Green)</option>}
                  <option value="Cancelled">Cancelled (Grey)</option>
                </select>
                {!isSupervisor && updateStatusVal === 'Completed' && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    Note: Faculty submissions are sent to Principal / HOD as "Submitted" for final approval before marking Completed.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isSupervisor ? `${isPrincipal ? 'Principal' : 'HOD'} Remarks / Approval Notes` : 'Completion Remarks / Proof Summary'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    isSupervisor
                      ? `Enter ${isPrincipal ? 'Principal' : 'HOD'} feedback, approval notes, or guidelines for faculty...`
                      : 'Enter work done summary, links, or progress remarks...'
                  }
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Proof Document / Image
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUploadSimulated}
                    className="hidden"
                    id="proof-file-upload"
                  />
                  <label
                    htmlFor="proof-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
                  >
                    <Upload className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                      Click to choose proof document (PDF / Image)
                    </span>
                    <span className="text-[10px]">
                      {attachmentName ? `Selected: ${attachmentName}` : 'Upload report, sign sheet, or output file'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                {isHod ? (
                  <button
                    type="button"
                    onClick={() => {
                      const tId = statusModalTask.id;
                      const tTitle = statusModalTask.title;
                      setStatusModalTask(null);
                      handleDeleteTask(tId, tTitle);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalTask(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md"
                  >
                    {isHod
                      ? 'Save Status & Remarks'
                      : updateStatusVal === 'Submitted'
                      ? 'Submit Task for HOD Approval'
                      : 'Save Progress'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Workspace Integration Modal */}
      <GoogleWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        selectedTask={workspaceModalTask}
      />
    </div>
  );
};
