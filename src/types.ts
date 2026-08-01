export type Role = 'principal' | 'admin' | 'staff' | 'librarian' | 'incucula';

export type TaskStatus = 'Pending' | 'In Progress' | 'Submitted' | 'Completed' | 'Cancelled' | 'Overdue';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export type StaffStatus = 'Active' | 'Inactive';

export type ObservationRating = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';

export interface User {
  username: string;
  role: Role;
  staffId?: string;
  name: string;
  department?: string;
  email?: string;
  mobile?: string;
  password?: string;
  avatarUrl?: string;
  googleConnected?: boolean;
}

export interface Staff {
  id: string; // Staff ID e.g., STF001
  facultyName: string;
  designation: string;
  department: string;
  mobile: string;
  email: string;
  password?: string;
  role: Role;
  status: StaffStatus;
}

export interface ClassRoom {
  id: string;
  year: string; // e.g., '1st Year', '2nd Year', '3rd Year', '4th Year'
  department: string;
  section: string; // e.g., 'A', 'B'
  classAdvisor: string; // Staff Name or Staff ID
  roomNumber: string;
  semester: string; // e.g., 'Sem 1', 'Sem 5'
  academicYear: string; // e.g., '2025-2026'
  courseCode?: string; // e.g., 'CS3501'
  courseName?: string; // e.g., 'Compiler Design'
}

export interface Task {
  id: string; // Task ID e.g., TSK-101
  title: string;
  description: string;
  category?: string;
  assignedToStaffId: string;
  assignedToName: string;
  classId?: string;
  className?: string;
  priority: TaskPriority;
  assignedDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  status: TaskStatus;
  remarks?: string;
  completionRemarks?: string;
  completionDate?: string;
  submittedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionRemarks?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  googleCalendarEventId?: string;
  googleCalendarLink?: string;
  googleClassroomCourseId?: string;
  googleClassroomWorkId?: string;
  googleClassroomLink?: string;
  googleTasksId?: string;
  googleTasksLink?: string;
}

export interface ClassObservation {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  facultyName: string;
  classId: string;
  className: string;
  hour: string; // e.g., '1st Hour', '3rd Hour'
  subject: string;
  topic?: string;
  startingTime?: string;
  endingTime?: string;
  observedBy: string;
  observation: ObservationRating;
  criteriaRatings?: Record<string, 'Excellent' | 'Good' | 'Average' | 'Poor'>;
  strengths?: string[];
  improvements?: string[];
  remarks: string;
  followUpRequired: boolean;
}

export interface FacultyDailyMonitoring {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  facultyName: string;
  classesHandled: string;
  attendanceUpdated: boolean;
  syllabusUpdated: boolean;
  assignedDuties: string;
  taskStatusSummary: string;
  classObservationDone: boolean;
  remarks: string;
}

export interface StudentAttendanceSummary {
  classId: string;
  className: string;
  year?: string; // 'I Year', 'II Year', 'III Year', 'IV Year'
  totalStudents: number;
  presentStudents: number;
  absentStudents?: number;
  odStudents?: number; // On Duty
  othersStudents?: number; // Leave / Suspended / Other
  attendancePercentage: number;
}

export interface StudentAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  department: string;
  classId: string;
  className: string;
  year?: string;
  section?: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents?: number;
  odStudents?: number;
  othersStudents?: number;
  attendancePercentage: number;
  markedBy?: string;
  remarks?: string;
}

export const DEPARTMENTS = [
  'Artificial Intelligence & Data Science (AI & DS)',
  'Cyber Security (CYBER)',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Humanities & Sciences',
] as const;

export type DepartmentType = typeof DEPARTMENTS[number];

export interface DailyHODReport {
  id: string;
  date: string; // YYYY-MM-DD
  department: string;
  hodName: string;
  hodEmail?: string;
  principalName?: string;
  collegeName: string;
  collegeLogoUrl?: string;
  collegeLogoText?: string;
  facultyAttendanceCount: { present: number; total: number; absentNames?: string };
  assignedTasksCount: { total: number; completed: number; pending: number; overdue: number };
  classObservationsCount: number;
  studentAttendanceSummaries: StudentAttendanceSummary[];
  eventsConducted: string;
  naacWorkDone?: string;
  disciplineIssues: string;
  specialRemarks: string;
  hodRemarks: string;
  hodSignatureDate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'due_soon' | 'overdue' | 'completed' | 'daily_reminder' | 'info';
  read: boolean;
  relatedTaskId?: string;
}

export interface LessonPlanItem {
  id: string;
  staffId: string;
  staffName: string;
  classId?: string;
  className: string;
  courseCode: string;
  courseName: string;
  unitNo: 'Unit 1' | 'Unit 2' | 'Unit 3' | 'Unit 4' | 'Unit 5';
  unitName: string;
  topicName: string;
  planHours: number; // e.g. 1
  planDate: string; // YYYY-MM-DD
  coLevel: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5' | 'NA';
  ptLevel: 'K1 - Remember' | 'K2 - Understand' | 'K3 - Apply' | 'K4 - Analyze' | 'K5 - Evaluate' | 'K6 - Create' | 'NA';
  pedagogy: 'Chalk & Talk' | 'PPT / ICT' | 'Flipped Classroom' | 'Group Discussion' | 'Problem Based Learning' | 'Seminar' | 'NA';
  status: 'Planned' | 'In Progress' | 'Completed';
  completedDate?: string;
  actualHours?: number;
  remarks?: string;
}

export interface FilterState {
  searchQuery: string;
  department: string;
  status: string;
  priority: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  facultyId?: string;
  classId?: string;
}
