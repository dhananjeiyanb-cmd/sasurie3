import { User, Staff, StudentAttendanceSummary, ClassRoom, StudentAttendanceRecord, DEPARTMENTS } from '../types';
import { StudentSkillBankData, StudentProfile, MentorMenteeMapping } from '../types/skillBank';

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

  // Staff (Faculty Mentor): Sees ONLY the mentees that the HOD has assigned to
  // them — never other mentors' students and never the raw department fallback.
  if (currentUser.role === 'staff') {
    const staffId = (currentUser.staffId || '').trim().toLowerCase();
    const staffName = (currentUser.name || '').trim().toLowerCase();

    return pool.filter((s) => {
      const stMentorId = String(s.studentProfile?.mentorStaffId || '').trim().toLowerCase();
      const stMentor = (s.studentProfile?.mentorFaculty || '').trim().toLowerCase();
      return (Boolean(staffId && stMentorId === staffId) || Boolean(staffName && stMentor === staffName));
    });
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

/**
 * Returns the student skill-bank records whose mentor-mentee mapping points to the
 * given staff user. It uses EXACTLY the same matching rules as the Mentor-Mentee
 * Mapping module (mentorFaculty === staff.facultyName OR mentorStaffId === staff.id).
 * Matching is trimmed + case-insensitive so the auto-fetched "Total Students Strength"
 * always equals the "N Mentees" count shown on the Mentor-Mentee Mapping screen
 * (e.g. II CYBER 41, III CYBER 48, IV CYBER 12) for every mentor.
 */
export function getStudentsAssignedToMentor(
  currentUser: User | null,
  skillBankStudents: StudentSkillBankData[]
): StudentSkillBankData[] {
  if (!currentUser) return [];
  const staffId = String(currentUser.staffId || currentUser.username || '').trim().toLowerCase();
  const staffName = String(currentUser.name || '').trim().toLowerCase();
  return (skillBankStudents || []).filter((s) => {
    const prof = s?.studentProfile;
    if (!prof) return false;
    // Exact mentorStaffId -> staff.id match (same as Mentor-Mentee Mapping "Map Selected Mentees")
    const matchedById = Boolean(
      staffId && String(prof.mentorStaffId || '').trim().toLowerCase() === staffId
    );
    // Exact mentorFaculty -> staff.facultyName match (same rule the Mapping screen uses)
    const matchedByName = Boolean(
      staffName && String(prof.mentorFaculty || '').trim().toLowerCase() === staffName
    );
    return matchedById || matchedByName;
  });
}

/** Best-effort: maps a student profile to a year index (1..4); 0 when unknown. */
function getStudentYearIndex(prof: StudentProfile | undefined): number {
  if (!prof) return 0;
  const sem = String(prof.semester || '').toLowerCase();
  const m = sem.match(/\bsem\s*([ivx]+|\d{1,2})/);
  if (m) {
    let idx = 0;
    if (/^\d+$/.test(m[1])) idx = parseInt(m[1], 10);
    else idx = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'].indexOf(m[1]) + 1;
    if (idx >= 1) return Math.min(4, Math.ceil(idx / 2)); // Sem I/II → 1, III/IV → 2, V/VI → 3, VII/VIII → 4
  }
  const batchMatch = String(prof.batch || '').match(/\d{4}/);
  const acadMatch = String(prof.academicYear || '').match(/\d{4}/);
  if (batchMatch && acadMatch) {
    const y = parseInt(acadMatch[0], 10) - parseInt(batchMatch[0], 10) + 1;
    if (y >= 1 && y <= 4) return y;
  }
  return 0;
}

/** Best-effort: maps a ClassRoom year label (e.g. '2nd Year') to a year index (1..4); 0 when unknown. */
function getClassYearIndex(year?: string): number {
  const y = String(year || '').toLowerCase();
  if (/iv|4/.test(y)) return 4;
  if (/iii|3/.test(y)) return 3;
  if (/ii|2/.test(y)) return 2;
  if (/[i1]/.test(y)) return 1;
  return 0;
}

/**
 * Total Students Strength for a mentor, auto-fetched from the mentor-mentee mapping.
 * - Without a class filter: count of every mentee mapped to the logged-in mentor.
 * - With a class filter: count of mentees matching the class department (+ section + year
 *   whenever the year can be derived from the student profile). If no mentee matches the
 *   given ClassRoom record, the mentor's overall strength is returned as a fallback.
 */
export function getMentorMappedClassStrength(
  currentUser: User | null,
  skillBankStudents: StudentSkillBankData[],
  cls?: ClassRoom | null
): number {
  const assigned = getStudentsAssignedToMentor(currentUser, skillBankStudents);
  if (assigned.length === 0) return 0;
  if (!cls) return assigned.length;

  const clsYearIdx = getClassYearIndex(cls.year);
  const clsSection = normalizeSection(cls.section || '');

  const inClass = assigned.filter((s) => {
    const prof = s?.studentProfile;
    if (!prof) return false;
    if (!isSameDept(prof.department, cls.department)) return false;
    if (clsSection && normalizeSection(prof.section || '') !== clsSection) return false;
    if (clsYearIdx > 0) {
      const stYearIdx = getStudentYearIndex(prof);
      if (stYearIdx > 0 && stYearIdx !== clsYearIdx) return false;
    }
    return true;
  });

  return inClass.length > 0 ? inClass.length : assigned.length;
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

/**
 * Builds the dedicated Mentor → Mentee mapping list from the student skill-bank
 * records. Every student that carries a mentorStaffId / mentorFaculty produces
 * one entry in its mentor's mentee list. `updatedAt` is left empty here so the
 * computed list is deterministic (callers stamp the timestamp when persisting).
 */
export function buildMentorMappingsFromStudents(
  skillBankStudents: StudentSkillBankData[],
  staffList?: Staff[]
): MentorMenteeMapping[] {
  const map = new Map<string, MentorMenteeMapping>();

  (skillBankStudents || []).forEach((s) => {
    const prof = s?.studentProfile;
    if (!prof) return;
    const staffId = String(prof.mentorStaffId || '').trim();
    const facultyName = String(prof.mentorFaculty || '').trim();
    if (!staffId && !facultyName) return; // unassigned students do not belong to any mentor

    const staffInfo = staffList?.find((st) => st.id === staffId);
    const key = staffId || `NAME_${facultyName.toLowerCase().replace(/\s+/g, '_')}`;

    let mapping = map.get(key);
    if (!mapping) {
      mapping = {
        mentorStaffId: staffId,
        mentorFaculty: facultyName || staffInfo?.facultyName || 'Staff Mentor',
        mentorEmail: staffInfo?.email || prof.studentEmail,
        department: prof.department,
        menteeRegNumbers: [],
        mentees: [],
        updatedAt: '',
      };
      map.set(key, mapping);
    } else if (facultyName && !mapping.mentorFaculty) {
      mapping.mentorFaculty = facultyName;
    }

    const reg = String(prof.registerNumber || '').trim();
    if (reg && !mapping.menteeRegNumbers.includes(reg)) {
      mapping.menteeRegNumbers.push(reg);
      mapping.mentees?.push({
        registerNumber: reg,
        studentName: prof.studentName,
        academicYear: prof.academicYear,
        semester: prof.semester,
        section: prof.section,
        batch: prof.batch,
      });
    }
  });

  return Array.from(map.values());
}


