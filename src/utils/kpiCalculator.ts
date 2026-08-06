// kpiCalculator.ts — Faculty KPI cascade engine.
//
// AUTO-DERIVATION (Phase 1): a mentor's Pillars B, C, E are computed from the
// Skill Bank coin totals of the students assigned to them (mentor linkage via
// `studentProfile.mentorStaffId === staff.id`, falling back to `mentorFaculty`).
// Pillars A, D are self-claimed by the faculty; Pillar F is HOD-assigned (Phase 2).
//
// Dimension -> Pillar mapping (ASSUMPTION — framework PDF unreadable):
//   Student Dimension 1 (attendance, library, fees, exams, mini-project, ICT) -> Pillar B (Tutor-Ward)
//   Student Dimension 2 (NPTEL, LeetCode, online certs, papers)            -> Pillar C (Teaching & Learning)
//   Student Dimensions 3+4+5 (career, aptitude, internship, co/extra-curr) -> Pillar E (Placement)
//
// Per-pillar grading (ASSUMPTION — framework PDF unreadable):
//   percentage of pillar maxCoins -> S+ >= 90%, A+ >= 80%, A >= 65%, B >= 50%, C < 50%.
//
// Weighting (ASSUMPTION — per mentor KPI): A=20, B=20, C=20, D=20, E=20, F=0.
//   => Pillars B, C, E = 60% auto + Pillars A, D = 40% self-claimed (F in Phase 2).

import { Staff } from '../types';
import { StudentSkillBankData } from '../types/skillBank';
import {
  calculateDimension1,
  calculateDimension2,
  calculateDimension3,
  calculateDimension4,
  calculateDimension5,
} from '../data/mockSkillBank';
import {
  FacultyPillar,
  FacultyGrade,
  FacultyPillarClaim,
  FacultyKpiRecord,
  FacultyPillarDefinition,
} from '../types/facultyKpi';

// ---- Dimension caps (must mirror mockSkillBank calculators) ----
const DIM1_CAP = 40000;
const DIM2_CAP = 15000;
const DIM3_CAP = 15000;
const DIM4_CAP = 15000;
const DIM5_CAP = 15000;
const DIM_35_CAP = DIM3_CAP + DIM4_CAP + DIM5_CAP; // 45000

export const PILLAR_MAX_COINS = 8000;
export const MAX_OVERALL_COINS = 8000; // overall KPI on the same 0..8000 coin scale

export const FACULTY_PILLAR_DEFINITIONS: FacultyPillarDefinition[] = [
  {
    pillar: 'A',
    label: 'Publications, Grants & Consultancy',
    weight: 0.2,
    auto: false,
    selfClaim: true,
    hodAssigned: false,
    description: 'Self-declared research & consultancy output: journal papers, conference papers, patents, grants, consultancy.',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'Self-claimed (no Skill-Bank dimension)',
  },
  {
    pillar: 'B',
    label: 'Tutor-Ward Performance',
    weight: 0.2,
    auto: true,
    selfClaim: false,
    hodAssigned: false,
    description: 'Average Skill-Bank Dimension 1 (attendance, library, fees, exams, mini-project, ICT) across mentees, blended with mentor-touchpoint engagement (counselling, parent meetings, transformation journeys).',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'Student Dimension 1',
  },
  {
    pillar: 'C',
    label: 'Teaching & Learning',
    weight: 0.2,
    auto: true,
    selfClaim: false,
    hodAssigned: false,
    description: 'Average Skill-Bank Dimension 2 (NPTEL, LeetCode, online certs, papers) across mentees — evidence of teaching & learning engagement.',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'Student Dimension 2',
  },
  {
    pillar: 'D',
    label: 'MoUs, Consultancy & FDPs',
    weight: 0.2,
    auto: false,
    selfClaim: true,
    hodAssigned: false,
    description: 'Self-declared MoUs signed, consultancy work, and Faculty Development Programme (FDP) attendance.',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'Self-claimed (no Skill-Bank dimension)',
  },
  {
    pillar: 'E',
    label: 'Placement Readiness',
    weight: 0.2,
    auto: true,
    selfClaim: false,
    hodAssigned: false,
    description: 'Average Skill-Bank Dimensions 3+4+5 (career, aptitude, resume, internships, hackathons, co- & extra-curricular) across mentees.',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'Student Dimensions 3+4+5',
  },
  {
    pillar: 'F',
    label: 'Faculty Service / HOD Audit',
    weight: 0.0,
    auto: false,
    selfClaim: false,
    hodAssigned: true,
    description: 'HOD-audit & committee service. Assigned by the HOD — introduced in Phase 2 (not weighted in Phase 1).',
    maxCoins: PILLAR_MAX_COINS,
    dimensionHint: 'HOD assigned (Phase 2)',
  },
] as const;

export const PILLAR_DEFINITION_MAP: Record<FacultyPillar, FacultyPillarDefinition> =
  FACULTY_PILLAR_DEFINITIONS.reduce((acc, d) => {
    acc[d.pillar] = d as FacultyPillarDefinition;
    return acc;
  }, {} as Record<FacultyPillar, FacultyPillarDefinition>);

// Grading scale (ASSUMPTION — framework PDF unreadable).
export const GRADE_ORDER: FacultyGrade[] = ['S+', 'A+', 'A', 'B', 'C'];
export const GRADE_COLORS: Record<FacultyGrade, string> = {
  'S+': 'bg-amber-400 text-slate-900',
  'A+': 'bg-emerald-500 text-white',
  A: 'bg-blue-500 text-white',
  B: 'bg-indigo-500 text-white',
  C: 'bg-slate-400 text-slate-900',
};
export const GRADE_THRESHOLDS: { grade: FacultyGrade; minPct: number }[] = [
  { grade: 'S+', minPct: 90 },
  { grade: 'A+', minPct: 80 },
  { grade: 'A', minPct: 65 },
  { grade: 'B', minPct: 50 },
  { grade: 'C', minPct: 0 },
];

export function gradeFromPct(pct: number): FacultyGrade {
  const p = Math.max(0, Math.min(100, pct));
  for (const { grade, minPct } of GRADE_THRESHOLDS) {
    if (p >= minPct) return grade;
  }
  return 'C';
}
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function dim1Pct(s: StudentSkillBankData | undefined): number {
  if (!s) return 0;
  return calculateDimension1(s).cappedTotal / DIM1_CAP;
}
function dim2Pct(s: StudentSkillBankData | undefined): number {
  if (!s) return 0;
  return calculateDimension2(s).cappedTotal / DIM2_CAP;
}
function dim345Pct(s: StudentSkillBankData | undefined): number {
  if (!s) return 0;
  const raw =
    calculateDimension3(s).cappedTotal +
    calculateDimension4(s).cappedTotal +
    calculateDimension5(s).cappedTotal;
  return raw / DIM_35_CAP;
}

/**
 * Mentor-touchpoint engagement signal (ASSUMPTION): blends three mentor-only
 * TouchPoints the Skill Bank records — counselling logs, parent meetings, and
 * transformation-journey completion — into a 0..1 score. Blended 80/20 with the
 * Dimension-1 academic average for Pillar B. Weights isolated for easy tuning.
 */
const ENGAGEMENT_DIM_WEIGHT = 0.8; // weight of Dimension-1 in Pillar B
const ENGAGEMENT_ENG_WEIGHT = 0.2; // weight of mentor-touchpoint engagement in Pillar B

function engagementPct(s: StudentSkillBankData | undefined): number {
  if (!s) return 0;
  let score = 0;
  if ((s.counsellingLogs || []).length >= 1) score += 0.25;
  if ((s.parentMeetingLogs || []).length >= 1) score += 0.25;
  const tj = s.transformationJourney;
  if (tj) {
    const fields = [
      tj.academicReflection,
      tj.skillReflection,
      tj.careerReflection,
      tj.coCurricularReflection,
      tj.extraCurricularReflection,
    ];
    let present = 0;
    fields.forEach((f) => {
      if (f && String(f).trim().length > 0) present += 1;
    });
    present += tj.checkpoint1Coins > 0 ? 1 : 0;
    present += tj.checkpoint2Coins > 0 ? 1 : 0;
    present += tj.finalGradeCoin > 0 ? 1 : 0;
    score += (present / 8) * 0.5;
  }
  return clamp01(score);
}

function isMyMentee(m: StudentSkillBankData | undefined, staffId: string, facultyName: string): boolean {
  if (!m) return false;
  const sp = m.studentProfile || ({} as any);
  if (staffId && sp.mentorStaffId && sp.mentorStaffId === staffId) return true;
  if (facultyName && sp.mentorFaculty) {
    return sp.mentorFaculty.toLowerCase() === facultyName.toLowerCase();
  }
  return false;
}

export interface FacultyPillarBreakdown {
  pillar: FacultyPillar;
  definition: FacultyPillarDefinition;
  label: string;
  weight: number;
  maxCoins: number;
  earnedCoins: number; // auto pillars: round(pct*max). Self-claim: 0.
  claimedCoins: number; // auto pillars: equal to earned. Self-claim: claim coins.
  pct: number; // 0..100
  grade: FacultyGrade;
  auto: boolean;
  source: string; // human-readable derivation
  menteeCount: number;
  evidence?: string;
  claim?: FacultyPillarClaim;
}

export interface FacultyKpiReport {
  staffId: string;
  facultyName: string;
  department: string;
  institution?: string;
  academicYear: string;
  overallPct: number; // 0..100
  overallCoins: number; // 0..MAX_OVERALL_COINS
  maxOverallCoins: number;
  overallGrade: FacultyGrade;
  pillars: FacultyPillarBreakdown[];
  computedAt: string;
  menteeCount: number;
  assumptions: string[];
}

export interface FacultyKpiInput {
  staff: Staff;
  mentees: StudentSkillBankData[];
  claims: FacultyPillarClaim[];
  academicYear?: string;
}
/** Main entry: compute a single faculty member's KPI report. */
export function computeFacultyKpi(input: FacultyKpiInput): FacultyKpiReport {
  const { staff, mentees, claims, academicYear } = input;
  const staffId = staff?.id || '';
  const facultyName = staff?.facultyName || '';
  const department = staff?.department || '';
  const institution = staff?.institution;

  const claimsByPillar = new Map<FacultyPillar, FacultyPillarClaim | undefined>();
  (claims || []).forEach((c) => {
    if (c && !claimsByPillar.has(c.pillar)) claimsByPillar.set(c.pillar, c);
  });

  const myMentees = (mentees || []).filter((m) => isMyMentee(m, staffId, facultyName));

  const pillars: FacultyPillarBreakdown[] = FACULTY_PILLAR_DEFINITIONS.map((def) => {
    if (def.auto) {
      let pct = 0;
      let source = '';
      if (myMentees.length > 0) {
        if (def.pillar === 'B') {
          const dim1 = avg(myMentees.map(dim1Pct));
          const eng = avg(myMentees.map(engagementPct));
          pct = clamp01(dim1 * ENGAGEMENT_DIM_WEIGHT + eng * ENGAGEMENT_ENG_WEIGHT);
          const counselCount = myMentees.reduce((n, m) => n + ((m.counsellingLogs || []).length || 0), 0);
          const parentCount = myMentees.reduce((n, m) => n + ((m.parentMeetingLogs || []).length || 0), 0);
          const tjComplete = myMentees.reduce(
            (n, m) =>
              n +
              (m.transformationJourney &&
              (m.transformationJourney.finalGradeCoin > 0 ||
                m.transformationJourney.checkpoint1Coins > 0 ||
                m.transformationJourney.checkpoint2Coins > 0)
                ? 1
                : 0),
            0
          );
          source = `Avg Student Dimension-1 ${Math.round(dim1 * 100)}% across ${myMentees.length} mentees · Mentor engagement ${Math.round(eng * 100)}% (counselling ${counselCount}, parent meetings ${parentCount}, transformation journeys ${tjComplete}). 80/20 blend.`;
        } else if (def.pillar === 'C') {
          pct = avg(myMentees.map(dim2Pct));
          source = `Avg Student Dimension-2 ${Math.round(pct * 100)}% across ${myMentees.length} mentees (NPTEL, LeetCode, online certs, papers).`;
        } else if (def.pillar === 'E') {
          pct = avg(myMentees.map(dim345Pct));
          source = `Avg Student Dimensions 3+4+5 ${Math.round(pct * 100)}% across ${myMentees.length} mentees (career, aptitude, internship, co/extra-curricular).`;
        }
      } else {
        source = 'No mentees assigned — auto value 0. Map students via Mentor-Mentee Mapping.';
      }
      const coins = Math.round(clamp01(pct) * def.maxCoins);
      return {
        pillar: def.pillar,
        definition: def,
        label: def.label,
        weight: def.weight,
        maxCoins: def.maxCoins,
        earnedCoins: coins,
        claimedCoins: coins,
        pct: Math.round(clamp01(pct) * 100),
        grade: gradeFromPct(pct * 100),
        auto: true,
        source,
        menteeCount: myMentees.length,
      };
    }

    // Self-claimed (A, D) or HOD-assigned (F) pillar
    const claim = claimsByPillar.get(def.pillar);
    if (def.selfClaim) {
      const claimedCoins = Math.min(def.maxCoins, Math.max(0, claim?.claimedCoins || 0));
      const pct = (claimedCoins / def.maxCoins) * 100;
      const source = claim
        ? `Self-claimed ${claimedCoins} coins — ${claim.claimSource || 'evidence provided'} (${claim.status}).`
        : 'Not yet claimed — use the Self-Claims tab.';
      return {
        pillar: def.pillar,
        definition: def,
        label: def.label,
        weight: def.weight,
        maxCoins: def.maxCoins,
        earnedCoins: 0,
        claimedCoins,
        pct: Math.round(pct),
        grade: gradeFromPct(pct),
        auto: false,
        source,
        menteeCount: myMentees.length,
        evidence: claim?.evidence,
        claim,
      };
    }

    // F — HOD audit (Phase 2)
    return {
      pillar: def.pillar,
      definition: def,
      label: def.label,
      weight: def.weight,
      maxCoins: def.maxCoins,
      earnedCoins: 0,
      claimedCoins: 0,
      pct: 0,
      grade: gradeFromPct(0),
      auto: false,
      source: claim?.status === 'verified'
        ? `HOD-verified ${claim.claimedCoins} coins — ${claim.claimSource}.`
        : 'Awaiting HOD audit (Phase 2).',
      menteeCount: myMentees.length,
      evidence: claim?.evidence,
      claim,
    };
  });

  const overallPct = Math.round(
    pillars.reduce((sum, p) => sum + p.definition.weight * p.pct, 0)
  );
  const overallCoins = Math.round((overallPct / 100) * MAX_OVERALL_COINS);

  return {
    staffId,
    facultyName,
    department,
    institution,
    academicYear: academicYear || '',
    overallPct,
    overallCoins,
    maxOverallCoins: MAX_OVERALL_COINS,
    overallGrade: gradeFromPct(overallPct),
    pillars,
    computedAt: new Date().toISOString(),
    menteeCount: myMentees.length,
    assumptions: [
      'Framework PDF unreadable — dimension→pillar mapping (D1→B, D2→C, D3+D4+D5→E) and grade scale (S+≥90/A+≥80/A≥65/B≥50/C<50) are inferred conventions.',
      'Pillar B blends Dimension-1 academic average (80%) with mentor-touchpoint engagement (20%).',
      'Weights: A=20%, B=20%, C=20%, D=20%, E=20%, F=0% (F added in HOD-audit Phase 2).',
      'Mentor linkage resolved by studentProfile.mentorStaffId (fallback: mentorFaculty name match).',
      'Dimension caps (D1=40k, D2–D5=15k each, target 100k) mirror mockSkillBank calculators.',
    ],
  };
}
/** Convenience: compute KPI reports for every staff member that could be a mentor. */
export function computeAllFacultyKpis(input: {
  staffList: Staff[];
  skillBankStudents: StudentSkillBankData[];
  facultyKpiRecords: FacultyKpiRecord[];
  academicYear?: string;
}): { report: FacultyKpiReport; staff: Staff }[] {
  const { staffList, skillBankStudents, facultyKpiRecords, academicYear } = input;
  const claimsByStaff = new Map<string, FacultyPillarClaim[]>();
  (facultyKpiRecords || []).forEach((r) => {
    if (!claimsByStaff.has(r.staffId)) claimsByStaff.set(r.staffId, []);
    (claimsByStaff.get(r.staffId) || []).push(...r.claims);
  });

  return staffList
    .filter((s) => s.role === 'staff' || s.role === 'admin' || s.role === 'principal')
    .map((staff) => {
      const claims = claimsByStaff.get(staff.id) || [];
      const report = computeFacultyKpi({ staff, mentees: skillBankStudents, claims, academicYear });
      return { report, staff };
    });
}

/** Get the persisted claim (if any) for a given staff + pillar. */
export function getClaimFor(
  records: FacultyKpiRecord[],
  staffId: string,
  pillar: FacultyPillar
): FacultyPillarClaim | undefined {
  const rec = (records || []).find((r) => r.staffId === staffId);
  if (!rec) return undefined;
  return rec.claims.find((c) => c.pillar === pillar);
}
