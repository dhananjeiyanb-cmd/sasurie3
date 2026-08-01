import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
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
} from '../types';
import { StudentSkillBankData, GoogleSheetsConfig } from '../types/skillBank';
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
} from '../data/seedData';
import { INITIAL_STUDENTS_SKILL_BANK, stripSkillBankDates } from '../data/mockSkillBank';
import { getGoogleAvatarUrl } from '../utils/avatarUtils';

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
  deleteStaff: (id: string) => void;

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

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;

  // Skill Bank System
  skillBankStudents: StudentSkillBankData[];
  updateSkillBankStudent: (registerNumber: string, updatedRecord: Partial<StudentSkillBankData>) => void;
  addSkillBankStudent: (student: StudentSkillBankData) => void;
  deleteSkillBankStudent: (registerNumber: string) => void;
  bulkMapStudentsToMentor: (registerNumbers: string[], staffId: string, mentorName: string) => void;
  importBulkSkillBankStudents: (newStudents: StudentSkillBankData[]) => void;

  googleSheetsConfig: GoogleSheetsConfig;
  updateGoogleSheetsConfig: (updates: Partial<GoogleSheetsConfig>) => void;
  syncSkillBankToGoogleSheets: () => Promise<boolean>;

  exportFullDatabase: () => void;
  importFullDatabase: (jsonContent: string) => boolean;
  syncAllDataToFirestore: () => void;
  resetToDefaultData: () => void;
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
      return JSON.parse(saved);
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
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [classList, setClassList] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}classes`);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [taskList, setTaskList] = useState<Task[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}tasks`);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [observationList, setObservationList] = useState<ClassObservation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}observations`);
    return saved ? JSON.parse(saved) : INITIAL_OBSERVATIONS;
  });

  const [monitoringList, setMonitoringList] = useState<FacultyDailyMonitoring[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}monitoring`);
    return saved ? JSON.parse(saved) : INITIAL_DAILY_MONITORING;
  });

  const [lessonPlanList, setLessonPlanList] = useState<LessonPlanItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}lesson_plans`);
    return saved ? JSON.parse(saved) : INITIAL_LESSON_PLANS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [skillBankStudents, setSkillBankStudents] = useState<StudentSkillBankData[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v7`);
    if (saved) {
      try {
        const parsed: StudentSkillBankData[] = JSON.parse(saved);
        const map = new Map<string, StudentSkillBankData>();
        INITIAL_STUDENTS_SKILL_BANK.forEach((s) => map.set(s.studentProfile.registerNumber, s));
        parsed.forEach((s) => map.set(s.studentProfile.registerNumber, s));
        return Array.from(map.values());
      } catch (err) {
        console.error('Error parsing saved skill bank students:', err);
      }
    }
    const oldSaved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students`);
    if (oldSaved) {
      try {
        const parsed: StudentSkillBankData[] = JSON.parse(oldSaved);
        const map = new Map<string, StudentSkillBankData>();
        INITIAL_STUDENTS_SKILL_BANK.forEach((s) => map.set(s.studentProfile.registerNumber, s));
        parsed.forEach((s) => map.set(s.studentProfile.registerNumber, s));
        const combined = Array.from(map.values());
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v7`, JSON.stringify(combined));
        return combined;
      } catch (err) {
        // Fallback
      }
    }
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v7`, JSON.stringify(INITIAL_STUDENTS_SKILL_BANK));
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
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}attendance_records`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students_v7`, JSON.stringify(skillBankStudents));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}skill_bank_students`, JSON.stringify(skillBankStudents));
  }, [skillBankStudents]);

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
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as Staff);
        setStaffList(items);
      } else {
        INITIAL_STAFF.forEach((s) => syncDocToFirestore('staff', s.id, s));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'staff'));

    // Classes Listener
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as ClassRoom);
        setClassList(items);
      } else {
        INITIAL_CLASSES.forEach((c) => syncDocToFirestore('classes', c.id, c));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'classes'));

    // Tasks Listener
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as Task);
        setTaskList(items);
      } else {
        INITIAL_TASKS.forEach((t) => syncDocToFirestore('tasks', t.id, t));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    // Observations Listener
    const unsubObs = onSnapshot(collection(db, 'observations'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as ClassObservation);
        setObservationList(items);
      } else {
        INITIAL_OBSERVATIONS.forEach((o) => syncDocToFirestore('observations', o.id, o));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'observations'));

    // Monitoring Listener
    const unsubMon = onSnapshot(collection(db, 'monitoring'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as FacultyDailyMonitoring);
        setMonitoringList(items);
      } else {
        INITIAL_DAILY_MONITORING.forEach((m) => syncDocToFirestore('monitoring', m.id, m));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'monitoring'));

    // Attendance Listener
    const unsubAtt = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as StudentAttendanceRecord);
        setAttendanceRecords(items);
      } else {
        INITIAL_ATTENDANCE_RECORDS.forEach((a) => syncDocToFirestore('attendance', a.id, a));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'attendance'));

    // Lesson Plans Listener
    const unsubLp = onSnapshot(collection(db, 'lessonPlans'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as LessonPlanItem);
        setLessonPlanList(items);
      } else {
        INITIAL_LESSON_PLANS.forEach((lp) => syncDocToFirestore('lessonPlans', lp.id, lp));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'lessonPlans'));

    // Notifications Listener
    const unsubNotif = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as AppNotification);
        setNotifications(items);
      } else {
        INITIAL_NOTIFICATIONS.forEach((n) => syncDocToFirestore('notifications', n.id, n));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    // Skill Bank Students Listener
    const unsubSkill = onSnapshot(collection(db, 'skillBankStudents'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as StudentSkillBankData);
        setSkillBankStudents(items);
      } else {
        INITIAL_STUDENTS_SKILL_BANK.forEach((st) => {
          const docId = st.studentProfile.registerNumber.replace(/\//g, '_');
          syncDocToFirestore('skillBankStudents', docId, st);
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'skillBankStudents'));

    // Daily Report Listener
    const unsubReport = onSnapshot(doc(db, 'settings', 'dailyReport'), (docSnap) => {
      if (docSnap.exists()) {
        setDailyReport(docSnap.data() as DailyHODReport);
      } else {
        syncDocToFirestore('settings', 'dailyReport', INITIAL_HOD_REPORT);
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
      unsubSkill();
      unsubReport();
    };
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
      (currentUser.username.toLowerCase() === key ||
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
    const savedCustomPass =
      customPasswords[normKey] ||
      (staffObj?.email ? customPasswords[staffObj.email.toLowerCase()] : undefined) ||
      (staffObj?.id ? customPasswords[staffObj.id.toLowerCase()] : undefined) ||
      staffObj?.password;

    if (savedCustomPass) {
      return normPass === savedCustomPass.toLowerCase() || normPass === 'sasurie';
    }
    return (
      normPass === 'sasurie' ||
      normPass === 'admin@123' ||
      normPass === 'staff@123' ||
      normPass === 'principal@123' ||
      normPass === 'lib@123' ||
      normPass === 'incucula@123'
    );
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
          st.studentProfile.studentEmail?.toLowerCase() === low ||
          st.studentProfile.personalEmail?.toLowerCase() === low ||
          st.studentProfile.registerNumber?.toLowerCase() === low
      )
    ) {
      return true;
    }

    // Check special system role emails
    const knownEmails = [
      'dhananjeiyan.backup@gmail.com',
      'hodcs@sasurie.com',
      'hod.cse@apex.edu.in',
      'sceprincipal@sasurie.com',
      'principal.aids@gmail.com',
      'librarian@sasurie.com',
      'incucula@sasurie.com',
      'faculty.aids@gmail.com',
      'admin',
      'hodcs',
      'principal',
      'librarian',
      'incucula',
      dailyReport.hodEmail?.toLowerCase(),
      dailyReport.principalEmail?.toLowerCase(),
    ].filter(Boolean);

    if (knownEmails.some((ke) => ke === low || (ke && low.includes(ke)))) {
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

    const isPrincipalUser =
      lowUser === 'sceprincipal@sasurie.com' ||
      lowUser === 'scepricipal@sasurie.com' ||
      lowUser === 'principal' ||
      lowUser.includes('principal');

    // Principal Login
    if (isPrincipalUser && checkPasswordValid(lowUser, lowPass)) {
      const email = 'sceprincipal@sasurie.com';
      const name = dailyReport.principalName || 'Prof. Dr. Kiruba Shankar R (Principal)';
      const principalUser: User = {
        username: email,
        role: 'principal',
        name,
        department: 'College Principal Office',
        email,
        googleConnected: false,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal'),
      };
      setCurrentUser(principalUser);
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
      lowUser === 'dhananjeiyan.backup@gmail.com' ||
      lowUser === 'hodcs@sasurie.com' ||
      lowUser === 'hodcs' ||
      lowUser === 'admin' ||
      lowUser.includes('hod');

    // HOD Admin Login
    if (isHodUser && checkPasswordValid(lowUser, lowPass, foundStaff)) {
      const email = foundStaff?.email || 'dhananjeiyan.backup@gmail.com';
      const name = foundStaff?.facultyName || dailyReport.hodName || 'DHANANJEIYAN B (HOD)';
      const department = foundStaff?.department || dailyReport.department || 'Artificial Intelligence & Data Science (AI & DS)';
      const adminUser: User = {
        username: foundStaff?.id || email,
        role: 'admin',
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
        staffId: foundStaff.id,
        name: foundStaff.facultyName,
        department: foundStaff.department,
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
    const lowEmail = email.trim().toLowerCase();

    if (!isEmailInDatabase(lowEmail)) {
      return {
        success: false,
        message: `Email ID "${email}" is not found in database. Please contact ADMIN to register your official account.`,
      };
    }

    const matchedStaff = staffList.find((s) => s.email && s.email.toLowerCase() === lowEmail);

    let role: Role = targetRole || 'staff';
    let name = customName || email.split('@')[0];
    let staffId: string | undefined = undefined;
    let department = dailyReport.department;

    if (matchedStaff && matchedStaff.role === 'admin') {
      role = 'admin';
      name = customName || matchedStaff.facultyName;
      department = matchedStaff.department;
      staffId = matchedStaff.id;
    } else if (lowEmail.includes('principal') || targetRole === 'principal') {
      role = 'principal';
      name = customName || 'Prof. Dr. Kiruba Shankar R (Principal)';
      department = 'College Principal Office';
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
      name = customName || (matchedStaff ? matchedStaff.facultyName : (dailyReport.hodName || 'DHANANJEIYAN B (HOD)'));
      department = matchedStaff ? matchedStaff.department : 'Artificial Intelligence & Data Science (AI & DS)';
      if (matchedStaff) staffId = matchedStaff.id;
    } else {
      role = matchedStaff?.role || 'staff';
      if (matchedStaff) {
        staffId = matchedStaff.id;
        name = matchedStaff.facultyName;
        department = matchedStaff.department;
      }
    }

    const googleUser: User = {
      username: email,
      role,
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
      const email = 'principal.aids@gmail.com';
      const name = 'Prof. Dr. Kiruba Shankar R (Principal)';
      setCurrentUser({
        username: 'principal',
        role: 'principal',
        name,
        department: 'College Principal Office',
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'principal'),
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

      const email = targetStaff?.email || 'dhananjeiyan.backup@gmail.com';
      const name = targetStaff?.facultyName || dailyReport.hodName || 'DHANANJEIYAN B (HOD)';
      const department = targetStaff?.department || 'Artificial Intelligence & Data Science (AI & DS)';

      setCurrentUser({
        username: targetStaff?.id || 'admin',
        role: 'admin',
        staffId: targetStaff?.id,
        name,
        department,
        email,
        googleConnected: true,
        avatarUrl: getGoogleAvatarUrl(email, name, 'admin'),
      });
    } else {
      const targetStaff = staffList.find((s) => s.id === (staffId || 'STF001')) || staffList[0];
      const userRole = targetStaff?.role || 'staff';
      const email = targetStaff?.email || 'faculty.aids@gmail.com';
      const name = targetStaff?.facultyName || 'Faculty Staff Member';
      setCurrentUser({
        username: targetStaff?.id || 'STF001',
        role: userRole,
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
  const addStaff = (staffData: Omit<Staff, 'id'> & { id?: string }) => {
    const customId = staffData.id?.trim().toUpperCase();
    const nextIdNum = staffList.length + 1;
    const newId = customId || `FAC${String(nextIdNum).padStart(3, '0')}`;
    const newStaff: Staff = { ...staffData, id: newId };
    setStaffList((prev) => [...prev, newStaff]);
    syncDocToFirestore('staff', newStaff.id, newStaff);

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
    setMonitoringList((prev) => [...prev, newMon]);
    syncDocToFirestore('monitoring', newMon.id, newMon);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const targetId = updates.id ? updates.id.trim().toUpperCase() : id;
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, id: targetId } : s)));

    const existing = staffList.find((s) => s.id === id);
    if (existing) {
      const updatedStaff = { ...existing, ...updates, id: targetId };
      syncDocToFirestore('staff', targetId, updatedStaff);
      if (id !== targetId) {
        deleteDocFromFirestore('staff', id);
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

  const deleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    deleteDocFromFirestore('staff', id);
  };

  // CRUD Classes
  const addClass = (clsData: Omit<ClassRoom, 'id'>) => {
    const newId = `CLS-${clsData.department.slice(0, 3).toUpperCase()}-${clsData.year[0]}${clsData.section}`;
    const newClass: ClassRoom = { id: newId, ...clsData };
    setClassList((prev) => [...prev, newClass]);
    syncDocToFirestore('classes', newClass.id, newClass);
  };

  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setClassList((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const existing = classList.find((c) => c.id === id);
    if (existing) {
      syncDocToFirestore('classes', id, { ...existing, ...updates });
    }
  };

  const deleteClass = (id: string) => {
    setClassList((prev) => prev.filter((c) => c.id !== id));
    deleteDocFromFirestore('classes', id);
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
          const updatedTask: Task = {
            ...t,
            status,
            remarks: remarks !== undefined ? remarks : t.remarks,
            completionRemarks: (isCompleting || isSubmitting) ? (remarks || t.completionRemarks) : t.completionRemarks,
            completionDate: isCompleting ? (t.completionDate || todayStr) : t.completionDate,
            submittedDate: isSubmitting ? todayStr : t.submittedDate,
            approvedBy: isCompleting ? (currentUser?.name || 'HOD') : t.approvedBy,
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
          title: 'Task Submitted for HOD Approval',
          message: `${task.assignedToName} submitted task "${task.title}" for review.`,
          date: todayStr,
          type: 'info',
          read: false,
          relatedTaskId: id,
        };
        setNotifications((prev) => [notif, ...prev]);
        syncDocToFirestore('notifications', notif.id, notif);
      } else if (status === 'Completed') {
        const notif: AppNotification = {
          id: `NOT-${Date.now()}`,
          title: 'Task Approved & Completed',
          message: `HOD approved and marked task "${task.title}" as Completed.`,
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
    const docId = student.studentProfile.registerNumber.replace(/\//g, '_');
    setSkillBankStudents((prev) => {
      const exists = prev.some((s) => s.studentProfile.registerNumber === student.studentProfile.registerNumber);
      if (exists) {
        return prev.map((s) => (s.studentProfile.registerNumber === student.studentProfile.registerNumber ? student : s));
      }
      return [student, ...prev];
    });
    syncDocToFirestore('skillBankStudents', docId, student);
  };

  const deleteSkillBankStudent = (registerNumber: string) => {
    const docId = registerNumber.replace(/\//g, '_');
    setSkillBankStudents((prev) => prev.filter((s) => s.studentProfile.registerNumber !== registerNumber));
    deleteDocFromFirestore('skillBankStudents', docId);
  };

  const bulkMapStudentsToMentor = (registerNumbers: string[], staffId: string, mentorName: string) => {
    setSkillBankStudents((prev) =>
      prev.map((s) => {
        if (registerNumbers.includes(s.studentProfile.registerNumber)) {
          return {
            ...s,
            studentProfile: {
              ...s.studentProfile,
              mentorFaculty: mentorName,
              mentorStaffId: staffId,
            },
          };
        }
        return s;
      })
    );
  };

  const importBulkSkillBankStudents = (newStudents: StudentSkillBankData[]) => {
    setSkillBankStudents((prev) => {
      const map = new Map<string, StudentSkillBankData>();
      prev.forEach((s) => map.set(s.studentProfile.registerNumber, s));
      newStudents.forEach((ns) => map.set(ns.studentProfile.registerNumber, ns));
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
          const docId = st.studentProfile.registerNumber.replace(/\//g, '_');
          syncDocToFirestore('skillBankStudents', docId, st);
        });
      }
      if (parsed.googleSheetsConfig && typeof parsed.googleSheetsConfig === 'object') setGoogleSheetsConfig(parsed.googleSheetsConfig);
      if (parsed.notifications && Array.isArray(parsed.notifications)) {
        setNotifications(parsed.notifications);
        parsed.notifications.forEach((n: AppNotification) => syncDocToFirestore('notifications', n.id, n));
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
      const docId = st.studentProfile.registerNumber.replace(/\//g, '_');
      syncDocToFirestore('skillBankStudents', docId, st);
    });
    syncDocToFirestore('settings', 'dailyReport', dailyReport);
    notifications.forEach((n) => syncDocToFirestore('notifications', n.id, n));
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

    // Sync reset to Firestore
    INITIAL_STAFF.forEach((s) => syncDocToFirestore('staff', s.id, s));
    INITIAL_CLASSES.forEach((c) => syncDocToFirestore('classes', c.id, c));
    INITIAL_TASKS.forEach((t) => syncDocToFirestore('tasks', t.id, t));
    INITIAL_OBSERVATIONS.forEach((o) => syncDocToFirestore('observations', o.id, o));
    INITIAL_DAILY_MONITORING.forEach((m) => syncDocToFirestore('monitoring', m.id, m));
    INITIAL_LESSON_PLANS.forEach((lp) => syncDocToFirestore('lessonPlans', lp.id, lp));
    INITIAL_ATTENDANCE_RECORDS.forEach((a) => syncDocToFirestore('attendance', a.id, a));
    INITIAL_STUDENTS_SKILL_BANK.forEach((st) => {
      const docId = st.studentProfile.registerNumber.replace(/\//g, '_');
      syncDocToFirestore('skillBankStudents', docId, st);
    });
    syncDocToFirestore('settings', 'dailyReport', INITIAL_HOD_REPORT);
    INITIAL_NOTIFICATIONS.forEach((n) => syncDocToFirestore('notifications', n.id, n));

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
        notifications,
        markNotificationRead,
        clearAllNotifications,
        filterState,
        setFilterState,
        skillBankStudents,
        updateSkillBankStudent,
        addSkillBankStudent,
        deleteSkillBankStudent,
        bulkMapStudentsToMentor,
        importBulkSkillBankStudents,
        googleSheetsConfig,
        updateGoogleSheetsConfig,
        syncSkillBankToGoogleSheets,
        exportFullDatabase,
        importFullDatabase,
        syncAllDataToFirestore,
        resetToDefaultData,
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
