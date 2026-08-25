import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SystemLog } from '../types';
import {
  Search,
  Filter,
  Calendar,
  LogIn,
  LogOut,
  PlusCircle,
  Edit2,
  Trash2,
  HelpCircle,
  Database,
  ArrowDownAz,
  FileText,
} from 'lucide-react';

export const LogsView: React.FC = () => {
  const { systemLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Available filter options
  const filterOptions = [
    { value: 'all', label: 'All Action Types' },
    { value: 'login', label: 'Logins' },
    { value: 'logoff', label: 'Logoffs' },
    { value: 'create', label: 'Creations' },
    { value: 'update', label: 'Updates' },
    { value: 'delete', label: 'Deletions' },
    { value: 'other', label: 'Others' },
  ];

  // Helper to format date label
  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper to get relative time formatting (e.g. 10:15 AM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Icon mapping for action type
  const getActionIcon = (type: SystemLog['actionType']) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'logoff':
        return <LogOut className="w-4 h-4 text-slate-500" />;
      case 'create':
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'update':
        return <Edit2 className="w-4 h-4 text-amber-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
    }
  };

  // Badge class mapping for action type
  const getActionBadgeClass = (type: SystemLog['actionType']) => {
    switch (type) {
      case 'login':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'logoff':
        return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
      case 'create':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'update':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'delete':
        return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
      default:
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
    }
  };

  // Badge class mapping for user role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-600/15 text-blue-400 border border-blue-500/20';
      case 'principal':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'secretary':
        return 'bg-red-500/15 text-red-400 border border-red-500/20';
      case 'staff':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-600/15 text-slate-400 border border-slate-500/10';
    }
  };

  // Filtered and grouped system logs
  const filteredAndGroupedLogs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const filtered = systemLogs.filter((log) => {
      // 1) Search Query filter
      const matchesSearch =
        (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.userRole || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 2) Action filter
      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;

      // 3) Date filter
      const logDate = log.timestamp.split('T')[0];
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = logDate === today;
      } else if (dateFilter === 'yesterday') {
        matchesDate = logDate === yesterday;
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesDate = new Date(log.timestamp) >= oneWeekAgo;
      } else if (dateFilter === 'custom') {
        matchesDate = logDate === customDate;
      }

      return matchesSearch && matchesAction && matchesDate;
    });

    // Group logs by date
    const groups: { [date: string]: SystemLog[] } = {};
    filtered.forEach((log) => {
      const dateKey = log.timestamp.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((date) => ({
      date,
      formattedDate: formatDateLabel(date),
      logs: groups[date],
    }));
  }, [systemLogs, searchQuery, actionFilter, dateFilter, customDate]);

  const totalLogsCount = useMemo(() => {
    return filteredAndGroupedLogs.reduce((sum, g) => sum + g.logs.length, 0);
  }, [filteredAndGroupedLogs]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            System Audit & Activity Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time administrative ledger of authentication triggers, database modifications, and actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-semibold text-slate-300">
            {totalLogsCount} Records Displayed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl mb-6">
        {/* Search Input */}
        <div className={`relative ${dateFilter === 'custom' ? 'md:col-span-5' : 'md:col-span-6'}`}>
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, role, email, description details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Type Dropdown */}
        <div className={`relative ${dateFilter === 'custom' ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-3 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
        </div>

        {/* Date Filter Dropdown */}
        <div className={`relative ${dateFilter === 'custom' ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="yesterday">Yesterday Only</option>
            <option value="week">Past 7 Days</option>
            <option value="custom">Specific Date...</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-3 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
        </div>

        {/* Custom Date Input */}
        {dateFilter === 'custom' && (
          <div className="relative md:col-span-3">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
            />
          </div>
        )}
      </div>

      {/* Logs Display List */}
      {filteredAndGroupedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
          <FileText className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-400">No activity logs match your filter criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search terms or choosing 'All Action Types'.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndGroupedLogs.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date Header Tag */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {group.formattedDate}
                </span>
                <div className="flex-1 h-px bg-slate-800/80" />
                <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                  {group.logs.length} Events
                </span>
              </div>

              {/* Logs in this date group */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md divide-y divide-slate-800/60">
                {group.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Log Main Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Action Type Icon Card */}
                      <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0 mt-0.5">
                        {getActionIcon(log.actionType)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title Row: User name, role badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">
                            {log.userName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md bg-slate-950 px-1.5 py-0.5 rounded">
                            {log.userId}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${getRoleBadgeClass(log.userRole)}`}>
                            {log.userRole === 'admin' ? 'HOD' : log.userRole}
                          </span>
                        </div>

                        {/* Description Detail */}
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium break-words">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    {/* Metadata column (Action badge & Time) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t border-slate-800 sm:border-0 pt-2 sm:pt-0">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full select-none ${getActionBadgeClass(log.actionType)}`}>
                        {log.actionType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold select-none flex items-center gap-1">
                        <ArrowDownAz className="w-3 h-3 text-slate-600" />
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

