export interface StudentProfile {
  id: string; // e.g. STU-2026-001
  registerNumber: string; // e.g. 732422104001
  studentName: string;
  skillBankAccountNo: string; // e.g. SSB-2026-CS-001
  degreeBranch: string; // e.g. B.E. Computer Science & Engineering
  department: string;
  institution?: string;
  batch: string; // e.g. 2024-2028
  academicYear: string; // e.g. 2026-2027
  semester: string; // e.g. Odd Semester (Sem V)
  section: string; // e.g. A
  admissionNumber: string;

  // Personal
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  bloodGroup: string;
  motherTongue: string;
  nationality: string;
  aadhaarNo: string; // e.g. 1234-5678-9012
  dateOfBirth: string;

  // Contact
  communicationAddress: string;
  pinCode: string;
  studentMobile: string;
  studentEmail: string;
  personalEmail: string;

  // Parents / Guardian
  fatherName: string;
  fatherOccupation: string;
  fatherMobile: string;
  fatherEmail: string;

  motherName: string;
  motherOccupation: string;
  motherMobile: string;
  motherEmail: string;

  guardianName?: string;
  guardianOccupation?: string;
  guardianMobile?: string;
  guardianEmail?: string;

  // Academic Account
  sslcSchool: string;
  hscSchool: string; // HSC or Diploma
  yearOfPassing: string;
  admissionCategory: 'Government Quota' | 'Management Quota' | 'Lateral Entry' | '7.5% Govt Quota';
  mentorFaculty: string;
  mentorStaffId?: string;

  // Career Aspiration
  dreamCompany: string;
  careerGoal: string;

  // Verification Signatures
  studentSigned: boolean;
  studentSignedDate?: string;
  mentorSigned: boolean;
  mentorSignedDate?: string;
  hodSigned: boolean;
  hodSignedDate?: string;
}

export type MonthKey = 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

export const MONTH_LIST: MonthKey[] = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Attendance month entry
export interface AttendanceMonthEntry {
  totalDays: number;
  daysAttended: number;
  attendancePct: number; // auto = Attended/Total
  additionalRemedialDays: number;
  coinsEarned: number; // 75-80% -> 0, 81-90% -> 3000, 91-95% -> 5000, >95% -> 8000
}

// Library Borrowing Entry
export interface LibraryBookLog {
  id: string;
  month: MonthKey;
  bookName: string;
  author: string;
  issueDate: string;
  returnDate: string;
  returnedOnTime: boolean;
  verifiedByLibrarian: boolean;
  mentorSigned: boolean;
}

// Library Borrowing Checklist (Max 3,000 Coins)
export interface LibraryChecklist {
  min5BooksBorrowed: boolean; // 1,000 coins
  onTimeReturnVerified: boolean; // 500 coins
  referenceAndJournalsBorrowed: boolean; // 500 coins
  digitalLibraryAccess: boolean; // 500 coins
  bookReviewSubmitted: boolean; // 500 coins
  coinsEarned: number; // Max 3,000
  updatedByLibrarian?: boolean;
  librarianLastUpdatedDate?: string;
  librarianNotes?: string;
}

// Library Visit Entry
export interface LibraryVisitLog {
  id: string;
  month: MonthKey;
  date: string;
  inTime: string;
  outTime: string;
  verified: boolean;
}

// Fee Payment Entry
export interface FeePaymentLog {
  tuitionFeePaid: boolean;
  hostelFeePaid: boolean;
  transportFeePaid: boolean;
  scholarshipReceived: boolean;
  scholarshipAmount?: number;
  scholarshipDate?: string;
  examFeePaid: boolean;
  finePaid?: number;
  dateOfPayment: string;
  paymentBand: 'before_due' | 'on_deadline' | 'with_fine' | 'after_30_days';
  coinsEarned: number; // 5000 / 2000 / 500 / 0 + 1000 if scholarship
  signedByStaff: boolean;
}

// Mini Project / Patent / Pubs Checklists
export interface MiniProjectChecklist {
  topicSelectionApproved: boolean; // 300
  proposalPrepared: boolean; // 400
  literatureReview: boolean; // 300
  developmentPlagiarismCheck: boolean; // 700
  verificationDone: boolean; // 300
  presentationVivaIPR: boolean; // 500
  coinsEarned: number; // Max 2500
}

export interface MiniProjectDetail {
  id: string;
  subjectCode: string;
  courseName: string;
  facultyName: string;
  projectTitle: string;
  learningOutcome: string;
}

export interface ICTToolsChecklist {
  joiningClassroom: boolean; // 500
  submittingAssignmentOnTime: boolean; // 500
  completingQuizTest: boolean; // 500
  activeParticipation: boolean; // 500
  disciplineEngagement: boolean; // 500
  coinsEarned: number; // Max 2500
}

// Internal Exams / CIAT
export interface ExamPerformanceEntry {
  ciat1Appeared: boolean;
  ciat1Pct: number;
  ciat2Appeared: boolean;
  ciat2Pct: number;
  endSemAllPass: boolean;
  arrearCount: number;
  coinsEarned: number; // Max 12,000
}

export interface SubjectMarkDetail {
  id: string;
  subjectCode: string;
  subjectName: string;
  ciat1Marks: number;
  ciat2Marks: number;
  assignment1Marks: number;
  assignment2Marks: number;
  modelLabMarks: number;
}

export interface LearnerCategoryEntry {
  ciat1Category: 'Slow' | 'Moderate' | 'Fast';
  ciat2Category: 'Slow' | 'Moderate' | 'Fast';
  remedialAttendancePct: number;
  remedialBonusEarned: boolean; // +1500 if slow learner & >=95% remedial
  coinsEarned: number;
}

export interface EndSemSubjectGrade {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'RA' | 'SA' | 'W';
  gradePoint: number;
  resultStatus: 'PASS' | 'ARREAR' | 'ABSENT';
}

export interface EndSemResultEntry {
  allPass: boolean;
  arrearsCount: number;
  gpa: number;
  cgpa: number;
  coinsEarned: number;
  examSession?: string;
  publishedDate?: string;
  marksheetVerifiedByMentor?: boolean;
  subjectGrades?: EndSemSubjectGrade[];
  revaluationNotes?: string;
}

// Dimension 2: Skill Development
export interface NptelMonthEntry {
  registrationDone: boolean; // 500
  weeklyTestsDone: boolean; // 500
  examApplied: boolean; // 500
  resultStatus: 'None' | 'Pass' | 'Elite' | 'Silver' | 'Gold'; // Pass 500, Elite 1000, Silver 750, Gold 1500
  coinsEarned: number; // Max 3000
}

export interface LeetCodeMonthEntry {
  taskCompleted: boolean; // 1000
  attendanceBand: '90%+' | '70-79%' | '60-69%' | '<60%'; // 1000 / 500 / 250 / 0
  coinsEarned: number; // Max 2000
}

export interface OnlineCertBasicLog {
  id: string;
  month: MonthKey;
  platform: string;
  courseName: string;
  durationHrs: number; // 0-15 hrs
  proofAttached: boolean;
  coinsEarned: number; // 100 per cert, max 1000
}

export interface AdvancedCourseLog {
  id: string;
  month: MonthKey;
  platform: string;
  courseName: string;
  durationHrs: number; // >15 hrs
  verifiedProof: boolean;
  remarks: string;
  coinsEarned: number; // 200 per cert, max 2000
}

export interface PaperPresentationLog {
  id: string;
  month: MonthKey;
  level: 'Dept' | 'Inter-dept' | 'Inter-college' | 'Intra-college' | 'State' | 'National' | 'International';
  symposiumName: string;
  title: string;
  venue: string;
  date: string;
  prizeWon: string;
  hasCertificate: boolean;
  coinsEarned: number;
  remarks: string;
}

// Dimension 3: Internship & Career Readiness
export interface AptitudeMonthEntry {
  attended: boolean; // 1000
  scoreBand: 'None' | 'Score >= 50' | 'Score >= 60' | 'Score >= 80'; // 1000 / 1500 / 2000
  coinsEarned: number; // Max 3000
}

export interface ResumeEntry {
  workshopAttended: boolean; // 500
  atsScorePct: number; // >=85% -> 1500
  enteredByCDC: boolean;
  coinsEarned: number; // Max 2000
}

export interface MockInterviewEntry {
  attended: boolean; // 500
  performanceBand: 'Attended' | 'Moderate' | 'Top'; // 500 / 750 / 1500
  enteredByCDC: boolean;
  coinsEarned: number; // Max 2000
}

export interface LinkedInEntry {
  profileCreated: boolean; // 500
  originalPostCount: number; // 100 per post up to 10
  repostCount: number; // 50 per post up to 10
  coinsEarned: number; // Max 2000
}

export interface GitHubEntry {
  portfolioCompleted: boolean; // 250
  assessmentBand: '<50' | '50-74' | '75-99' | '100-149' | '150+'; // 0 / 200 / 350 / 500 / 750
  coinsEarned: number; // Max 1000
}

export interface SocialMediaEntry {
  profileCreated: boolean; // 250
  originalPostCount: number; // 100 per post up to 10
  repostCount: number; // 50 per post up to 10
  coinsEarned: number;
}

export interface HackathonEntry {
  id: string;
  month: MonthKey;
  eventName: string; // SIH / Codeathon / Ideathon / Hackathon
  participated: boolean; // 1000
  prizeWon: boolean; // +1000
  verifiedByEDC: boolean;
  coinsEarned: number; // Max 2000
}

export interface InternshipEntry {
  industryName: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  type: 'Summer' | 'Winter' | 'Other';
  internshipDone: boolean; // 1000
  certificateReceived: boolean; // 500
  reportCompleted: boolean; // 700
  fullTimeConverted: boolean; // 1000
  startupActivity: boolean; // 1000
  coinsEarned: number; // Max 1000 cap applied
}

// Dimension 4: Co-Curricular Performance
export interface WorkshopEntry {
  certificationCompleted: boolean; // 2000
  reportOnLearning: boolean; // 1000
  industrialVisitParticipation: boolean; // 1000
  coinsEarned: number; // Max 4000
}

export interface CollegeEventEntry {
  paidValueAddedCourse: boolean; // 3000
  eventParticipation: boolean; // 1500
  eventWinner: boolean; // 4000
  coinsEarned: number; // Max 4000
}

export interface VolunteeringEntry {
  nssNccActivity: boolean; // 2000
  communityAwareness: boolean; // 3000
  leadershipRole: boolean; // 4000
  coinsEarned: number; // Max 4000
}

export interface ProfessionalMembershipLog {
  id: string;
  bodyName: string; // e.g. IEEE / CSI / ISTE
  membershipType: 'Annual' | 'Life';
  dateOfIssue: string;
  validity: string;
  coinsEarned: number; // Annual 1500, Life 2000
}

// Dimension 5: Extra-Curricular & Talent Track
export interface SportsLog {
  id: string;
  gameSport: string;
  participationLevel: 'Inter-college' | 'Intra-college' | 'Zonal' | 'District' | 'State' | 'National' | 'Winner/Runner';
  venue: string;
  date: string;
  resultPosition: string; // e.g. 1st Place, Runner
  verifiedByPhysicalDirector: boolean;
  coinsEarned: number; // 1000 / 1500 / 2000 / 2500 / 3500 / 4500 / 5000
}

export interface ArtsLog {
  id: string;
  culturalCategory: string; // Dance, Music, Drama, Painting
  participationLevel: 'Cultural Participation' | 'Dance/Music/Drama' | 'State Level' | 'National Level' | 'Winner/Best Performer';
  date: string;
  position: string;
  coinsEarned: number; // 1000 / 1500 / 2500 / 3500 / 5000
}

export interface ClubActivityLog {
  id: string;
  clubName: string; // Rotaract, Fine Arts, YRC, Coding Club
  role: 'Member' | 'Active Participant' | 'Event Organizer' | 'Coordinator/Lead' | 'Workshop Instructor';
  activityDetails: string;
  date: string;
  coinsEarned: number; // 500 / 500 / 1000 / 1000 / 2000
}

// Code of Conduct - Retraction
export interface ViolationLog {
  id: string;
  date: string;
  type: 'Minor/Behavioral' | 'Disciplinary';
  category: 'Late coming' | 'Improper Dress' | 'Late Submission' | 'No ID Card' | 'Misconduct' | 'Insubordination' | 'Campus Disruption' | 'Other';
  occurrenceNo: number; // 1, 2, 3, >3
  deductionPct: number; // e.g. 3, 5, 15, 50 or 10, 25, 50
  coinsDeducted: number;
  recordedBy: string;
  remarks: string;
}

// Supporting Modules
export interface CounsellingLog {
  id: string;
  date: string;
  observationAnalysis: string;
  actionTaken: string;
  remarks: string;
  counsellorName: string;
  studentSigned: boolean;
  counsellorSigned: boolean;
  mentorSigned: boolean;
  hodSigned: boolean;
}

export interface ParentMeetingLog {
  id: string;
  dateTime: string;
  academicDetailsDiscussed: string;
  extraCoCurricularDiscussed: string;
  actionPlan: string;
  parentName: string;
  studentSigned: boolean;
  parentSigned: boolean;
  mentorSigned: boolean;
  hodSigned: boolean;
}

export interface TransformationJourney {
  academicReflection: string;
  skillReflection: string;
  careerReflection: string;
  coCurricularReflection: string;
  extraCurricularReflection: string;

  checkpoint1Date: string;
  checkpoint1Coins: number;
  checkpoint1Grade: string;

  checkpoint2Date: string;
  checkpoint2Coins: number;
  checkpoint2Grade: string;

  finalGradeCoin: number;
  finalGradeLetter: string; // e.g. O (Outstanding), A+, A, B+
}

// Full Student Skill Bank Record
export interface StudentSkillBankData {
  studentProfile: StudentProfile;

  // Month-wise Attendance Entries
  attendanceMonths: Record<MonthKey, AttendanceMonthEntry>;

  // Library
  libraryBooks: LibraryBookLog[];
  libraryVisits: LibraryVisitLog[];
  libraryChecklist?: LibraryChecklist;

  // Fee
  feePayment: FeePaymentLog;

  // Projects & ICT
  miniProjectChecklist: MiniProjectChecklist;
  miniProjectDetails: MiniProjectDetail[];
  ictToolsChecklist: ICTToolsChecklist;

  // Exams
  examPerformance: ExamPerformanceEntry;
  subjectMarkDetails: SubjectMarkDetail[];
  learnerCategory: LearnerCategoryEntry;
  endSemResults: EndSemResultEntry;

  // Dimension 2: Skill Development
  nptelMonths: Record<MonthKey, NptelMonthEntry>;
  leetCodeMonths: Record<MonthKey, LeetCodeMonthEntry>;
  onlineCertBasic: OnlineCertBasicLog[];
  advancedCourses: AdvancedCourseLog[];
  paperPresentations: PaperPresentationLog[];

  // Dimension 3: Career
  aptitudeMonths: Record<MonthKey, AptitudeMonthEntry>;
  resume: ResumeEntry;
  mockInterview: MockInterviewEntry;
  linkedIn: LinkedInEntry;
  gitHub: GitHubEntry;
  socialMedia: SocialMediaEntry;
  hackathons: HackathonEntry[];
  internship: InternshipEntry;

  // Dimension 4: Co-Curricular
  workshop: WorkshopEntry;
  collegeEvent: CollegeEventEntry;
  volunteering: VolunteeringEntry;
  professionalMemberships: ProfessionalMembershipLog[];

  // Dimension 5: Extra-Curricular
  sportsLogs: SportsLog[];
  artsLogs: ArtsLog[];
  clubLogs: ClubActivityLog[];

  // Code of Conduct
  violations: ViolationLog[];

  // Supporting Logs
  counsellingLogs: CounsellingLog[];
  parentMeetingLogs: ParentMeetingLog[];
  transformationJourney: TransformationJourney;
}

// Google Sheets Web App Config
export interface GoogleSheetsConfig {
  webAppUrl: string; // e.g. https://script.google.com/macros/s/.../exec
  autoSync: boolean;
  lastSyncedAt?: string;
  status: 'Idle' | 'Syncing' | 'Success' | 'Error';
  errorMessage?: string;
}

// Dedicated Mentor → Mentee mapping record persisted in the `mentorMappings`
// Firestore collection (one document per mentor). This gives the system a
// first-class Mentor → Mentee allocation that both the HOD (writer) and the
// assigned mentor (reader) can rely on, and it is updated in real time.
export interface MentorMenteeMapping {
  /** Staff ID of the mentor (e.g. STF001). Document id in Firestore. */
  mentorStaffId: string;
  /** Display name of the mentor (e.g. 'M. Kaviyarasu'). */
  mentorFaculty: string;
  mentorEmail?: string;
  department?: string;
  /** Register numbers of every student currently allocated to this mentor. */
  menteeRegNumbers: string[];
  /** Lightweight snapshot of the allocated mentees for quick list rendering. */
  mentees?: {
    registerNumber: string;
    studentName: string;
    academicYear?: string;
    semester?: string;
    section?: string;
    batch?: string;
  }[];
  /** ISO timestamp of the last allocation update. */
  updatedAt: string;
}
