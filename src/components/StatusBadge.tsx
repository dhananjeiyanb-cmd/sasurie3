import React from 'react';
import { TaskStatus, TaskPriority, ObservationRating, StaffStatus } from '../types';

interface StatusBadgeProps {
  status: TaskStatus;
}

export const TaskStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClasses = '';

  switch (status) {
    case 'Pending':
      // Orange
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700';
      break;
    case 'In Progress':
      // Blue
      colorClasses = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700';
      break;
    case 'Submitted':
      // Purple (Pending HOD Approval)
      colorClasses = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700 font-semibold';
      break;
    case 'Completed':
      // Green
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700';
      break;
    case 'Overdue':
      // Red
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700 font-semibold animate-pulse';
      break;
    case 'Cancelled':
      // Grey
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'Pending'
            ? 'bg-amber-500'
            : status === 'In Progress'
            ? 'bg-blue-500'
            : status === 'Submitted'
            ? 'bg-purple-500'
            : status === 'Completed'
            ? 'bg-emerald-500'
            : status === 'Overdue'
            ? 'bg-rose-500'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  let style = '';
  if (priority === 'High') {
    style = 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
  } else if (priority === 'Medium') {
    style = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
  } else {
    style = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300';
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${style}`}>
      {priority === 'High' ? 'HIGH' : priority === 'Medium' ? 'MED' : 'LOW'}
    </span>
  );
};

export const ObservationBadge: React.FC<{ rating: ObservationRating }> = ({ rating }) => {
  let style = '';
  switch (rating) {
    case 'Excellent':
      style = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      break;
    case 'Good':
      style = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
      break;
    case 'Average':
      style = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      break;
    case 'Needs Improvement':
      style = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      break;
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {rating}
    </span>
  );
};

export const StaffStatusBadge: React.FC<{ status: StaffStatus }> = ({ status }) => {
  const isOk = status === 'Active';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        isOk
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOk ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
};
