import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Task } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Calendar Scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// Google Classroom Scopes
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');

// Google Tasks Scopes
provider.addScope('https://www.googleapis.com/auth/tasks');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
      console.warn('Google Workspace sign-in popup was closed by user.');
      throw new Error('Sign-in cancelled: The authentication popup was closed before completing.');
    }
    console.error('Google Workspace sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE CALENDAR API FUNCTIONS
// ==========================================

export interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
}

export const addTaskToGoogleCalendar = async (
  task: Task,
  accessToken: string
): Promise<CalendarEventResult> => {
  const startDate = task.targetDate || new Date().toISOString().split('T')[0];
  // Calculate next day as end date for all-day event
  const startD = new Date(startDate);
  const endD = new Date(startD);
  endD.setDate(endD.getDate() + 1);
  const endDate = endD.toISOString().split('T')[0];

  const eventPayload = {
    summary: `[HOD Task] ${task.title}`,
    description: `Assigned To: ${task.assignedToName}\nClass/Dept: ${task.className || 'Department'}\nPriority: ${task.priority}\n\nTask Details:\n${task.description}\n\nAssigned Date: ${task.assignedDate}`,
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
    reminders: {
      useDefault: true,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Calendar API returned status ${response.status}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
  };
};

// ==========================================
// GOOGLE CLASSROOM API FUNCTIONS
// ==========================================

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
  courseState?: string;
}

export const fetchClassroomCourses = async (accessToken: string): Promise<ClassroomCourse[]> => {
  const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Classroom API error ${response.status}`);
  }

  const data = await response.json();
  return data.courses || [];
};

export interface ClassroomAssignmentResult {
  workId: string;
  alternateLink: string;
}

export const createClassroomAssignment = async (
  courseId: string,
  task: Task,
  accessToken: string
): Promise<ClassroomAssignmentResult> => {
  let dueObj = undefined;
  if (task.targetDate) {
    const parts = task.targetDate.split('-');
    if (parts.length === 3) {
      dueObj = {
        dueDate: {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10),
          day: parseInt(parts[2], 10),
        },
        dueTime: {
          hours: 23,
          minutes: 59,
        },
      };
    }
  }

  const payload = {
    title: task.title,
    description: `Assigned Faculty: ${task.assignedToName}\nPriority: ${task.priority}\n\n${task.description}`,
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    ...dueObj,
  };

  const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Classroom API error ${response.status}`);
  }

  const data = await response.json();
  return {
    workId: data.id,
    alternateLink: data.alternateLink,
  };
};

export const createClassroomAnnouncement = async (
  courseId: string,
  text: string,
  accessToken: string
) => {
  const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      state: 'PUBLISHED',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Classroom Announcement error ${response.status}`);
  }

  return await response.json();
};

// ==========================================
// GOOGLE TASKS API FUNCTIONS
// ==========================================

export interface GoogleTaskResult {
  taskId: string;
  selfLink: string;
}

export const addTaskToGoogleTasks = async (
  task: Task,
  accessToken: string
): Promise<GoogleTaskResult> => {
  let dueIso: string | undefined = undefined;
  if (task.targetDate) {
    const d = new Date(`${task.targetDate}T23:59:59Z`);
    if (!isNaN(d.getTime())) {
      dueIso = d.toISOString();
    }
  }

  const payload = {
    title: `[HOD Task] ${task.title}`,
    notes: `Assigned To: ${task.assignedToName}\nClass/Dept: ${task.className || 'Department'}\nPriority: ${task.priority}\nStatus: ${task.status}\n\nDetails:\n${task.description}\n\nAssigned Date: ${task.assignedDate}`,
    due: dueIso,
    status: task.status === 'Completed' ? 'completed' : 'needsAction',
  };

  const response = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Tasks API returned status ${response.status}`);
  }

  const data = await response.json();
  return {
    taskId: data.id,
    selfLink: data.selfLink || 'https://tasks.google.com',
  };
};
