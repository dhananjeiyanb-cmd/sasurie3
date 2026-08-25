import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PdtEntry } from '../types';
import { exportElementToPDF, exportToExcel } from '../utils/exportUtils';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle,
  X,
  Save,
  Activity,
  FileText,
  Briefcase,
  Users
} from 'lucide-react';

export const PdtView: React.FC = () => {
  const { pdtEntries, addPdtEntry, updatePdtEntry, deletePdtEntry, currentUser, addTask, staffList } = useApp();

  const canEdit = currentUser?.role !== 'secretary' && currentUser?.role !== 'secretary_pa';

  // Date selection (default to today)
  const todayStr = new Date().toISOString().split('T')[0];

  // Follow Up state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [parentMeeting, setParentMeeting] = useState<PdtEntry | null>(null);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDescription, setFollowUpDescription] = useState('');
  const [followUpTargetDate, setFollowUpTargetDate] = useState(todayStr);
  const [followUpPriority, setFollowUpPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [followUpAssignee, setFollowUpAssignee] = useState('all_hods');

  const hods = useMemo(() => {
    return staffList.filter(
      (s) =>
        s.role === 'admin' ||
        s.id.startsWith('HOD') ||
        (s.designation && s.designation.toLowerCase().includes('hod')) ||
        (s.designation && s.designation.toLowerCase().includes('head of department'))
    );
  }, [staffList]);

  // Date selection (default to today)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PdtEntry | null>(null);

  // Form inputs
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<'Task' | 'Meeting'>('Meeting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PdtEntry['status']>('Scheduled');
  const [remarks, setRemarks] = useState('');

  // Filter entries for the selected date
  const filteredEntries = useMemo(() => {
    return pdtEntries
      .filter((entry) => {
        const matchesDate = entry.date === selectedDate;
        
        // Filter by institution if the user is a Principal or Principal PA
        const isPrincipalUser = currentUser?.role === 'principal' || currentUser?.role === 'principal_pa';
        const matchesInstitution = !isPrincipalUser || !entry.institution || !currentUser?.institution || entry.institution === currentUser.institution;

        const matchesSearch =
          !searchQuery ||
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesInstitution && matchesSearch;
      })
      .sort((a, b) => a.time.localeCompare(b.time)); // Chronological order
  }, [pdtEntries, selectedDate, searchQuery, currentUser]);

  // Aggregate values
  const stats = useMemo(() => {
    const total = filteredEntries.length;
    const tasks = filteredEntries.filter((e) => e.type === 'Task');
    const meetings = filteredEntries.filter((e) => e.type === 'Meeting');
    const completed = filteredEntries.filter((e) => e.status === 'Completed').length;
    return {
      total,
      tasksCount: tasks.length,
      meetingsCount: meetings.length,
      completed,
      pending: total - completed,
    };
  }, [filteredEntries]);

  // Reset form
  const resetForm = () => {
    setTime('09:05');
    setType('Meeting');
    setTitle('');
    setDescription('');
    setStatus('Scheduled');
    setRemarks('');
    setEditingEntry(null);
  };

  const handleOpenFollowUpModal = (entry: PdtEntry) => {
    setParentMeeting(entry);
    setFollowUpTitle(`Follow-up from Meeting: ${entry.title}`);
    setFollowUpDescription(`Action items from meeting on ${entry.time}: ${entry.description}`);
    setFollowUpTargetDate(entry.date);
    setFollowUpPriority('Medium');
    setFollowUpAssignee('all_hods');
    setIsFollowUpModalOpen(true);
  };

  const handleCreateFollowUpTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTitle.trim()) return;

    // 1. Assign Task in HOD Task Manager
    if (followUpAssignee === 'all_hods') {
      if (hods.length > 0) {
        hods.forEach((hod) => {
          addTask({
            title: followUpTitle,
            description: followUpDescription,
            assignedToStaffId: hod.id,
            assignedToName: `${hod.facultyName} (HOD - ${hod.department})`,
            priority: followUpPriority,
            targetDate: followUpTargetDate,
            status: 'Pending',
            groupName: 'HODs Group',
            isGroupTask: true,
            department: hod.department,
          });
        });
      }

      // Add HODs Group Broadcast Master Task
      addTask({
        title: `${followUpTitle} [HODs Group Broadcast]`,
        description: followUpDescription,
        assignedToStaffId: 'GROUP_HODS',
        assignedToName: 'HODs Group (All Department HODs)',
        priority: followUpPriority,
        targetDate: followUpTargetDate,
        status: 'Pending',
        groupName: 'HODs Group',
        isGroupTask: true,
      });
    } else {
      const selectedHod = hods.find((h) => h.id === followUpAssignee);
      if (selectedHod) {
        addTask({
          title: followUpTitle,
          description: followUpDescription,
          assignedToStaffId: selectedHod.id,
          assignedToName: `${selectedHod.facultyName} (HOD - ${selectedHod.department})`,
          priority: followUpPriority,
          targetDate: followUpTargetDate,
          status: 'Pending',
          department: selectedHod.department,
        });
      }
    }

    // 2. Auto-log Follow-up PDT task entry
    const timeNow = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    addPdtEntry({
      date: selectedDate,
      time: timeNow,
      type: 'Task',
      title: `Follow-up: ${followUpTitle}`,
      description: `Follow-up task assigned to HODs: ${followUpDescription}`,
      status: 'Scheduled',
      remarks: `Follow-up from meeting: "${parentMeeting?.title || ''}"`,
    });

    // Close and reset
    setIsFollowUpModalOpen(false);
    setParentMeeting(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: PdtEntry) => {
    setEditingEntry(entry);
    setTime(entry.time);
    setType(entry.type);
    setTitle(entry.title);
    setDescription(entry.description);
    setStatus(entry.status);
    setRemarks(entry.remarks || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    const payload = {
      date: selectedDate,
      time,
      type,
      title,
      description,
      status,
      remarks,
    };

    if (editingEntry) {
      updatePdtEntry(editingEntry.id, payload);
    } else {
      addPdtEntry(payload);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tracker entry?')) {
      deletePdtEntry(id);
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    exportElementToPDF('pdt-report-print-area', `PDT_Report_${selectedDate}`);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredEntries.map((e) => ({
      Date: e.date,
      Time: e.time,
      Type: e.type,
      Title: e.title,
      Description: e.description,
      Status: e.status,
      Remarks: e.remarks || '',
    }));
    exportToExcel(dataToExport, `PDT_Report_${selectedDate}`, 'Daily Activity Tracker');
  };

  // Utility to style status badge
  const getStatusBadgeClass = (s: PdtEntry['status']) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'Scheduled':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Postponed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            PDT (Principal Daily Tracker)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Log and manage principal schedules, meetings, and daily task trackers for reporting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            PDF Report
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>
        </div>
      </div>

      {/* Date and Search Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm print:hidden">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Select Track Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Search Activities
          </label>
          <input
            type="text"
            placeholder="Search by title, description, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Items</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Meetings Scheduled</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.meetingsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Tasks Tracked</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.tasksCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm col-span-2 lg:col-span-1 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Pending / Active</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden print:hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Schedule Timeline ({new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' })})
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
            {filteredEntries.length} Items
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No activities scheduled</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-1">
              There are no tasks or meetings logged for this date. Click "Add Entry" to log a schedule.
            </p>
          </div>
        ) : (
          <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="flex gap-4 items-start">
                  {/* Time box */}
                  <div className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl min-w-[76px] font-mono text-sm font-bold shadow-sm">
                    <Clock className="w-4 h-4 mb-1" />
                    {entry.time}
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        entry.type === 'Meeting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {entry.type}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{entry.title}</h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{entry.description}</p>
                    {entry.remarks && (
                      <div className="text-xs bg-slate-50 dark:bg-slate-800/40 border-l-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 mt-2 rounded-r-lg max-w-xl text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Remarks:</strong> {entry.remarks}
                      </div>
                    )}
                    {entry.type === 'Meeting' && canEdit && (
                      <div className="mt-2.5">
                        <button
                          onClick={() => handleOpenFollowUpModal(entry)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 hover:text-indigo-800 dark:text-indigo-400 text-xs font-bold transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Assign Follow-up Task to HODs
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit / Delete actions */}
                {canEdit && (
                  <div className="flex items-center gap-1.5 self-end md:self-start">
                    <button
                      onClick={() => handleOpenEditModal(entry)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                      title="Edit entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Printable Report Section */}
      <div id="pdt-report-print-area" className="hidden print:block bg-white text-black p-10 font-sans max-w-4xl mx-auto shadow-none border border-slate-300 rounded-none space-y-8">
        {/* Letterhead */}
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h2 className="text-2xl font-black tracking-wide uppercase">Sasurie College of Engineering</h2>
          <p className="text-xs">Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai</p>
          <p className="text-xs text-slate-600">Vijayamangalam, Tiruppur - 638 056, Tamil Nadu</p>
          <div className="pt-3">
            <span className="border border-black px-4 py-1.5 rounded-lg text-sm font-extrabold uppercase tracking-widest bg-slate-50">
              Principal's Office - Daily Activity Report (PDT)
            </span>
          </div>
        </div>

        {/* Metadata info */}
        <div className="grid grid-cols-2 gap-4 text-sm font-semibold border-b pb-4">
          <div>
            <p><span className="text-slate-500">Date of Report:</span> {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
            <p><span className="text-slate-500">Generated By:</span> {currentUser?.name || 'College Principal'}</p>
          </div>
          <div className="text-right">
            <p><span className="text-slate-500">Role:</span> Principal / Admin</p>
            <p><span className="text-slate-500">Status Count:</span> {stats.completed} Completed, {stats.pending} Pending</p>
          </div>
        </div>

        {/* Daily activities table */}
        <div className="space-y-4">
          <h3 className="text-base font-bold underline">List of Scheduled Tasks & Meetings:</h3>
          {filteredEntries.length === 0 ? (
            <p className="text-sm italic text-slate-500">No scheduled activities recorded on this date.</p>
          ) : (
            <table className="w-full border-collapse border border-slate-400 text-sm animate-fade-in">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-400 p-2 text-left w-20">Time</th>
                  <th className="border border-slate-400 p-2 text-left w-24">Type</th>
                  <th className="border border-slate-400 p-2 text-left">Activity Title & Description</th>
                  <th className="border border-slate-400 p-2 text-left w-28">Status</th>
                  <th className="border border-slate-400 p-2 text-left w-40">Remarks / Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{e.time}</td>
                    <td className="border border-slate-400 p-2 uppercase font-extrabold text-xs">{e.type}</td>
                    <td className="border border-slate-400 p-2">
                      <div className="font-bold">{e.title}</div>
                      <div className="text-xs text-slate-700 mt-1">{e.description}</div>
                    </td>
                    <td className="border border-slate-400 p-2 font-semibold text-xs">{e.status}</td>
                    <td className="border border-slate-400 p-2 text-xs">{e.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Print Signatures */}
        <div className="pt-20 grid grid-cols-2 gap-10 text-sm font-bold">
          <div>
            <div className="border-t border-black w-48 text-center pt-1.5">Prepared By</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="border-t border-black w-48 text-center pt-1.5">College Principal</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-extrabold text-slate-950 dark:text-white text-lg">
                {editingEntry ? 'Edit Tracker Entry' : 'Add Daily Activity'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Activity Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Meeting' | 'Task')}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Meeting">Meeting / Appointment</option>
                    <option value="Task">Office Task / Event</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ISO External Audit Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter details of the schedule or discussion items..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Postponed">Postponed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Remarks / Follow-up Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Next review on Monday, files handed over to HOD"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Follow Up Task Modal */}
      {isFollowUpModalOpen && parentMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <button
              onClick={() => {
                setIsFollowUpModalOpen(false);
                setParentMeeting(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-indigo-650" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Follow-Up HOD Task</h3>
            </div>

            <form onSubmit={handleCreateFollowUpTask} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter task title"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Task Description / Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed action items or instructions..."
                  value={followUpDescription}
                  onChange={(e) => setFollowUpDescription(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Assign To HOD
                </label>
                <select
                  value={followUpAssignee}
                  onChange={(e) => setFollowUpAssignee(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                >
                  <option value="all_hods">👥 All HODs (Group Broadcast)</option>
                  {hods.map((hod) => (
                    <option key={hod.id} value={hod.id}>
                      👤 {hod.facultyName} ({hod.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpTargetDate}
                    onChange={(e) => setFollowUpTargetDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Priority
                  </label>
                  <select
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value as any)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFollowUpModalOpen(false);
                    setParentMeeting(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

