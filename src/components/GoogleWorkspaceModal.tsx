import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import {
  googleSignIn,
  getCachedAccessToken,
  initWorkspaceAuth,
  googleSignOut,
  addTaskToGoogleCalendar,
  addTaskToGoogleTasks,
  fetchClassroomCourses,
  createClassroomAssignment,
  ClassroomCourse,
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Send,
  Sparkles,
  CheckSquare,
  ListTodo,
  Mail,
} from 'lucide-react';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask?: Task | null;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  selectedTask,
}) => {
  const { updateTaskStatus, taskList, dailyReport } = useApp();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Classroom Courses state
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Target task to sync
  const [activeTask, setActiveTask] = useState<Task | null>(selectedTask || null);

  useEffect(() => {
    setActiveTask(selectedTask || null);
  }, [selectedTask]);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (accessToken && user) {
      loadCourses();
    }
  }, [accessToken, user]);

  const loadCourses = async () => {
    if (!accessToken) return;
    setLoadingCourses(true);
    try {
      const courseList = await fetchClassroomCourses(accessToken);
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      setSuccessMsg('Signed in with Google successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setCourses([]);
  };

  // Sync ALL tasks to Google Calendar
  const handleSyncAllToCalendar = async () => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }

    if (taskList.length === 0) {
      setError('No tasks available to sync.');
      return;
    }

    const confirmed = window.confirm(
      `Confirm adding ALL ${taskList.length} tasks to HOD's Google Calendar?\n\nThis will create event entries for all department tasks.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    let syncedCount = 0;
    let failedCount = 0;

    for (const taskItem of taskList) {
      try {
        const result = await addTaskToGoogleCalendar(taskItem, accessToken);
        updateTaskStatus(taskItem.id, taskItem.status, taskItem.remarks, {
          googleCalendarEventId: result.eventId,
          googleCalendarLink: result.htmlLink,
        });
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync task ${taskItem.id}:`, err);
        failedCount++;
      }
    }

    if (failedCount > 0) {
      setSuccessMsg(`Synced ${syncedCount} tasks to Google Calendar (${failedCount} failed).`);
    } else {
      setSuccessMsg(`Successfully synced all ${syncedCount} tasks to Google Calendar!`);
    }
    setLoading(false);
  };

  // Sync task to Google Calendar
  const handleSyncToCalendar = async (taskToSync: Task) => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }

    const confirmed = window.confirm(
      `Confirm adding event to Google Calendar for:\n\n"${taskToSync.title}"\nDue Date: ${taskToSync.targetDate}`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await addTaskToGoogleCalendar(taskToSync, accessToken);
      updateTaskStatus(taskToSync.id, taskToSync.status, taskToSync.remarks, {
        googleCalendarEventId: result.eventId,
        googleCalendarLink: result.htmlLink,
      });

      setSuccessMsg(`Successfully added "${taskToSync.title}" to Google Calendar!`);
    } catch (err: any) {
      setError(err.message || 'Failed to sync event to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Sync task to Google Tasks
  const handleSyncToTasks = async (taskToSync: Task) => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await addTaskToGoogleTasks(taskToSync, accessToken);
      updateTaskStatus(taskToSync.id, taskToSync.status, taskToSync.remarks, {
        googleTasksId: result.taskId,
        googleTasksLink: result.selfLink,
      });

      setSuccessMsg(`Successfully added "${taskToSync.title}" to HOD's Google Tasks!`);
    } catch (err: any) {
      setError(err.message || 'Failed to sync task to Google Tasks');
    } finally {
      setLoading(false);
    }
  };

  // Sync ALL tasks to Google Tasks
  const handleSyncAllToTasks = async () => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }

    if (taskList.length === 0) {
      setError('No tasks available to sync.');
      return;
    }

    const confirmed = window.confirm(
      `Confirm adding ALL ${taskList.length} tasks to HOD (${dailyReport.hodEmail || 'hod.cse@apex.edu.in'}) Google Tasks?`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    let syncedCount = 0;
    let failedCount = 0;

    for (const taskItem of taskList) {
      try {
        const result = await addTaskToGoogleTasks(taskItem, accessToken);
        updateTaskStatus(taskItem.id, taskItem.status, taskItem.remarks, {
          googleTasksId: result.taskId,
          googleTasksLink: result.selfLink,
        });
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync task ${taskItem.id} to Google Tasks:`, err);
        failedCount++;
      }
    }

    if (failedCount > 0) {
      setSuccessMsg(`Synced ${syncedCount} tasks to Google Tasks (${failedCount} failed).`);
    } else {
      setSuccessMsg(`Successfully synced all ${syncedCount} tasks to HOD's Google Tasks!`);
    }
    setLoading(false);
  };

  // Post assignment to Google Classroom
  const handlePostToClassroom = async (taskToSync: Task) => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }
    if (!selectedCourseId) {
      setError('Please select a Google Classroom course.');
      return;
    }

    const courseObj = courses.find((c) => c.id === selectedCourseId);

    const confirmed = window.confirm(
      `Confirm posting assignment to Google Classroom Course:\n"${courseObj?.name || 'Selected Course'}"\n\nTitle: "${taskToSync.title}"`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await createClassroomAssignment(selectedCourseId, taskToSync, accessToken);
      updateTaskStatus(taskToSync.id, taskToSync.status, taskToSync.remarks, {
        googleClassroomCourseId: selectedCourseId,
        googleClassroomWorkId: result.workId,
        googleClassroomLink: result.alternateLink,
      });

      setSuccessMsg(`Successfully created coursework in Google Classroom!`);
    } catch (err: any) {
      setError(err.message || 'Failed to post assignment to Google Classroom');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 p-2 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 text-white rounded-xl shadow-xs">
              <Calendar className="w-5 h-5" />
              <CheckSquare className="w-5 h-5" />
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Google Workspace Integration (Calendar, Tasks & Classroom)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync department tasks to HOD's Google Calendar & Google Tasks, and assign coursework on Google Classroom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HOD Official Email Banner */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mb-4">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">HOD Target Official Email ID: </span>
              <strong className="text-xs text-blue-700 dark:text-blue-300 font-mono ml-1">{dailyReport.hodEmail || 'hod.cse@apex.edu.in'}</strong>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {dailyReport.department || 'Department HOD'}
          </span>
        </div>

        {/* Auth Status Section */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Google User')}`}
                alt="User Avatar"
                className="w-9 h-9 rounded-full border border-blue-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{user.displayName || user.email}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                    Connected Google Account
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Google Workspace Connection Required
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Sign in with HOD's Google Account to sync tasks directly with Google Calendar, Google Tasks & Google Classroom
              </div>
            </div>
          )}

          <div>
            {!user ? (
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="gsi-material-button text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Task Selection */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Task to Sync
          </label>
          <select
            value={activeTask?.id || ''}
            onChange={(e) => {
              const found = taskList.find((t) => t.id === e.target.value);
              setActiveTask(found || null);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
          >
            <option value="">-- Choose a Task ({taskList.length} available) --</option>
            {taskList.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.id}] {task.title} (Due: {task.targetDate})
              </option>
            ))}
          </select>
        </div>

        {activeTask && (
          <div className="space-y-5">
            {/* Task Preview Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {activeTask.id} • {activeTask.priority} Priority
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeTask.title}
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Target: {activeTask.targetDate}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                {activeTask.description}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span>Assigned To: <strong className="text-slate-800 dark:text-slate-200">{activeTask.assignedToName}</strong></span>
                {activeTask.className && <span>• Class: <strong className="text-slate-800 dark:text-slate-200">{activeTask.className}</strong></span>}
              </div>

              {/* Existing Sync Status Badges */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                {activeTask.googleCalendarLink ? (
                  <a
                    href={activeTask.googleCalendarLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-medium hover:underline"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Synced to Calendar <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Not on Calendar
                  </span>
                )}

                {activeTask.googleTasksId ? (
                  <a
                    href="https://tasks.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-medium hover:underline"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Synced to Google Tasks <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-2">
                    <CheckSquare className="w-3.5 h-3.5" /> Not on Google Tasks
                  </span>
                )}

                {activeTask.googleClassroomLink ? (
                  <a
                    href={activeTask.googleClassroomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium hover:underline ml-2"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Posted on Classroom <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-2">
                    <BookOpen className="w-3.5 h-3.5" /> Not on Classroom
                  </span>
                )}
              </div>
            </div>

            {/* Sync Action Grid - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Google Calendar Sync */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Google Calendar
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sync tasks as deadline events to HOD's Google Calendar with automated reminders.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSyncAllToCalendar}
                    disabled={loading || !user || taskList.length === 0}
                    className="w-full py-2 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-slate-300 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    Sync ALL ({taskList.length}) to Calendar
                  </button>

                  <button
                    onClick={() => handleSyncToCalendar(activeTask)}
                    disabled={loading || !user}
                    className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {activeTask.googleCalendarLink ? 'Re-sync Selected' : 'Sync Selected'}
                  </button>
                </div>
              </div>

              {/* 2. Google Tasks Sync */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Google Tasks (HOD Mail)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add tasks directly to HOD's official Google Tasks checklist with due dates.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSyncAllToTasks}
                    disabled={loading || !user || taskList.length === 0}
                    className="w-full py-2 px-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-300 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    Sync ALL ({taskList.length}) to Tasks
                  </button>

                  <button
                    onClick={() => handleSyncToTasks(activeTask)}
                    disabled={loading || !user}
                    className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <CheckSquare className="w-3 h-3 text-purple-600" />
                    {activeTask.googleTasksId ? 'Re-sync Selected' : 'Sync Selected to Tasks'}
                  </button>
                </div>
              </div>

              {/* 3. Google Classroom Sync */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Google Classroom
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Creates Course Work assignment in a selected Google Classroom course.
                  </p>

                  {/* Course Dropdown */}
                  {user && (
                    <div className="mb-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Select Course:
                      </label>
                      {loadingCourses ? (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Loading courses...
                        </div>
                      ) : courses.length > 0 ? (
                        <select
                          value={selectedCourseId}
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                        >
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.name} {course.section ? `(${course.section})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">
                          No active teaching courses found on your Google Classroom account.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePostToClassroom(activeTask)}
                  disabled={loading || !user || !selectedCourseId}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {activeTask.googleClassroomLink ? 'Re-post to Google Classroom' : 'Post to Google Classroom'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
