import { User, Staff, StudentAttendanceSummary, ClassRoom, StudentAttendanceRecord, DEPARTMENTS } from '../types';
import { StudentSkillBankData } from '../types/skillBank';

export function normalizeDept(dept?: string): string {
  if (!dept) return '';
  let d = dept.trim().toLowerCase();
  d = d.replace(/^department of\s+/i, '').replace(/^b\.e\.\s+/i, '').replace(/^b\.tech\.\s+/i, '');

  if (d.includes('artificial intelligence') || d.includes('ai & ds') || d.includes('ai&ds') || d.includes('aids') || d.includes('ai and ds')) {
    return 'ai & ds';
  }
  if (d.includes('cyber')) return 'cyber security';
  if (d.includes('information technology') || d.includes('it')) return 'it';
  if (d.includes('electrical') || d.includes('eee')) return 'eee';
  if (d.includes('electronics') || d.includes('ece')) return 'ece';
  if (d.includes('computer science') || d.includes('cse')) return 'cse';
  if (d.includes('mechanical') || d.includes('mech')) return 'mech';
  if (d.includes('civil')) return 'civil';
  if (d.includes('science') || d.includes('humanities') || d.includes('s&h') || d.includes('s & h')) return 'science and humanities';
  return d;
}

export function isSameDept(dept1?: string, dept2?: string): boolean {
  if (!dept1 || !dept2) return false;
  const n1 = normalizeDept(dept1);
  const n2 = normalizeDept(dept2);
  if (!n1 || !n2) return false;
  return n1 === n2;
}

/**
 * Returns students that are accessible to the given user based on their role & department
 */
export function getScopedStudents(
  skillBankStudents: StudentSkillBankData[],
  currentUser: User | null,
  fallbackDept: string = 'Artificial Intelligence & Data Science (AI & DS)'
): StudentSkillBankData[] {
  const targetDept = (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments')
    ? fallbackDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : 'Artificial Intelligence & Data Science (AI & DS)');

  if (!currentUser) {
    return skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
  }

  // Principal: Sees all students across all departments, UNLESS a specific fallbackDept filter is selected
  if (currentUser.role === 'principal') {
    if (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments') {
      return skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
    }
    return skillBankStudents;
  }

  // HOD (admin): Sees only students in their respective department (or selected filter department)
  if (currentUser.role === 'admin') {
    return skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
  }

  // Staff (Faculty Mentor): Sees assigned mentees or department students
  if (currentUser.role === 'staff') {
    const staffId = currentUser.staffId;
    const staffName = currentUser.name?.toLowerCase() || '';

    // First filter to target department
    const deptStudents = skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));

    // Find assigned mentees
    const assignedMentees = deptStudents.filter((s) => {
      const stMentorId = s.studentProfile?.mentorStaffId;
      const stMentor = (s.studentProfile?.mentorFaculty || '').toLowerCase();
      return (
        Boolean(staffId && stMentorId === staffId) ||
        Boolean(staffName && stMentor.includes(staffName))
      );
    });

    // If staff has explicitly assigned mentees, return ONLY those assigned mentees!
    if (assignedMentees.length > 0) {
      return assignedMentees;
    }

    // Otherwise, fallback to department students
    return deptStudents;
  }

  return skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
}

/**
 * Returns staff list accessible to the user (e.g. for HOD assigning mentors within their department)
 */
export function getScopedStaff(
  staffList: Staff[],
  currentUser: User | null,
  fallbackDept: string = 'Artificial Intelligence & Data Science (AI & DS)'
): Staff[] {
  const targetDept = (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments')
    ? fallbackDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : 'Artificial Intelligence & Data Science (AI & DS)');

  if (currentUser?.role === 'principal' && (!fallbackDept || fallbackDept === 'all' || fallbackDept === 'All Departments')) {
    return staffList;
  }

  const deptStaff = staffList.filter((st) => isSameDept(st.department, targetDept));
  return deptStaff;
}

/**
 * Resolves the HOD name dynamically for a specific department and logged in user
 */
export function getDeptHodName(
  staffList: Staff[],
  department: string,
  currentUser?: User | null,
  fallbackHodName?: string
): string {
  if (currentUser?.role === 'admin' && currentUser.name) {
    if (!department || isSameDept(currentUser.department, department)) {
      return currentUser.name;
    }
  }

  const foundHod = staffList.find(
    (s) => s.role === 'admin' && isSameDept(s.department, department)
  );
  if (foundHod?.facultyName) {
    return foundHod.facultyName;
  }

  const anyHod = staffList.find((s) => s.role === 'admin');
  if (anyHod?.facultyName) {
    return anyHod.facultyName;
  }

  if (currentUser?.role === 'admin' && currentUser.name) {
    return currentUser.name;
  }

  return fallbackHodName || 'Head of Department';
}

/**
 * Returns full HOD object details (Name, Email, Mobile, Dept) for a specific department
 */
export function getDeptHodDetail(
  staffList: Staff[],
  department: string,
  currentUser?: User | null,
  fallbackHodName?: string
): { name: string; email: string; mobile: string; department: string; designation: string } {
  const name = getDeptHodName(staffList, department, currentUser, fallbackHodName);
  const foundHod = staffList.find(
    (s) => s.role === 'admin' && isSameDept(s.department, department)
  ) || staffList.find((s) => s.role === 'admin');

  return {
    name,
    email: foundHod?.email || `${normalizeDept(department).replace(/\s+/g, '')}.hod@sasurie.com`,
    mobile: foundHod?.mobile || '+91 98422 12345',
    department: foundHod?.department || department,
    designation: foundHod?.designation || 'Head of Department (HOD)',
  };
}

/**
 * Helper function to ensure II Year, III Year, IV Year class attendance rows are always returned
 * for a specific department (e.g. AI & DS, CSE, ECE, CYBER, EEE, IT, etc.)
 */
export function getDeptTag(department?: string): string {
  if (!department) return 'AI & DS';
  const norm = normalizeDept(department);
  if (norm.includes('cyber')) return 'CYBER';
  if (norm.includes('computer science') || norm.includes('cse')) return 'CSE';
  if (norm.includes('electronics') || norm.includes('ece')) return 'ECE';
  if (norm.includes('electrical') || norm.includes('eee')) return 'EEE';
  if (norm.includes('information technology') || norm.includes('it')) return 'IT';
  if (norm.includes('mechanical') || norm.includes('mech')) return 'MECH';
  if (norm.includes('civil')) return 'CIVIL';
  if (norm.includes('science')) return 'S&H';
  return 'AI & DS';
}

export function getDepartmentAttendanceSummaries(
  existingSummaries: StudentAttendanceSummary[],
  classList: ClassRoom[],
  department: string,
  attendanceRecords?: StudentAttendanceRecord[]
): StudentAttendanceSummary[] {
  if (!department) return existingSummaries || [];

  // If department is 'all' or 'All Departments', aggregate summaries across all departments
  if (department === 'all' || department === 'All Departments') {
    return DEPARTMENTS.flatMap((d) =>
      getDepartmentAttendanceSummaries(existingSummaries, classList, d, attendanceRecords)
    );
  }

  const deptTag = getDeptTag(department);

  // Helper to normalize year string for display
  const normYear = (y?: string) => {
    if (!y) return 'II Year';
    if (y.includes('2') || y.includes('II')) return 'II Year';
    if (y.includes('3') || y.includes('III')) return 'III Year';
    if (y.includes('4') || y.includes('IV')) return 'IV Year';
    if (y.includes('1') || y.includes('I')) return 'I Year';
    return y;
  };

  // 1. Get all class definitions for this department from classList
  let deptClasses = (classList || []).filter((c) => isSameDept(c.department, department));

  // Fallback if no classes found in classList for this department
  if (deptClasses.length === 0) {
    deptClasses = [
      {
        id: `CLS-DEF-II-${deptTag}`,
        year: '2nd Year',
        department: department,
        section: 'Sec A',
        classAdvisor: '',
        roomNumber: '',
        semester: 'Semester 3',
        academicYear: '2025-2026',
      },
      {
        id: `CLS-DEF-III-${deptTag}`,
        year: '3rd Year',
        department: department,
        section: 'Sec A',
        classAdvisor: '',
        roomNumber: '',
        semester: 'Semester 5',
        academicYear: '2025-2026',
      },
      {
        id: `CLS-DEF-IV-${deptTag}`,
        year: '4th Year',
        department: department,
        section: 'Sec A',
        classAdvisor: '',
        roomNumber: '',
        semester: 'Semester 7',
        academicYear: '2025-2026',
      },
    ];
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDeptRecords = (attendanceRecords || []).filter(
    (r) => r.date === todayStr && isSameDept(r.department, department)
  );

  // Filter existingSummaries for those strictly matching this department
  const existingDeptSummaries = (existingSummaries || []).filter((sa) => {
    if (sa.department) return isSameDept(sa.department, department);
    const classObj = classList.find((c) => c.id === sa.classId);
    if (classObj) return isSameDept(classObj.department, department);
    return isSameDept(sa.className, department);
  });

  const matchedSummaries: StudentAttendanceSummary[] = [];
  const processedClassIds = new Set<string>();

  // Construct a row for each class section belonging strictly to this department
  for (const c of deptClasses) {
    processedClassIds.add(c.id);

    // 1st Priority: Check if existingDeptSummaries has an entry for this class
    const foundSummary = existingDeptSummaries.find(
      (s) =>
        s.classId === c.id ||
        (normYear(s.year) === normYear(c.year) && (s.className || '').toLowerCase().includes((c.section || '').toLowerCase()))
    );

    if (foundSummary) {
      const secTag = c.section.startsWith('Sec') ? c.section : `Sec ${c.section}`;
      const cName = `${normYear(c.year)} ${deptTag} - ${secTag}`;
      matchedSummaries.push({
        ...foundSummary,
        classId: c.id,
        className: foundSummary.className || cName,
        department: department,
        year: normYear(c.year),
      });
      continue;
    }

    // 2nd Priority: Check if today's attendanceRecords has an entry for this class
    const foundRecord = todayDeptRecords.find(
      (r) =>
        r.classId === c.id ||
        (normYear(r.year) === normYear(c.year) && (r.className || '').toLowerCase().includes(r.section?.toLowerCase() || (c.section || '').toLowerCase()))
    );

    if (foundRecord) {
      const secTag = c.section.startsWith('Sec') ? c.section : `Sec ${c.section}`;
      const cName = `${normYear(c.year)} ${deptTag} - ${secTag}`;
      matchedSummaries.push({
        classId: c.id,
        className: foundRecord.className || cName,
        year: normYear(c.year),
        department: department,
        totalStudents: foundRecord.totalStudents,
        presentStudents: foundRecord.presentStudents,
        absentStudents: foundRecord.absentStudents || 0,
        odStudents: foundRecord.odStudents || 0,
        othersStudents: foundRecord.othersStudents || 0,
        attendancePercentage: foundRecord.attendancePercentage,
        morningPresent: foundRecord.presentStudents,
        morningAbsent: foundRecord.absentStudents || 0,
        morningOd: foundRecord.odStudents || 0,
        morningOthers: foundRecord.othersStudents || 0,
        morningPercentage: foundRecord.attendancePercentage,
        eveningPresent: foundRecord.presentStudents,
        eveningAbsent: foundRecord.absentStudents || 0,
        eveningOd: foundRecord.odStudents || 0,
        eveningOthers: foundRecord.othersStudents || 0,
        eveningPercentage: foundRecord.attendancePercentage,
        variation: 0,
      });
      continue;
    }

    // 3rd Priority: Default empty summary for this class section
    const secTag = c.section.startsWith('Sec') ? c.section : `Sec ${c.section}`;
    const cName = `${normYear(c.year)} ${deptTag} - ${secTag}`;
    matchedSummaries.push({
      classId: c.id,
      className: cName,
      year: normYear(c.year),
      department: department,
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
    });
  }

  // Include any extra summaries from existingDeptSummaries that were not mapped to deptClasses
  for (const s of existingDeptSummaries) {
    if (s.classId && !processedClassIds.has(s.classId)) {
      matchedSummaries.push({
        ...s,
        department: department,
      });
    }
  }

  // Sort chronologically by year order (II Year, III Year, IV Year) and section
  const yearWeight = (y?: string) => {
    const ny = normYear(y);
    if (ny.includes('I Year') || ny.includes('1st')) return 1;
    if (ny.includes('II Year') || ny.includes('2nd')) return 2;
    if (ny.includes('III Year') || ny.includes('3rd')) return 3;
    if (ny.includes('IV Year') || ny.includes('4th')) return 4;
    return 5;
  };

  matchedSummaries.sort((a, b) => {
    const wA = yearWeight(a.year);
    const wB = yearWeight(b.year);
    if (wA !== wB) return wA - wB;
    return a.className.localeCompare(b.className);
  });

  return matchedSummaries;
}


