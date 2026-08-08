import { User, Staff, StudentAttendanceSummary, ClassRoom, StudentAttendanceRecord, DEPARTMENTS } from '../types';
import { StudentSkillBankData } from '../types/skillBank';

export function getCollegeLogoText(collegeName?: string): string {
  if (!collegeName) return 'SCE';
  if (collegeName.includes('Arts')) return 'SCAS';
  if (collegeName.includes('Education')) return 'SCED';
  if (collegeName.includes('Nursing') || collegeName.includes('Pharmacy')) return 'SCNP';
  if (collegeName.includes('Polytechnic')) return 'SPC';
  return 'SCE';
}

export function normalizeDept(dept?: string): string {
  if (!dept) return '';
  let d = dept.trim().toLowerCase();
  d = d.replace(/^department of\s+/i, '').replace(/^b\.e\.\s+/i, '').replace(/^b\.tech\.\s+/i, '');

  if (d.includes('artificial intelligence') || d.includes('ai & ds') || d.includes('ai&ds') || d.includes('aids') || d.includes('ai and ds')) {
    return 'ai & ds';
  }
  if (d.includes('computer science') || d.includes('cse')) {
    return 'cse';
  }
  if (d.includes('cyber')) return 'cyber security';
  if (d.includes('information technology') || /\b(it)\b/i.test(d)) return 'it';
  if (d.includes('electrical') || d.includes('eee')) return 'eee';
  if (d.includes('electronics') || d.includes('ece')) return 'ece';
  if (d.includes('mechanical') || d.includes('mech')) return 'mech';
  if (d.includes('civil')) return 'civil';
  if (
    d.includes('science and humanities') ||
    d.includes('humanities') ||
    d.includes('s&h') ||
    d.includes('s & h') ||
    d === 'science' ||
    d === 's&h'
  ) {
    return 'science and humanities';
  }
  return d;
}

export function isSameDept(dept1?: string, dept2?: string): boolean {
  if (!dept1 || !dept2) return false;
  const n1 = normalizeDept(dept1);
  const n2 = normalizeDept(dept2);
  if (!n1 || !n2) return false;
  return n1 === n2;
}

export function getUserCollege(currentUser: User | null, defaultCollegeName?: string): string {
  if (currentUser?.institution) {
    return currentUser.institution;
  }
  return defaultCollegeName || 'Sasurie College of Engineering';
}

export function isSameCollege(col1?: string, col2?: string): boolean {
  if (!col1 || !col2) return true;
  const norm1 = col1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm2 = col2.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
}

export function isStaffInCollege(staff: Staff, targetCollege?: string): boolean {
  if (!targetCollege) return true;
  const staffCollege = staff.institution || 'Sasurie College of Engineering';
  return isSameCollege(staffCollege, targetCollege);
}

export function isSuperAdmin(currentUser: User | null): boolean {
  if (!currentUser) return false;
  if (currentUser.role === 'secretary' || currentUser.role === 'secretary_pa') return true;
  const lowEmail = (currentUser.email || '').toLowerCase();
  const lowDept = (currentUser.department || '').toLowerCase();
  const lowUser = (currentUser.username || '').toLowerCase();
  
  if (
    lowEmail.includes('admin@sas') ||
    lowEmail.includes('admin@sasu') ||
    lowUser === 'adm001' ||
    lowUser === 'admin' ||
    lowDept === 'all departments' ||
    lowDept === 'central administration' ||
    lowDept === 'management secretariat'
  ) {
    return true;
  }
  return false;
}

/**
 * Returns students that are accessible to the given user based on their role & department
 */
export function getScopedStudents(
  skillBankStudents: StudentSkillBankData[],
  currentUser: User | null,
  fallbackDept: string = 'Artificial Intelligence & Data Science (AI & DS)',
  collegeNameFallback?: string
): StudentSkillBankData[] {
  const isSecretary = isSuperAdmin(currentUser);
  const isPrincipal = !isSecretary && (currentUser?.role === 'principal' || currentUser?.role === 'principal_pa');
  const userCollege = getUserCollege(currentUser, collegeNameFallback);

  let pool = skillBankStudents;
  if (isPrincipal) {
    pool = skillBankStudents.filter((s) => {
      const stCollege = s.studentProfile?.institution || 'Sasurie College of Engineering';
      return isSameCollege(stCollege, userCollege);
    });
  }

  const targetDept = (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments')
    ? fallbackDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : 'Artificial Intelligence & Data Science (AI & DS)');

  if (!currentUser) {
    return pool.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
  }

  // Super Admin / Secretary sees all students across all colleges
  if (isSecretary) {
    if (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments') {
      return skillBankStudents.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
    }
    return skillBankStudents;
  }

  // Principal sees all students in THEIR college
  if (isPrincipal) {
    if (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments') {
      return pool.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
    }
    return pool;
  }

  // HOD (admin): Sees only students in their respective department
  if (currentUser.role === 'admin') {
    return pool.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
  }

  // Staff (Faculty Mentor): Sees assigned mentees or department students
  if (currentUser.role === 'staff') {
    const staffId = currentUser.staffId;
    const staffName = currentUser.name?.toLowerCase() || '';

    const deptStudents = pool.filter((s) => isSameDept(s.studentProfile?.department, targetDept));

    const assignedMentees = deptStudents.filter((s) => {
      const stMentorId = s.studentProfile?.mentorStaffId;
      const stMentor = (s.studentProfile?.mentorFaculty || '').toLowerCase();
      return (
        Boolean(staffId && stMentorId === staffId) ||
        Boolean(staffName && stMentor.includes(staffName))
      );
    });

    if (assignedMentees.length > 0) {
      return assignedMentees;
    }

    return deptStudents;
  }

  return pool.filter((s) => isSameDept(s.studentProfile?.department, targetDept));
}

/**
 * Returns staff list accessible to the user (e.g. for HOD assigning mentors within their department)
 */
export function getScopedStaff(
  staffList: Staff[],
  currentUser: User | null,
  fallbackDept: string = 'Artificial Intelligence & Data Science (AI & DS)',
  collegeNameFallback?: string
): Staff[] {
  const isSecretary = isSuperAdmin(currentUser);
  const isPrincipal = !isSecretary && (currentUser?.role === 'principal' || currentUser?.role === 'principal_pa');
  const userCollege = getUserCollege(currentUser, collegeNameFallback);

  let pool = staffList;
  if (isPrincipal) {
    pool = staffList.filter((s) => isStaffInCollege(s, userCollege));
  }

  // Super Admin / Secretary sees all staff across all colleges unless a department filter is selected
  if (isSecretary && (!fallbackDept || fallbackDept === 'all' || fallbackDept === 'All Departments')) {
    return staffList;
  }

  // Principal with 'all' or 'All Departments' sees all staff in THEIR college
  if (isPrincipal && (!fallbackDept || fallbackDept === 'all' || fallbackDept === 'All Departments')) {
    return pool;
  }

  const targetDept = (fallbackDept && fallbackDept !== 'all' && fallbackDept !== 'All Departments')
    ? fallbackDept
    : (currentUser?.department && currentUser.department !== 'College Principal Office' ? currentUser.department : 'Artificial Intelligence & Data Science (AI & DS)');

  return pool.filter((st) => isSameDept(st.department, targetDept));
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
  if (!department) return [];

  // Helper to normalize year string for sorting
  const normYear = (y?: string) => {
    if (!y) return 'II Year';
    if (y.includes('2') || y.includes('II')) return 'II Year';
    if (y.includes('3') || y.includes('III')) return 'III Year';
    if (y.includes('4') || y.includes('IV')) return 'IV Year';
    if (y.includes('1') || y.includes('I')) return 'I Year';
    return y;
  };

  const yearWeight = (y?: string) => {
    const ny = normYear(y);
    if (ny.includes('I Year') || ny.includes('1st')) return 1;
    if (ny.includes('II Year') || ny.includes('2nd')) return 2;
    if (ny.includes('III Year') || ny.includes('3rd')) return 3;
    if (ny.includes('IV Year') || ny.includes('4th')) return 4;
    return 5;
  };

  // If department is 'all' or 'All Departments', aggregate summaries across all departments
  if (department === 'all' || department === 'All Departments') {
    return DEPARTMENTS.flatMap((d) =>
      getDepartmentAttendanceSummaries(existingSummaries, classList, d, attendanceRecords)
    );
  }

  // Filter existingSummaries for those strictly matching this department
  const matchedSummaries = (existingSummaries || []).filter((sa) => {
    if (sa.department) return isSameDept(sa.department, department);
    const classObj = classList.find((c) => c.id === sa.classId);
    if (classObj) return isSameDept(classObj.department, department);
    return isSameDept(sa.className, department);
  });

  matchedSummaries.sort((a, b) => {
    const wA = yearWeight(a.year);
    const wB = yearWeight(b.year);
    if (wA !== wB) return wA - wB;
    return (a.className || '').localeCompare(b.className || '');
  });

  return matchedSummaries;
}

/**
 * Returns the ClassRoom[] that a mentor (staff) user is assigned to.
 * Assignment is determined by:
 *   1. Students mapped to the mentor (via mentorStaffId or mentorFaculty name)
 *      → extract their department + section → match to ClassRoom entries.
 *   2. Fallback: ClassRoom.classAdvisor matching the mentor's name or staffId.
 * For non-staff users, all classes are returned.
 */
export function getMentorAssignedClasses(
  currentUser: User | null,
  classList: ClassRoom[],
  skillBankStudents: StudentSkillBankData[]
): ClassRoom[] {
  if (!currentUser || currentUser.role !== 'staff') return classList;

  const staffId = (currentUser.staffId || currentUser.username || '').trim();
  const staffName = (currentUser.name || '').toLowerCase();

  // 1. Find students assigned to this mentor via mentor mapping
  const assignedStudents = (skillBankStudents || []).filter((s) => {
    const prof = s.studentProfile;
    if (!prof) return false;
    const stMentorId = (prof.mentorStaffId || '').trim();
    const stMentor = (prof.mentorFaculty || '').toLowerCase();
    return (
      Boolean(staffId && stMentorId === staffId) ||
      Boolean(staffName && stMentor && stMentor.includes(staffName))
    );
  });

  const matchedClassIds = new Set<string>();

    if (assignedStudents.length > 0) {
    assignedStudents.forEach((s) => {
      const prof = s.studentProfile;
      if (!prof) return;
      const stDept = prof.department || '';
      const stSection = normalizeSection(prof.section || '');

      classList.forEach((c) => {
        if (!isSameDept(c.department, stDept)) return;
        const clsSection = normalizeSection(c.section || '');
        if (clsSection !== stSection) return;
        matchedClassIds.add(c.id);
      });
    });
  }

  // 2. Also match via classAdvisor field (by name or staffId)
  classList.forEach((c) => {
    const advisor = (c.classAdvisor || '').toLowerCase();
    if (Boolean(staffName && advisor && advisor.includes(staffName)) ||
        Boolean(staffId && advisor && advisor.includes(staffId.toLowerCase()))) {
      matchedClassIds.add(c.id);
    }
  });

  if (matchedClassIds.size > 0) {
    return classList.filter((c) => matchedClassIds.has(c.id));
  }

  // Last resort: if mentor has a department, return classes in that department
  if (currentUser.department) {
    return classList.filter((c) => isSameDept(c.department, currentUser.department));
  }

  return classList;
}

/** Normalises a section string so 'A' and 'Sec A' compare equal. */
function normalizeSection(sec: string): string {
  return sec
    .toLowerCase()
    .replace(/^sec\s+/i, '')
    .replace(/^section\s+/i, '')
    .trim();
}

export function checkIsHodOrAdmin(currentUser?: User | null): boolean {
  if (!currentUser) return false;
  const role = currentUser.role as string;
  const u = currentUser as any;
  const desig = String(u?.designation || u?.designationRole || u?.coordinatorRole || '').toLowerCase();
  return (
    role === 'admin' ||
    role === 'principal' ||
    role === 'hod' ||
    desig.includes('hod') ||
    desig.includes('head of department') ||
    desig.includes('principal')
  );
}


