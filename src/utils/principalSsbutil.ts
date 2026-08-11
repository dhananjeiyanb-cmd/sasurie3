import { StudentSkillBankData } from '../types/skillBank';
import { calculateDimension1, calculateDimension2, calculateDimension3, calculateDimension4, calculateDimension5 } from '../data/mockSkillBank';

export interface DepartmentSsbtotals {
  department: string;
  studentCount: number;
  dim1Total: number;
  dim2Total: number;
  dim3Total: number;
  dim4Total: number;
  dim5Total: number;
  totalCoins: number;
  targetCoins: number;
  achievementPct: number;
  avgCoinsPerStudent: number;
}

export function computeDepartmentSsb(
  skillBankStudents: StudentSkillBankData[],
  departments?: string[]
): DepartmentSsbtotals[] {
  const pool = departments && departments.length > 0 ? departments : Array.from(new Set((skillBankStudents || []).map((s) => s.studentProfile?.department).filter(Boolean)));

  return pool.map((dept) => {
    const students = (skillBankStudents || []).filter((s) => s.studentProfile?.department === dept);

    let dim1 = 0;
    let dim2 = 0;
    let dim3 = 0;
    let dim4 = 0;
    let dim5 = 0;

    students.forEach((s) => {
      const d1 = calculateDimension1(s);
      const d2 = calculateDimension2(s);
      const d3 = calculateDimension3(s);
      const d4 = calculateDimension4(s);
      const d5 = calculateDimension5(s);
      dim1 += d1.cappedTotal || 0;
      dim2 += d2.cappedTotal || 0;
      dim3 += d3.cappedTotal || 0;
      dim4 += d4.cappedTotal || 0;
      dim5 += d5.cappedTotal || 0;
    });

    const totalCoins = dim1 + dim2 + dim3 + dim4 + dim5;
    const targetCoins = students.length * 100000; // 100k target per student
    const achievementPct = targetCoins > 0 ? Math.round((totalCoins / targetCoins) * 100) : 0;

    return {
      department: dept,
      studentCount: students.length,
      dim1Total: dim1,
      dim2Total: dim2,
      dim3Total: dim3,
      dim4Total: dim4,
      dim5Total: dim5,
      totalCoins,
      targetCoins,
      achievementPct,
      avgCoinsPerStudent: students.length > 0 ? Math.round(totalCoins / students.length) : 0,
    };
  }).sort((a, b) => b.totalCoins - a.totalCoins);
}
