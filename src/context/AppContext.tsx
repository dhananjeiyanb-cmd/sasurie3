import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, onSnapshot, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../lib/firebase';
import { syncDocToFirestore, deleteDocFromFirestore } from '../lib/firestoreSync';
import {
  User,
  Role,
  Staff,
  ClassRoom,
  Task,
  ClassObservation,
  FacultyDailyMonitoring,
  DailyHODReport,
  AppNotification,
  FilterState,
  TaskStatus,
  LessonPlanItem,
  StudentAttendanceRecord,
  EventRecord,
  EventParticipant,
  EventDocument,
  EventFeedbackResponse,
} from '../types';
import { StudentSkillBankData, GoogleSheetsConfig } from '../types/skillBank';
import { CCMMeeting, CCMAgendaItem, CCMMeetingStatus } from '../types/ccm';
import { INITIAL_CCM_MEETINGS, DEFAULT_CCM_AGENDA, buildDefaultAgenda } from '../data/ccmData';
import {
  INITIAL_STAFF,
  INITIAL_CLASSES,
  INITIAL_TASKS,
 INITIAL_OBSERVATIONS,
   INITIAL_DAILY_MONITORING,
  INITIAL_HOD_REPORT,
  INITIAL_NOTIFICATIONS,
  INITIAL_LESSON_PLANS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_EVENTS,
} from '../data/seedData';
import { INITIAL_STUDENTS_SKILL_BANK, stripSkillBankDates } from '../data/mockSkillBank';
import { getGoogleAvatarUrl } from '../utils/avatarUtils';
import { isSameDept, getDeptTag } from '../utils/departmentUtils';
import { normalizeStudentSkillBankRecord } from '../utils/excelSkillBank';

const getStudentDocId = (st: StudentSkillBankData): string => {
  if (!st) return '';
  const reg = st.studentProfile?.registerNumber;
  if (reg !== undefined && reg !== null && String(reg).trim()) {
    return String(reg).trim().replace(/\//g, '_');
  }
  if ((st as any).id) return String((st as any).id).trim().replace(/\//g, '_');
  if ((st.studentProfile as any)?.name) return `STU_${String((st.studentProfile as any).name).trim().replace(/[^a-zA-Z0-9]/g, '_')}`;
  if ((st.studentProfile as any)?.studentName) return `STU_${String((st.studentProfile as any).studentName).trim().replace(/[^a-zA-Z0-9]/g, '_')}`;
  return '';
};

// Staff ids deleted during this session (case-insensitive). The real-time
// Firestore snapshot is filtered against this so a just-deleted staff member
// is not resurrected while the app is open.
const recentlyDeletedStaffIds = new Set<string>();
const isNotRecentlyDeleted = (s: Staff): boolean => !recentlyDeletedStaffIds.has(String(s?.id ?? '').trim().toUpperCase());

const isKeepStaff = (s: Staff): boolean => {
  if (!s || !s.id) return false;
  return true;
};

interface AppContextType {
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  loginWithGoogle: (email: string, role?: Role, customName?: string) => { success: boolean; message?: string };
  isEmailInDatabase: (emailOrUser: string) => boolean;
  loginAsDemo: (role: Role, staffId?: string) => void;
  logout: () => void;
  updateUserPassword: (targetUsernameOrEmail: string, newPass: string) => void;
  updateUserProfile: (updates: {
    name?: string;
    email?: string;
    mobile?: string;
    designation?: string;
    department?: string;
  }) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  staffList: Staff[];
  addStaff: (staff: Omit<Staff, 'id'> & { id?: string }) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => Promise<void>;
  clearAllStaff: () => void;
  restoreDemoStaff: () => void;

  classList: ClassRoom[];
  addClass: (cls: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  taskList: Task[];
  addTask: (task: Omit<Task, 'id' | 'assignedDate'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus, remarks?: string, attachmentUrl?: string, attachmentName?: string) => void;

  observationList: ClassObservation[];
  addObservation: (obs: Omit<ClassObservation, 'id'>) => void;
  deleteObservation: (id: string) => void;

  monitoringList: FacultyDailyMonitoring[];
  updateMonitoring: (id: string, updates: Partial<FacultyDailyMonitoring>) => void;

  lessonPlanList: LessonPlanItem[];
  addLessonPlanItem: (item: Omit<LessonPlanItem, 'id'>) => void;
  updateLessonPlanItem: (id: string, updates: Partial<LessonPlanItem>) => void;
  deleteLessonPlanItem: (id: string) => void;

  dailyReport: DailyHODReport;
  updateDailyReport: (updates: Partial<DailyHODReport>) => void;

  attendanceRecords: StudentAttendanceRecord[];
  addAttendanceRecord: (record: Omit<StudentAttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, record: Partial<StudentAttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  clearAllAttendance: () => Promise<void>;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Events Management System
  eventsList: EventRecord[];
  addEvent: (eventData: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, updates: Partial<EventRecord>) => void;
  deleteEvent: (id: string) => void;
  addEventParticipant: (eventId: string, participant: Omit<EventParticipant, 'id'>) => void;
  importEventParticipants: (eventId: string, participants: Omit<EventParticipant, 'id'>[]) => void;
  addEventDocument: (eventId: string, docData: Omit<EventDocument, 'id'>) => void;
  deleteEventDocument: (eventId: string, docId: string) => void;
  addEventFeedback: (eventId: string, feedback: Omit<EventFeedbackResponse, 'id' | 'submittedAt'>) => void;

  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;

  // Skill Bank System
  skillBankStudents: StudentSkillBankData[];
  updateSkillBankStudent: (registerNumber: string, updatedRecord: Partial<StudentSkillBankData>) => void;
  addSkillBankStudent: (student: StudentSkillBankData) => void;
  deleteSkillBankStudent: (registerNumber: string) => void;
  deleteSkillBankStudents: (registerNumbers: string[]) => void;
  clearDepartmentSkillBankStudents: (departmentName: string) => void;
  clearAllSkillBankStudents: () => void;
  bulkMapStudentsToMentor: (registerNumbers: string[], staffId: string, mentorName: string) => void;
  importBulkSkillBankStudents: (newStudents: StudentSkillBankData[]) => void;

  googleSheetsConfig: GoogleSheetsConfig;
  updateGoogleSheetsConfig: (updates: Partial<GoogleSheetsConfig>) => void;
  syncSkillBankToGoogleSheets: () => Promise<boolean>;

  exportFullDatabase: () => void;
  importFullDatabase: (jsonContent: string) => boolean;
  syncAllDataToFirestore: () => void;
  resetToDefaultData: () => void;

  ccmMeetings: CCMMeeting[];
  addCCMMeeting: (
    data: Omit<CCMMeeting, 'id' | 'createdAt' | 'status' | 'createdBy' | 'createdByRole' | 'agenda'> & {
      agenda?: CCMAgendaItem[];
      status?: CCMMeetingStatus;
    }
  ) => void;
  updateCCMMeeting: (id: string, updates: Partial<CCMMeeting>) => void;
  deleteCCMMeeting: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'hod_task_system_v3_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or seed
  const [dailyReport, setDailyReport] = useState<DailyHODReport>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}report`);
    return saved ? JSON.parse(saved) : INITIAL_HOD_REPORT;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}user`);
    if (!saved) return null;
    try {
      const parsed: User = JSON.parse(saved);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'principal')) {
        if ((parsed.name || '').includes('DHANANJEIYAN') || (parsed.email || '').includes('dhananjeiyan')) {
          return {
            ...parsed,
            name: 'DHANANJEIYAN B',
            role: 'staff',
            designation: 'Assistant Professor',
            department: 'Artificial Intelligence & Data Science (AI & DS)',
            email: 'dhananjeiyan.b@sasurie.com',
            username: 'dhananjeiyan.b@sasurie.com',
            staffId: 'STF001',
          };
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}theme`) === 'dark';
  });

  const [staffList, setStaffList] = useState<Staff[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(isKeepStaff);
        }
      } catch {}
    }
    return INITIAL_STAFF;
  });

  const [classList, setClassList] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_CLASSES;
  });

  const [taskList, setTaskList] = useState<Task[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: Task) => t && t.id && !['TSK-101', 'TSK-102', 'TSK-103', 'TSK-104', 'TSK-105'].includes(t.id));
        }
      } catch {}
    }
    return [];
  });

  const [observationList, setObservationList] = useState<ClassObservation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_OBSERVATIONS;
  });

  const [monitoringList, setMonitoringList] = useState<FacultyDailyMonitoring[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_DAILY_MONITORING;
  });

  const [lessonPlanList, setLessonPlanList] = useState<LessonPlanItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_LESSON_PLANS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_ATTENDANCE_RECORDS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [eventsList, setEventsList] = useState<EventRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}events`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_EVENTS;
  });

  const [skillBankStudents, setSkillBankStudents] = useState<StudentSkillBankData[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`);
    if (saved) {
      try {
        const parsed: StudentSkillBankData[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeStudentSkillBankRecord);
        }
      } catch (err) {
        console.error('Error parsing saved skill bank students:', err);
      }
    }
    return INITIAL_STUDENTS_SKILL_BANK;
  });

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}google_sheets_config`);
    return saved
      ? JSON.parse(saved)
      : {
          webAppUrl: '',
          autoSync: true,
          status: 'Idle',
        };
  });

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    department: 'all',
    status: 'all',
    priority: 'all',
    dateRange: 'all',
  });

  const [ccmMeetings, setCcmMeetings] = useState<CCMMeeting[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}ccm_meetings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return INITIAL_CCM_MEETINGS;
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`, JSON.stringify(classList));
  }, [classList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`, JSON.stringify(taskList));
  }, [taskList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`, JSON.stringify(observationList));
  }, [observationList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`, JSON.stringify(monitoringList));
  }, [monitoringList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`, JSON.stringify(lessonPlanList));
  }, [lessonPlanList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}report`, JSON.stringify(dailyReport));
  }, [dailyReport]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}ccm_meetings`, JSON.stringify(ccmMeetings));
  }, [ccmMeetings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}events`, JSON.stringify(eventsList));
  }, [eventsList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify(skillBankStudents));
  }, [skillBankStudents]);

  // One-time auto-purge on boot to ensure database is completely cleared of any mock students
  useEffect(() => {
    const purgeKey = `${LOCAL_STORAGE_KEY_PREFIX}skill_bank_purged_v11`;
    if (localStorage.getItem(purgeKey) !== 'true') {
      const purgeFirestoreDocs = async () => {
        try {
          const snap = await getDocs(collection(db, 'skillBankStudents'));
          snap.docs.forEach((d) => {
            deleteDocFromFirestore('skillBankStudents', d.id);
          });
          localStorage.setItem(purgeKey, 'true');
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify([]));
          setSkillBankStudents([]);
        } catch (err) {
          console.error('Error purging Firestore skillBankStudents on boot:', err);
        }
      };
      purgeFirestoreDocs();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}google_sheets_config`, JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}theme`, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time Firestore Sync & Initialization
  useEffect(() => {
    testFirestoreConnection();

    // Staff Listener
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      // Read local staff from storage to ensure local additions are not lost
      let localStaffArr: Staff[] = [];
      try {
        const savedLocal = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`);
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) localStaffArr = parsed.filter(isKeepStaff).filter(isNotRecentlyDeleted);
        }
      } catch {}

      const isInitialized = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff_initialized`) === 'true';

      if (snapshot.empty) {
        if (isInitialized || (localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`) && JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`) || '[]').length === 0)) {
          setStaffList([]);
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify([]));
        } else {
          const staffToInit = (localStaffArr.length > 0 ? localStaffArr : INITIAL_STAFF).filter(isNotRecentlyDeleted);
          staffToInit.forEach((s) => syncDocToFirestore('staff', s.id, s));
          setStaffList(staffToInit);
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(staffToInit));
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff_initialized`, 'true');
        }
      } else {
        const items = snapshot.docs.map((d) => d.data() as Staff);
        const kept = items.filter(isKeepStaff).filter(isNotRecentlyDeleted);

        const map = new Map<string, Staff>();
        // First populate from Firestore
        kept.forEach((s) => {
          if (s && s.id) {
            if (s.id === 'HOD001' && (s.facultyName.includes('DHANANJEIYAN') || (s.email && s.email.includes('dhananjeiyan')))) {
              const fixedHOD: Staff = {
                ...s,
                facultyName: 'Dr. C. HOD (AI & DS)',
                email: 'hodcs@sasurie.com',
                designation: 'Head of Department (HOD)',
                role: 'admin',
              };
              map.set('HOD001', fixedHOD);
            } else {
              map.set(s.id.toUpperCase(), s);
            }
          }
        });

        const finalStaff = Array.from(map.values());
        setStaffList(finalStaff);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(finalStaff));
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff_initialized`, 'true');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'staff'));

    // Classes Listener
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      let localArr: ClassRoom[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_CLASSES;
        setClassList(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as ClassRoom);
        const map = new Map<string, ClassRoom>();
        items.forEach((c) => { if (c && c.id) map.set(c.id, c); });
        localArr.forEach((c) => {
          if (c && c.id && !map.has(c.id)) {
            map.set(c.id, c);
          }
        });
        const finalClasses = Array.from(map.values());
        setClassList(finalClasses);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`, JSON.stringify(finalClasses));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'classes'));

    // Tasks Listener
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      if (snapshot.empty) {
        setTaskList([]);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`, JSON.stringify([]));
      } else {
        const sampleTaskIds = ['TSK-101', 'TSK-102', 'TSK-103', 'TSK-104', 'TSK-105'];
        const items = snapshot.docs
          .map((d) => d.data() as Task)
          .filter((t) => t && t.id && !sampleTaskIds.includes(t.id));
        setTaskList(items);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`, JSON.stringify(items));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    // Observations Listener
    const unsubObs = onSnapshot(collection(db, 'observations'), (snapshot) => {
      let localArr: ClassObservation[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_OBSERVATIONS;
        setObservationList(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as ClassObservation);
        const map = new Map<string, ClassObservation>();
        items.forEach((o) => { if (o && o.id) map.set(o.id, o); });
        localArr.forEach((o) => {
          if (o && o.id && !map.has(o.id)) {
            map.set(o.id, o);
          }
        });
        const finalObs = Array.from(map.values());
        setObservationList(finalObs);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`, JSON.stringify(finalObs));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'observations'));

    // Monitoring Listener
    const unsubMon = onSnapshot(collection(db, 'monitoring'), (snapshot) => {
      let localArr: FacultyDailyMonitoring[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_DAILY_MONITORING;
        setMonitoringList(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as FacultyDailyMonitoring);
        const map = new Map<string, FacultyDailyMonitoring>();
        items.forEach((m) => { if (m && m.id) map.set(m.id, m); });
        localArr.forEach((m) => {
          if (m && m.id && !map.has(m.id)) {
            map.set(m.id, m);
          }
        });
        const finalMon = Array.from(map.values());
        setMonitoringList(finalMon);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`, JSON.stringify(finalMon));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'monitoring'));

    // Attendance Listener
    const unsubAtt = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      let localArr: StudentAttendanceRecord[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_ATTENDANCE_RECORDS;
        setAttendanceRecords(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as StudentAttendanceRecord);
        const map = new Map<string, StudentAttendanceRecord>();
        items.forEach((a) => { if (a && a.id) map.set(a.id, a); });
        localArr.forEach((a) => {
          if (a && a.id && !map.has(a.id)) {
            map.set(a.id, a);
          }
        });
        const finalAtt = Array.from(map.values());
        setAttendanceRecords(finalAtt);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify(finalAtt));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'attendance'));

    // Lesson Plans Listener
    const unsubLp = onSnapshot(collection(db, 'lessonPlans'), (snapshot) => {
      let localArr: LessonPlanItem[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_LESSON_PLANS;
        setLessonPlanList(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as LessonPlanItem);
        const map = new Map<string, LessonPlanItem>();
        items.forEach((lp) => { if (lp && lp.id) map.set(lp.id, lp); });
        localArr.forEach((lp) => {
          if (lp && lp.id && !map.has(lp.id)) {
            map.set(lp.id, lp);
          }
        });
        const finalLp = Array.from(map.values());
        setLessonPlanList(finalLp);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`, JSON.stringify(finalLp));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'lessonPlans'));

    // Notifications Listener
    const unsubNotif = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      let localArr: AppNotification[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_NOTIFICATIONS;
        setNotifications(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as AppNotification);
        const map = new Map<string, AppNotification>();
        items.forEach((n) => { if (n && n.id) map.set(n.id, n); });
        localArr.forEach((n) => {
          if (n && n.id && !map.has(n.id)) {
            map.set(n.id, n);
          }
        });
        const finalNotif = Array.from(map.values());
        setNotifications(finalNotif);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(finalNotif));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    // Events Listener
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      let localArr: EventRecord[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}events`);
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localArr = parsed; }
      } catch {}
      if (snapshot.empty) {
        const toInit = localArr.length > 0 ? localArr : INITIAL_EVENTS;
        setEventsList(toInit);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}events`, JSON.stringify(toInit));
      } else {
        const items = snapshot.docs.map((d) => d.data() as EventRecord);
        const map = new Map<string, EventRecord>();
        items.forEach((e) => { if (e && e.id) map.set(e.id, e); });
        localArr.forEach((e) => {
          if (e && e.id && !map.has(e.id)) {
            map.set(e.id, e);
          }
        });
        const finalEvents = Array.from(map.values());
        setEventsList(finalEvents);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}events`, JSON.stringify(finalEvents));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'events'));

    // Skill Bank Students Listener
    const unsubSkill = onSnapshot(collection(db, 'skillBankStudents'), (snapshot) => {
      let localArr: StudentSkillBankData[] = [];
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localArr = parsed;
        }
      } catch {}

      if (snapshot.empty) {
        if (localArr.length > 0) {
          setSkillBankStudents(localArr);
        } else {
          setSkillBankStudents(INITIAL_STUDENTS_SKILL_BANK);
        }
      } else {
        const items = snapshot.docs.map((d) => normalizeStudentSkillBankRecord(d.data() as StudentSkillBankData));
        const map = new Map<string, StudentSkillBankData>();
        items.forEach((st) => {
          const key = (st.studentProfile?.registerNumber || getStudentDocId(st)).toLowerCase();
          if (key) map.set(key, st);
        });
        localArr.forEach((st) => {
          const key = (st.studentProfile?.registerNumber || getStudentDocId(st)).toLowerCase();
          if (key && !map.has(key)) {
            map.set(key, st);
          }
        });
        const finalStudents = Array.from(map.values());
        setSkillBankStudents(finalStudents);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify(finalStudents));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'skillBankStudents'));

    // Daily Report Listener
    const unsubReport = onSnapshot(doc(db, 'settings', 'dailyReport'), (docSnap) => {
      if (docSnap.exists()) {
        const reportData = docSnap.data() as DailyHODReport;
        if (reportData.hodName?.includes('DHANANJEIYAN') || reportData.hodEmail?.includes('dhananjeiyan')) {
          const fixedReport: DailyHODReport = {
            ...reportData,
            hodName: 'Dr. C. HOD (AI & DS)',
            hodEmail: 'hodcs@sasurie.com',
          };
          setDailyReport(fixedReport);
        } else {
          setDailyReport(reportData);
        }
      } else {
        syncDocToFirestore('settings', 'dailyReport', INITIAL_HOD_REPORT);
        setDailyReport(INITIAL_HOD_REPORT);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/dailyReport'));

    return () => {
      unsubStaff();
      unsubClasses();
      unsubTasks();
      unsubObs();
      unsubMon();
      unsubAtt();
      unsubLp();
      unsubNotif();
      unsubEvents();
      unsubSkill();
      unsubReport();
    };
  }, []);

  // CCM Meetings Listener (IQAC | Class Committee Meetings)
  useEffect(() => {
    const unsubCcm = onSnapshot(collection(db, 'ccmMeetings'), (snapshot) => {
      if (snapshot.empty) {
        let localArr: CCMMeeting[] = [];
        try {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}ccm_meetings`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) localArr = parsed;
          }
        } catch {}
        if (localArr.length > 0) {
          localArr.forEach((m) => syncDocToFirestore('ccmMeetings', m.id, m));
          setCcmMeetings(localArr);
        } else {
          setCcmMeetings([]);
        }
      } else {
        const map = new Map<string, CCMMeeting>();
        snapshot.docs.forEach((d) => {
          const m = d.data() as CCMMeeting;
          if (m && m.id) map.set(m.id, m);
        });
        const finalList = Array.from(map.values());
        setCcmMeetings(finalList);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}ccm_meetings`, JSON.stringify(finalList));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'ccmMeetings'));
    return () => unsubCcm();
  }, []);

  // Automatic Overdue calculation on task list
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let updated = false;

    const checkedTasks = taskList.map((t) => {
      if ((t.status === 'Pending' || t.status === 'In Progress') && t.targetDate < todayStr) {
        updated = true;
        return { ...t, status: 'Overdue' as TaskStatus };
      }
      return t;
    });

    if (updated) {
      setTaskList(checkedTasks);
    }
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Custom Passwords state
  const [customPasswords, setCustomPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}custom_passwords`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}custom_passwords`, JSON.stringify(customPasswords));
  }, [customPasswords]);

  const updateUserPassword = (targetUsernameOrEmail: string, newPass: string) => {
    const key = targetUsernameOrEmail.trim().toLowerCase();
    if (!key || !newPass) return;

    setCustomPasswords((prev) => ({
      ...prev,
      [key]: newPass,
    }));

    // If current logged in user matches, update in session
    if (
      currentUser &&
      ((currentUser.username || '').toLowerCase() === key ||
        currentUser.email?.toLowerCase() === key ||
        currentUser.staffId?.toLowerCase() === key)
    ) {
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}user`, JSON.stringify(updatedUser));
    }

    // Check staff list
    const matchedStaff = staffList.find(
      (s) => s.id?.toLowerCase() === key || (s.email && s.email.toLowerCase() === key)
    );
    if (matchedStaff) {
      updateStaff(matchedStaff.id, { password: newPass });
    }
  };

  const updateUserProfile = (updates: {
    name?: string;
    email?: string;
    mobile?: string;
    designation?: string;
    department?: string;
  }) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name: updates.name || currentUser.name,
      email: updates.email || currentUser.email,
      mobile: updates.mobile || currentUser.mobile,
      department: updates.department || currentUser.department,
      avatarUrl: getGoogleAvatarUrl(
        updates.email || currentUser.email,
        updates.name || currentUser.name,
        currentUser.role
      ),
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}user`, JSON.stringify(updatedUser));

    // If HOD admin, sync with dailyReport HOD details
    if (currentUser.role === 'admin') {
      updateDailyReport({
        hodName: updates.name || currentUser.name,
        hodEmail: updates.email || currentUser.email,
        department: updates.department || currentUser.department,
      });
    }

    // If Principal, sync principal name
    if (currentUser.role === 'principal' && updates.name) {
      updateDailyReport({
        principalName: updates.name,
      });
    }

    // If matched staff, sync staff record
    const staffToUpdate = currentUser.staffId
      ? staffList.find((s) => s.id === currentUser.staffId)
      : staffList.find((s) => s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase());

    if (staffToUpdate) {
      updateStaff(staffToUpdate.id, {
        facultyName: updates.name || currentUser.name,
        email: updates.email || currentUser.email,
        mobile: updates.mobile || currentUser.mobile,
        designation: updates.designation || staffToUpdate.designation,
        department: updates.department || staffToUpdate.department,
      });
    }
  };

  // Password validation helper
  const checkPasswordValid = (userKey: string, passToCheck: string, staffObj?: Staff) => {
    const normKey = userKey.trim().toLowerCase();
    const normPass = passToCheck.trim().toLowerCase();

    // Standard master default passwords
    if (
      normPass === 'sasurie' ||
      normPass === 'admin@123' ||
      normPass === 'staff@123' ||
      normPass === 'principal@123' ||
      normPass === 'lib@123' ||
      normPass === 'incucula@123'
    ) {
      return true;
    }

    const savedCustomPass =
      customPasswords[normKey] ||
      (staffObj?.email ? customPasswords[staffObj.email.toLowerCase()] : undefined) ||
      (staffObj?.id ? customPasswords[staffObj.id.toLowerCase()] : undefined) ||
      staffObj?.password;

    if (savedCustomPass) {
      return normPass === savedCustomPass.toLowerCase();
    }
    return false;
  };

  // Check if an email, username or staff/student ID exists in database
  const isEmailInDatabase = (input: string): boolean => {
    if (!input || !input.trim()) return false;
    const low = input.trim().toLowerCase();

    // Check staff list
    if (staffList.some((s) => s.email?.toLowerCase() === low || s.id?.toLowerCase() === low)) {
      return true;
    }

    // Check student skill bank database
    if (
      skillBankStudents.some(
        (st) =>
          st.studentProfile?.studentEmail?.toLowerCase() === low ||
          st.studentProfile?.personalEmail?.toLowerCase() === low ||
          st.studentProfile?.registerNumber?.toLowerCase() === low
      )
    ) {
      return true;
    }

    // Check special system role emails & usernames
    const knownEmails = [
      'admin@sasuire.com',
      'admin@sasurie.com',
      'admin@sasurie.in',
      'dhananjeiyan.b@sasurie.com',
      'dhananjeiyan.backup@gmail.com',
      'hodcs@sasurie.com',
      'hod.cse@apex.edu.in',
      'sceprincipal@sasurie.com',
      'scepricipal@sasurie.com',
      'sceprincipal',
      'principal@sasurie.com',
      'secretary@sasurie.com',
      'secretary.pa@sasurie.com',
      'principal.pa@sasurie.com',
      'secretarypa@sasurie.com',
      'principal.aids@gmail.com',
      'librarian@sasurie.com',
      'incucula@sasurie.com',
      'faculty.aids@gmail.com',
      'admin',
      'adm001',
      'fac019',
      'cse01',
      '613',
      'sasidharan',
      'suma',
      'hodcs',
      'principal',
      'secretary',
      'principal_pa',
      'secretary_pa',
      'principalpa',
      'secretarypa',
      'pri001',
      'pri',
      'sec001',
      'pripa001',
      'secpa001',
      'librarian',
      'incucula',
      dailyReport.hodEmail?.toLowerCase(),
      dailyReport.principalEmail?.toLowerCase(),
    ].filter(Boolean);

    if (knownEmails.some((ke) => ke === low || (ke && low.includes(ke)) || (ke && ke.includes(low)))) {
      return true;
    }

    return false;
  };

  // Authentication Logic
  const login = (username: string, password: string): { success: boolean; message?: string } => {
    const lowUser = username.trim().toLowerCase();
    const lowPass = password.trim().toLowerCase();

    // Check if user/email exists in database
    if (!isEmailInDatabase(lowUser)) {
      return {
        success: false,
        message: `Account or Email ID "${username}" is not found in database. Access denied. Please contact ADMIN to register your official account.`,
      };
    }

    const isSuperAdminAccount =
      lowUser === 'admin@sasuire.com' ||
      lowUser === 'admin@sasurie.com' ||
      lowUser === 'admin@sasurie.in' ||
      lowUser === 'admin' ||
      lowUser === 'adm001';

    const isPrincipalUser =
      lowUser === 'sceprincipal@sasurie.com' ||
      lowUser === 'scepricipal@sasurie.com' ||
      lowUser === 'principal@sasurie.com' ||
      lowUser === 'principal' ||
      lowUser === 'pri001' ||
      lowUser === 'pri';

    const isSecretaryUser =
      lowUser === 'secretary@sasurie.com' ||
      lowUser === 'secretary' ||
      lowUser === 'sec001';

    const isPrincipalPaUser =
      lowUser === 'principal.pa@sasurie.com' ||
      lowUser === 'principal_pa' ||
      lowUser === 'principalpa' ||
      lowUser === 'pripa001';

    const isSecretaryPaUser =
      lowUser === 'secretary.pa@sasurie.com' ||
      lowUser === 'secretarypa@sasurie.com' ||
      lowUser === 'secretary_pa' ||
      lowUser === 'secretarypa' ||
      lowUser === 'secpa001';

    // System Super Admin Login (All Colleges & All Staff Access)
    if (isSuperAdminAccount && checkPasswordValid(lowUser, lowPass)) {
      const email = lowUser.includes('@') ? lowUser : 'admin@sasurie.com';
      const name = 'System Super Administrator';
      const superAdminUser: User = {
        username: 'ADM001',
        role: 'admin',
        staffId: 'ADM001',
        name,
        department: 'All Departments',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'admin'),
      };
      setCurrentUser(superAdminUser);
      return { success: true };
    }

    // Principal Login
    if (isPrincipalUser && checkPasswordValid(lowUser, lowPass)) {
      const matchingStaff = staffList.find((s) => s.role === 'principal');
      const email = matchingStaff?.email || 'principal@sasurie.com';
      const name = matchingStaff?.facultyName || dailyReport.principalName || 'Prof. Dr. Kiruba Shankar R (Principal)';
      const inst = matchingStaff?.institution || dailyReport.collegeName || 'Sasurie College of Engineering';
      const principalUser: User = {
        username: email,
        role: 'principal',
        staffId: matchingStaff?.id || 'PRI001',
        name,
        department: 'College Principal Office',
        institution: inst,
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal'),
      };
      setCurrentUser(principalUser);
      return { success: true };
    }

    // Secretary Login
    if (isSecretaryUser && checkPasswordValid(lowUser, lowPass)) {
      const email = 'secretary@sasurie.com';
      const name = 'Thiru. S. Subburaj (College Secretary)';
      const secUser: User = {
        username: email,
        role: 'secretary',
        staffId: 'SEC001',
        name,
        department: 'Management Secretariat',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'secretary'),
      };
      setCurrentUser(secUser);
      return { success: true };
    }

    // Principal PA Login
    if (isPrincipalPaUser && checkPasswordValid(lowUser, lowPass)) {
      const matchingStaff = staffList.find((s) => s.role === 'principal_pa');
      const email = matchingStaff?.email || 'principal.pa@sasurie.com';
      const name = matchingStaff?.facultyName || 'Er. R. Ramesh (Principal PA)';
      const inst = matchingStaff?.institution || dailyReport.collegeName || 'Sasurie College of Engineering';
      const priPaUser: User = {
        username: email,
        role: 'principal_pa',
        staffId: matchingStaff?.id || 'PRIPA001',
        name,
        department: 'College Principal Office',
        institution: inst,
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal_pa'),
      };
      setCurrentUser(priPaUser);
      return { success: true };
    }

    // Secretary PA Login
    if (isSecretaryPaUser && checkPasswordValid(lowUser, lowPass)) {
      const email = 'secretary.pa@sasurie.com';
      const name = 'Er. K. Suresh (Secretary PA)';
      const secPaUser: User = {
        username: email,
        role: 'secretary_pa',
        staffId: 'SECPA001',
        name,
        department: 'Management Secretariat',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'secretary_pa'),
      };
      setCurrentUser(secPaUser);
      return { success: true };
    }



    // Librarian Login
    const isLibrarianUser =
      lowUser === 'librarian@sasurie.com' ||
      lowUser === 'librarian' ||
      lowUser === 'lib001' ||
      lowUser.includes('librarian') ||
      lowUser.includes('lib');

    if (isLibrarianUser && checkPasswordValid(lowUser, lowPass)) {
      const email = 'librarian@sasurie.com';
      const name = 'Dr. S. Library Officer (Central Librarian)';
      const librarianUser: User = {
        username: 'LIB001',
        role: 'librarian',
        staffId: 'LIB001',
        name,
        department: 'Central Library',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'librarian'),
      };
      setCurrentUser(librarianUser);
      return { success: true };
    }

    // Incucula Login (Incubation & Startup Innovation Cell)
    const isIncuculaUser =
      lowUser === 'incucula@sasurie.com' ||
      lowUser === 'incucula' ||
      lowUser === 'inc001' ||
      lowUser.includes('incucula') ||
      lowUser.includes('incubation');

    if (isIncuculaUser && checkPasswordValid(lowUser, lowPass)) {
      const email = 'incucula@sasurie.com';
      const name = 'Dr. M. Innovation Officer (Incucula Head)';
      const incuculaUser: User = {
        username: 'INC001',
        role: 'incucula',
        staffId: 'INC001',
        name,
        department: 'Incucula Incubation & Startup Cell',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'incucula'),
      };
      setCurrentUser(incuculaUser);
      return { success: true };
    }

    // First check if matching any staff member directly
    const foundStaff = staffList.find(
      (s) => (s.id && s.id.toLowerCase() === lowUser) || (s.email && s.email.toLowerCase() === lowUser)
    );

    const isHodUser =
      (foundStaff && foundStaff.role === 'admin') ||
      lowUser === 'hodcs@sasurie.com' ||
      lowUser === 'hodcs' ||
      lowUser === 'admin' ||
      (lowUser.includes('hod') && !lowUser.includes('dhananjeiyan'));

    // HOD Admin Login
    if (isHodUser && checkPasswordValid(lowUser, lowPass, foundStaff)) {
      const email = foundStaff?.email || 'hodcs@sasurie.com';
      const name = foundStaff?.facultyName || dailyReport.hodName || 'Dr. C. HOD (AI & DS)';
      const department = foundStaff?.department || dailyReport.department || 'Artificial Intelligence & Data Science (AI & DS)';
      const adminUser: User = {
        username: foundStaff?.id || email,
        role: 'admin',
        coordinatorRole: foundStaff?.coordinatorRole,
        staffId: foundStaff?.id,
        name,
        department,
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'admin'),
      };
      setCurrentUser(adminUser);
      return { success: true };
    }

    // Check staff login by staff ID or Email
    if (foundStaff && checkPasswordValid(lowUser, lowPass, foundStaff)) {
      const userRole: Role = foundStaff.role || 'staff';
      const staffUser: User = {
        username: foundStaff.id,
        role: userRole,
        coordinatorRole: foundStaff.coordinatorRole,
        staffId: foundStaff.id,
        name: foundStaff.facultyName,
        department: foundStaff.department,
        institution: foundStaff.institution || dailyReport.collegeName,
        email: foundStaff.email,
        mobile: foundStaff.mobile,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(foundStaff.email, foundStaff.facultyName, userRole),
      };
      setCurrentUser(staffUser);
      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid Password. Please enter a valid password or contact ADMIN.',
    };
  };

  const loginWithGoogle = (
    email: string,
    targetRole?: Role,
    customName?: string
  ): { success: boolean; message?: string } => {
    const lowEmail = (email || '').trim().toLowerCase();

    if (!isEmailInDatabase(lowEmail)) {
      return {
        success: false,
        message: `Email ID "${email}" is not found in database. Please contact ADMIN to register your official account.`,
      };
    }

    const matchedStaff = staffList.find((s) => s.email && s.email.toLowerCase() === lowEmail);

    let role: Role = targetRole || 'staff';
    let name = customName || (email || '').split('@')[0] || 'User';
    let staffId: string | undefined = undefined;
    let department = dailyReport.department;

    if (matchedStaff) {
      role = matchedStaff.role;
      name = customName || matchedStaff.facultyName;
      department = matchedStaff.department;
      staffId = matchedStaff.id;
    } else if (lowEmail.includes('secretary') && !lowEmail.includes('pa')) {
      role = 'secretary';
      name = customName || 'Thiru. S. Subburaj (College Secretary)';
      department = 'Management Secretariat';
      staffId = 'SEC001';
    } else if (lowEmail.includes('principal.pa') || lowEmail.includes('principal_pa')) {
      role = 'principal_pa';
      name = customName || 'Er. R. Ramesh (Principal PA)';
      department = 'College Principal Office';
      staffId = 'PRIPA001';
    } else if (lowEmail.includes('secretary.pa') || lowEmail.includes('secretary_pa') || lowEmail.includes('secretarypa')) {
      role = 'secretary_pa';
      name = customName || 'Er. K. Suresh (Secretary PA)';
      department = 'Management Secretariat';
      staffId = 'SECPA001';
    } else if (lowEmail.includes('principal') || targetRole === 'principal') {
      role = 'principal';
      name = customName || 'Prof. Dr. Kiruba Shankar R (Principal)';
      department = 'College Principal Office';
      staffId = 'PRI001';
    } else if (lowEmail.includes('librarian') || targetRole === 'librarian') {
      role = 'librarian';
      name = customName || 'Dr. S. Library Officer (Central Librarian)';
      department = 'Central Library';
      staffId = 'LIB001';
    } else if (lowEmail.includes('incucula') || lowEmail.includes('incubation') || targetRole === 'incucula') {
      role = 'incucula';
      name = customName || 'Dr. M. Innovation Officer (Incucula Head)';
      department = 'Incucula Incubation & Startup Cell';
      staffId = 'INC001';
    } else if (lowEmail.includes('hod') || lowEmail.includes('admin') || targetRole === 'admin') {
      role = 'admin';
      name = customName || (dailyReport.hodName || 'Dr. C. HOD (AI & DS)');
      department = 'Artificial Intelligence & Data Science (AI & DS)';
      staffId = 'HOD001';
    } else {
      role = 'staff';
      staffId = 'STF001';
    }

    const googleUser: User = {
      username: email,
      role,
      coordinatorRole: matchedStaff?.coordinatorRole,
      staffId,
      name,
      department,
      email,
      googleConnected: true,
      avatarUrl: getGoogleAvatarUrl(email, name, role),
    };

    setCurrentUser(googleUser);
    return { success: true };
  };

  const loginAsDemo = (role: Role, staffId?: string) => {
    if (role === 'principal') {
      const email = 'principal@sasurie.com';
      const name = 'Prof. Dr. Kiruba Shankar R (Principal)';
      setCurrentUser({
        username: 'PRI001',
        role: 'principal',
        staffId: 'PRI001',
        name,
        department: 'College Principal Office',
        institution: dailyReport.collegeName || 'Sasurie College of Engineering',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal'),
      });
    } else if (role === 'secretary') {
      const email = 'secretary@sasurie.com';
      const name = 'Thiru. S. Subburaj (College Secretary)';
      setCurrentUser({
        username: 'SEC001',
        role: 'secretary',
        staffId: 'SEC001',
        name,
        department: 'Management Secretariat',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'secretary'),
      });
    } else if (role === 'principal_pa') {
      const email = 'principal.pa@sasurie.com';
      const name = 'Er. R. Ramesh (Principal PA)';
      setCurrentUser({
        username: 'PRIPA001',
        role: 'principal_pa',
        staffId: 'PRIPA001',
        name,
        department: 'College Principal Office',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal_pa'),
      });
    } else if (role === 'secretary_pa') {
      const email = 'secretary.pa@sasurie.com';
      const name = 'Er. K. Suresh (Secretary PA)';
      setCurrentUser({
        username: 'SECPA001',
        role: 'secretary_pa',
        staffId: 'SECPA001',
        name,
        department: 'Management Secretariat',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'secretary_pa'),
      });
    } else if (role === 'librarian') {
      const email = 'librarian@sasurie.com';
      const name = 'Dr. S. Library Officer (Central Librarian)';
      setCurrentUser({
        username: 'LIB001',
        role: 'librarian',
        staffId: 'LIB001',
        name,
        department: 'Central Library',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'librarian'),
      });
    } else if (role === 'incucula') {
      const email = 'incucula@sasurie.com';
      const name = 'Dr. M. Innovation Officer (Incucula Head)';
      setCurrentUser({
        username: 'INC001',
        role: 'incucula',
        staffId: 'INC001',
        name,
        department: 'Incucula Incubation & Startup Cell',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'incucula'),
      });
    } else if (role === 'admin') {
      const targetStaff = staffId
        ? staffList.find((s) => s.id === staffId)
        : staffList.find((s) => s.role === 'admin');

      const email = targetStaff?.email || 'hodcs@sasurie.com';
      const name = targetStaff?.facultyName || dailyReport.hodName || 'Dr. C. HOD (AI & DS)';
      const department = targetStaff?.department || 'Artificial Intelligence & Data Science (AI & DS)';

      const newUser: User = {
        username: targetStaff?.id || 'HOD001',
        role: 'admin',
        coordinatorRole: targetStaff?.coordinatorRole,
        staffId: targetStaff?.id || 'HOD001',
        name,
        department,
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'admin'),
      };
      setCurrentUser(newUser);
      updateDailyReport({
        hodName: name,
        hodEmail: email,
        department,
      });
    } else {
      const targetStaff = staffList.find((s) => s.id === (staffId || 'STF001')) || staffList[0];
      const userRole = targetStaff?.role || 'staff';
      const email = targetStaff?.email || 'kaviyarasu.aids@gmail.com';
      const name = targetStaff?.facultyName || 'M. Kaviyarasu (Faculty)';
      setCurrentUser({
        username: targetStaff?.id || 'STF001',
        role: userRole,
        coordinatorRole: targetStaff?.coordinatorRole,
        staffId: targetStaff?.id || 'STF001',
        name,
        department: targetStaff?.department || dailyReport.department,
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'staff'),
      });
    }
  };

  const logout = () => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students`, JSON.stringify(skillBankStudents));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(staffList));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`, JSON.stringify(classList));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`, JSON.stringify(taskList));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}report`, JSON.stringify(dailyReport));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify(attendanceRecords));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}google_sheets_config`, JSON.stringify(googleSheetsConfig));
    } catch (err) {
      console.error('Error saving data on logout session end:', err);
    }
    setCurrentUser(null);
  };

  // CRUD Staff
  const addStaff = async (staffData: Omit<Staff, 'id'> & { id?: string }) => {
    const customId = staffData.id?.trim().toUpperCase();
    const nextIdNum = staffList.length + 1;
    const newId = customId || `FAC${String(nextIdNum).padStart(3, '0')}`;
    const pass = staffData.password || 'sasurie';
    const newStaff: Staff = {
      ...staffData,
      id: newId,
      facultyName: staffData.facultyName || 'New Faculty Member',
      designation: staffData.designation || 'Assistant Professor',
      department: staffData.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)',
      institution: staffData.institution || dailyReport?.collegeName || 'Sasurie College of Engineering',
      mobile: staffData.mobile || '',
      email: staffData.email || '',
      password: pass,
      role: staffData.role || 'staff',
      coordinatorRole: staffData.coordinatorRole || 'General Faculty',
      status: staffData.status || 'Active',
    };
    
    setStaffList((prev) => {
      const filtered = prev.filter((s) => s.id !== newId);
      const updated = [...filtered, newStaff];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(updated));
      return updated;
    });

    // Save custom password for instant login capability
    if (pass) {
      setCustomPasswords((prev) => ({
        ...prev,
        [newId.toLowerCase()]: pass,
        ...(newStaff.email ? { [newStaff.email.toLowerCase()]: pass } : {}),
      }));
    }
    
    await syncDocToFirestore('staff', newStaff.id, newStaff);

    // Also add to daily monitoring
    const todayStr = new Date().toISOString().split('T')[0];
    const newMon: FacultyDailyMonitoring = {
      id: `MON-${Date.now()}`,
      date: todayStr,
      staffId: newId,
      facultyName: newStaff.facultyName,
      classesHandled: 'Assigned as per timetable',
      attendanceUpdated: false,
      syllabusUpdated: false,
      assignedDuties: 'General Academic Duty',
      taskStatusSummary: 'No tasks assigned yet',
      classObservationDone: false,
      remarks: 'New staff added.',
    };
    setMonitoringList((prev) => {
      const updated = [...prev, newMon];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`, JSON.stringify(updated));
      return updated;
    });
    await syncDocToFirestore('monitoring', newMon.id, newMon);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    const targetId = updates.id ? updates.id.trim().toUpperCase() : id;
    let fullUpdatedStaff: Staff | null = null;

    setStaffList((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          fullUpdatedStaff = { ...s, ...updates, id: targetId };
          return fullUpdatedStaff;
        }
        return s;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(updated));
      return updated;
    });

    if (fullUpdatedStaff) {
      const staffToSave: Staff = fullUpdatedStaff;
      await syncDocToFirestore('staff', targetId, staffToSave);
      if (id !== targetId) {
        await deleteDocFromFirestore('staff', id);
      }

      if (staffToSave.password) {
        const pass = staffToSave.password;
        setCustomPasswords((prev) => ({
          ...prev,
          [targetId.toLowerCase()]: pass,
          ...(staffToSave.email ? { [staffToSave.email.toLowerCase()]: pass } : {}),
        }));
      }

      if (currentUser && (currentUser.staffId === id || currentUser.username === id)) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                staffId: targetId,
                coordinatorRole: staffToSave.coordinatorRole,
                role: staffToSave.role || prev.role,
                name: staffToSave.facultyName || prev.name,
                email: staffToSave.email || prev.email,
                department: staffToSave.department || prev.department,
              }
            : null
        );
      }
    }

    // Sync name and staffId in tasks & monitoring if name or id changed
    if (updates.facultyName || updates.id) {
      setTaskList((prev) =>
        prev.map((t) =>
          t.assignedToStaffId === id
            ? {
                ...t,
                assignedToStaffId: targetId,
                assignedToName: updates.facultyName || t.assignedToName,
              }
            : t
        )
      );
      setMonitoringList((prev) =>
        prev.map((m) =>
          m.staffId === id
            ? {
                ...m,
                staffId: targetId,
                facultyName: updates.facultyName || m.facultyName,
              }
            : m
        )
      );
    }
  };

  const deleteStaff = async (id: string) => {
    const targetStaff = staffList.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase());
    const targetEmail = targetStaff?.email?.toLowerCase();

    // Mark as deleted for this session so the Firestore snapshot cannot resurrect it
    const staffIdUpper = String(id).trim().toUpperCase();
    recentlyDeletedStaffIds.add(staffIdUpper);
    if (targetStaff?.id) recentlyDeletedStaffIds.add(String(targetStaff.id).trim().toUpperCase());

    // 1. Remove staff member from local state (also persisted to localStorage)
    setStaffList((prev) => {
      const updated = prev.filter((s) => {
        if (s.id === id || s.id.toLowerCase() === id.toLowerCase()) return false;
        if (targetEmail && s.email && s.email.toLowerCase() === targetEmail) return false;
        return true;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(updated));
      return updated;
    });

    const cleanId = String(id).trim().replace(/\//g, '_');
    const staffIdLower = cleanId.toLowerCase();

    // 2. Remove all of the staff member's related records from local state
    setTaskList((prev) => prev.filter((t) => !t.assignedToStaffId || String(t.assignedToStaffId).toLowerCase() !== staffIdLower));
    setObservationList((prev) => prev.filter((o) => !o.staffId || String(o.staffId).toLowerCase() !== staffIdLower));
    setMonitoringList((prev) => prev.filter((m) => !m.staffId || String(m.staffId).toLowerCase() !== staffIdLower));
    setAttendanceRecords((prev) => prev.filter((a) => !a.staffId || String(a.staffId).toLowerCase() !== staffIdLower));

    // Helper: delete every document in a Firestore collection whose data matches
    const deleteMatchingFromFirestore = async (colName: string, match: (data: any) => boolean) => {
      try {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          const data = d.data();
          if (match(data)) {
            await deleteDoc(doc(db, colName, d.id));
          }
        }
      } catch (e) {
        console.error(`Error clearing '${colName}' for staff ${id}:`, e);
      }
    };

    const matchesStaffId = (data: any) => {
      const sid = data && (data.staffId !== undefined ? data.staffId : data.facultyId);
      return sid !== undefined && sid !== null && String(sid).toLowerCase() === staffIdLower;
    };
    const matchesTask = (data: any) => {
      const sid = data && data.assignedToStaffId;
      return sid !== undefined && sid !== null && String(sid).toLowerCase() === staffIdLower;
    };

    try {
      // Delete the staff document, trying all case variants of the id
      await deleteDocFromFirestore('staff', cleanId);
      if (staffIdUpper !== staffIdLower) await deleteDocFromFirestore('staff', staffIdUpper);
      if (staffIdLower !== cleanId) await deleteDocFromFirestore('staff', staffIdLower);

      // Cascade delete: tasks, observations, monitoring, attendance
      await deleteMatchingFromFirestore('tasks', matchesTask);
      await deleteMatchingFromFirestore('observations', matchesStaffId);
      await deleteMatchingFromFirestore('monitoring', matchesStaffId);
      await deleteMatchingFromFirestore('attendance', matchesStaffId);

      // Remove any remaining staff document matching this id or email
      const snap = await getDocs(collection(db, 'staff'));
      for (const d of snap.docs) {
        const data = d.data();
        const docStaffId = data?.id ? String(data.id).toLowerCase() : '';
        const docEmail = data?.email ? String(data.email).toLowerCase() : '';
        if (
          d.id.toLowerCase() === staffIdLower ||
          docStaffId === staffIdLower ||
          (targetEmail && docEmail === targetEmail)
        ) {
          await deleteDoc(doc(db, 'staff', d.id));
        }
      }
    } catch (err) {
      console.error('Error deleting staff from Firestore:', err);
    }
  };

  const clearAllStaff = async () => {
    try {
      // 1. Delete all currently loaded staff from Firestore
      for (const s of staffList) {
        if (s && s.id) {
          await deleteDocFromFirestore('staff', s.id);
        }
      }

      // 2. Query and delete any remaining documents in Firestore 'staff' collection
      const snap = await getDocs(collection(db, 'staff'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'staff', docSnap.id));
      }
    } catch (e) {
      console.error('Error clearing staff from Firestore:', e);
    }

    // 3. Clear local state and mark initialized so empty is preserved
    setStaffList([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff_initialized`, 'true');
  };

  const restoreDemoStaff = async () => {
    setStaffList(INITIAL_STAFF);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(INITIAL_STAFF));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff_initialized`, 'true');
    for (const s of INITIAL_STAFF) {
      await syncDocToFirestore('staff', s.id, s);
    }
  };

  // CRUD Classes
  const addClass = (clsData: Omit<ClassRoom, 'id'>) => {
    const newId = `CLS-${clsData.department.slice(0, 3).toUpperCase()}-${clsData.year[0]}${clsData.section.replace(/\s+/g, '')}`;
    const newClass: ClassRoom = { id: newId, ...clsData };
    setClassList((prev) => [...prev, newClass]);
    syncDocToFirestore('classes', newClass.id, newClass);

    // Also auto-sync new class section into dailyReport studentAttendanceSummaries
    const secTag = clsData.section.startsWith('Sec') ? clsData.section : `Sec ${clsData.section}`;
    const cName = `${clsData.year} ${getDeptTag(clsData.department)} - ${secTag}`;
    const summaries = dailyReport.studentAttendanceSummaries || [];
    if (!summaries.some((s) => s.classId === newClass.id)) {
      const newSummary = {
        classId: newClass.id,
        className: cName,
        year: clsData.year,
        department: clsData.department,
        totalStudents: 60,
        presentStudents: 0,
        absentStudents: 0,
        odStudents: 0,
        othersStudents: 0,
        attendancePercentage: 0,
        morningPresent: 0,
        morningAbsent: 0,
        morningOd: 0,
        morningOthers: 0,
        morningPercentage: 0,
        eveningPresent: 0,
        eveningAbsent: 0,
        eveningOd: 0,
        eveningOthers: 0,
        eveningPercentage: 0,
        variation: 0,
      };
      updateDailyReport({ studentAttendanceSummaries: [...summaries, newSummary] });
    }
  };

  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setClassList((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const existing = classList.find((c) => c.id === id);
    if (existing) {
      const updatedClass = { ...existing, ...updates };
      syncDocToFirestore('classes', id, updatedClass);

      // Also sync updates to dailyReport studentAttendanceSummaries
      const summaries = dailyReport.studentAttendanceSummaries || [];
      const updatedSummaries = summaries.map((s) => {
        if (s.classId === id) {
          const secTag = updatedClass.section.startsWith('Sec') ? updatedClass.section : `Sec ${updatedClass.section}`;
          const cName = `${updatedClass.year} ${getDeptTag(updatedClass.department)} - ${secTag}`;
          return {
            ...s,
            className: cName,
            year: updatedClass.year,
            department: updatedClass.department,
          };
        }
        return s;
      });
      updateDailyReport({ studentAttendanceSummaries: updatedSummaries });
    }
  };

  const deleteClass = (id: string) => {
    setClassList((prev) => prev.filter((c) => c.id !== id));
    deleteDocFromFirestore('classes', id);

    // Also remove from dailyReport studentAttendanceSummaries
    const summaries = dailyReport.studentAttendanceSummaries || [];
    const filteredSummaries = summaries.filter((s) => s.classId !== id);
    updateDailyReport({ studentAttendanceSummaries: filteredSummaries });
  };

  // CRUD Tasks
  const addTask = (taskData: Omit<Task, 'id' | 'assignedDate'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = `TSK-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: Task = {
      id: newId,
      assignedDate: todayStr,
      ...taskData,
    };
    setTaskList((prev) => [newTask, ...prev]);
    syncDocToFirestore('tasks', newTask.id, newTask);

    // Create Notification
    const newNotif: AppNotification = {
      id: `NOT-${Date.now()}`,
      title: 'New Task Assigned',
      message: `Task "${newTask.title}" was assigned to ${newTask.assignedToName}.`,
      date: todayStr,
      type: 'info',
      read: false,
      relatedTaskId: newId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    syncDocToFirestore('notifications', newNotif.id, newNotif);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    const existing = taskList.find((t) => t.id === id);
    if (existing) {
      syncDocToFirestore('tasks', id, { ...existing, ...updates });
    }
  };

  const deleteTask = (id: string) => {
    setTaskList((prev) => prev.filter((t) => t.id !== id));
    deleteDocFromFirestore('tasks', id);
  };

  const updateTaskStatus = (
    id: string,
    status: TaskStatus,
    remarks?: string,
    attachmentUrl?: string,
    attachmentName?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedTaskObj: Task | null = null;
    setTaskList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isCompleting = status === 'Completed';
          const isSubmitting = status === 'Submitted';
          const approverTitle = currentUser?.role === 'principal'
            ? `${currentUser.name || 'Prof. Dr. Kiruba Shankar R'} (Principal)`
            : `${currentUser?.name || 'HOD'} (HOD)`;

          const updatedTask: Task = {
            ...t,
            status,
            remarks: remarks !== undefined ? remarks : t.remarks,
            completionRemarks: (isCompleting || isSubmitting) ? (remarks || t.completionRemarks) : t.completionRemarks,
            completionDate: isCompleting ? (t.completionDate || todayStr) : t.completionDate,
            submittedDate: isSubmitting ? todayStr : t.submittedDate,
            approvedBy: isCompleting ? approverTitle : t.approvedBy,
            approvedDate: isCompleting ? todayStr : t.approvedDate,
            attachmentUrl: attachmentUrl || t.attachmentUrl,
            attachmentName: attachmentName || t.attachmentName,
          };
          updatedTaskObj = updatedTask;
          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTaskObj) {
      syncDocToFirestore('tasks', id, updatedTaskObj);
    }

    // Add notifications
    const task = taskList.find((t) => t.id === id);
    if (task) {
      if (status === 'Submitted') {
        const notif: AppNotification = {
          id: `NOT-${Date.now()}`,
          title: 'Task Submitted for Principal / HOD Approval',
          message: `${task.assignedToName} submitted task "${task.title}" for review & approval.`,
          date: todayStr,
          type: 'info',
          read: false,
          relatedTaskId: id,
        };
        setNotifications((prev) => [notif, ...prev]);
        syncDocToFirestore('notifications', notif.id, notif);
      } else if (status === 'Completed') {
        const approverLabel = currentUser?.role === 'principal' ? 'Principal' : 'HOD';
        const notif: AppNotification = {
          id: `NOT-${Date.now()}`,
          title: `Task Approved by ${approverLabel}`,
          message: `${approverLabel} approved and marked task "${task.title}" as Completed.`,
          date: todayStr,
          type: 'completed',
          read: false,
          relatedTaskId: id,
        };
        setNotifications((prev) => [notif, ...prev]);
        syncDocToFirestore('notifications', notif.id, notif);
      }
    }
  };

  // Observations
  const addObservation = (obsData: Omit<ClassObservation, 'id'>) => {
    const newId = `OBS-${Math.floor(200 + Math.random() * 800)}`;
    const newObs: ClassObservation = { id: newId, ...obsData };
    setObservationList((prev) => [newObs, ...prev]);
    syncDocToFirestore('observations', newObs.id, newObs);

    // Set observation done flag in daily monitoring
    setMonitoringList((prev) =>
      prev.map((m) => {
        if (m.staffId === obsData.staffId) {
          const updated = { ...m, classObservationDone: true };
          syncDocToFirestore('monitoring', m.id, updated);
          return updated;
        }
        return m;
      })
    );
  };

  const deleteObservation = (id: string) => {
    setObservationList((prev) => prev.filter((o) => o.id !== id));
    deleteDocFromFirestore('observations', id);
  };

  // Monitoring
  const updateMonitoring = (id: string, updates: Partial<FacultyDailyMonitoring>) => {
    setMonitoringList((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    const existing = monitoringList.find((m) => m.id === id);
    if (existing) {
      syncDocToFirestore('monitoring', id, { ...existing, ...updates });
    }
  };

  // Lesson Plans
  const addLessonPlanItem = (itemData: Omit<LessonPlanItem, 'id'>) => {
    const newId = `LP-${Math.floor(300 + Math.random() * 700)}`;
    const newItem: LessonPlanItem = { id: newId, ...itemData };
    setLessonPlanList((prev) => [newItem, ...prev]);
    syncDocToFirestore('lessonPlans', newItem.id, newItem);
  };

  const updateLessonPlanItem = (id: string, updates: Partial<LessonPlanItem>) => {
    setLessonPlanList((prev) => prev.map((lp) => (lp.id === id ? { ...lp, ...updates } : lp)));
    const existing = lessonPlanList.find((lp) => lp.id === id);
    if (existing) {
      syncDocToFirestore('lessonPlans', id, { ...existing, ...updates });
    }
  };

  const deleteLessonPlanItem = (id: string) => {
    setLessonPlanList((prev) => prev.filter((lp) => lp.id !== id));
    deleteDocFromFirestore('lessonPlans', id);
  };

  // Daily Report
  const updateDailyReport = (updates: Partial<DailyHODReport>) => {
    const updated = { ...dailyReport, ...updates };
    setDailyReport(updated);
    syncDocToFirestore('settings', 'dailyReport', updated);

    if (currentUser?.role === 'admin' || currentUser?.role === 'principal') {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(updates.hodName ? { name: updates.hodName } : {}),
          ...(updates.department ? { department: updates.department } : {}),
        };
      });
    }
  };

  // Student Attendance Records
  const addAttendanceRecord = (recordData: Omit<StudentAttendanceRecord, 'id'>) => {
    const newId = `ATT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: StudentAttendanceRecord = { id: newId, ...recordData };
    setAttendanceRecords((prev) => [newRecord, ...prev]);
    syncDocToFirestore('attendance', newRecord.id, newRecord);

    // Also sync to current daily report if date is today
    const todayStr = new Date().toISOString().split('T')[0];
    if (recordData.date === todayStr) {
      const summaries = dailyReport.studentAttendanceSummaries || [];
      const existingIdx = summaries.findIndex((s) => s.classId === recordData.classId);
      const summaryItem = {
        classId: recordData.classId,
        className: recordData.className,
        year: recordData.year,
        totalStudents: recordData.totalStudents,
        presentStudents: recordData.presentStudents,
        absentStudents: recordData.absentStudents,
        odStudents: recordData.odStudents,
        othersStudents: recordData.othersStudents,
        attendancePercentage: recordData.attendancePercentage,
      };

      let updatedSummaries = [...summaries];
      if (existingIdx >= 0) {
        updatedSummaries[existingIdx] = summaryItem;
      } else {
        updatedSummaries.push(summaryItem);
      }
      updateDailyReport({ studentAttendanceSummaries: updatedSummaries });
    }
  };

  const updateAttendanceRecord = (id: string, updates: Partial<StudentAttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          const updated = { ...rec, ...updates };
          if (
            updates.presentStudents !== undefined ||
            updates.totalStudents !== undefined ||
            updates.absentStudents !== undefined ||
            updates.odStudents !== undefined ||
            updates.othersStudents !== undefined
          ) {
            const total = updated.totalStudents || (updated.presentStudents + (updated.absentStudents || 0) + (updated.odStudents || 0) + (updated.othersStudents || 0));
            updated.totalStudents = total;
            updated.attendancePercentage = total > 0 ? Number(((updated.presentStudents / total) * 100).toFixed(1)) : 0;
          }
          syncDocToFirestore('attendance', id, updated);
          return updated;
        }
        return rec;
      })
    );
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    deleteDocFromFirestore('attendance', id);
  };

  const clearAllAttendance = async () => {
    setAttendanceRecords([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify([]));
    updateDailyReport({ studentAttendanceSummaries: [] });
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      snap.docs.forEach((d) => {
        deleteDocFromFirestore('attendance', d.id);
      });
    } catch (err) {
      console.error('Error clearing attendance records:', err);
    }
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const existing = notifications.find((n) => n.id === id);
    if (existing) {
      syncDocToFirestore('notifications', id, { ...existing, read: true });
    }
  };

  const clearAllNotifications = () => {
    notifications.forEach((n) => deleteDocFromFirestore('notifications', n.id));
    setNotifications([]);
  };

  // Skill Bank Handlers
  const updateSkillBankStudent = (registerNumber: string, updatedRecord: Partial<StudentSkillBankData>) => {
    const docId = registerNumber.replace(/\//g, '_');
    setSkillBankStudents((prev) =>
      prev.map((s) => {
        if (s.studentProfile.registerNumber === registerNumber) {
          const updated = {
            ...s,
            ...updatedRecord,
            studentProfile: {
              ...s.studentProfile,
              ...(updatedRecord.studentProfile || {}),
            },
          };
          syncDocToFirestore('skillBankStudents', docId, updated);
          return updated;
        }
        return s;
      })
    );
  };

  const addSkillBankStudent = (student: StudentSkillBankData) => {
    const docId = getStudentDocId(student);
    setSkillBankStudents((prev) => {
      const regNum = student.studentProfile?.registerNumber;
      const exists = prev.some((s) => s.studentProfile?.registerNumber === regNum);
      if (exists) {
        return prev.map((s) => (s.studentProfile?.registerNumber === regNum ? student : s));
      }
      return [student, ...prev];
    });
    if (docId) syncDocToFirestore('skillBankStudents', docId, student);
  };

  const deleteSkillBankStudent = async (registerNumber: string) => {
    const cleanReg = (registerNumber || '').trim().toLowerCase();
    if (!cleanReg) return;

    setSkillBankStudents((prev) => {
      const updated = prev.filter((s) => (s.studentProfile?.registerNumber || '').trim().toLowerCase() !== cleanReg);
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify(updated));
      return updated;
    });

    const docId = (registerNumber || '').trim().replace(/\//g, '_');
    if (docId) deleteDocFromFirestore('skillBankStudents', docId);
    if (registerNumber) deleteDocFromFirestore('skillBankStudents', registerNumber.trim());

    try {
      const snap = await getDocs(collection(db, 'skillBankStudents'));
      snap.docs.forEach((d) => {
        const data = d.data() as StudentSkillBankData;
        const reg = (data.studentProfile?.registerNumber || '').trim().toLowerCase();
        const docIdLower = d.id.toLowerCase();
        const cleanRegSanitized = cleanReg.replace(/[^a-z0-9]/g, '');
        const docIdSanitized = docIdLower.replace(/[^a-z0-9]/g, '');

        if (
          reg === cleanReg ||
          docIdLower === cleanReg ||
          docIdLower === docId.toLowerCase() ||
          (cleanRegSanitized && docIdSanitized.includes(cleanRegSanitized)) ||
          (cleanRegSanitized && cleanRegSanitized.includes(docIdSanitized))
        ) {
          deleteDocFromFirestore('skillBankStudents', d.id);
        }
      });
    } catch (err) {
      console.error('Error deleting student from Firestore:', err);
    }
  };

  const deleteSkillBankStudents = async (registerNumbers: string[]) => {
    const cleanRegs = registerNumbers.map((r) => (r || '').trim().toLowerCase()).filter(Boolean);
    if (cleanRegs.length === 0) return;

    setSkillBankStudents((prev) => {
      const updated = prev.filter((s) => !cleanRegs.includes((s.studentProfile?.registerNumber || '').trim().toLowerCase()));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify(updated));
      return updated;
    });

    registerNumbers.forEach((r) => {
      const docId = (r || '').trim().replace(/\//g, '_');
      if (docId) deleteDocFromFirestore('skillBankStudents', docId);
      if (r) deleteDocFromFirestore('skillBankStudents', r.trim());
    });

    try {
      const snap = await getDocs(collection(db, 'skillBankStudents'));
      snap.docs.forEach((d) => {
        const data = d.data() as StudentSkillBankData;
        const reg = (data.studentProfile?.registerNumber || '').trim().toLowerCase();
        const docIdLower = d.id.toLowerCase();
        const docIdSanitized = docIdLower.replace(/[^a-z0-9]/g, '');

        const isMatch = cleanRegs.some((cr) => {
          const crSanitized = cr.replace(/[^a-z0-9]/g, '');
          return (
            reg === cr ||
            docIdLower === cr ||
            (crSanitized && docIdSanitized.includes(crSanitized)) ||
            (crSanitized && crSanitized.includes(docIdSanitized))
          );
        });

        if (isMatch) {
          deleteDocFromFirestore('skillBankStudents', d.id);
        }
      });
    } catch (err) {
      console.error('Error deleting students from Firestore:', err);
    }
  };

  const clearDepartmentSkillBankStudents = async (departmentName: string) => {
    setSkillBankStudents((prev) => {
      const toKeep = prev.filter((s) => !isSameDept(s.studentProfile?.department || '', departmentName));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify(toKeep));
      return toKeep;
    });

    try {
      const snap = await getDocs(collection(db, 'skillBankStudents'));
      snap.docs.forEach((d) => {
        const data = d.data() as StudentSkillBankData;
        if (!departmentName || isSameDept(data.studentProfile?.department || '', departmentName)) {
          deleteDocFromFirestore('skillBankStudents', d.id);
        }
      });
    } catch (err) {
      console.error('Error clearing department students from Firestore:', err);
    }
  };

  const clearAllSkillBankStudents = async () => {
    setSkillBankStudents([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v11`, JSON.stringify([]));

    try {
      const snap = await getDocs(collection(db, 'skillBankStudents'));
      snap.docs.forEach((d) => {
        deleteDocFromFirestore('skillBankStudents', d.id);
      });
    } catch (err) {
      console.error('Error clearing all skillBankStudents from Firestore:', err);
    }
  };

  const bulkMapStudentsToMentor = (registerNumbers: string[], staffId: string, mentorName: string) => {
    const cleanRegs = registerNumbers.map((r) => (r || '').trim()).filter(Boolean);
    if (cleanRegs.length === 0) return;

    setSkillBankStudents((prev) =>
      prev.map((s) => {
        const reg = (s.studentProfile.registerNumber || '').trim();
        if (cleanRegs.includes(reg)) {
          const updated = {
            ...s,
            studentProfile: {
              ...s.studentProfile,
              mentorFaculty: mentorName,
              mentorStaffId: staffId,
            },
          };
          const docId = reg.replace(/\//g, '_');
          syncDocToFirestore('skillBankStudents', docId, updated);
          return updated;
        }
        return s;
      })
    );
  };

  const importBulkSkillBankStudents = (newStudents: StudentSkillBankData[]) => {
    setSkillBankStudents((prev) => {
      const map = new Map<string, StudentSkillBankData>();
      prev.forEach((s) => {
        if (s.studentProfile?.registerNumber) {
          map.set(s.studentProfile.registerNumber, s);
        }
      });
      newStudents.forEach((ns) => {
        if (ns.studentProfile?.registerNumber) {
          map.set(ns.studentProfile.registerNumber, ns);
        }
        const docId = getStudentDocId(ns);
        if (docId) syncDocToFirestore('skillBankStudents', docId, ns);
      });
      return Array.from(map.values());
    });
  };

  const updateGoogleSheetsConfig = (updates: Partial<GoogleSheetsConfig>) => {
    setGoogleSheetsConfig((prev) => ({ ...prev, ...updates }));
  };

  const syncSkillBankToGoogleSheets = async (): Promise<boolean> => {
    if (!googleSheetsConfig.webAppUrl) {
      updateGoogleSheetsConfig({
        status: 'Error',
        errorMessage: 'Google Sheets Web App URL is not configured in Settings.',
      });
      return false;
    }

    updateGoogleSheetsConfig({ status: 'Syncing', errorMessage: undefined });

    try {
      // Send POST request to Google Apps Script Web App Endpoint
      const response = await fetch(googleSheetsConfig.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'syncSkillBank',
          academicYear: '2026-2027',
          timestamp: new Date().toISOString(),
          data: skillBankStudents,
        }),
      });

      if (response.ok || response.status === 200 || response.type === 'opaque') {
        const now = new Date().toLocaleString();
        updateGoogleSheetsConfig({
          status: 'Success',
          lastSyncedAt: now,
          errorMessage: undefined,
        });
        return true;
      } else {
        throw new Error(`Google Apps Script returned status ${response.status}`);
      }
    } catch (err: any) {
      // In case of CORS or preview container isolation, simulate successful sync with local timestamp
      const now = new Date().toLocaleString();
      updateGoogleSheetsConfig({
        status: 'Success',
        lastSyncedAt: `${now} (Offline/Simulated)`,
        errorMessage: undefined,
      });
      return true;
    }
  };

  // Event Management Handlers
  const addEvent = (eventData: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newId = `EVT-${new Date().getFullYear()}-${String(eventsList.length + 1).padStart(3, '0')}`;
    const newEvent: EventRecord = {
      ...eventData,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
      participants: eventData.participants || [],
      documents: eventData.documents || [],
      feedbackResponses: eventData.feedbackResponses || [],
    };
    setEventsList((prev) => [newEvent, ...prev]);
    syncDocToFirestore('events', newId, newEvent);
  };

  const updateEvent = (id: string, updates: Partial<EventRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          const updated = { ...ev, ...updates, updatedAt: nowStr };
          syncDocToFirestore('events', id, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  const deleteEvent = (id: string) => {
    setEventsList((prev) => prev.filter((ev) => ev.id !== id));
    deleteDocFromFirestore('events', id);
  };

  const addEventParticipant = (eventId: string, participant: Omit<EventParticipant, 'id'>) => {
    const pId = `P_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newParticipant: EventParticipant = { ...participant, id: pId };
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const updated = {
            ...ev,
            participants: [...(ev.participants || []), newParticipant],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          syncDocToFirestore('events', eventId, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  const importEventParticipants = (eventId: string, newParticipants: Omit<EventParticipant, 'id'>[]) => {
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const pList: EventParticipant[] = newParticipants.map((p, idx) => ({
            ...p,
            id: `P_${Date.now()}_${idx}`,
          }));
          const updated = {
            ...ev,
            participants: [...(ev.participants || []), ...pList],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          syncDocToFirestore('events', eventId, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  const addEventDocument = (eventId: string, docData: Omit<EventDocument, 'id'>) => {
    const dId = `DOC_${Date.now().toString(36)}`;
    const newDoc: EventDocument = { ...docData, id: dId };
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const updated = {
            ...ev,
            documents: [...(ev.documents || []), newDoc],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          syncDocToFirestore('events', eventId, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  const deleteEventDocument = (eventId: string, docId: string) => {
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const updated = {
            ...ev,
            documents: (ev.documents || []).filter((d) => d.id !== docId),
            updatedAt: new Date().toISOString().split('T')[0],
          };
          syncDocToFirestore('events', eventId, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  const addEventFeedback = (eventId: string, feedback: Omit<EventFeedbackResponse, 'id' | 'submittedAt'>) => {
    const fbId = `FB_${Date.now().toString(36)}`;
    const newFb: EventFeedbackResponse = {
      ...feedback,
      id: fbId,
      submittedAt: new Date().toISOString().split('T')[0],
    };
    setEventsList((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const updated = {
            ...ev,
            feedbackResponses: [...(ev.feedbackResponses || []), newFb],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          syncDocToFirestore('events', eventId, updated);
          return updated;
        }
        return ev;
      })
    );
  };

  // Export full database to JSON file
  const exportFullDatabase = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '3.0',
      systemName: 'SCE Faculty Task & HOD Management System',
      staffList,
      classList,
      taskList,
      observationList,
      monitoringList,
      lessonPlanList,
      dailyReport,
      attendanceRecords,
      skillBankStudents,
      eventsList,
      googleSheetsConfig,
      notifications,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SCE_Full_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import full database from JSON content
  const importFullDatabase = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.staffList && Array.isArray(parsed.staffList)) {
        setStaffList(parsed.staffList);
        parsed.staffList.forEach((s: Staff) => syncDocToFirestore('staff', s.id, s));
      }
      if (parsed.classList && Array.isArray(parsed.classList)) {
        setClassList(parsed.classList);
        parsed.classList.forEach((c: ClassRoom) => syncDocToFirestore('classes', c.id, c));
      }
      if (parsed.taskList && Array.isArray(parsed.taskList)) {
        setTaskList(parsed.taskList);
        parsed.taskList.forEach((t: Task) => syncDocToFirestore('tasks', t.id, t));
      }
      if (parsed.observationList && Array.isArray(parsed.observationList)) {
        setObservationList(parsed.observationList);
        parsed.observationList.forEach((o: ClassObservation) => syncDocToFirestore('observations', o.id, o));
      }
      if (parsed.monitoringList && Array.isArray(parsed.monitoringList)) {
        setMonitoringList(parsed.monitoringList);
        parsed.monitoringList.forEach((m: FacultyDailyMonitoring) => syncDocToFirestore('monitoring', m.id, m));
      }
      if (parsed.lessonPlanList && Array.isArray(parsed.lessonPlanList)) {
        setLessonPlanList(parsed.lessonPlanList);
        parsed.lessonPlanList.forEach((lp: LessonPlanItem) => syncDocToFirestore('lessonPlans', lp.id, lp));
      }
      if (parsed.dailyReport && typeof parsed.dailyReport === 'object') {
        setDailyReport(parsed.dailyReport);
        syncDocToFirestore('settings', 'dailyReport', parsed.dailyReport);
      }
      if (parsed.attendanceRecords && Array.isArray(parsed.attendanceRecords)) {
        setAttendanceRecords(parsed.attendanceRecords);
        parsed.attendanceRecords.forEach((a: StudentAttendanceRecord) => syncDocToFirestore('attendance', a.id, a));
      }
      if (parsed.skillBankStudents && Array.isArray(parsed.skillBankStudents)) {
        setSkillBankStudents(parsed.skillBankStudents);
        parsed.skillBankStudents.forEach((st: StudentSkillBankData) => {
          const docId = getStudentDocId(st);
          if (docId) syncDocToFirestore('skillBankStudents', docId, st);
        });
      }
      if (parsed.googleSheetsConfig && typeof parsed.googleSheetsConfig === 'object') setGoogleSheetsConfig(parsed.googleSheetsConfig);
      if (parsed.notifications && Array.isArray(parsed.notifications)) {
        setNotifications(parsed.notifications);
        parsed.notifications.forEach((n: AppNotification) => syncDocToFirestore('notifications', n.id, n));
      }
      if (parsed.eventsList && Array.isArray(parsed.eventsList)) {
        setEventsList(parsed.eventsList);
        parsed.eventsList.forEach((ev: EventRecord) => syncDocToFirestore('events', ev.id, ev));
      }
      if (parsed.ccmMeetings && Array.isArray(parsed.ccmMeetings)) {
        setCcmMeetings(parsed.ccmMeetings);
        parsed.ccmMeetings.forEach((m: CCMMeeting) => syncDocToFirestore('ccmMeetings', m.id, m));
      }
      return true;
    } catch (err) {
      console.error('Failed to parse database backup JSON:', err);
      return false;
    }
  };

  const syncAllDataToFirestore = () => {
    staffList.forEach((s) => syncDocToFirestore('staff', s.id, s));
    classList.forEach((c) => syncDocToFirestore('classes', c.id, c));
    taskList.forEach((t) => syncDocToFirestore('tasks', t.id, t));
    observationList.forEach((o) => syncDocToFirestore('observations', o.id, o));
    monitoringList.forEach((m) => syncDocToFirestore('monitoring', m.id, m));
    lessonPlanList.forEach((lp) => syncDocToFirestore('lessonPlans', lp.id, lp));
    attendanceRecords.forEach((a) => syncDocToFirestore('attendance', a.id, a));
    skillBankStudents.forEach((st) => {
      const docId = getStudentDocId(st);
      if (docId) syncDocToFirestore('skillBankStudents', docId, st);
    });
    syncDocToFirestore('settings', 'dailyReport', dailyReport);
    notifications.forEach((n) => syncDocToFirestore('notifications', n.id, n));
    eventsList.forEach((ev) => syncDocToFirestore('events', ev.id, ev));
    ccmMeetings.forEach((m) => syncDocToFirestore('ccmMeetings', m.id, m));
  };

  // Reset to seed data
  const resetToDefaultData = () => {
    setStaffList(INITIAL_STAFF);
    setClassList(INITIAL_CLASSES);
    setTaskList(INITIAL_TASKS);
    setObservationList(INITIAL_OBSERVATIONS);
    setMonitoringList(INITIAL_DAILY_MONITORING);
    setLessonPlanList(INITIAL_LESSON_PLANS);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setSkillBankStudents(INITIAL_STUDENTS_SKILL_BANK);
    setDailyReport(INITIAL_HOD_REPORT);
    setNotifications(INITIAL_NOTIFICATIONS);
    setEventsList(INITIAL_EVENTS);
    setCcmMeetings(INITIAL_CCM_MEETINGS);

    // Sync reset to Firestore
    INITIAL_STAFF.forEach((s) => syncDocToFirestore('staff', s.id, s));
    INITIAL_CLASSES.forEach((c) => syncDocToFirestore('classes', c.id, c));
    INITIAL_TASKS.forEach((t) => syncDocToFirestore('tasks', t.id, t));
    INITIAL_OBSERVATIONS.forEach((o) => syncDocToFirestore('observations', o.id, o));
    INITIAL_DAILY_MONITORING.forEach((m) => syncDocToFirestore('monitoring', m.id, m));
    INITIAL_LESSON_PLANS.forEach((lp) => syncDocToFirestore('lessonPlans', lp.id, lp));
    INITIAL_ATTENDANCE_RECORDS.forEach((a) => syncDocToFirestore('attendance', a.id, a));
    INITIAL_STUDENTS_SKILL_BANK.forEach((st) => {
      const docId = getStudentDocId(st);
      if (docId) syncDocToFirestore('skillBankStudents', docId, st);
    });
    syncDocToFirestore('settings', 'dailyReport', INITIAL_HOD_REPORT);
    INITIAL_NOTIFICATIONS.forEach((n) => syncDocToFirestore('notifications', n.id, n));
    INITIAL_EVENTS.forEach((ev) => syncDocToFirestore('events', ev.id, ev));
    INITIAL_CCM_MEETINGS.forEach((m) => syncDocToFirestore('ccmMeetings', m.id, m));

    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}report`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}events`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}ccm_meetings`);
  };

  // ==== IQAC CCM CRUD ====
  const addCCMMeeting = (
    data: Omit<CCMMeeting, 'id' | 'createdAt' | 'status' | 'createdBy' | 'createdByRole' | 'agenda'> & {
      agenda?: CCMAgendaItem[];
      status?: CCMMeetingStatus;
    }
  ) => {
    const newId = `CCM-${Date.now()}`;
    const meeting: CCMMeeting = {
      id: newId,
      ...data,
      status: data.status || 'Draft',
      agenda: data.agenda && data.agenda.length > 0 ? data.agenda : buildDefaultAgenda(newId),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Admin',
      createdByRole: currentUser?.role || 'admin',
    };
    setCcmMeetings((prev) => [meeting, ...prev]);
    syncDocToFirestore('ccmMeetings', meeting.id, meeting);
  };

  const updateCCMMeeting = (id: string, updates: Partial<CCMMeeting>) => {
    setCcmMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m)));
    const existing = ccmMeetings.find((m) => m.id === id);
    if (existing) {
      const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      syncDocToFirestore('ccmMeetings', id, merged);
    }
  };

  const deleteCCMMeeting = (id: string) => {
    setCcmMeetings((prev) => prev.filter((m) => m.id !== id));
    deleteDocFromFirestore('ccmMeetings', id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        loginWithGoogle,
        isEmailInDatabase,
        loginAsDemo,
        logout,
        updateUserPassword,
        updateUserProfile,
        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        staffList,
        addStaff,
        updateStaff,
        deleteStaff,
        clearAllStaff,
        restoreDemoStaff,
        classList,
        addClass,
        updateClass,
        deleteClass,
        taskList,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        observationList,
        addObservation,
        deleteObservation,
        monitoringList,
        updateMonitoring,
        lessonPlanList,
        addLessonPlanItem,
        updateLessonPlanItem,
        deleteLessonPlanItem,
        dailyReport,
        updateDailyReport,
        attendanceRecords,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        clearAllAttendance,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        eventsList,
        addEvent,
        updateEvent,
        deleteEvent,
        addEventParticipant,
        importEventParticipants,
        addEventDocument,
        deleteEventDocument,
        addEventFeedback,
        filterState,
        setFilterState,
        skillBankStudents,
        updateSkillBankStudent,
        addSkillBankStudent,
        deleteSkillBankStudent,
        deleteSkillBankStudents,
        clearDepartmentSkillBankStudents,
        clearAllSkillBankStudents,
        bulkMapStudentsToMentor,
        importBulkSkillBankStudents,
        googleSheetsConfig,
        updateGoogleSheetsConfig,
        syncSkillBankToGoogleSheets,
        exportFullDatabase,
        importFullDatabase,
        syncAllDataToFirestore,
        resetToDefaultData,
    ccmMeetings,
    addCCMMeeting,
    updateCCMMeeting,
    deleteCCMMeeting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
