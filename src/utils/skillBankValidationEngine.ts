import { StudentSkillBankData } from '../types/skillBank';
import {
  calculateDimension1,
  calculateDimension2,
  calculateDimension3,
  calculateDimension4,
  calculateDimension5,
  calculateStudentTotals,
} from '../data/mockSkillBank';

export interface CapCheckDetail {
  dimensionId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5';
  dimensionName: string;
  categoryKey: string;
  categoryLabel: string;
  rawCoins: number;
  capLimit: number;
  cappedCoins: number;
  overflowCoins: number;
  status: 'EXCEEDED' | 'WARNING_90' | 'OK';
  message: string;
}

export interface DimensionValidationSummary {
  dimensionId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5';
  dimensionName: string;
  rawTotal: number;
  capLimit: number;
  cappedTotal: number;
  overflowTotal: number;
  isCapped: boolean;
  status: 'EXCEEDED' | 'WARNING_90' | 'OK';
  subCategoryViolations: CapCheckDetail[];
}

export interface SkillBankValidationResult {
  isValid: boolean;
  totalRawEarned: number;
  totalCappedEarned: number;
  totalOverflowCoins: number;
  strictEnforcementActive: boolean;
  dimensionSummaries: DimensionValidationSummary[];
  allViolations: CapCheckDetail[];
  criticalAlertsCount: number;
  warningAlertsCount: number;
}

/**
 * Validates a single student's Skill Bank record against all sub-category caps and 5-Dimension hard caps.
 */
export function validateSkillBankRecord(
  record: StudentSkillBankData,
  strictEnforcement: boolean = false
): SkillBankValidationResult {
  const totals = calculateStudentTotals(record);

  const d1 = totals.d1;
  const d2 = totals.d2;
  const d3 = totals.d3;
  const d4 = totals.d4;
  const d5 = totals.d5;

  const allViolations: CapCheckDetail[] = [];

  // Helper to create check detail
  const createCheck = (
    dimId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5',
    dimName: string,
    catKey: string,
    catLabel: string,
    raw: number,
    cap: number
  ): CapCheckDetail => {
    const overflow = Math.max(0, raw - cap);
    const capped = Math.min(raw, cap);
    let status: 'EXCEEDED' | 'WARNING_90' | 'OK' = 'OK';
    let message = `Within limit (${capped.toLocaleString()} / ${cap.toLocaleString()})`;

    if (raw > cap) {
      status = 'EXCEEDED';
      message = `Sub-category cap exceeded! Raw: ${raw.toLocaleString()}, Cap: ${cap.toLocaleString()} (Overflow: +${overflow.toLocaleString()} truncated)`;
    } else if (raw >= cap * 0.9 && cap > 0) {
      status = 'WARNING_90';
      message = `Approaching cap threshold (${Math.round((raw / cap) * 100)}% used)`;
    }

    const detail: CapCheckDetail = {
      dimensionId: dimId,
      dimensionName: dimName,
      categoryKey: catKey,
      categoryLabel: catLabel,
      rawCoins: raw,
      capLimit: cap,
      cappedCoins: capped,
      overflowCoins: overflow,
      status,
      message,
    };

    if (status !== 'OK') {
      allViolations.push(detail);
    }

    return detail;
  };

  // Dimension 1 Sub-checks (Cap 40,000)
  const d1Checks: CapCheckDetail[] = [
    createCheck('d1', 'Dimension 1: Academic Performance', 'attendance', '4.1 Class Attendance', d1.attendanceCoins, 8000),
    createCheck('d1', 'Dimension 1: Academic Performance', 'libraryBooks', '4.2 Library Book Borrowing', d1.libraryCoins, 3000),
    createCheck('d1', 'Dimension 1: Academic Performance', 'libraryUtil', '4.3 Library Utilization', d1.libraryUtilCoins, 500),
    createCheck('d1', 'Dimension 1: Academic Performance', 'feePayment', '4.4 Fee Payment Discipline', d1.feeCoins, 5000),
    createCheck('d1', 'Dimension 1: Academic Performance', 'miniProject', '4.5 Mini Project / Checklists', d1.miniProjectCoins, 2500),
    createCheck('d1', 'Dimension 1: Academic Performance', 'ictTools', '4.6 ICT Tools Checklist', d1.ictToolsCoins, 2500),
    createCheck('d1', 'Dimension 1: Academic Performance', 'examPerf', '4.7 Internal Exam Performance', d1.examCoins, 12000),
    createCheck('d1', 'Dimension 1: Academic Performance', 'learnerCat', '4.8 Learner Category Weightage', d1.learnerCatCoins, 3000),
    createCheck('d1', 'Dimension 1: Academic Performance', 'endSem', '4.9 End Sem Results', d1.endSemCoins, 8000),
  ];

  const d1Summary: DimensionValidationSummary = {
    dimensionId: 'd1',
    dimensionName: 'Dimension 1: Academic Performance',
    rawTotal: d1.rawTotal,
    capLimit: 40000,
    cappedTotal: d1.cappedTotal,
    overflowTotal: Math.max(0, d1.rawTotal - 40000),
    isCapped: d1.isCapped,
    status: d1.rawTotal > 40000 ? 'EXCEEDED' : d1.rawTotal >= 36000 ? 'WARNING_90' : 'OK',
    subCategoryViolations: d1Checks.filter((c) => c.status !== 'OK'),
  };

  // Dimension 2 Sub-checks (Cap 15,000)
  const d2Checks: CapCheckDetail[] = [
    createCheck('d2', 'Dimension 2: Skill & Certification Track', 'nptel', '5.1 NPTEL / MOOC Courses', d2.nptelCoins, 3000),
    createCheck('d2', 'Dimension 2: Skill & Certification Track', 'leetCode', '5.2 LeetCode / Coding Practice', d2.leetCodeCoins, 2000),
    createCheck('d2', 'Dimension 2: Skill & Certification Track', 'basicCert', '5.3 Basic Online Certifications', d2.onlineBasicCoins, 1000),
    createCheck('d2', 'Dimension 2: Skill & Certification Track', 'advCourse', '5.4 Advanced Professional Courses', d2.advancedCourseCoins, 2000),
    createCheck('d2', 'Dimension 2: Skill & Certification Track', 'paperPres', '5.5 Paper Presentation / Publication', d2.paperCoins, 2000),
  ];

  const d2Summary: DimensionValidationSummary = {
    dimensionId: 'd2',
    dimensionName: 'Dimension 2: Skill & Certification Track',
    rawTotal: d2.rawTotal,
    capLimit: 15000,
    cappedTotal: d2.cappedTotal,
    overflowTotal: Math.max(0, d2.rawTotal - 15000),
    isCapped: d2.isCapped,
    status: d2.rawTotal > 15000 ? 'EXCEEDED' : d2.rawTotal >= 13500 ? 'WARNING_90' : 'OK',
    subCategoryViolations: d2Checks.filter((c) => c.status !== 'OK'),
  };

  // Dimension 3 Sub-checks (Cap 15,000)
  const d3Checks: CapCheckDetail[] = [
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'aptitude', '6.1 Aptitude & Assessment', d3.aptitudeCoins, 3000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'resume', '6.2 ATS Resume Building', d3.resumeCoins, 2000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'mockInterview', '6.3 Mock HR & Technical Interview', d3.mockInterviewCoins, 2000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'linkedIn', '6.4 LinkedIn Profile & Posts', d3.linkedInCoins, 2000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'gitHub', '6.5 GitHub Portfolio', d3.gitHubCoins, 1000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'socialMedia', '6.6 Social Media Professional', d3.socialMediaCoins, 1000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'hackathon', '6.7 Hackathons & Expos', d3.hackathonCoins, 2000),
    createCheck('d3', 'Dimension 3: Career Readiness & Placement', 'internship', '6.8 Industry Internship', d3.internshipCoins, 1000),
  ];

  const d3Summary: DimensionValidationSummary = {
    dimensionId: 'd3',
    dimensionName: 'Dimension 3: Career Readiness & Placement',
    rawTotal: d3.rawTotal,
    capLimit: 15000,
    cappedTotal: d3.cappedTotal,
    overflowTotal: Math.max(0, d3.rawTotal - 15000),
    isCapped: d3.isCapped,
    status: d3.rawTotal > 15000 ? 'EXCEEDED' : d3.rawTotal >= 13500 ? 'WARNING_90' : 'OK',
    subCategoryViolations: d3Checks.filter((c) => c.status !== 'OK'),
  };

  // Dimension 4 Sub-checks (Cap 15,000)
  const d4Checks: CapCheckDetail[] = [
    createCheck('d4', 'Dimension 4: Co-Curricular Track', 'workshop', '7.1 Technical Workshops Attended', d4.workshopCoins, 4000),
    createCheck('d4', 'Dimension 4: Co-Curricular Track', 'event', '7.2 College Level Event Participation', d4.eventCoins, 4000),
    createCheck('d4', 'Dimension 4: Co-Curricular Track', 'volunteering', '7.3 Event Volunteering & Organizing', d4.volunteeringCoins, 4000),
    createCheck('d4', 'Dimension 4: Co-Curricular Track', 'memberships', '7.4 Professional Memberships', d4.membershipCoins, 3000),
  ];

  const d4Summary: DimensionValidationSummary = {
    dimensionId: 'd4',
    dimensionName: 'Dimension 4: Co-Curricular Track',
    rawTotal: d4.rawTotal,
    capLimit: 15000,
    cappedTotal: d4.cappedTotal,
    overflowTotal: Math.max(0, d4.rawTotal - 15000),
    isCapped: d4.isCapped,
    status: d4.rawTotal > 15000 ? 'EXCEEDED' : d4.rawTotal >= 13500 ? 'WARNING_90' : 'OK',
    subCategoryViolations: d4Checks.filter((c) => c.status !== 'OK'),
  };

  // Dimension 5 Sub-checks (Cap 15,000)
  const d5Checks: CapCheckDetail[] = [
    createCheck('d5', 'Dimension 5: Talent, Sports & Club Activities', 'sports', '8.1 Sports & Physical Fitness Logs', d5.sportsCoins, 5000),
    createCheck('d5', 'Dimension 5: Talent, Sports & Club Activities', 'arts', '8.2 Fine Arts & Cultural Talent', d5.artsCoins, 5000),
    createCheck('d5', 'Dimension 5: Talent, Sports & Club Activities', 'clubs', '8.3 Student Clubs & Activity Logs', d5.clubCoins, 5000),
  ];

  const d5Summary: DimensionValidationSummary = {
    dimensionId: 'd5',
    dimensionName: 'Dimension 5: Talent, Sports & Club Activities',
    rawTotal: d5.rawTotal,
    capLimit: 15000,
    cappedTotal: d5.cappedTotal,
    overflowTotal: Math.max(0, d5.rawTotal - 15000),
    isCapped: d5.isCapped,
    status: d5.rawTotal > 15000 ? 'EXCEEDED' : d5.rawTotal >= 13500 ? 'WARNING_90' : 'OK',
    subCategoryViolations: d5Checks.filter((c) => c.status !== 'OK'),
  };

  const dimensionSummaries = [d1Summary, d2Summary, d3Summary, d4Summary, d5Summary];

  const criticalAlertsCount = allViolations.filter((v) => v.status === 'EXCEEDED').length +
    dimensionSummaries.filter((d) => d.status === 'EXCEEDED').length;

  const warningAlertsCount = allViolations.filter((v) => v.status === 'WARNING_90').length +
    dimensionSummaries.filter((d) => d.status === 'WARNING_90').length;

  const totalRawEarned = d1.rawTotal + d2.rawTotal + d3.rawTotal + d4.rawTotal + d5.rawTotal;
  const totalCappedEarned = totals.totalGrossEarned;
  const totalOverflowCoins = totalRawEarned - totalCappedEarned;

  return {
    isValid: criticalAlertsCount === 0,
    totalRawEarned,
    totalCappedEarned,
    totalOverflowCoins,
    strictEnforcementActive: strictEnforcement,
    dimensionSummaries,
    allViolations,
    criticalAlertsCount,
    warningAlertsCount,
  };
}

/**
 * Validates a single input before committing to state during mentor data entry.
 * If strict mode is active, clamps the new value so sub-category or dimension total never exceeds hard cap limit.
 */
export function validateAndClampMentorInput(
  inputValue: number,
  subCategoryMaxCap: number,
  currentSubCategoryTotalExceptThisInput: number,
  currentDimensionTotalExceptThisInput: number,
  dimensionMaxCap: number,
  strictMode: boolean = true
): {
  allowedValue: number;
  originalRequested: number;
  isClamped: boolean;
  clampReason?: string;
  warningMessage?: string;
} {
  if (inputValue <= 0) {
    return { allowedValue: 0, originalRequested: inputValue, isClamped: false };
  }

  // 1. Check Sub-category cap
  let maxAllowedBySubCap = Math.max(0, subCategoryMaxCap - currentSubCategoryTotalExceptThisInput);
  if (subCategoryMaxCap <= 0) maxAllowedBySubCap = inputValue; // no sub-cap restriction

  // 2. Check Dimension cap
  const maxAllowedByDimCap = Math.max(0, dimensionMaxCap - currentDimensionTotalExceptThisInput);

  const effectiveMaxAllowed = Math.min(maxAllowedBySubCap, maxAllowedByDimCap);

  if (inputValue > effectiveMaxAllowed && strictMode) {
    let reason = '';
    if (inputValue > maxAllowedBySubCap) {
      reason = `Exceeds sub-category cap limit (${subCategoryMaxCap.toLocaleString()} Coins). Clamped to ${maxAllowedBySubCap.toLocaleString()} Coins.`;
    } else {
      reason = `Exceeds Dimension hard cap limit (${dimensionMaxCap.toLocaleString()} Coins). Clamped to ${maxAllowedByDimCap.toLocaleString()} Coins.`;
    }

    return {
      allowedValue: effectiveMaxAllowed,
      originalRequested: inputValue,
      isClamped: true,
      clampReason: reason,
      warningMessage: `[Auto-Clamped by Validation Engine] ${reason}`,
    };
  }

  if (inputValue > effectiveMaxAllowed && !strictMode) {
    return {
      allowedValue: inputValue,
      originalRequested: inputValue,
      isClamped: false,
      warningMessage: `⚠️ Input exceeds cap limit. Surplus coins (+${(inputValue - effectiveMaxAllowed).toLocaleString()}) will be truncated at total calculation.`,
    };
  }

  return {
    allowedValue: inputValue,
    originalRequested: inputValue,
    isClamped: false,
  };
}
