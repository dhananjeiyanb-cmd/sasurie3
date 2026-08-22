import { StudentSkillBankData, StudentProfile, MonthKey, MONTH_LIST } from '../types/skillBank';

// Helper to calculate Attendance coins from percentage
export function calculateAttendanceCoins(pct: number): number {
  if (pct >= 95) return 8000;
  if (pct >= 91) return 5000;
  if (pct >= 81) return 3000;
  return 0;
}

// Calculate Dimension 1 Total with Cap 40,000
export function calculateDimension1(record: StudentSkillBankData): {
  attendanceCoins: number;
  libraryCoins: number;
  libraryUtilCoins: number;
  feeCoins: number;
  miniProjectCoins: number;
  ictToolsCoins: number;
  examCoins: number;
  learnerCatCoins: number;
  endSemCoins: number;
  rawTotal: number;
  cappedTotal: number;
  isCapped: boolean;
} {
  if (!record) {
    return { attendanceCoins: 0, libraryCoins: 0, libraryUtilCoins: 0, feeCoins: 0, miniProjectCoins: 0, ictToolsCoins: 0, examCoins: 0, learnerCatCoins: 0, endSemCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false };
  }
  let attCoins = 0;
  if (record.attendanceMonths) {
    let totDays = 0;
    let attDays = 0;
    MONTH_LIST.forEach((m) => {
      const entry = record.attendanceMonths[m];
      if (entry) {
        totDays += entry.totalDays || 0;
        attDays += entry.daysAttended || 0;
      }
    });
    if (totDays > 0) {
      const overallPct = Number(((attDays / totDays) * 100).toFixed(1));
      attCoins = calculateAttendanceCoins(overallPct);
    } else {
      MONTH_LIST.forEach((m) => {
        attCoins += record.attendanceMonths[m]?.coinsEarned || 0;
      });
    }
  }
  const attendanceCoins = Math.min(8000, attCoins);

  let libraryCoins = 0;
  if (record.libraryChecklist) {
    libraryCoins = record.libraryChecklist.coinsEarned || 0;
  } else if (record.libraryBooks && Array.isArray(record.libraryBooks)) {
    const libBooksCount = record.libraryBooks.filter((b) => b?.verifiedByLibrarian && b?.returnedOnTime).length;
    libraryCoins = Math.min(3000, Math.max(1500, Math.floor(libBooksCount / 5) * 1500));
  }
  libraryCoins = Math.min(3000, libraryCoins);

  const libVisitsCount = record.libraryVisits && Array.isArray(record.libraryVisits) ? record.libraryVisits.filter((v) => v?.verified).length : 0;
  const libraryUtilCoins = Math.min(500, libVisitsCount * 20);

  const feeCoins = Math.min(5000, record.feePayment?.coinsEarned || 0);
  const miniProjectCoins = Math.min(2500, record.miniProjectChecklist?.coinsEarned || 0);
  const ictToolsCoins = Math.min(2500, record.ictToolsChecklist?.coinsEarned || 0);
  const examCoins = Math.min(12000, record.examPerformance?.coinsEarned || 0);
  const learnerCatCoins = record.learnerCategory?.coinsEarned || 0;
  const endSemCoins = record.endSemResults?.coinsEarned || 0;

  const rawTotal =
    attendanceCoins +
    libraryCoins +
    libraryUtilCoins +
    feeCoins +
    miniProjectCoins +
    ictToolsCoins +
    examCoins +
    learnerCatCoins +
    endSemCoins;

  const cappedTotal = Math.min(40000, rawTotal);

  return {
    attendanceCoins,
    libraryCoins,
    libraryUtilCoins,
    feeCoins,
    miniProjectCoins,
    ictToolsCoins,
    examCoins,
    learnerCatCoins,
    endSemCoins,
    rawTotal,
    cappedTotal,
    isCapped: rawTotal > 40000,
  };
}

// Calculate Dimension 2 Total with Cap 15,000
export function calculateDimension2(record: StudentSkillBankData): {
  nptelCoins: number;
  leetCodeCoins: number;
  onlineBasicCoins: number;
  advancedCourseCoins: number;
  paperCoins: number;
  rawTotal: number;
  cappedTotal: number;
  isCapped: boolean;
} {
  if (!record) {
    return { nptelCoins: 0, leetCodeCoins: 0, onlineBasicCoins: 0, advancedCourseCoins: 0, paperCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false };
  }
  let nptel = 0;
  if (record.nptelMonths) {
    MONTH_LIST.forEach((m) => {
      nptel += record.nptelMonths[m]?.coinsEarned || 0;
    });
  }
  const nptelCoins = Math.min(3000, nptel);

  let leet = 0;
  if (record.leetCodeMonths) {
    MONTH_LIST.forEach((m) => {
      leet += record.leetCodeMonths[m]?.coinsEarned || 0;
    });
  }
  const leetCodeCoins = Math.min(2000, leet);

  const basicSum = (record.onlineCertBasic || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const onlineBasicCoins = Math.min(1000, basicSum);

  const advSum = (record.advancedCourses || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const advancedCourseCoins = Math.min(2000, advSum);

  const paperSum = (record.paperPresentations || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const paperCoins = Math.min(2000, paperSum);

  const rawTotal = nptelCoins + leetCodeCoins + onlineBasicCoins + advancedCourseCoins + paperCoins;
  const cappedTotal = Math.min(15000, rawTotal);

  return {
    nptelCoins,
    leetCodeCoins,
    onlineBasicCoins,
    advancedCourseCoins,
    paperCoins,
    rawTotal,
    cappedTotal,
    isCapped: rawTotal > 15000,
  };
}

// Calculate Dimension 3 Total with Cap 15,000
export function calculateDimension3(record: StudentSkillBankData): {
  aptitudeCoins: number;
  resumeCoins: number;
  mockInterviewCoins: number;
  linkedInCoins: number;
  gitHubCoins: number;
  socialMediaCoins: number;
  hackathonCoins: number;
  internshipCoins: number;
  rawTotal: number;
  cappedTotal: number;
  isCapped: boolean;
} {
  if (!record) {
    return { aptitudeCoins: 0, resumeCoins: 0, mockInterviewCoins: 0, linkedInCoins: 0, gitHubCoins: 0, socialMediaCoins: 0, hackathonCoins: 0, internshipCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false };
  }
  let apt = 0;
  if (record.aptitudeMonths) {
    MONTH_LIST.forEach((m) => {
      apt += record.aptitudeMonths[m]?.coinsEarned || 0;
    });
  }
  const aptitudeCoins = Math.min(3000, apt);

  const resumeCoins = Math.min(2000, record.resume?.coinsEarned || 0);
  const mockInterviewCoins = Math.min(2000, record.mockInterview?.coinsEarned || 0);
  const linkedInCoins = Math.min(2000, record.linkedIn?.coinsEarned || 0);
  const gitHubCoins = Math.min(1000, record.gitHub?.coinsEarned || 0);
  const socialMediaCoins = record.socialMedia?.coinsEarned || 0;

  const hackSum = (record.hackathons || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const hackathonCoins = Math.min(2000, hackSum);

  const internshipCoins = Math.min(1000, record.internship?.coinsEarned || 0);

  const rawTotal =
    aptitudeCoins +
    resumeCoins +
    mockInterviewCoins +
    linkedInCoins +
    gitHubCoins +
    socialMediaCoins +
    hackathonCoins +
    internshipCoins;

  const cappedTotal = Math.min(15000, rawTotal);

  return {
    aptitudeCoins,
    resumeCoins,
    mockInterviewCoins,
    linkedInCoins,
    gitHubCoins,
    socialMediaCoins,
    hackathonCoins,
    internshipCoins,
    rawTotal,
    cappedTotal,
    isCapped: rawTotal > 15000,
  };
}

// Calculate Dimension 4 Total with Cap 15,000
export function calculateDimension4(record: StudentSkillBankData): {
  workshopCoins: number;
  eventCoins: number;
  volunteeringCoins: number;
  membershipCoins: number;
  rawTotal: number;
  cappedTotal: number;
  isCapped: boolean;
} {
  if (!record) {
    return { workshopCoins: 0, eventCoins: 0, volunteeringCoins: 0, membershipCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false };
  }
  const workshopCoins = Math.min(4000, record.workshop?.coinsEarned || 0);
  const eventCoins = Math.min(4000, record.collegeEvent?.coinsEarned || 0);
  const volunteeringCoins = Math.min(4000, record.volunteering?.coinsEarned || 0);

  const memSum = (record.professionalMemberships || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const membershipCoins = Math.min(3000, memSum);

  const rawTotal = workshopCoins + eventCoins + volunteeringCoins + membershipCoins;
  const cappedTotal = Math.min(15000, rawTotal);

  return {
    workshopCoins,
    eventCoins,
    volunteeringCoins,
    membershipCoins,
    rawTotal,
    cappedTotal,
    isCapped: rawTotal > 15000,
  };
}

// Calculate Dimension 5 Total with Cap 15,000
export function calculateDimension5(record: StudentSkillBankData): {
  sportsCoins: number;
  artsCoins: number;
  clubCoins: number;
  rawTotal: number;
  cappedTotal: number;
  isCapped: boolean;
} {
  if (!record) {
    return { sportsCoins: 0, artsCoins: 0, clubCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false };
  }
  const sportsSum = (record.sportsLogs || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const sportsCoins = Math.min(5000, sportsSum);

  const artsSum = (record.artsLogs || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const artsCoins = Math.min(5000, artsSum);

  const clubSum = (record.clubLogs || []).reduce((sum, item) => sum + (item?.coinsEarned || 0), 0);
  const clubCoins = Math.min(5000, clubSum);

  const rawTotal = sportsCoins + artsCoins + clubCoins;
  const cappedTotal = Math.min(15000, rawTotal);

  return {
    sportsCoins,
    artsCoins,
    clubCoins,
    rawTotal,
    cappedTotal,
    isCapped: rawTotal > 15000,
  };
}

// Full Grand Summary Calculator
export function calculateStudentTotals(record: StudentSkillBankData) {
  const d1 = calculateDimension1(record);
  const d2 = calculateDimension2(record);
  const d3 = calculateDimension3(record);
  const d4 = calculateDimension4(record);
  const d5 = calculateDimension5(record);

  const totalGrossEarned = d1.cappedTotal + d2.cappedTotal + d3.cappedTotal + d4.cappedTotal + d5.cappedTotal;

  let totalDeductions = 0;
  if (record && record.violations) {
    record.violations.forEach((v) => {
      totalDeductions += v?.coinsDeducted || 0;
    });
  }

  const grandTotalNetCoins = Math.max(0, totalGrossEarned - totalDeductions);
  const percentageOfTarget = Math.round((grandTotalNetCoins / 100000) * 100);

  return {
    d1,
    d2,
    d3,
    d4,
    d5,
    totalGrossEarned,
    totalDeductions,
    grandTotalNetCoins,
    percentageOfTarget,
  };
}

// Strip signature details and dates to default zero/unsigned values
export function stripSkillBankDates(student: StudentSkillBankData): StudentSkillBankData {
  return {
    ...student,
    studentProfile: {
      ...student.studentProfile,
      studentSigned: false,
      studentSignedDate: '',
      mentorSigned: false,
      mentorSignedDate: '',
      hodSigned: false,
      hodSignedDate: '',
    }
  };
}

const RAW_INITIAL_STUDENTS_SKILL_BANK: StudentSkillBankData[] = [];

export const INITIAL_STUDENTS_SKILL_BANK: StudentSkillBankData[] = RAW_INITIAL_STUDENTS_SKILL_BANK;
