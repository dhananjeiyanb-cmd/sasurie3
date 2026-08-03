import * as XLSX from 'xlsx';
import { StudentSkillBankData } from '../types/skillBank';

// Function to check if a student matches a target cohort year (e.g. 'I Year', 'II Year', 'III Year', 'IV Year')
export function isStudentInCohortYear(
  profile: { academicYear?: string; batch?: string; semester?: string } | undefined | null,
  targetYear: string
): boolean {
  if (!profile || !targetYear || targetYear === 'all') return true;

  const target = targetYear.trim().toLowerCase();
  const isTarget1st = target.includes('1st') || target.includes('i year') || target === '1' || target === 'i';
  const isTarget2nd = target.includes('2nd') || target.includes('ii year') || target === '2' || target === 'ii';
  const isTarget3rd = target.includes('3rd') || target.includes('iii year') || target === '3' || target === 'iii';
  const isTarget4th = target.includes('4th') || target.includes('iv year') || target === '4' || target === 'iv' || target.includes('final');

  const pYear = (profile.academicYear || '').trim().toLowerCase();
  const pSem = (profile.semester || '').trim().toLowerCase();
  const pBatch = (profile.batch || '').trim().toLowerCase();

  // Explicit Year String check on academicYear (e.g. '4th Year', 'IV Year', '3rd Year', 'III Year', '2nd Year', 'II Year', '1st Year', 'I Year')
  const is4thYear = pYear.includes('4th') || pYear.includes('iv') || pYear === '4' || pYear.includes('final') || pYear.includes('iv year');
  const is3rdYear = !is4thYear && (pYear.includes('3rd') || pYear.includes('iii') || pYear === '3' || pYear.includes('iii year'));
  const is2ndYear = !is4thYear && !is3rdYear && (pYear.includes('2nd') || pYear.includes('ii') || pYear === '2' || pYear.includes('ii year'));
  const is1stYear = !is4thYear && !is3rdYear && !is2ndYear && (pYear.includes('1st') || pYear === '1' || pYear.includes('i year') || (pYear.includes('i') && !pYear.includes('iii') && !pYear.includes('ii')));

  if (is4thYear) return isTarget4th;
  if (is3rdYear) return isTarget3rd;
  if (is2ndYear) return isTarget2nd;
  if (is1stYear) return isTarget1st;

  // Next Semester check
  if (pSem.includes('sem vii') || pSem.includes('sem viii') || pSem.includes('sem 7') || pSem.includes('sem 8')) {
    return isTarget4th;
  }
  if (pSem.includes('sem v') || pSem.includes('sem vi') || pSem.includes('sem 5') || pSem.includes('sem 6')) {
    return isTarget3rd;
  }
  if (pSem.includes('sem iii') || pSem.includes('sem iv') || pSem.includes('sem 3') || pSem.includes('sem 4')) {
    return isTarget2nd;
  }
  if (pSem.includes('sem i') || pSem.includes('sem ii') || pSem.includes('sem 1') || pSem.includes('sem 2')) {
    return isTarget1st;
  }

  // Next Batch check
  if (pBatch.includes('2022') || pBatch === '2022-2026') return isTarget4th;
  if (pBatch.includes('2023') || pBatch === '2023-2027') return isTarget3rd;
  if (pBatch.includes('2024') || pBatch === '2024-2028') return isTarget2nd;
  if (pBatch.includes('2025') || pBatch === '2025-2029') return isTarget1st;

  return false;
}

// Function to normalize student profile year, batch, and semester consistency
export function normalizeStudentSkillBankRecord(record: StudentSkillBankData): StudentSkillBankData {
  if (!record || !record.studentProfile) return record;

  const prof = { ...record.studentProfile };
  const pYear = (prof.academicYear || '').trim().toLowerCase();
  const pSem = (prof.semester || '').trim().toLowerCase();
  const pBatch = (prof.batch || '').trim().toLowerCase();

  const is4th = pYear.includes('4th') || pYear.includes('iv') || pYear === '4' || pYear.includes('final') || pSem.includes('sem vii') || pSem.includes('sem viii') || pBatch.includes('2022');
  const is3rd = !is4th && (pYear.includes('3rd') || pYear.includes('iii') || pYear === '3' || pSem.includes('sem v') || pSem.includes('sem vi') || pBatch.includes('2023'));
  const is2nd = !is4th && !is3rd && (pYear.includes('2nd') || pYear.includes('ii') || pYear === '2' || pSem.includes('sem iii') || pSem.includes('sem iv') || pBatch.includes('2024'));
  const is1st = !is4th && !is3rd && !is2nd && (pYear.includes('1st') || pYear === '1' || pYear.includes('i year') || pSem.includes('sem i') || pSem.includes('sem ii') || pBatch.includes('2025'));

  let targetAcademicYear = prof.academicYear;
  let targetBatch = prof.batch;
  let targetSem = prof.semester;

  if (is4th) {
    targetAcademicYear = '4th Year';
    targetBatch = '2022-2026';
    targetSem = 'Sem VII & VIII';
  } else if (is3rd) {
    targetAcademicYear = '3rd Year';
    targetBatch = '2023-2027';
    targetSem = 'Sem V & VI';
  } else if (is2nd) {
    targetAcademicYear = '2nd Year';
    targetBatch = '2024-2028';
    targetSem = 'Sem III & IV';
  } else if (is1st) {
    targetAcademicYear = '1st Year';
    targetBatch = '2025-2029';
    targetSem = 'Sem I & II';
  }

  if (
    prof.academicYear !== targetAcademicYear ||
    prof.batch !== targetBatch ||
    prof.semester !== targetSem
  ) {
    return {
      ...record,
      studentProfile: {
        ...prof,
        academicYear: targetAcademicYear,
        batch: targetBatch,
        semester: targetSem,
      },
    };
  }

  return record;
}

// Function to construct a default empty StudentSkillBankData record for new students imported via Excel
export function createDefaultStudentSkillBankRecord(data: Partial<{
  registerNumber: string;
  studentName: string;
  skillBankAccountNo: string;
  degreeBranch: string;
  department: string;
  batch: string;
  academicYear: string;
  semester: string;
  section: string;
  admissionNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  bloodGroup: string;
  motherTongue: string;
  nationality: string;
  aadhaarNo: string;
  dateOfBirth: string;
  communicationAddress: string;
  pinCode: string;
  studentMobile: string;
  studentEmail: string;
  personalEmail: string;
  fatherName: string;
  fatherOccupation: string;
  fatherMobile: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherMobile: string;
  motherEmail: string;
  sslcSchool: string;
  hscSchool: string;
  yearOfPassing: string;
  admissionCategory: string;
  mentorFaculty: string;
  mentorStaffId: string;
  dreamCompany: string;
  careerGoal: string;
}>): StudentSkillBankData {
  const regNo = data.registerNumber || `7324${Math.floor(10000000 + Math.random() * 90000000)}`;
  const deptCode = data.department?.includes('ECE') ? 'ECE' : data.department?.includes('EEE') ? 'EEE' : 'CS';

  return {
    studentProfile: {
      id: `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registerNumber: regNo,
      studentName: data.studentName || 'New Student',
      skillBankAccountNo: data.skillBankAccountNo || `SSB-2026-${deptCode}-${regNo.slice(-3)}`,
      degreeBranch: data.degreeBranch || 'B.E. Computer Science & Engineering',
      department: data.department || 'Computer Science & Engineering',
      batch: data.batch || '2023-2027',
      academicYear: data.academicYear || '2026-2027',
      semester: data.semester || 'Odd Semester (Sem V)',
      section: data.section || 'A',
      admissionNumber: data.admissionNumber || `SCE${regNo.slice(-6)}`,
      gender: data.gender || 'Male',
      age: data.age || 20,
      bloodGroup: data.bloodGroup || 'O+',
      motherTongue: data.motherTongue || 'Tamil',
      nationality: data.nationality || 'Indian',
      aadhaarNo: data.aadhaarNo || 'XXXX-XXXX-XXXX',
      dateOfBirth: data.dateOfBirth || '2005-01-01',
      communicationAddress: data.communicationAddress || 'Sasurie College Campus Hostels, Vijayamangalam',
      pinCode: data.pinCode || '638056',
      studentMobile: data.studentMobile || '9876543210',
      studentEmail: data.studentEmail || `${regNo}@sasurie.ac.in`,
      personalEmail: data.personalEmail || `${regNo}@gmail.com`,
      fatherName: data.fatherName || 'Father Name',
      fatherOccupation: data.fatherOccupation || 'Private Employee',
      fatherMobile: data.fatherMobile || '9876543211',
      fatherEmail: data.fatherEmail || 'father@gmail.com',
      motherName: data.motherName || 'Mother Name',
      motherOccupation: data.motherOccupation || 'Homemaker',
      motherMobile: data.motherMobile || '9876543212',
      motherEmail: data.motherEmail || 'mother@gmail.com',
      sslcSchool: data.sslcSchool || 'Govt Higher Secondary School',
      hscSchool: data.hscSchool || 'Govt Higher Secondary School',
      yearOfPassing: data.yearOfPassing || '2023',
      admissionCategory: (data.admissionCategory as 'Government Quota' | 'Management Quota' | 'Lateral Entry' | '7.5% Govt Quota') || 'Government Quota',
      mentorFaculty: data.mentorFaculty || 'M. Kaviyarasu (Asst. Prof / III Year Mentor)',
      mentorStaffId: data.mentorStaffId || 'STF001',
      dreamCompany: data.dreamCompany || 'Zoho Corp / TCS',
      careerGoal: data.careerGoal || 'Software Development Engineer',
      studentSigned: true,
      studentSignedDate: new Date().toISOString().split('T')[0],
      mentorSigned: true,
      mentorSignedDate: new Date().toISOString().split('T')[0],
      hodSigned: true,
      hodSignedDate: new Date().toISOString().split('T')[0],
    },
    attendanceMonths: {
      Jul: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
      Aug: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
      Sep: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
      Oct: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
      Nov: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
      Dec: { totalDays: 0, daysAttended: 0, attendancePct: 0, additionalRemedialDays: 0, coinsEarned: 0 },
    },
    libraryBooks: [],
    libraryVisits: [],
    feePayment: {
      tuitionFeePaid: false,
      hostelFeePaid: false,
      transportFeePaid: false,
      scholarshipReceived: false,
      scholarshipAmount: 0,
      scholarshipDate: '',
      examFeePaid: false,
      dateOfPayment: '',
      paymentBand: 'before_due',
      coinsEarned: 0,
      signedByStaff: false,
    },
    miniProjectChecklist: {
      topicSelectionApproved: false,
      proposalPrepared: false,
      literatureReview: false,
      developmentPlagiarismCheck: false,
      verificationDone: false,
      presentationVivaIPR: false,
      coinsEarned: 0,
    },
    miniProjectDetails: [],
    ictToolsChecklist: {
      joiningClassroom: false,
      submittingAssignmentOnTime: false,
      completingQuizTest: false,
      activeParticipation: false,
      disciplineEngagement: false,
      coinsEarned: 0,
    },
    examPerformance: {
      ciat1Appeared: false,
      ciat1Pct: 0,
      ciat2Appeared: false,
      ciat2Pct: 0,
      endSemAllPass: false,
      arrearCount: 0,
      coinsEarned: 0,
    },
    subjectMarkDetails: [],
    learnerCategory: {
      ciat1Category: 'Slow',
      ciat2Category: 'Slow',
      remedialAttendancePct: 0,
      remedialBonusEarned: false,
      coinsEarned: 0,
    },
    endSemResults: {
      allPass: false,
      arrearsCount: 0,
      gpa: 0,
      cgpa: 0,
      coinsEarned: 0,
    },
    nptelMonths: {
      Jul: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Aug: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Sep: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Oct: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Nov: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Dec: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
    },
    leetCodeMonths: {
      Jul: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Aug: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Sep: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Oct: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Nov: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Dec: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
    },
    onlineCertBasic: [],
    advancedCourses: [],
    paperPresentations: [],
    aptitudeMonths: {
      Jul: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Aug: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Sep: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Oct: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Nov: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Dec: { attended: false, scoreBand: 'None', coinsEarned: 0 },
    },
    resume: { workshopAttended: false, atsScorePct: 0, enteredByCDC: false, coinsEarned: 0 },
    mockInterview: { attended: false, performanceBand: 'Attended', enteredByCDC: false, coinsEarned: 0 },
    linkedIn: { profileCreated: false, originalPostCount: 0, repostCount: 0, coinsEarned: 0 },
    gitHub: { portfolioCompleted: false, assessmentBand: '<50', coinsEarned: 0 },
    socialMedia: { profileCreated: false, originalPostCount: 0, repostCount: 0, coinsEarned: 0 },
    hackathons: [],
    internship: { industryName: '', fromDate: '', toDate: '', totalDays: 0, type: 'Summer', internshipDone: false, certificateReceived: false, reportCompleted: false, fullTimeConverted: false, startupActivity: false, coinsEarned: 0 },
    workshop: { certificationCompleted: false, reportOnLearning: false, industrialVisitParticipation: false, coinsEarned: 0 },
    collegeEvent: { paidValueAddedCourse: false, eventParticipation: false, eventWinner: false, coinsEarned: 0 },
    volunteering: { nssNccActivity: false, communityAwareness: false, leadershipRole: false, coinsEarned: 0 },
    professionalMemberships: [],
    sportsLogs: [],
    artsLogs: [],
    clubLogs: [],
    violations: [],
    counsellingLogs: [],
    parentMeetingLogs: [],
    transformationJourney: {
      academicReflection: '',
      skillReflection: '',
      careerReflection: '',
      coCurricularReflection: '',
      extraCurricularReflection: '',
      checkpoint1Date: '',
      checkpoint1Coins: 0,
      checkpoint1Grade: 'E (Needs Improvement)',
      checkpoint2Date: '',
      checkpoint2Coins: 0,
      checkpoint2Grade: 'E (Needs Improvement)',
      finalGradeCoin: 0,
      finalGradeLetter: 'E (Needs Improvement)',
    },
  };
}

// Function to download Excel Template for HOD Bulk Import
export function downloadHODStudentTemplate() {
  const sampleRows = [
    {
      'Register Number': '732422104015',
      'Student Name': 'Kavya S. Sundaram',
      'Degree & Branch': 'B.E. Computer Science & Engineering',
      'Department': 'Computer Science & Engineering',
      'Batch': '2023-2027',
      'Semester': 'Odd Semester (Sem V)',
      'Section': 'A',
      'Mentor Faculty Name': 'M. Kaviyarasu (Asst. Prof / III Year Mentor)',
      'Student Mobile': '9876543220',
      'Student Email': 'kavya.sundaram@sasurie.ac.in',
      'Father Name': 'Sundaram S.',
      'Father Mobile': '9842109900',
      'Dream Company': 'Zoho Corporation',
      'Career Goal': 'Full Stack Java Developer',
    },
    {
      'Register Number': '732422104022',
      'Student Name': 'Dinesh Kumar M.',
      'Degree & Branch': 'B.E. Computer Science & Engineering',
      'Department': 'Computer Science & Engineering',
      'Batch': '2023-2027',
      'Semester': 'Odd Semester (Sem V)',
      'Section': 'A',
      'Mentor Faculty Name': 'M. Kaviyarasu (Asst. Prof / III Year Mentor)',
      'Student Mobile': '9876543221',
      'Student Email': 'dinesh.kumar@sasurie.ac.in',
      'Father Name': 'Manoharan K.',
      'Father Mobile': '9842109901',
      'Dream Company': 'TCS Digital',
      'Career Goal': 'Cloud Operations Engineer',
    },
    {
      'Register Number': '732422104038',
      'Student Name': 'Priya Dharshini P.',
      'Degree & Branch': 'B.E. Computer Science & Engineering',
      'Department': 'Computer Science & Engineering',
      'Batch': '2023-2027',
      'Semester': 'Odd Semester (Sem V)',
      'Section': 'B',
      'Mentor Faculty Name': 'M. Kaviyarasu (Asst. Prof / III Year Mentor)',
      'Student Mobile': '9876543222',
      'Student Email': 'priya.dharshini@sasurie.ac.in',
      'Father Name': 'Palanisamy V.',
      'Father Mobile': '9842109902',
      'Dream Company': 'Cognizant',
      'Career Goal': 'Data Analyst',
    },
    {
      'Register Number': '732423104008',
      'Student Name': 'Vignesh R.',
      'Degree & Branch': 'B.E. Computer Science & Engineering',
      'Department': 'Computer Science & Engineering',
      'Batch': '2024-2028',
      'Semester': 'Odd Semester (Sem III)',
      'Section': 'A',
      'Mentor Faculty Name': 'Dr. M. Karthikeyan (Asst. Prof / CSE)',
      'Student Mobile': '9876543223',
      'Student Email': 'vignesh.r@sasurie.ac.in',
      'Father Name': 'Ramasamy N.',
      'Father Mobile': '9842109903',
      'Dream Company': 'Infosys Power Programmer',
      'Career Goal': 'AI Engineer',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_Master_Import');

  XLSX.writeFile(wb, 'Sasurie_SSB_Student_Master_Template.xlsx');
}

// Function to parse Excel File uploaded by HOD
export async function parseExcelStudentFile(file: File): Promise<StudentSkillBankData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const importedStudents: StudentSkillBankData[] = rawJson
          .map((row) => {
            // Flexible header matching
            const regNo =
              String(
                row['Register Number'] ||
                row['Reg No'] ||
                row['RegisterNo'] ||
                row['registerNumber'] ||
                row['REG_NO'] ||
                ''
              ).trim();

            const studentName =
              String(
                row['Student Name'] ||
                row['Name'] ||
                row['StudentName'] ||
                row['studentName'] ||
                row['STUDENT_NAME'] ||
                ''
              ).trim();

            if (!regNo && !studentName) return null;

            const mentor =
              String(
                row['Mentor Faculty Name'] ||
                row['Mentor'] ||
                row['Mentor Name'] ||
                row['mentorFaculty'] ||
                'M. Kaviyarasu (Asst. Prof / III Year Mentor)'
              ).trim();

            return createDefaultStudentSkillBankRecord({
              registerNumber: regNo || `73242210${Math.floor(1000 + Math.random() * 9000)}`,
              studentName: studentName || 'Uploaded Student',
              degreeBranch: String(row['Degree & Branch'] || row['Branch'] || 'B.E. Computer Science & Engineering'),
              department: String(row['Department'] || row['Dept'] || 'Computer Science & Engineering'),
              batch: String(row['Batch'] || '2023-2027'),
              semester: String(row['Semester'] || 'Odd Semester (Sem V)'),
              section: String(row['Section'] || 'A'),
              mentorFaculty: mentor,
              studentMobile: String(row['Student Mobile'] || row['Mobile'] || '9876543210'),
              studentEmail: String(row['Student Email'] || row['Email'] || ''),
              fatherName: String(row['Father Name'] || ''),
              fatherMobile: String(row['Father Mobile'] || ''),
              dreamCompany: String(row['Dream Company'] || 'Zoho Corp'),
              careerGoal: String(row['Career Goal'] || 'Software Engineer'),
            });
          })
          .filter((item): item is StudentSkillBankData => item !== null);

        resolve(importedStudents);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
