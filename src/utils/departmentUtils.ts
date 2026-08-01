import { User, Staff } from '../types';
import { StudentSkillBankData } from '../types/skillBank';

export function normalizeDept(dept?: string): string {
  if (!dept) return '';
  let d = dept.trim().toLowerCase();
  d = d.replace(/^department of\s+/i, '').replace(/^b\.e\.\s+/i, '').replace(/^b\.tech\.\s+/i, '');

  if (d.includes('artificial intelligence') || d.includes('ai & ds') || d.includes('ai&ds') || d.includes('aids') || d.includes('ai and ds')) {
    return 'ai & ds';
  }
  if (d.includes('computer science') || d.includes('cse')) {
    if (d.includes('cyber')) return 'cyber security';
    return 'cse';
  }
  if (d.includes('cyber')) return 'cyber security';
  if (d.includes('electronics') || d.includes('ece')) return 'ece';
  if (d.includes('electrical') || d.includes('eee')) return 'eee';
  if (d.includes('mechanical') || d.includes('mech')) return 'mech';
  if (d.includes('civil')) return 'civil';
  return d;
}

export function isSameDept(dept1?: string, dept2?: string): boolean {
  if (!dept1 || !dept2) return true;
  const n1 = normalizeDept(dept1);
  const n2 = normalizeDept(dept2);
  if (!n1 || !n2) return true;
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
  if (!currentUser) return skillBankStudents;

  // Principal: Sees all students across all departments
  if (currentUser.role === 'principal') {
    return skillBankStudents;
  }

  // HOD (admin): Sees only students in their department
  if (currentUser.role === 'admin') {
    const userDept = currentUser.department || fallbackDept;
    return skillBankStudents.filter((s) => isSameDept(s.studentProfile.department, userDept));
  }

  // Staff (Faculty Mentor): Sees assigned mentees or department students
  if (currentUser.role === 'staff') {
    const userDept = currentUser.department || fallbackDept;
    const staffId = currentUser.staffId;
    const staffName = currentUser.name?.toLowerCase() || '';

    // First filter to same department
    const deptStudents = skillBankStudents.filter((s) => isSameDept(s.studentProfile.department, userDept));

    // Find assigned mentees
    const assignedMentees = deptStudents.filter((s) => {
      const stMentorId = s.studentProfile.mentorStaffId;
      const stMentor = (s.studentProfile.mentorFaculty || '').toLowerCase();
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

  return skillBankStudents;
}

/**
 * Returns staff list accessible to the user (e.g. for HOD assigning mentors within their department)
 */
export function getScopedStaff(
  staffList: Staff[],
  currentUser: User | null,
  fallbackDept: string = 'Artificial Intelligence & Data Science (AI & DS)'
): Staff[] {
  if (!currentUser) return staffList;
  if (currentUser.role === 'principal') return staffList;

  const userDept = currentUser.department || fallbackDept;
  const deptStaff = staffList.filter((st) => isSameDept(st.department, userDept));
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

