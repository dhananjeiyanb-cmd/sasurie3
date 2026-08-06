// Faculty KPI cascade data model.
//
// The Faculty KPI is organised into six pillars (A-F):
//   A — Publications, Grants & Consultancy        (self-claimed by faculty)
//   B — Tutor-Ward Performance                     (auto-derived from Student Skill Bank Dimension 1)
//   C — Teaching & Learning                        (auto-derived from Student Skill Bank Dimension 2)
//   D — MoUs, Consultancy & FDPs                   (self-claimed by faculty)
//   E — Placement Readiness                        (auto-derived from Student Skill Bank Dimensions 3+4+5)
//   F — Faculty Service / HOD Audit                (assigned by HOD — Phase 2)
//
// Phase 1 weighting (per mentor KPI): A=20%, B=20%, C=20%, D=20%, E=20%, F=0%.
// => Pillars B, C, E = 60% auto + Pillars A, D = 40% self-claimed (F introduced in Phase 2).

export type FacultyPillar = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type FacultyGrade = 'S+' | 'A+' | 'A' | 'B' | 'C';

export type ClaimStatus = 'draft' | 'submitted' | 'verified';

export interface FacultyPillarClaim {
  /** Pillar letter the claim is made against (Phase 1: 'A' | 'D'). */
  pillar: FacultyPillar;
  /** Coins claimed for the pillar, 0..maxCoins (clamped to maxCoins). */
  claimedCoins: number;
  /** Free-text evidence / URL supporting the claim. */
  evidence: string;
  /** Human readable sub-source, e.g. 'Publications & International Grants'. */
  claimSource: string;
  /** ISO timestamp of the last save. */
  claimedAt: string;
  /** Faculty name that made the claim. */
  claimedBy: string;
  /** Status of the claim. */
  status: ClaimStatus;
}

export interface FacultyKpiRecord {
  /** Staff ID, e.g. STF001 — used as the Firestore document id. */
  staffId: string;
  facultyName: string;
  department: string;
  institution?: string;
  academicYear: string;
  /** Self / HOD claims keyed by pillar letter. */
  claims: FacultyPillarClaim[];
  /** Cached last auto-computed overall % for quick offline display. */
  lastComputedAt?: string;
  lastComputedOverallPct?: number;
  /** Schema version for future migrations. */
  version?: number;
}

export interface FacultyPillarDefinition {
  pillar: FacultyPillar;
  label: string;
  /** Share of 1.0 in the overall Faculty KPI. */
  weight: number;
  /** Auto-derived from the student Skill Bank (B, C, E in Phase 1). */
  auto: boolean;
  /** Faculty can self-declare this pillar (A, D in Phase 1). */
  selfClaim: boolean;
  /** HOD assigns this pillar (F in Phase 1). */
  hodAssigned: boolean;
  description: string;
  /** Display target coins for the pillar. */
  maxCoins: number;
  /** Which student Skill-Bank dimension(s) feed the auto pillar. */
  dimensionHint: string;
}
