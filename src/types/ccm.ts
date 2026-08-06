// ====== IQAC CCM (Class Committee Meeting) module types ======

export type CCMMemberRole = 'chief_mentor' | 'faculty' | 'student_rep';

export interface CCMMember {
  id: string;
  name: string;
  role: CCMMemberRole;
  email?: string;
  designation?: string;
  present?: boolean;
  absenceReason?: string;
  signature?: string; // data URL of the digital signature
}

export type CCMAgendaStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface CCMAgendaItem {
  id: string;
  title: string;
  order: number;
  discussion?: string;
  decision?: string;
  actionPlan?: string;
  responsible?: string;
  targetDate?: string;
  status: CCMAgendaStatus;
  completionPct: number; // 0 - 100
  evidence?: string[]; // uploaded file names / data URLs
}

export type CCMMeetingStatus = 'Draft' | 'Scheduled' | 'Completed' | 'Approved';

export interface CCMMeeting {
  id: string;
  meetingNumber: string;
  className: string;
  department: string;
  programme: string;
  semester: string;
  academicYear: string;
  section: string;
  venue: string;
  date: string; // YYYY-MM-DD
  time: string;
  chiefMentor: string;
  facultyMembers: CCMMember[];
  studentReps: CCMMember[];
  agenda: CCMAgendaItem[];
  status: CCMMeetingStatus;
  createdAt: string;
  createdBy: string;
  createdByRole: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface CCMAcademicSetup {
  academicYears: string[];
  semesters: string[];
  programmes: string[];
  departments: string[];
  sections: string[];
}
