import * as XLSX from 'xlsx';
import { StudentSkillBankData } from '../types/skillBank';

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
      Jul: { totalDays: 24, daysAttended: 24, attendancePct: 100, additionalRemedialDays: 0, coinsEarned: 8000 },
      Aug: { totalDays: 22, daysAttended: 21, attendancePct: 95.5, additionalRemedialDays: 0, coinsEarned: 8000 },
      Sep: { totalDays: 25, daysAttended: 24, attendancePct: 96, additionalRemedialDays: 0, coinsEarned: 8000 },
      Oct: { totalDays: 20, daysAttended: 19, attendancePct: 95, additionalRemedialDays: 0, coinsEarned: 8000 },
      Nov: { totalDays: 22, daysAttended: 21, attendancePct: 95.5, additionalRemedialDays: 0, coinsEarned: 8000 },
      Dec: { totalDays: 15, daysAttended: 15, attendancePct: 100, additionalRemedialDays: 0, coinsEarned: 8000 },
    },
    libraryBooks: [
      { id: `LIB-${Date.now()}-1`, month: 'Jul', bookName: 'Core Java Programming', author: 'E. Balagurusamy', issueDate: '2026-07-05', returnDate: '2026-07-19', returnedOnTime: true, verifiedByLibrarian: true, mentorSigned: true },
    ],
    libraryVisits: [
      { id: `LV-${Date.now()}-1`, month: 'Jul', date: '2026-07-06', inTime: '10:00 AM', outTime: '11:00 AM', verified: true },
    ],
    feePayment: {
      tuitionFeePaid: true,
      hostelFeePaid: false,
      transportFeePaid: true,
      scholarshipReceived: true,
      scholarshipAmount: 10000,
      scholarshipDate: '2026-07-10',
      examFeePaid: true,
      dateOfPayment: '2026-07-15',
      paymentBand: 'before_due',
      coinsEarned: 6000,
      signedByStaff: true,
    },
    miniProjectChecklist: {
      topicSelectionApproved: true,
      proposalPrepared: true,
      literatureReview: true,
      developmentPlagiarismCheck: true,
      verificationDone: true,
      presentationVivaIPR: true,
      coinsEarned: 2500,
    },
    miniProjectDetails: [
      { id: `MP-${Date.now()}`, subjectCode: 'CS3591', courseName: 'Mini Project', facultyName: data.mentorFaculty || 'M. Kaviyarasu', projectTitle: 'Web Application Development', learningOutcome: 'Built React TypeScript frontend' },
    ],
    ictToolsChecklist: {
      joiningClassroom: true,
      submittingAssignmentOnTime: true,
      completingQuizTest: true,
      activeParticipation: true,
      disciplineEngagement: true,
      coinsEarned: 2500,
    },
    examPerformance: {
      ciat1Appeared: true,
      ciat1Pct: 85,
      ciat2Appeared: true,
      ciat2Pct: 88,
      endSemAllPass: true,
      arrearCount: 0,
      coinsEarned: 10000,
    },
    subjectMarkDetails: [
      { id: `SM-${Date.now()}`, subjectCode: 'CS3501', subjectName: 'Compiler Design', ciat1Marks: 85, ciat2Marks: 88, assignment1Marks: 10, assignment2Marks: 10, modelLabMarks: 90 },
    ],
    learnerCategory: {
      ciat1Category: 'Fast',
      ciat2Category: 'Fast',
      remedialAttendancePct: 100,
      remedialBonusEarned: false,
      coinsEarned: 3000,
    },
    endSemResults: {
      allPass: true,
      arrearsCount: 0,
      gpa: 8.5,
      cgpa: 8.4,
      coinsEarned: 5000,
    },
    nptelMonths: {
      Jul: { registrationDone: true, weeklyTestsDone: true, examApplied: true, resultStatus: 'Elite', coinsEarned: 2500 },
      Aug: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Sep: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Oct: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Nov: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
      Dec: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
    },
    leetCodeMonths: {
      Jul: { taskCompleted: true, attendanceBand: '90%+', coinsEarned: 2000 },
      Aug: { taskCompleted: true, attendanceBand: '90%+', coinsEarned: 2000 },
      Sep: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Oct: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Nov: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
      Dec: { taskCompleted: false, attendanceBand: '<60%', coinsEarned: 0 },
    },
    onlineCertBasic: [
      { id: `OCB-${Date.now()}`, month: 'Jul', platform: 'Coursera', courseName: 'Python for Beginners', durationHrs: 10, proofAttached: true, coinsEarned: 100 },
    ],
    advancedCourses: [
      { id: `ADV-${Date.now()}`, month: 'Jul', platform: 'Udemy', courseName: 'Full Stack Web Development', durationHrs: 25, verifiedProof: true, remarks: 'Verified certificate', coinsEarned: 200 },
    ],
    paperPresentations: [],
    aptitudeMonths: {
      Jul: { attended: true, scoreBand: 'Score >= 80', coinsEarned: 3000 },
      Aug: { attended: true, scoreBand: 'Score >= 80', coinsEarned: 3000 },
      Sep: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Oct: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Nov: { attended: false, scoreBand: 'None', coinsEarned: 0 },
      Dec: { attended: false, scoreBand: 'None', coinsEarned: 0 },
    },
    resume: { workshopAttended: true, atsScorePct: 85, enteredByCDC: true, coinsEarned: 2000 },
    mockInterview: { attended: true, performanceBand: 'Moderate', enteredByCDC: true, coinsEarned: 1000 },
    linkedIn: { profileCreated: true, originalPostCount: 4, repostCount: 5, coinsEarned: 1200 },
    gitHub: { portfolioCompleted: true, assessmentBand: '100-149', coinsEarned: 1000 },
    socialMedia: { profileCreated: true, originalPostCount: 3, repostCount: 3, coinsEarned: 800 },
    hackathons: [],
    internship: { industryName: 'Sasurie Tech Solutions', fromDate: '2026-06-01', toDate: '2026-06-15', totalDays: 15, type: 'Summer', internshipDone: true, certificateReceived: true, reportCompleted: true, fullTimeConverted: false, startupActivity: false, coinsEarned: 1000 },
    workshop: { certificationCompleted: true, reportOnLearning: true, industrialVisitParticipation: true, coinsEarned: 4000 },
    collegeEvent: { paidValueAddedCourse: true, eventParticipation: true, eventWinner: false, coinsEarned: 3000 },
    volunteering: { nssNccActivity: true, communityAwareness: true, leadershipRole: false, coinsEarned: 3000 },
    professionalMemberships: [],
    sportsLogs: [],
    artsLogs: [],
    clubLogs: [
      { id: `CLUB-${Date.now()}`, clubName: 'Tech Club', role: 'Member', activityDetails: 'Attended Workshop', date: '2026-08-10', coinsEarned: 500 },
    ],
    violations: [],
    counsellingLogs: [],
    parentMeetingLogs: [],
    transformationJourney: {
      academicReflection: 'Steady academic progress.',
      skillReflection: 'Active in online certifications.',
      careerReflection: 'Prepared resume and completed internship.',
      coCurricularReflection: 'Participating in workshops.',
      extraCurricularReflection: 'Engaged in college activities.',
      checkpoint1Date: '2026-08-30',
      checkpoint1Coins: 35000,
      checkpoint1Grade: 'A (Very Good)',
      checkpoint2Date: '2026-11-30',
      checkpoint2Coins: 75000,
      checkpoint2Grade: 'A+ (Exemplary)',
      finalGradeCoin: 82000,
      finalGradeLetter: 'A+ (Exemplary)',
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
