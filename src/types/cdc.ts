export type QuestionCategory =
  | 'CSE Cluster'
  | 'Core Engineering'
  | 'Circuits Branches'
  | 'AI & DS'
  | 'CSE / Cyber Security'
  | 'IT'
  | 'Other departments';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type ExamStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';

export interface CdcQuestion {
  id: string;
  category: QuestionCategory;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  negativeMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface CdcExamAssignment {
  department: string;
  year: string; // e.g., '2nd Year', '3rd Year'
  batch?: string; // e.g., '2024-2028'
  sections?: string[]; // e.g., ['Sec A', 'Sec B']
  studentRegisterNumbers?: string[]; // specific students
}

export interface CdcExam {
  id: string;
  title: string;
  description?: string;
  status: ExamStatus;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  durationMinutes: number;
  totalMarks: number;
  negativeMarksPerWrong: number;
  passingMarks?: number;
  questionIds: string[]; // ordered list of question IDs
  assignments: CdcExamAssignment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CdcStudent {
  id: string;
  registerNumber: string;
  name: string;
  department: string;
  year: string;
  section: string;
  batch: string;
  email?: string;
  mobile?: string;
  photoUrl?: string; // for webcam verification
  password: string;
}

export interface CdcExamAttempt {
  id: string;
  examId: string;
  studentRegisterNumber: string;
  studentName: string;
  studentDepartment: string;
  studentYear: string;
  studentSection?: string;
  startTime: string;
  endTime?: string;
  submittedAt?: string;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex
  markedForReview: number[];
  suspiciousEvents: CdcSuspiciousEvent[];
  tabSwitchCount: number;
  fullscreenExitCount: number;
  copyPasteCount: number;
  rightClickCount: number;
  webcamVerified: boolean;
  faceVerifiedAt?: string;
  verificationFaceCount?: number;
  verificationIdentityMatch?: boolean;
  verificationPhotoAvailable?: boolean;
  multiFaceDetectedCount: number;
  noFaceDetectedCount: number;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'abandoned';
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  percentage?: number;
  accuracy?: number;
  overallRank?: number;
  departmentRank?: number;
  branchRank?: number;
  yearRank?: number;
}

export interface CdcSuspiciousEvent {
  id: string;
  attemptId: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'multi_face' | 'no_face' | 'text_selection';
  timestamp: string;
  details?: string;
}

export interface CdcExamResultSummary {
  examId: string;
  examTitle: string;
  totalStudents: number;
  appeared: number;
  absent: number;
  averageMarks: number;
  highestMarks: number;
  passPercentage: number;
  passCount: number;
}

/** Per-department result breakdown shown on the CDC Dashboard. */
export interface CdcDepartmentResult {
  department: string;
  totalStudents: number;
  appeared: number;
  absent: number;
  averageMarks: number;
  highestMarks: number;
  passPercentage: number;
  passCount: number;
  passThresholdPercent: number;
}

/** Competitive rank assignment across four dimensions for one student. */
export interface CdcStudentRanks {
  overall: number;
  department: number;
  branch: number;
  year: number;
}

/** A row in the on-screen Rank List. */
export interface CdcRankListEntry {
  registerNumber: string;
  name: string;
  department: string;
  year: string;
  section: string;
  score: number;
  percentage: number;
  overallRank: number;
  departmentRank: number;
  branchRank: number;
  yearRank: number;
}

/** A joined proctoring (suspicious activity) log row for the dashboard. */
export interface CdcProctoringLogRow {
  id: string;
  attemptId: string;
  studentRegisterNumber: string;
  studentName: string;
  examId: string;
  type: CdcSuspiciousEvent['type'];
  timestamp: string;
  details?: string;
}

export interface CdcWeaknessReport {
  studentRegisterNumber: string;
  studentName: string;
  department: string;
  subjectWeaknesses: { subject: string; percentage: number; totalQuestions: number; correctAnswers: number }[];
  topicWeaknesses: { topic: string; percentage: number; totalQuestions: number; correctAnswers: number }[];
  overallPercentage: number;
}

export interface CdcDepartmentGapReport {
  department: string;
  weakSubjects: { subject: string; avgPercentage: number; affectedStudents: number }[];
  weakTopics: { topic: string; avgPercentage: number; affectedStudents: number }[];
}
