import { CCMMeeting, CCMAgendaItem } from '../types/ccm';

// ====== CCM Reference data (Module 1 - Academic Setup lists) ======
export const CCM_ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
export const CCM_SEMESTERS = ['Odd', 'Even'];
export const CCM_PROGRAMMES = ['B.E.', 'B.Tech', 'MBA', 'M.E.'];
export const CCM_DEPARTMENTS = [
  'CSE',
  'Cyber Security',
  'AI&DS',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
];
export const CCM_SECTIONS = ['A', 'B', 'C'];

// ====== Default Agenda template (Module 3 - Agenda Generator) ======
export const DEFAULT_CCM_AGENDA: string[] = [
  'Review of Previous Minutes',
  'Syllabus Completion',
  'CO Awareness',
  'Teaching Learning Process',
  'Lab Status',
  'Course Files',
  'Attendance',
  'Slow Learners',
  'Fast Learners',
  'Assignments',
  'Mini Projects',
  'Placement Activities',
  'Higher Studies',
  'Internship',
  'Student Feedback',
  'Infrastructure',
  'Library',
  'Sports',
  'NSS/NCC',
  'Extra Curricular Activities',
];

// Build an empty agenda from the default template
export const buildDefaultAgenda = (meetingId: string): CCMAgendaItem[] =>
  DEFAULT_CCM_AGENDA.map((title, i) => ({
    id: `AG-${meetingId}-${i}`,
    title,
    order: i + 1,
    status: 'Pending',
    completionPct: 0,
  }));

// ====== Sample seed meeting ======
export const INITIAL_CCM_MEETINGS: CCMMeeting[] = [
  {
    id: 'CCM-1001',
    meetingNumber: 'CCM-2026-01',
    className: 'II Year CSE Section A',
    department: 'CSE',
    programme: 'B.E.',
    semester: 'Odd',
    academicYear: '2026-2027',
    section: 'A',
    venue: 'CSE Seminar Hall',
    date: '2026-08-20',
    time: '10:00 AM',
    chiefMentor: 'Dr. V. Henderson',
    facultyMembers: [
      { id: 'STF001', name: 'M. Kaviyarasu', role: 'faculty', designation: 'Assistant Professor' },
      { id: 'STF002', name: 'Dhananjeiyan B', role: 'faculty', designation: 'Assistant Professor' },
    ],
    studentReps: [
      { id: 'STU-101', name: 'Arun Kumar', role: 'student_rep' },
      { id: 'STU-102', name: 'Priya Sharma', role: 'student_rep' },
    ],
    agenda: buildDefaultAgenda('CCM-1001'),
    status: 'Scheduled',
    createdAt: '2026-08-10T09:00:00.000Z',
    createdBy: 'HOD',
    createdByRole: 'admin',
  },
];
