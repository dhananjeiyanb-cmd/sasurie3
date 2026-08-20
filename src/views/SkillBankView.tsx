import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getScopedStudents, getScopedStaff, getDeptHodName } from '../utils/departmentUtils';
import {
  MONTH_LIST,
  MonthKey,
  StudentSkillBankData,
  SubjectMarkDetail,
} from '../types/skillBank';
import {
  calculateStudentTotals,
  calculateAttendanceCoins,
} from '../data/mockSkillBank';
import {
  downloadHODStudentTemplate,
  parseExcelStudentFile,
  createDefaultStudentSkillBankRecord,
  isStudentInCohortYear,
  downloadSkillBankMonitoringSampleSheet,
  parseSkillBankMonitoringSheet,
} from '../utils/excelSkillBank';
import {
  validateSkillBankRecord,
  validateAndClampMentorInput,
  SkillBankValidationResult,
  CapCheckDetail,
} from '../utils/skillBankValidationEngine';
import {
  Coins,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  FileText,
  UserCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Heart,
  CreditCard,
  Layers,
  Settings,
  Upload,
  Download,
  Filter,
  Users,
  X,
  FileCheck,
  Eye,
  Check,
  FileUp,
  FilePlus,
} from 'lucide-react';

export const SkillBankView: React.FC = () => {
  const {
    currentUser,
    skillBankStudents,
    updateSkillBankStudent,
    addSkillBankStudent,
    deleteSkillBankStudent,
    clearAllSkillBankStudents,
    clearDepartmentSkillBankStudents,
    googleSheetsConfig,
    updateGoogleSheetsConfig,
    syncSkillBankToGoogleSheets,
    dailyReport,
    staffList,
  } = useApp();

  const fallbackDept = currentUser?.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)';
  const scopedStudents = React.useMemo(() => getScopedStudents(skillBankStudents, currentUser, fallbackDept), [skillBankStudents, currentUser, fallbackDept]);

  const isStaff = currentUser?.role === 'staff';
  const isHodOrPrincipal = currentUser?.role === 'admin' || currentUser?.role === 'principal';

  const [selectedRegisterNo, setSelectedRegisterNo] = useState<string>(
    scopedStudents[0]?.studentProfile.registerNumber || skillBankStudents[0]?.studentProfile.registerNumber || ''
  );
  const [activeMainTab, setActiveMainTab] = useState<
    'hod_overview' | 'profile' | 'dim1' | 'dim2' | 'dim3' | 'dim4' | 'dim5' | 'retraction' | 'journey' | 'leaderboard'
  >(currentUser?.role === 'staff' ? 'profile' : 'hod_overview');

  // HOD Executive Dashboard & Student Report Modal State
  const [hodYearFilterTab, setHodYearFilterTab] = useState<'I Year' | 'II Year' | 'III Year' | 'IV Year' | 'all'>('all');
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);
  const [selectedReportRegisterNo, setSelectedReportRegisterNo] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Mentor Scoping & User Access Role
  const [userScopeMode, setUserScopeMode] = useState<'hod' | 'mentor'>(
    currentUser?.role === 'staff' ? 'mentor' : 'hod'
  );
  const [activeMentorName, setActiveMentorName] = useState<string>(
    currentUser?.name || 'M. Kaviyarasu (Asst. Prof / III Year Mentor)'
  );

  const showDataEntryTabs = true;

  // Synchronize Staff mode restrictions whenever currentUser changes
  React.useEffect(() => {
    if (isStaff) {
      if (userScopeMode !== 'mentor') {
        setUserScopeMode('mentor');
      }
      if (activeMainTab === 'hod_overview') {
        setActiveMainTab('profile');
      }
      if (currentUser?.name && !(activeMentorName || '').toLowerCase().includes((currentUser.name || '').toLowerCase().split(' ')[0])) {
        setActiveMentorName(currentUser.name);
      }
    }
  }, [currentUser, isStaff, activeMainTab, userScopeMode, activeMentorName]);

  // Allow HOD / Principal to navigate all categories freely

  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Batch CIAT Mark Entry State
  const [isBatchCiatModalOpen, setIsBatchCiatModalOpen] = useState(false);
  const [batchCiatExam, setBatchCiatExam] = useState<'CIAT 1' | 'CIAT 2'>('CIAT 1');
  const [batchSubjectCode, setBatchSubjectCode] = useState('CS3401');
  const [batchSubjectName, setBatchSubjectName] = useState('Algorithms & Data Structures');
  const [batchStudentMarks, setBatchStudentMarks] = useState<Record<string, number>>({});

  // Excel Bulk Import Modal State
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [excelPreviewStudents, setExcelPreviewStudents] = useState<StudentSkillBankData[]>([]);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelImportStatus, setExcelImportStatus] = useState<string | null>(null);
  const [selectedDefaultMentorForExcel, setSelectedDefaultMentorForExcel] = useState<string>(
    'M. Kaviyarasu (Asst. Prof / III Year Mentor)'
  );

  // 5-Dimension Monitoring Sheet Upload State
  const [isMonitoringUploadModalOpen, setIsMonitoringUploadModalOpen] = useState(false);
  const [monitoringPreviewUpdated, setMonitoringPreviewUpdated] = useState<StudentSkillBankData[]>([]);
  const [monitoringPreviewCreated, setMonitoringPreviewCreated] = useState<StudentSkillBankData[]>([]);
  const [isImportingMonitoring, setIsImportingMonitoring] = useState(false);
  const [monitoringImportStatus, setMonitoringImportStatus] = useState<string | null>(null);

  // Print Passbook State
  const [isPrintingPassbook, setIsPrintingPassbook] = useState(false);

  // Validation Engine State
  const [strictEnforcementMode, setStrictEnforcementMode] = useState<boolean>(true);
  const [isValidationDiagnosticsOpen, setIsValidationDiagnosticsOpen] = useState<boolean>(false);

  // Dimension 2 Proof Viewer & Data Entry Modal States
  const [proofViewerData, setProofViewerData] = useState<{
    title: string;
    category: string;
    studentName: string;
    regNo: string;
    fileName: string;
    fileUrl?: string;
    uploadDate: string;
    status: 'Verified' | 'Pending Review' | 'Rejected';
    verifiedBy: string;
    coinsEarned: number;
    platform?: string;
    remarks?: string;
  } | null>(null);

  const [isAddBasicCertModalOpen, setIsAddBasicCertModalOpen] = useState(false);
  const [basicCertForm, setBasicCertForm] = useState({
    courseName: '',
    platform: 'Infosys Springboard',
    durationHrs: 12,
    fileName: '',
  });

  const [isAddAdvCourseModalOpen, setIsAddAdvCourseModalOpen] = useState(false);
  const [advCourseForm, setAdvCourseForm] = useState({
    courseName: '',
    platform: 'AWS Academy / Cloud',
    durationHrs: 30,
    remarks: 'Cloud Infrastructure Specialization',
    fileName: '',
  });

  const [isAddPaperModalOpen, setIsAddPaperModalOpen] = useState(false);
  const [paperForm, setPaperForm] = useState({
    title: '',
    symposiumName: '',
    venue: '',
    level: 'National' as any,
    prizeWon: '1st Prize (1,000 Coins)',
    coinsEarned: 1000,
    fileName: '',
  });

  const [isAddHackathonModalOpen, setIsAddHackathonModalOpen] = useState(false);
  const [hackathonForm, setHackathonForm] = useState({
    eventName: '',
    month: 'Jul' as MonthKey,
    participated: true,
    prizeWon: true,
    fileName: '',
  });

  // Dimension 4 & 5 & Disciplinary Modals State
  const [isAddMembershipModalOpen, setIsAddMembershipModalOpen] = useState(false);
  const [membershipForm, setMembershipForm] = useState({
    bodyName: 'IEEE Student Branch',
    membershipType: 'Annual' as 'Annual' | 'Life',
    dateOfIssue: '',
    validity: '',
    fileName: '',
  });

  const [isAddSportsModalOpen, setIsAddSportsModalOpen] = useState(false);
  const [sportsForm, setSportsForm] = useState({
    gameSport: 'Athletics / 100m Sprint',
    participationLevel: 'Zonal' as 'Inter-college' | 'Intra-college' | 'Zonal' | 'District' | 'State' | 'National' | 'Winner/Runner',
    venue: 'Anna University Sports Complex',
    date: '',
    resultPosition: '1st Place (Gold Medal)',
    fileName: '',
  });

  const [isAddArtsModalOpen, setIsAddArtsModalOpen] = useState(false);
  const [artsForm, setArtsForm] = useState({
    culturalCategory: 'Fine Arts / Painting',
    participationLevel: 'Dance/Music/Drama' as 'Cultural Participation' | 'Dance/Music/Drama' | 'State Level' | 'National Level' | 'Winner/Best Performer',
    date: '',
    position: 'Winner (1st Prize)',
    fileName: '',
  });

  const [isAddClubModalOpen, setIsAddClubModalOpen] = useState(false);
  const [clubForm, setClubForm] = useState({
    clubName: 'Rotaract Club of Sasurie',
    role: 'Event Organizer' as 'Member' | 'Active Participant' | 'Event Organizer' | 'Coordinator/Lead' | 'Workshop Instructor',
    activityDetails: 'Organized Blood Donation Drive & Science Fair',
    date: '',
    fileName: '',
  });

  const [isAddViolationModalOpen, setIsAddViolationModalOpen] = useState(false);
  const [violationForm, setViolationForm] = useState({
    type: 'Minor/Behavioral' as 'Minor/Behavioral' | 'Disciplinary',
    category: 'Late coming' as 'Late coming' | 'Improper Dress' | 'Late Submission' | 'No ID Card' | 'Misconduct' | 'Insubordination' | 'Campus Disruption' | 'Attendance Shortage (<75%)' | 'Other',
    occurrenceNo: 1,
    recordedBy: 'Chief Mentor / HOD',
    remarks: 'Late arrival to class morning session without prior permission.',
    fileName: '',
  });

  // Filtered Students List with Role & Department Scoping
  const filteredStudents = scopedStudents.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    const studentName = s.studentProfile?.studentName || '';
    const registerNumber = s.studentProfile?.registerNumber || '';
    const matchesSearch =
      term === '' ||
      studentName.toLowerCase().includes(term) ||
      registerNumber.toLowerCase().includes(term);

    const matchesDept =
      selectedDeptFilter === 'all' || s.studentProfile?.department === selectedDeptFilter;

    const matchesYear =
      selectedYearFilter === 'all' ||
      isStudentInCohortYear(s.studentProfile, selectedYearFilter);

    let matchesMentor = true;
    if (selectedMentorFilter !== 'all') {
      matchesMentor = (s.studentProfile?.mentorFaculty || '').toLowerCase().includes(selectedMentorFilter.toLowerCase());
    }

    return matchesSearch && matchesDept && matchesYear && matchesMentor;
  });

  // Ensure available dropdown list includes scoped/filtered students only
  const dropdownStudents = React.useMemo(() => {
    if (filteredStudents.length > 0) return filteredStudents;
    return scopedStudents;
  }, [filteredStudents, scopedStudents]);

  // Keep selectedRegisterNo synchronized without dropping selected student if they exist in scoped list
  React.useEffect(() => {
    if (dropdownStudents.length > 0) {
      const existsInDropdown = dropdownStudents.some(
        (s) => (s.studentProfile?.registerNumber || '').trim().toLowerCase() === (selectedRegisterNo || '').trim().toLowerCase()
      );
      if (!existsInDropdown) {
        setSelectedRegisterNo(dropdownStudents[0].studentProfile?.registerNumber || '');
      }
    }
  }, [dropdownStudents, selectedRegisterNo]);

  // Selected Student Record
  const currentStudent =
    dropdownStudents.find((s) => (s.studentProfile?.registerNumber || '').trim().toLowerCase() === (selectedRegisterNo || '').trim().toLowerCase()) ||
    dropdownStudents[0] ||
    scopedStudents[0] ||
    skillBankStudents[0];

  const defaultTotals = {
    d1: { attendanceCoins: 0, libraryCoins: 0, libraryUtilCoins: 0, feeCoins: 0, miniProjectCoins: 0, ictToolsCoins: 0, examCoins: 0, learnerCatCoins: 0, endSemCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false },
    d2: { nptelCoins: 0, leetCodeCoins: 0, onlineBasicCoins: 0, advancedCourseCoins: 0, paperCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false },
    d3: { aptitudeCoins: 0, resumeCoins: 0, mockInterviewCoins: 0, linkedInCoins: 0, gitHubCoins: 0, socialMediaCoins: 0, hackathonCoins: 0, internshipCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false },
    d4: { workshopCoins: 0, eventCoins: 0, volunteeringCoins: 0, membershipCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false },
    d5: { sportsCoins: 0, artsCoins: 0, clubCoins: 0, rawTotal: 0, cappedTotal: 0, isCapped: false },
    totalGrossEarned: 0,
    totalDeductions: 0,
    grandTotalNetCoins: 0,
    percentageOfTarget: 0,
  };

  const totals = currentStudent ? calculateStudentTotals(currentStudent) : defaultTotals;

  // Real-Time Skill Bank Validation Result
  const validationResult: SkillBankValidationResult | null = currentStudent
    ? validateSkillBankRecord(currentStudent, strictEnforcementMode)
    : null;

  // Excel Bulk File Upload Handler
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingExcel(true);
    setExcelImportStatus(null);
    try {
      const parsed = await parseExcelStudentFile(file);
      const formatted = parsed.map((st) => ({
        ...st,
        studentProfile: {
          ...st.studentProfile,
          mentorFaculty: st.studentProfile.mentorFaculty || selectedDefaultMentorForExcel,
        },
      }));
      setExcelPreviewStudents(formatted);
      setExcelImportStatus(`Parsed ${formatted.length} student record(s) from "${file.name}". Review below and confirm import.`);
    } catch (err) {
      console.error('Error reading excel file:', err);
      setExcelImportStatus('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleConfirmExcelImport = () => {
    if (excelPreviewStudents.length === 0) return;
    let addedCount = 0;
    excelPreviewStudents.forEach((st) => {
      addSkillBankStudent(st);
      addedCount++;
    });
    if (excelPreviewStudents[0]?.studentProfile.registerNumber) {
      setSelectedRegisterNo(excelPreviewStudents[0].studentProfile.registerNumber);
    }
    setExcelPreviewStudents([]);
    setIsExcelUploadModalOpen(false);
    setExcelImportStatus(null);
  };

  // Handle Sync to Google Sheets
  const handleSyncToSheets = async () => {
    await syncSkillBankToGoogleSheets();
  };

  // 5-Dimension Monitoring Sheet Upload Handler
  const handleMonitoringFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsImportingMonitoring(true);
    setMonitoringImportStatus(null);
    setMonitoringPreviewUpdated([]);
    setMonitoringPreviewCreated([]);
    try {
      const { updated, created } = await parseSkillBankMonitoringSheet(file, scopedStudents);
      setMonitoringPreviewUpdated(updated);
      setMonitoringPreviewCreated(created);
      setMonitoringImportStatus(
        `Parsed "${file.name}": ${updated.length} student record(s) will be UPDATED, ${created.length} new student account(s) will be CREATED.`
      );
    } catch (err) {
      console.error('Error reading 5D monitoring sheet:', err);
      setMonitoringImportStatus('Failed to parse monitoring sheet. Please use the downloaded 5D Sample Workbook (all 5 Dimension columns must match).');
    } finally {
      setIsImportingMonitoring(false);
    }
  };

  const handleDownload5DSampleSheet = () => {
    downloadSkillBankMonitoringSampleSheet(scopedStudents.length ? scopedStudents : skillBankStudents);
  };

  const handleConfirmMonitoringImport = () => {
    if (monitoringPreviewUpdated.length === 0 && monitoringPreviewCreated.length === 0) return;
    monitoringPreviewUpdated.forEach((st) => {
      updateSkillBankStudent(st.studentProfile.registerNumber, st);
    });
    monitoringPreviewCreated.forEach((st) => {
      addSkillBankStudent(st);
    });
    const firstReg = monitoringPreviewUpdated[0]?.studentProfile.registerNumber || monitoringPreviewCreated[0]?.studentProfile.registerNumber;
    if (firstReg) setSelectedRegisterNo(firstReg);
    setMonitoringPreviewUpdated([]);
    setMonitoringPreviewCreated([]);
    setIsMonitoringUploadModalOpen(false);
    setMonitoringImportStatus(null);
    alert(`✅ SSB 5D Monitoring updated: ${monitoringPreviewUpdated.length} updated, ${monitoringPreviewCreated.length} created. Re-open "Google Sheets Sync" to push the fresh matrix into Google Sheets.`);
  };

  // Quick Print Function for Skill Bank Passbook
  const handlePrintPassbook = () => {
    setIsPrintingPassbook(true);
    setTimeout(() => {
      window.print();
      setIsPrintingPassbook(false);
    }, 300);
  };

  // Reset current student to 0 default coins across all 5 dimensions
  const handleResetCoinsToZero = () => {
    if (!currentStudent) return;
    if (window.confirm(`Are you sure you want to reset ALL 5-Dimension Skill Bank coins to 0 for ${currentStudent.studentProfile.studentName}? (Mentor can add points afterwards)`)) {
      const freshZeroRecord = createDefaultStudentSkillBankRecord(currentStudent.studentProfile);
      updateSkillBankStudent(freshZeroRecord);
    }
  };

  const libChecklistData = currentStudent?.libraryChecklist || {
    min5BooksBorrowed: true,
    onTimeReturnVerified: true,
    referenceAndJournalsBorrowed: false,
    digitalLibraryAccess: false,
    bookReviewSubmitted: false,
    coinsEarned: 1500,
  };

  const handleLibraryChecklistToggle = (
    field: 'min5BooksBorrowed' | 'onTimeReturnVerified' | 'referenceAndJournalsBorrowed' | 'digitalLibraryAccess' | 'bookReviewSubmitted'
  ) => {
    if (!currentStudent) return;
    if (currentUser?.role !== 'librarian' && currentUser?.role !== 'admin' && currentUser?.role !== 'principal') {
      alert('🔒 DIM 4.2 & DIM 4.3 entries are managed exclusively by the Central Librarian. Mentors cannot modify these records.');
      return;
    }

    const updated = {
      ...libChecklistData,
      [field]: !libChecklistData[field],
    };

    let coins = 0;
    if (updated.min5BooksBorrowed) coins += 1000;
    if (updated.onTimeReturnVerified) coins += 500;
    if (updated.referenceAndJournalsBorrowed) coins += 500;
    if (updated.digitalLibraryAccess) coins += 500;
    if (updated.bookReviewSubmitted) coins += 500;

    updated.coinsEarned = Math.min(3000, coins);

    updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
      libraryChecklist: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Area Banner when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-passbook, #printable-passbook * {
            visibility: visible;
          }
          #printable-passbook {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30 text-amber-400 shrink-0 shadow-inner">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  AY 2026–2027 (Odd Semester)
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {dailyReport.collegeName || 'Sasurie College of Engineering (Autonomous)'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                Sasurie Skill Bank (SSB) — Grade Coin System
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Semester Target: <strong className="text-amber-300 font-bold">1,00,000 Grade Coins</strong> per student across 5 Dimensions of Excellence. Staff entry portal with hard-cap enforcement & disciplinary coin retraction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isHodOrPrincipal && (
              <button
                onClick={() => setIsExcelUploadModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                title="HOD Bulk Excel Sheet Student Upload"
              >
                <Upload className="w-4 h-4 text-emerald-100" />
                <span>Upload Excel Sheet (HOD)</span>
              </button>
            )}

            {isHodOrPrincipal && (
              <button
                onClick={handleDownload5DSampleSheet}
                className="px-3.5 py-2 bg-blue-800/90 hover:bg-blue-700 text-blue-100 rounded-xl text-xs font-bold border border-blue-700/80 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title="Download the 5-Dimension Skill Bank Monitoring sample workbook (name, department, year-wise, mentor + all 5 Dimension coin columns)"
              >
                <Download className="w-4 h-4 text-blue-300" />
                <span>Download 5D Sample Sheet</span>
              </button>
            )}

            {isHodOrPrincipal && (
              <button
                onClick={() => {
                  setMonitoringImportStatus(null);
                  setMonitoringPreviewUpdated([]);
                  setMonitoringPreviewCreated([]);
                  setIsMonitoringUploadModalOpen(true);
                }}
                className="px-3.5 py-2 bg-teal-700/90 hover:bg-teal-600 text-teal-100 rounded-xl text-xs font-bold border border-teal-700/80 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title="Upload the filled 5-Dimension monitoring workbook to update all students"
              >
                <FileUp className="w-4 h-4 text-teal-300" />
                <span>Upload 5D Monitoring Sheet</span>
              </button>
            )}

            {isHodOrPrincipal && (
              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700/80 shadow-md transition-all flex items-center gap-2 group cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Google Sheets Sync</span>
                {googleSheetsConfig.lastSyncedAt && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
                )}
              </button>
            )}

            <button
              onClick={handlePrintPassbook}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print SSB Passbook PDF</span>
            </button>
          </div>
        </div>
      </div>



      {/* Student Selector Bar & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name or reg no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Academic Year / Batch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Year:</span>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs font-bold bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Years</option>
              <option value="III Year">III Year (2023-2027)</option>
              <option value="II Year">II Year (2024-2028)</option>
              <option value="IV Year">IV Year (2022-2026)</option>
              <option value="I Year">I Year (2025-2029)</option>
            </select>
          </div>

          {/* Mentor Filter Dropdown (When in HOD mode) */}
          {userScopeMode === 'hod' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mentor:</span>
              <select
                value={selectedMentorFilter}
                onChange={(e) => setSelectedMentorFilter(e.target.value)}
                className="text-xs font-bold bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Mentors</option>
                <option value="Kaviyarasu">M. Kaviyarasu (III Year Mentor)</option>
                <option value="Karthikeyan">Dr. M. Karthikeyan (CSE Mentor)</option>
              </select>
            </div>
          )}

          {/* Skill Bank Category & Sub-Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCategoryFilter(val);
                if (val === 'hod_overview') setActiveMainTab('hod_overview');
                else if (val === 'profile') setActiveMainTab('profile');
                else if (
                  val.startsWith('dim1') ||
                  val === 'internal_exams' ||
                  val === 'learners' ||
                  val === 'semester' ||
                  val === 'end_semester' ||
                  val === 'class_attendance' ||
                  val === 'library' ||
                  val === 'fee_discipline' ||
                  val === 'ict_checklists'
                ) {
                  setActiveMainTab('dim1');
                } else if (
                  val.startsWith('dim2') ||
                  val === 'nptel' ||
                  val === 'leetcode' ||
                  val === 'certifications' ||
                  val === 'paper' ||
                  val === 'hackathon'
                ) {
                  setActiveMainTab('dim2');
                } else if (
                  val.startsWith('dim3') ||
                  val === 'placement' ||
                  val === 'internship' ||
                  val === 'resume'
                ) {
                  setActiveMainTab('dim3');
                } else if (val.startsWith('dim4') || val === 'cocurricular' || val === 'symposium') {
                  setActiveMainTab('dim4');
                } else if (val.startsWith('dim5') || val === 'sports' || val === 'talent' || val === 'higher_studies') {
                  setActiveMainTab('dim5');
                } else if (val === 'retraction') {
                  setActiveMainTab('retraction');
                } else if (val === 'journey') {
                  setActiveMainTab('journey');
                } else if (val === 'leaderboard') {
                  setActiveMainTab('leaderboard');
                }
              }}
              className="text-xs font-bold bg-transparent border-none focus:outline-none text-blue-900 dark:text-blue-200 cursor-pointer"
            >
              <option value="all">All Categories / Overview</option>
              <option value="profile">1. Student Profile</option>
              <optgroup label="Dimension 1: Academic Performance">
                <option value="class_attendance">4.1 Class Attendance</option>
                <option value="library">4.2 Central Library Utilization</option>
                <option value="fee_discipline">4.3 Fee Discipline & Guidelines</option>
                <option value="ict_checklists">4.4 Checklists / ICT Tools</option>
                <option value="internal_exams">4.5 Internal Exams (CIAT 1 & CIAT 2)</option>
                <option value="learners">4.6 Learner Category (Slow, Moderate, Fast)</option>
                <option value="semester">4.7 Semester Performance</option>
                <option value="end_semester">4.8 End Semester Exam Results</option>
              </optgroup>
              <optgroup label="Dimension 2: Skill & Certifications">
                <option value="nptel">NPTEL Courses</option>
                <option value="leetcode">LeetCode / Coding Practice</option>
                <option value="certifications">Online Certifications</option>
                <option value="paper">Paper Presentation / Journal</option>
                <option value="hackathon">Hackathons & Projects</option>
              </optgroup>
              <optgroup label="Dimension 3: Career Prep">
                <option value="placement">Placement Training</option>
                <option value="internship">Internships</option>
                <option value="resume">Resume & Portfolio</option>
              </optgroup>
              <optgroup label="Dimension 4: Co-Curricular">
                <option value="cocurricular">Club Activities & Symposiums</option>
              </optgroup>
              <optgroup label="Dimension 5: Talent & Sports">
                <option value="sports">Sports & Fine Arts</option>
                <option value="higher_studies">Higher Studies / Competitive Exams</option>
              </optgroup>
              <optgroup label="System / Discipline">
                <option value="retraction">Code of Conduct / Retraction</option>
                <option value="journey">Transformation Journey</option>
                <option value="leaderboard">Class Leaderboard</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:inline">
            Active Student:
          </label>
          <select
            value={selectedRegisterNo}
            onChange={(e) => setSelectedRegisterNo(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
          >
            {dropdownStudents.length === 0 ? (
              <option value="">No students found in this view filter</option>
            ) : (
              dropdownStudents.map((s) => (
                <option key={s.studentProfile.registerNumber} value={s.studentProfile.registerNumber}>
                  {s.studentProfile.registerNumber} - {s.studentProfile.studentName} ({s.studentProfile.batch || 'III Year'})
                </option>
              ))
            )}
          </select>

          {isHodOrPrincipal && (
            <button
              onClick={() => setIsExcelUploadModalOpen(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Upload Excel sheet to add multiple students"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Excel Bulk Import</span>
              <span className="sm:hidden">Excel</span>
            </button>
          )}

          {isHodOrPrincipal && (
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Student</span>
            </button>
          )}

          {isHodOrPrincipal && (
            <button
              onClick={() => {
                if (skillBankStudents.length === 0) {
                  alert('There are no student or Skill Bank records to delete.');
                  return;
                }
                if (window.confirm(`Are you sure you want to PERMANENTLY CLEAR ALL ${skillBankStudents.length} Skill Bank student records from the database? This will clear all data so HOD can enter fresh new student records.`)) {
                  clearAllSkillBankStudents();
                }
              }}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Clear all student records from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data ({skillBankStudents.length})</span>
            </button>
          )}

          {isHodOrPrincipal && selectedRegisterNo && (
            <button
              onClick={() => {
                const studentToDelete = skillBankStudents.find(
                  (s) => s.studentProfile.registerNumber === selectedRegisterNo
                );
                const name = studentToDelete?.studentProfile.studentName || selectedRegisterNo;
                if (window.confirm(`Are you sure you want to delete student "${name}" (${selectedRegisterNo}) from the database?`)) {
                  deleteSkillBankStudent(selectedRegisterNo);
                  setSelectedRegisterNo('');
                }
              }}
              className="px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Delete selected student record (HOD)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Student Header, Net Coins & Validation Engine (Staff Mentor Mode Only) */}
      {isStaff && currentStudent && (
        <>
          {/* Selected Student Active Profile Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-300/60 shrink-0">
                {currentStudent.studentProfile.studentName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{currentStudent.studentProfile.studentName}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Reg: {currentStudent.studentProfile.registerNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Acc: {currentStudent.studentProfile.skillBankAccountNo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentStudent.studentProfile.degreeBranch} • Section {currentStudent.studentProfile.section} • Batch {currentStudent.studentProfile.batch} • Mentor: {currentStudent.studentProfile.mentorFaculty}
                </p>
              </div>
            </div>

            {/* Total Grand Coins Badge */}
            <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-start">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Net Earned Grade Coins</div>
                <div className="text-xl font-black text-amber-400 flex items-center gap-1.5">
                  <span>{totals.grandTotalNetCoins.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-normal">/ 1,00,000</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block">
                  {totals.percentageOfTarget}% Target
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {totals.totalDeductions > 0 ? `-${totals.totalDeductions} Retracted` : 'Zero Violations'}
                </span>
              </div>
            </div>
          </div>

          {/* ----------------- REAL-TIME VALIDATION ENGINE STATUS & CAP CONTROL BAR ----------------- */}
          {validationResult && (
            <div
              className={`rounded-2xl p-4 border shadow-sm transition-all ${
                validationResult.isValid
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl border mt-0.5 ${
                      validationResult.isValid
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 animate-pulse text-rose-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider">
                        SSB Cap Validation Engine:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          validationResult.isValid
                            ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {validationResult.isValid
                          ? '✓ All Caps Compliant'
                          : `⚠️ Cap Threshold Alert (${validationResult.criticalAlertsCount} Exceeded)`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        Raw Total: {validationResult.totalRawEarned.toLocaleString()} Coins | Net Capped: {validationResult.totalCappedEarned.toLocaleString()} Coins
                      </span>
                      {validationResult.totalOverflowCoins > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-black">
                          +{validationResult.totalOverflowCoins.toLocaleString()} Raw Overflow Coins Truncated
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                      {validationResult.isValid
                        ? 'All student coin entries strictly obey 5-Dimension Hard Caps (40k Academic, 15k for Dim 2-5).'
                        : 'Data entry contains raw coins exceeding hard cap thresholds. Validation engine is enforcing caps automatically.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {/* Strict Mode Toggle */}
                  <button
                    onClick={() => setStrictEnforcementMode(!strictEnforcementMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      strictEnforcementMode
                        ? 'bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:border-slate-700'
                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                    }`}
                    title="Toggle Strict Cap Enforcement mode for mentor data entry"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{strictEnforcementMode ? 'Strict Auto-Clamp: ON' : 'Warning Audit: ON'}</span>
                  </button>

                  {/* Reset to 0 Coins Button */}
                  <button
                    onClick={handleResetCoinsToZero}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs border border-amber-500/30 shadow transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Reset all 5 dimension skill bank entries to 0 default coins"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Reset to 0 Coins</span>
                  </button>

                  {/* View Diagnostics Button */}
                  <button
                    onClick={() => setIsValidationDiagnosticsOpen(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Cap Diagnostics & Report</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top 5 Dimensions Weightage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Dim 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  Dimension 1 (40%)
                </span>
                {totals.d1.isCapped && (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                    Capped
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Academic Performance
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.d1.cappedTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 40,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totals.d1.cappedTotal / 40000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Dim 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Dimension 2 (15%)
                </span>
                {totals.d2.isCapped && (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                    Capped
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Skill & Certification
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.d2.cappedTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 15,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totals.d2.cappedTotal / 15000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Dim 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Dimension 3 (15%)
                </span>
                {totals.d3.isCapped && (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                    Capped
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Career Readiness
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.d3.cappedTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 15,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totals.d3.cappedTotal / 15000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Dim 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Dimension 4 (15%)
                </span>
                {totals.d4.isCapped && (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                    Capped
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Co-Curricular Track
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.d4.cappedTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 15,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totals.d4.cappedTotal / 15000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Dim 5 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  Dimension 5 (15%)
                </span>
                {totals.d5.isCapped && (
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                    Capped
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Extra-Curricular / Talent
              </h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.d5.cappedTotal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 15,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totals.d5.cappedTotal / 15000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {isHodOrPrincipal && (
            <button
              onClick={() => setActiveMainTab('hod_overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'hod_overview'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-950" />
              <span>HOD 5-Dim View (I-IV Year) &amp; Reports</span>
            </button>
          )}

          <button
            onClick={() => setActiveMainTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Student Profile</span>
          </button>

          {showDataEntryTabs && (
            <>
              <button
                onClick={() => setActiveMainTab('dim1')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'dim1'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Dim 1: Academic (40k)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('dim2')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'dim2'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Dim 2: Skill & Cert (15k)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('dim3')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'dim3'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Dim 3: Career Prep (15k)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('dim4')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'dim4'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Dim 4: Co-Curricular (15k)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('dim5')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'dim5'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dim 5: Talent & Sports (15k)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('retraction')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'retraction'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Code of Conduct / Retraction</span>
              </button>

              <button
                onClick={() => setActiveMainTab('journey')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === 'journey'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Transformation Logs</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveMainTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Class Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Display */}

      {/* ----------------- HOD EXECUTIVE 5-DIMENSION MONITORING TAB (I, II, III & IV YEAR) ----------------- */}
      {activeMainTab === 'hod_overview' && isHodOrPrincipal && (
        <div className="space-y-6">
          {/* HOD Banner & Policy Explanation */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800/60 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30 shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                      HOD Executive Oversight
                    </span>
                    <span className="text-xs text-indigo-200 font-bold">
                      No Data Entry Login Required For HOD
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Head of Department (HOD) 5-Dimension Skill Bank Monitoring
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                    Student-level data entry is managed directly by assigned Class Mentors and Course Instructors. The HOD maintains high-level supervisory access to monitor <strong>I YEAR, II YEAR, III YEAR, and IV YEAR</strong> across all 5 Dimensions and generate official <strong>Student-Wise SKILL BANK REPORTs</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const targetReg = selectedReportRegisterNo || currentStudent?.studentProfile?.registerNumber || scopedStudents[0]?.studentProfile?.registerNumber || '';
                    setSelectedReportRegisterNo(targetReg);
                    setIsStudentReportModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Take Student SKILL BANK REPORT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Year Filter Buttons (I YEAR, II YEAR, III YEAR, IV YEAR, ALL YEARS) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 shrink-0 mr-1">
                Select Year:
              </span>
              {(['all', 'I Year', 'II Year', 'III Year', 'IV Year'] as const).map((yr) => {
                const count = scopedStudents.filter((s) => isStudentInCohortYear(s.studentProfile, yr)).length;

                return (
                  <button
                    key={yr}
                    onClick={() => setHodYearFilterTab(yr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      hodYearFilterTab === yr
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{yr === 'all' ? 'ALL YEARS' : yr.toUpperCase()}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        hodYearFilterTab === yr ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white">{hodYearFilterTab === 'all' ? 'All Cohort Years' : hodYearFilterTab}</strong> 5-Dimension Overview
            </div>
          </div>

          {/* Year Cohort 5-Dimension Aggregate Cards */}
          {(() => {
            const cohortStudents = scopedStudents.filter((s) => isStudentInCohortYear(s.studentProfile, hodYearFilterTab));

            const cohortTotals = cohortStudents.map((s) => calculateStudentTotals(s));
            const totalCount = cohortTotals.length || 1;

            const avgD1 = Math.round(cohortTotals.reduce((acc, curr) => acc + curr.d1.cappedTotal, 0) / totalCount);
            const avgD2 = Math.round(cohortTotals.reduce((acc, curr) => acc + curr.d2.cappedTotal, 0) / totalCount);
            const avgD3 = Math.round(cohortTotals.reduce((acc, curr) => acc + curr.d3.cappedTotal, 0) / totalCount);
            const avgD4 = Math.round(cohortTotals.reduce((acc, curr) => acc + curr.d4.cappedTotal, 0) / totalCount);
            const avgD5 = Math.round(cohortTotals.reduce((acc, curr) => acc + curr.d5.cappedTotal, 0) / totalCount);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/40 shadow-sm">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase">
                    <span>Dim 1: Academic Track</span>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {avgD1.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 40,000</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Avg Academic Grade Coins ({Math.round((avgD1 / 40000) * 100)}% Cap)
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/40 shadow-sm">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase">
                    <span>Dim 2: Skill &amp; Cert</span>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {avgD2.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 15,000</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Avg Skill Cert Grade Coins ({Math.round((avgD2 / 15000) * 100)}% Cap)
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                    <span>Dim 3: Career &amp; Research</span>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {avgD3.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 15,000</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Avg Internship &amp; Paper Coins ({Math.round((avgD3 / 15000) * 100)}% Cap)
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/40 shadow-sm">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase">
                    <span>Dim 4: Co-Curricular</span>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {avgD4.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 15,000</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Avg Workshop &amp; VAC Coins ({Math.round((avgD4 / 15000) * 100)}% Cap)
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-purple-200 dark:border-purple-900/40 shadow-sm">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase">
                    <span>Dim 5: Sports &amp; Talent</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {avgD5.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 15,000</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Avg Sports &amp; Fine Arts Coins ({Math.round((avgD5 / 15000) * 100)}% Cap)
                  </div>
                </div>
              </div>
            );
          })()}

          {/* HOD Year-Wise Student 5-Dimension Master Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {hodYearFilterTab === 'all' ? 'All Cohort Years' : hodYearFilterTab} Student 5-Dimension Performance Matrix
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click "Skill Bank Report" on any student to generate and download their official 5-Dimension Grade Coin Report.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedReportRegisterNo(currentStudent?.studentProfile?.registerNumber || scopedStudents[0]?.studentProfile?.registerNumber || '');
                    setIsStudentReportModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Active Student Report</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Student Name &amp; Reg No</th>
                    <th className="p-3">Year / Batch</th>
                    <th className="p-3">Mentor</th>
                    <th className="p-3 text-center">Dim 1<br/><span className="text-[10px] font-normal text-slate-400">(40k Cap)</span></th>
                    <th className="p-3 text-center">Dim 2<br/><span className="text-[10px] font-normal text-slate-400">(15k Cap)</span></th>
                    <th className="p-3 text-center">Dim 3<br/><span className="text-[10px] font-normal text-slate-400">(15k Cap)</span></th>
                    <th className="p-3 text-center">Dim 4<br/><span className="text-[10px] font-normal text-slate-400">(15k Cap)</span></th>
                    <th className="p-3 text-center">Dim 5<br/><span className="text-[10px] font-normal text-slate-400">(15k Cap)</span></th>
                    <th className="p-3 text-center">Net Coins</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-right">HOD Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scopedStudents
                    .filter((s) => {
                      if (!s || !s.studentProfile) return false;
                      if (hodYearFilterTab === 'all') return true;
                      return isStudentInCohortYear(s.studentProfile, hodYearFilterTab);
                    })
                    .map((st) => {
                      const stTotals = calculateStudentTotals(st);
                      const isSelected = st.studentProfile.registerNumber === currentStudent?.studentProfile?.registerNumber;

                      let gradeBadge = 'A Grade';
                      let gradeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                      if (stTotals.grandTotalNetCoins >= 90000) {
                        gradeBadge = 'S Grade';
                        gradeColor = 'bg-purple-500/10 text-purple-600 border-purple-500/20 font-black';
                      } else if (stTotals.grandTotalNetCoins >= 80000) {
                        gradeBadge = 'A+ Grade';
                        gradeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold';
                      } else if (stTotals.grandTotalNetCoins >= 70000) {
                        gradeBadge = 'A Grade';
                        gradeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold';
                      } else if (stTotals.grandTotalNetCoins >= 60000) {
                        gradeBadge = 'B Grade';
                        gradeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold';
                      } else {
                        gradeBadge = 'C Grade';
                        gradeColor = 'bg-slate-500/10 text-slate-600 border-slate-500/20';
                      }

                      return (
                        <tr
                          key={st.studentProfile.registerNumber}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20 font-medium' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-black text-slate-900 dark:text-white">
                              {st.studentProfile.studentName}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              Reg: {st.studentProfile.registerNumber} • Acc: {st.studentProfile.skillBankAccountNo}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                            {st.studentProfile.batch || '2023-2027'}
                            <span className="block text-[10px] font-normal text-slate-400">{st.studentProfile.semester}</span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {st.studentProfile.mentorFaculty || 'Class Mentor'}
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {stTotals.d1.cappedTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {stTotals.d2.cappedTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {stTotals.d3.cappedTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                            {stTotals.d4.cappedTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400">
                            {stTotals.d5.cappedTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-black text-amber-600 dark:text-amber-400 text-sm">
                              {stTotals.grandTotalNetCoins.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">/ 1,00,000</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${gradeColor}`}>
                              {gradeBadge}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => {
                                setSelectedReportRegisterNo(st.studentProfile.registerNumber);
                                setIsStudentReportModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[11px] shadow-sm inline-flex items-center gap-1 cursor-pointer"
                              title="Generate Student Skill Bank Report PDF"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Skill Bank Report</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRegisterNo(st.studentProfile.registerNumber);
                                setActiveMainTab('profile');
                              }}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title="Inspect Full Profile"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Banner when Database is Empty and Student-specific Tab is Selected */}
      {['profile', 'dim1', 'dim2', 'dim3', 'dim4', 'dim5', 'retraction', 'journey'].includes(activeMainTab) && !currentStudent && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center shadow-sm my-6 space-y-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 dark:border-slate-700 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Student Skill Bank Data Available</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The Sasurie Skill Bank database is currently empty. Click <strong className="text-slate-900 dark:text-white">"Add Student"</strong> or <strong className="text-slate-900 dark:text-white">"Import Excel"</strong> above to enter fresh new student records.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isHodOrPrincipal && (
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            )}
            {isHodOrPrincipal && (
              <button
                onClick={() => setIsExcelUploadModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 1: STUDENT PROFILE MASTER ----------------- */}
      {activeMainTab === 'profile' && currentStudent && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Student Master Profile Record (One-time Setup)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Master identity details for Sasurie Skill Bank account holder.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-slate-700">
              Account No: {currentStudent.studentProfile.skillBankAccountNo}
            </span>
          </div>

          {/* Master Fields Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Holder Block */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                1. Account Holder Info
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-500">Student Name:</label>
                  <input
                    type="text"
                    value={currentStudent.studentProfile.studentName}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, studentName: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Register Number:</label>
                  <input
                    type="text"
                    value={currentStudent.studentProfile.registerNumber}
                    disabled
                    className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Degree & Branch:</label>
                  <input
                    type="text"
                    value={currentStudent.studentProfile.degreeBranch}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, degreeBranch: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-500">Batch:</label>
                    <input
                      type="text"
                      value={currentStudent.studentProfile.batch}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, batch: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500">Section:</label>
                    <input
                      type="text"
                      value={currentStudent.studentProfile.section}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, section: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Particulars */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                2. Personal Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-500">Gender:</label>
                    <select
                      value={currentStudent.studentProfile.gender}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, gender: e.target.value as any },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500">Blood Group:</label>
                    <input
                      type="text"
                      value={currentStudent.studentProfile.bloodGroup}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, bloodGroup: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Aadhaar No. (Masked):</label>
                  <input
                    type="text"
                    value={currentStudent.studentProfile.aadhaarNo}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, aadhaarNo: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Date of Birth:</label>
                  <input
                    type="date"
                    value={currentStudent.studentProfile.dateOfBirth}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, dateOfBirth: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-500">Mother Tongue:</label>
                    <input
                      type="text"
                      value={currentStudent.studentProfile.motherTongue}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, motherTongue: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-500">Nationality:</label>
                    <input
                      type="text"
                      value={currentStudent.studentProfile.nationality}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, nationality: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parent / Guardian & Career Goal */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                3. Parent Info & Career Goal
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-500">Father's Name & Mobile:</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="Father Name"
                      value={currentStudent.studentProfile.fatherName}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, fatherName: e.target.value },
                        })
                      }
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Father Mobile"
                      value={currentStudent.studentProfile.fatherMobile}
                      onChange={(e) =>
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          studentProfile: { ...currentStudent.studentProfile, fatherMobile: e.target.value },
                        })
                      }
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Dream Company:</label>
                  <input
                    type="text"
                    value={currentStudent.studentProfile.dreamCompany}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, dreamCompany: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Career Goal:</label>
                  <textarea
                    rows={2}
                    value={currentStudent.studentProfile.careerGoal}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        studentProfile: { ...currentStudent.studentProfile, careerGoal: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Signatures & Authorizations */}
          <div className="bg-blue-50/50 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs">
              <span className="font-black text-blue-900 dark:text-blue-300 uppercase block">
                Verification & Approval Status
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Official endorsement by Student, Faculty Mentor, and Head of Department.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={currentStudent.studentProfile.studentSigned}
                  onChange={(e) =>
                    updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                      studentProfile: {
                        ...currentStudent.studentProfile,
                        studentSigned: e.target.checked,
                        studentSignedDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Student Verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={currentStudent.studentProfile.mentorSigned}
                  onChange={(e) =>
                    updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                      studentProfile: {
                        ...currentStudent.studentProfile,
                        mentorSigned: e.target.checked,
                        mentorSignedDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Faculty Mentor Verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={currentStudent.studentProfile.hodSigned}
                  onChange={(e) =>
                    updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                      studentProfile: {
                        ...currentStudent.studentProfile,
                        hodSigned: e.target.checked,
                        hodSignedDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>HOD Verified</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: DIMENSION 1 — ACADEMIC PERFORMANCE (Cap 40k) ----------------- */}
      {activeMainTab === 'dim1' && currentStudent && (
        <div className="space-y-6">
          {/* Dimension 1 Cap Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-4 border border-blue-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-blue-300 tracking-wider">
                  Dimension 1: Academic Performance — Cap Enforcement (Max 40,000 Coins)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sub-categories: Class Attendance (8k) • Library (3.5k) • Fee Discipline (5k) • Checklists (5k) • Internal Exams (12k) • Learner Category (3k) • End Sem (8k)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-400">
                {totals.d1.cappedTotal.toLocaleString()} / 40,000 Capped Coins
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  totals.d1.rawTotal > 40000 ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-950 text-blue-200'
                }`}
              >
                {totals.d1.rawTotal > 40000
                  ? `Raw: ${totals.d1.rawTotal.toLocaleString()} (+${(totals.d1.rawTotal - 40000).toLocaleString()} Overflow Clamped)`
                  : `Raw: ${totals.d1.rawTotal.toLocaleString()} Coins`}
              </span>
            </div>
          </div>

          {/* 4.1 Class Attendance Block */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>4.1 Class Attendance (Max 8,000 Coins) — Month-wise Log</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rubric: 75–80% → 0 | 81–90% → 3,000 | 91–95% → 5,000 | &gt;95% → 8,000
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-black text-xs rounded-xl">
                Earned: {totals.d1.attendanceCoins.toLocaleString()} / 8,000
              </span>
            </div>

            {/* Semester Cumulative Attendance Summary Card */}
            {(() => {
              let totalWorkingDaysAllMonths = 0;
              let totalAttendedDaysAllMonths = 0;
              MONTH_LIST.forEach((m) => {
                const ent = currentStudent.attendanceMonths[m];
                if (ent) {
                  totalWorkingDaysAllMonths += ent.totalDays || 0;
                  totalAttendedDaysAllMonths += ent.daysAttended || 0;
                }
              });
              const overallSemesterPct = totalWorkingDaysAllMonths > 0
                ? Number(((totalAttendedDaysAllMonths / totalWorkingDaysAllMonths) * 100).toFixed(1))
                : 0;
              const overallSemesterCoins = calculateAttendanceCoins(overallSemesterPct);

              return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 block">
                        Semester Cumulative Attendance Summary (Logged Month-wise by Mentor)
                      </span>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Total Days Attended: <strong className="text-blue-700 dark:text-blue-400 font-bold">{totalAttendedDaysAllMonths} / {totalWorkingDaysAllMonths} Days</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Overall Semester %: <strong className={`font-black ${overallSemesterPct >= 95 ? 'text-emerald-600 dark:text-emerald-400' : overallSemesterPct >= 85 ? 'text-blue-600' : 'text-amber-600'}`}>{overallSemesterPct}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-500">Auto Evaluated Coins</div>
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {overallSemesterCoins.toLocaleString()} / 8,000 Coins
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {overallSemesterPct >= 95 ? '✓ >95% Band (Max 8,000 Coins)' : overallSemesterPct >= 91 ? '✓ 91–95% Band (5,000 Coins)' : overallSemesterPct >= 81 ? '✓ 81–90% Band (3,000 Coins)' : '75–80% (0 Coins)'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Attendance Month Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Month</th>
                    <th className="p-2.5">Total Working Days</th>
                    <th className="p-2.5">Days Attended</th>
                    <th className="p-2.5">Attendance %</th>
                    <th className="p-2.5">Remedial Days</th>
                    <th className="p-2.5">Semester Coins Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {MONTH_LIST.map((m) => {
                    const entry = currentStudent.attendanceMonths[m] || {
                      totalDays: 20,
                      daysAttended: 0,
                      attendancePct: 0,
                      additionalRemedialDays: 0,
                      coinsEarned: 0,
                    };

                    const handleAttendanceChange = (field: string, value: number) => {
                      const updatedEntry = { ...entry, [field]: value };
                      if (field === 'daysAttended' || field === 'totalDays') {
                        const total = field === 'totalDays' ? value : updatedEntry.totalDays;
                        const attended = field === 'daysAttended' ? value : updatedEntry.daysAttended;
                        const pct = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0;
                        updatedEntry.attendancePct = pct;
                        updatedEntry.coinsEarned = 0; // Total 8,000 coins is evaluated cumulatively for the semester, not per month
                      }

                      const updatedMonths = {
                        ...currentStudent.attendanceMonths,
                        [m]: updatedEntry,
                      };

                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        attendanceMonths: updatedMonths,
                      });
                    };

                    return (
                      <tr key={m} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-black text-slate-900 dark:text-white">{m} 2026</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={entry.totalDays}
                            onChange={(e) => handleAttendanceChange('totalDays', Number(e.target.value))}
                            className="w-20 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={entry.daysAttended}
                            onChange={(e) => handleAttendanceChange('daysAttended', Number(e.target.value))}
                            className="w-20 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                          />
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`font-black ${
                              entry.attendancePct >= 95
                                ? 'text-emerald-600'
                                : entry.attendancePct >= 85
                                ? 'text-blue-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {entry.attendancePct}%
                          </span>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={entry.additionalRemedialDays}
                            onChange={(e) =>
                              handleAttendanceChange('additionalRemedialDays', Number(e.target.value))
                            }
                            className="w-16 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                          />
                        </td>
                        <td className="p-2.5 text-xs text-slate-500 font-semibold">
                          Logged for Semester Total (Max 8,000)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4.2 Library & 4.3 Utilization (Read-only for Mentor - Updated by Librarian) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>4.2 Library Books Borrowing Checklist (Max 3,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Central Library verified borrowing criteria &amp; book log allocation.
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                    {totals.d1.libraryCoins.toLocaleString()} / 3,000 Coins
                  </span>
                </div>
              </div>

              {/* Librarian Access Permission Notice */}
              <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-bold text-teal-900 dark:text-teal-200 text-[11px]">
                    Updated by Library Login • Read-Only in Mentor SSB
                  </span>
                </div>
                {currentStudent.libraryChecklist?.updatedByLibrarian ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    ✓ Librarian Verified ({currentStudent.libraryChecklist?.librarianLastUpdatedDate || 'Updated'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Pending Library Verification
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Allocation Progress</span>
                  <span>{Math.round((totals.d1.libraryCoins / 3000) * 100)}% ({totals.d1.libraryCoins} / 3,000)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-600 to-amber-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (totals.d1.libraryCoins / 3000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Read-Only Verified Criteria List */}
              <div className="space-y-2 pt-1">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  libChecklistData.min5BooksBorrowed
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      1. Minimum 5 Books Borrowed per Semester
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Borrowed minimum 5 subject or reference books logged by Central Librarian.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {libChecklistData.min5BooksBorrowed ? (
                      <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        ✓ Verified (+1,000)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending (+0)
                      </span>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  libChecklistData.onTimeReturnVerified
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      2. On-Time Book Return Verification
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Returned all borrowed books on/before due date with zero fine penalties.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {libChecklistData.onTimeReturnVerified ? (
                      <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        ✓ Verified (+500)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending (+0)
                      </span>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  libChecklistData.referenceAndJournalsBorrowed
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      3. Reference Books &amp; Research Journals Borrowing
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Borrowed specialized reference volumes or IEEE journal prints.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {libChecklistData.referenceAndJournalsBorrowed ? (
                      <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        ✓ Verified (+500)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending (+0)
                      </span>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  libChecklistData.digitalLibraryAccess
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      4. Digital Library &amp; E-Resources Portal Access
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Logged into N-LIST, DELNET, IEEE Xplore, or NPTEL e-resources portal.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {libChecklistData.digitalLibraryAccess ? (
                      <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        ✓ Verified (+500)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending (+0)
                      </span>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  libChecklistData.bookReviewSubmitted
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      5. Book Review &amp; Abstract Summary Submitted
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Submitted a written book summary or critical review synopsis.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {libChecklistData.bookReviewSubmitted ? (
                      <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        ✓ Verified (+500)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending (+0)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Librarian Remark / Notes */}
              {currentStudent.libraryChecklist?.librarianNotes && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">Librarian Note: </span>
                  <span className="text-amber-800 dark:text-amber-300">{currentStudent.libraryChecklist.librarianNotes}</span>
                </div>
              )}

              {/* Logged Borrowed Books Log */}
              {currentStudent.libraryBooks.length > 0 && (
                <div className="pt-2 border-t dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Logged Books History ({currentStudent.libraryBooks.length}):
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold">Entered by Librarian</span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {currentStudent.libraryBooks.map((b) => (
                      <div key={b.id} className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{b.bookName}</p>
                          <p className="text-[10px] text-slate-400">By {b.author} • Issued: {b.issueDate}</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✓ Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                    4.3 Library Utilization (Max 500)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Central Library Gate Entry visits (20 coins / visit, cap 500).
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {totals.d1.libraryUtilCoins} Coins
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {currentStudent.libraryVisits.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No library gate entry visits logged by Central Librarian yet.
                  </div>
                ) : (
                  currentStudent.libraryVisits.map((v) => (
                    <div key={v.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex items-center justify-between border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Date: {v.date}</span>
                        <p className="text-[10px] text-slate-400">Time: {v.inTime} - {v.outTime}</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[10px]">
                        +20 Coins (Verified)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4.4 Fee Payment & 4.5 Mini Project / ICT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  4.4 Fee Payment (Max 5,000)
                </h4>
                <span className="text-xs font-bold text-amber-500">
                  {totals.d1.feeCoins} Coins
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-500">Payment Due Category:</label>
                  <select
                    value={currentStudent.feePayment.paymentBand}
                    onChange={(e) => {
                      const band = e.target.value as any;
                      let coins = 0;
                      if (band === 'before_due') coins = 5000;
                      else if (band === 'on_deadline') coins = 2000;
                      else if (band === 'with_fine') coins = 500;
                      if (currentStudent.feePayment.scholarshipReceived) coins += 1000;

                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        feePayment: {
                          ...currentStudent.feePayment,
                          paymentBand: band,
                          coinsEarned: coins,
                        },
                      });
                    }}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                  >
                    <option value="before_due">Before Due Date (21-07-2026) → 5,000 Coins</option>
                    <option value="on_deadline">On Deadline Date → 2,000 Coins</option>
                    <option value="with_fine">With Fine → 500 Coins</option>
                    <option value="after_30_days">After 30 Days → 0 Coins</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={currentStudent.feePayment.scholarshipReceived}
                      onChange={(e) => {
                        const rec = e.target.checked;
                        let coins = currentStudent.feePayment.coinsEarned;
                        if (rec) coins += 1000;
                        else coins = Math.max(0, coins - 1000);

                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          feePayment: {
                            ...currentStudent.feePayment,
                            scholarshipReceived: rec,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Scholarship Received (+1,000 Coins)</span>
                  </label>
                  <span className="font-black text-amber-500 text-sm">
                    {currentStudent.feePayment.coinsEarned} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* 4.5.2 ICT Tools Usage Checklist */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    4.5.2 ICT Tools Usage (Max 2,500) — Month-wise Mentor Entry
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Logged monthly for Google Classroom, online assignments &amp; engagement.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-500">
                  {totals.d1.ictToolsCoins} Coins
                </span>
              </div>

              {/* Month Selector Indicator for ICT Tools Monthly Log */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Logged Months:</span>
                </span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {MONTH_LIST.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-bold text-[10px]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { key: 'joiningClassroom', label: 'Joining Google Classroom / ERP (500)' },
                  { key: 'submittingAssignmentOnTime', label: 'Submitting Assignment On Time (500)' },
                  { key: 'completingQuizTest', label: 'Completing Online Quiz / Tests (500)' },
                  { key: 'activeParticipation', label: 'Active Forum Participation (500)' },
                  { key: 'disciplineEngagement', label: 'Discipline & Engagement (500)' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(currentStudent.ictToolsChecklist as any)[item.key]}
                        onChange={(e) => {
                          const updated = {
                            ...currentStudent.ictToolsChecklist,
                            [item.key]: e.target.checked,
                          };
                          let sum = 0;
                          if (updated.joiningClassroom) sum += 500;
                          if (updated.submittingAssignmentOnTime) sum += 500;
                          if (updated.completingQuizTest) sum += 500;
                          if (updated.activeParticipation) sum += 500;
                          if (updated.disciplineEngagement) sum += 500;
                          updated.coinsEarned = sum;

                          updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                            ictToolsChecklist: updated,
                          });
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-400">+500</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 4.5 Internal Exams Performance (CIAT 1 & CIAT 2) — Max 12,000 Coins */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>4.5 Internal Exams Performance (CIAT 1 &amp; CIAT 2) — Mentor Data Entry (Max 12,000 Coins)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enter CIAT-1, CIAT-2 exam performance, attendance &amp; subject marks breakdown.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Populate initial marks from scopedStudents
                    const initialMarks: Record<string, number> = {};
                    scopedStudents.forEach((st) => {
                      const sub = (st.subjectMarkDetails || []).find(
                        (s) => s.subjectCode.toUpperCase() === batchSubjectCode.toUpperCase()
                      );
                      initialMarks[st.studentProfile.registerNumber] =
                        batchCiatExam === 'CIAT 1' ? sub?.ciat1Marks || 0 : sub?.ciat2Marks || 0;
                    });
                    setBatchStudentMarks(initialMarks);
                    setIsBatchCiatModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>⚡ Batch Class CIAT Entry</span>
                </button>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 font-black text-xs rounded-xl border border-purple-200 dark:border-purple-800">
                  Earned: {totals.d1.examCoins.toLocaleString()} / 12,000 Coins
                </span>
              </div>
            </div>

            {/* Exam Summary Controls */}
            {(() => {
              const ep = currentStudent.examPerformance || {
                ciat1Appeared: true,
                ciat1Pct: 85,
                ciat2Appeared: true,
                ciat2Pct: 88,
                endSemAllPass: true,
                arrearCount: 0,
                coinsEarned: 10000,
              };

              const updateSubjectMarksAndAutoCalcAggregates = (updatedSubjects: SubjectMarkDetail[]) => {
                let calcCiat1Avg = ep.ciat1Pct;
                let calcCiat2Avg = ep.ciat2Pct;

                if (updatedSubjects.length > 0) {
                  const sum1 = updatedSubjects.reduce((acc, s) => acc + (Number(s.ciat1Marks) || 0), 0);
                  const sum2 = updatedSubjects.reduce((acc, s) => acc + (Number(s.ciat2Marks) || 0), 0);
                  calcCiat1Avg = Math.round(sum1 / updatedSubjects.length);
                  calcCiat2Avg = Math.round(sum2 / updatedSubjects.length);
                }

                let coins = 0;
                if (ep.ciat1Appeared) {
                  if (calcCiat1Avg >= 90) coins += 5000;
                  else if (calcCiat1Avg >= 80) coins += 4000;
                  else if (calcCiat1Avg >= 70) coins += 3000;
                  else if (calcCiat1Avg >= 60) coins += 2000;
                  else if (calcCiat1Avg > 0) coins += 1000;
                }
                if (ep.ciat2Appeared) {
                  if (calcCiat2Avg >= 90) coins += 5000;
                  else if (calcCiat2Avg >= 80) coins += 4000;
                  else if (calcCiat2Avg >= 70) coins += 3000;
                  else if (calcCiat2Avg >= 60) coins += 2000;
                  else if (calcCiat2Avg > 0) coins += 1000;
                }
                if (ep.ciat1Appeared && ep.ciat2Appeared && (ep.arrearCount === 0 || ep.endSemAllPass)) {
                  coins += 2000;
                }

                const updatedEp = {
                  ...ep,
                  ciat1Pct: calcCiat1Avg,
                  ciat2Pct: calcCiat2Avg,
                  coinsEarned: Math.min(12000, coins),
                };

                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  subjectMarkDetails: updatedSubjects,
                  examPerformance: updatedEp,
                });
              };

              const handleExamPerfUpdate = (field: string, value: any) => {
                const updated = { ...ep, [field]: value };
                let coins = 0;
                if (updated.ciat1Appeared) {
                  if (updated.ciat1Pct >= 90) coins += 5000;
                  else if (updated.ciat1Pct >= 80) coins += 4000;
                  else if (updated.ciat1Pct >= 70) coins += 3000;
                  else if (updated.ciat1Pct >= 60) coins += 2000;
                  else if (updated.ciat1Pct > 0) coins += 1000;
                }
                if (updated.ciat2Appeared) {
                  if (updated.ciat2Pct >= 90) coins += 5000;
                  else if (updated.ciat2Pct >= 80) coins += 4000;
                  else if (updated.ciat2Pct >= 70) coins += 3000;
                  else if (updated.ciat2Pct >= 60) coins += 2000;
                  else if (updated.ciat2Pct > 0) coins += 1000;
                }
                if (updated.ciat1Appeared && updated.ciat2Appeared && (updated.arrearCount === 0 || updated.endSemAllPass)) {
                  coins += 2000;
                }
                updated.coinsEarned = Math.min(12000, coins);

                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  examPerformance: updated,
                });
              };

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ep.ciat1Appeared}
                          onChange={(e) => handleExamPerfUpdate('ciat1Appeared', e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>CIAT-1 Appeared</span>
                      </label>
                      <p className="text-[10px] text-slate-400">Exam attendance status</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CIAT-1 Aggregate %
                        </label>
                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                          ⚡ Auto Calc
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ep.ciat1Pct}
                        onChange={(e) => handleExamPerfUpdate('ciat1Pct', Number(e.target.value))}
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ep.ciat2Appeared}
                          onChange={(e) => handleExamPerfUpdate('ciat2Appeared', e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>CIAT-2 Appeared</span>
                      </label>
                      <p className="text-[10px] text-slate-400">Exam attendance status</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CIAT-2 Aggregate %
                        </label>
                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                          ⚡ Auto Calc
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ep.ciat2Pct}
                        onChange={(e) => handleExamPerfUpdate('ciat2Pct', Number(e.target.value))}
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ep.endSemAllPass}
                          onChange={(e) => handleExamPerfUpdate('endSemAllPass', e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>All Pass Status</span>
                      </label>
                      <p className="text-[10px] text-slate-400">+2k Model Exam Bonus</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Standing Arrears
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={ep.arrearCount}
                        onChange={(e) => handleExamPerfUpdate('arrearCount', Number(e.target.value))}
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Subject Wise Marks Entry Table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        <span>Subject-wise Marks Breakdown:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const subjects = currentStudent.subjectMarkDetails || [];
                          const newSub = {
                            id: `SM-${Date.now()}`,
                            subjectCode: `CS${3000 + subjects.length + 1}`,
                            subjectName: 'New Subject',
                            ciat1Marks: 80,
                            ciat2Marks: 85,
                            assignment1Marks: 10,
                            assignment2Marks: 10,
                            modelLabMarks: 90,
                          };
                          updateSubjectMarksAndAutoCalcAggregates([...subjects, newSub]);
                        }}
                        className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Subject</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-2">Code</th>
                            <th className="p-2">Subject Name</th>
                            <th className="p-2">CIAT-1 (/100)</th>
                            <th className="p-2">CIAT-2 (/100)</th>
                            <th className="p-2">Assgn 1 (/10)</th>
                            <th className="p-2">Assgn 2 (/10)</th>
                            <th className="p-2">Model Lab (/100)</th>
                            <th className="p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {(currentStudent.subjectMarkDetails || []).map((sub, idx) => (
                            <tr key={sub.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={sub.subjectCode}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, subjectCode: e.target.value };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-20 p-1 bg-white dark:bg-slate-900 border rounded font-mono uppercase text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={sub.subjectName}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, subjectName: e.target.value };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-full min-w-[140px] p-1 bg-white dark:bg-slate-900 border rounded font-semibold text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sub.ciat1Marks}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, ciat1Marks: Number(e.target.value) };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sub.ciat2Marks}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, ciat2Marks: Number(e.target.value) };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={sub.assignment1Marks}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, assignment1Marks: Number(e.target.value) };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-14 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={sub.assignment2Marks}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, assignment2Marks: Number(e.target.value) };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-14 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sub.modelLabMarks}
                                  onChange={(e) => {
                                    const updated = [...(currentStudent.subjectMarkDetails || [])];
                                    updated[idx] = { ...sub, modelLabMarks: Number(e.target.value) };
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (currentStudent.subjectMarkDetails || []).filter((_, i) => i !== idx);
                                    updateSubjectMarksAndAutoCalcAggregates(updated);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Delete subject"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(currentStudent.subjectMarkDetails || []).length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-3 text-center text-slate-400 italic text-[11px]">
                                No subject mark details logged yet. Click "+ Add Subject" to begin entering marks.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 4.6 Learner Category (Slow, Moderate, Fast) & 4.7 End Semester Exam Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 4.6 Learner Category (Max 3,000 Coins) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>4.6 Learner Category — Mentor Entry (Max 3,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Classification based on CIAT performance &amp; remedial class attendance.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {totals.d1.learnerCatCoins} / 3,000 Coins
                </span>
              </div>

              {(() => {
                const lc = currentStudent.learnerCategory || {
                  ciat1Category: 'Moderate',
                  ciat2Category: 'Fast',
                  remedialAttendancePct: 92,
                  remedialBonusEarned: false,
                  coinsEarned: 2500,
                };

                const handleLearnerCatUpdate = (field: string, value: any) => {
                  const updated = { ...lc, [field]: value };
                  let coins = 0;
                  if (updated.ciat1Category === 'Fast' && updated.ciat2Category === 'Fast') {
                    coins = 3000;
                  } else if (updated.ciat1Category === 'Moderate' || updated.ciat2Category === 'Moderate') {
                    coins = 1500;
                    if (updated.remedialAttendancePct >= 90) coins += 1000;
                  } else {
                    coins = 1000;
                    if (updated.remedialAttendancePct >= 90) coins += 1000;
                  }
                  if (updated.remedialBonusEarned) {
                    coins += 1500;
                  }
                  updated.coinsEarned = Math.min(3000, coins);

                  updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                    learnerCategory: updated,
                  });
                };

                return (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CIAT-1 Learner Band
                        </label>
                        <select
                          value={lc.ciat1Category}
                          onChange={(e) => handleLearnerCatUpdate('ciat1Category', e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                        >
                          <option value="Slow">Slow Learner (&lt;60%)</option>
                          <option value="Moderate">Moderate Learner (60-79%)</option>
                          <option value="Fast">Fast Learner (&ge;80%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CIAT-2 Learner Band
                        </label>
                        <select
                          value={lc.ciat2Category}
                          onChange={(e) => handleLearnerCatUpdate('ciat2Category', e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                        >
                          <option value="Slow">Slow Learner (&lt;60%)</option>
                          <option value="Moderate">Moderate Learner (60-79%)</option>
                          <option value="Fast">Fast Learner (&ge;80%)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Remedial Class Attendance %
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={lc.remedialAttendancePct}
                        onChange={(e) => handleLearnerCatUpdate('remedialAttendancePct', Number(e.target.value))}
                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                      />
                    </div>

                    <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={lc.remedialBonusEarned}
                          onChange={(e) => handleLearnerCatUpdate('remedialBonusEarned', e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-semibold text-[11px]">Remedial Improvement Bonus (&ge;95% Remedial)</span>
                      </div>
                      <span className="font-black text-amber-600">+1,500</span>
                    </label>
                  </div>
                );
              })()}
            </div>

            {/* 4.7 End Semester Exam Results (Max 8,000 Coins) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>4.7 End Semester Exam Results — Mentor Entry (Max 8,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Semester pass status, standing arrears, GPA/CGPA &amp; subject grade logging.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                  {totals.d1.endSemCoins} / 8,000 Coins
                </span>
              </div>

              {(() => {
                const es = currentStudent.endSemResults || {
                  allPass: true,
                  arrearsCount: 0,
                  gpa: 8.5,
                  cgpa: 8.4,
                  coinsEarned: 5000,
                  examSession: 'Nov/Dec 2025',
                  publishedDate: '2026-02-15',
                  marksheetVerifiedByMentor: true,
                  subjectGrades: [],
                };

                const subjectGradesList = es.subjectGrades || [
                  { id: 'ES-1', subjectCode: 'CS3401', subjectName: 'Algorithms & Data Structures', grade: 'O', credits: 4, resultStatus: 'PASS' },
                  { id: 'ES-2', subjectCode: 'CS3402', subjectName: 'Database Management Systems', grade: 'A+', credits: 3, resultStatus: 'PASS' },
                  { id: 'ES-3', subjectCode: 'CS3403', subjectName: 'Operating Systems', grade: 'A', credits: 3, resultStatus: 'PASS' },
                ];

                const handleEndSemUpdate = (field: string, value: any) => {
                  const updated = { ...es, subjectGrades: subjectGradesList, [field]: value };
                  let coins = 0;
                  if (updated.allPass && updated.arrearsCount === 0) {
                    coins += 5000;
                  }
                  if (updated.gpa >= 9.0) coins += 3000;
                  else if (updated.gpa >= 8.0) coins += 2000;
                  else if (updated.gpa >= 7.0) coins += 1000;

                  if (updated.arrearsCount > 0) {
                    coins = Math.max(0, coins - updated.arrearsCount * 1000);
                  }
                  updated.coinsEarned = Math.min(8000, coins);

                  updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                    endSemResults: updated,
                  });
                };

                const updateGradesAndRecalculate = (newList: any[]) => {
                  const failCount = newList.filter(
                    (sg) => sg.grade === 'RA' || sg.grade === 'AB' || sg.resultStatus === 'FAIL' || sg.resultStatus === 'ABSENT'
                  ).length;
                  const autoAllPass = failCount === 0;

                  const updated = {
                    ...es,
                    subjectGrades: newList,
                    arrearsCount: failCount,
                    allPass: autoAllPass,
                  };

                  let coins = 0;
                  if (updated.allPass && updated.arrearsCount === 0) {
                    coins += 5000;
                  }
                  if (updated.gpa >= 9.0) coins += 3000;
                  else if (updated.gpa >= 8.0) coins += 2000;
                  else if (updated.gpa >= 7.0) coins += 1000;

                  if (updated.arrearsCount > 0) {
                    coins = Math.max(0, coins - updated.arrearsCount * 1000);
                  }
                  updated.coinsEarned = Math.min(8000, coins);

                  updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                    endSemResults: updated,
                  });
                };

                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Exam Session / Month
                        </label>
                        <input
                          type="text"
                          value={es.examSession || 'Nov/Dec 2025'}
                          onChange={(e) => handleEndSemUpdate('examSession', e.target.value)}
                          placeholder="e.g., Nov/Dec 2025"
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Published Date
                        </label>
                        <input
                          type="date"
                          value={es.publishedDate || ''}
                          onChange={(e) => handleEndSemUpdate('publishedDate', e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700/80 w-full h-[38px]">
                          <input
                            type="checkbox"
                            checked={!!es.marksheetVerifiedByMentor}
                            onChange={(e) => handleEndSemUpdate('marksheetVerifiedByMentor', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            Verified with Mark Sheet
                          </span>
                        </label>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={es.allPass}
                          onChange={(e) => handleEndSemUpdate('allPass', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="font-bold">Passed All Subjects in First Attempt</span>
                      </div>
                      <span className="font-black text-indigo-600">+5,000</span>
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Arrears Count
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={es.arrearsCount}
                          onChange={(e) => handleEndSemUpdate('arrearsCount', Number(e.target.value))}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          GPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={10}
                          value={es.gpa}
                          onChange={(e) => handleEndSemUpdate('gpa', Number(e.target.value))}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CGPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={10}
                          value={es.cgpa}
                          onChange={(e) => handleEndSemUpdate('cgpa', Number(e.target.value))}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* End Semester Subject-wise Grades Entry Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>End Semester Subject Grade Entries (Mentor Entry):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSubGrade = {
                              id: `ESG-${Date.now()}`,
                              subjectCode: `CS340${subjectGradesList.length + 1}`,
                              subjectName: 'New End Sem Subject',
                              grade: 'A',
                              credits: 3,
                              resultStatus: 'PASS',
                            };
                            updateGradesAndRecalculate([...subjectGradesList, newSubGrade]);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Subject Grade</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                              <th className="p-2">Subject Code</th>
                              <th className="p-2">Subject Name</th>
                              <th className="p-2">Credits</th>
                              <th className="p-2">Grade</th>
                              <th className="p-2">Result</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {subjectGradesList.map((sg: any, idx: number) => (
                              <tr key={sg.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={sg.subjectCode}
                                    onChange={(e) => {
                                      const updated = [...subjectGradesList];
                                      updated[idx] = { ...sg, subjectCode: e.target.value };
                                      updateGradesAndRecalculate(updated);
                                    }}
                                    className="w-24 p-1 bg-white dark:bg-slate-900 border rounded font-mono uppercase text-[11px]"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={sg.subjectName}
                                    onChange={(e) => {
                                      const updated = [...subjectGradesList];
                                      updated[idx] = { ...sg, subjectName: e.target.value };
                                      updateGradesAndRecalculate(updated);
                                    }}
                                    className="w-full min-w-[160px] p-1 bg-white dark:bg-slate-900 border rounded font-semibold text-[11px]"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={sg.credits || 3}
                                    onChange={(e) => {
                                      const updated = [...subjectGradesList];
                                      updated[idx] = { ...sg, credits: Number(e.target.value) };
                                      updateGradesAndRecalculate(updated);
                                    }}
                                    className="w-14 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={sg.grade}
                                    onChange={(e) => {
                                      const newGrade = e.target.value;
                                      const newRes = (newGrade === 'RA' || newGrade === 'AB') ? 'FAIL' : 'PASS';
                                      const updated = [...subjectGradesList];
                                      updated[idx] = { ...sg, grade: newGrade, resultStatus: newRes };
                                      updateGradesAndRecalculate(updated);
                                    }}
                                    className="p-1 bg-white dark:bg-slate-900 border rounded font-bold text-center"
                                  >
                                    <option value="O">O (Outstanding)</option>
                                    <option value="A+">A+ (Excellent)</option>
                                    <option value="A">A (Very Good)</option>
                                    <option value="B+">B+ (Good)</option>
                                    <option value="B">B (Average)</option>
                                    <option value="C">C (Satisfactory)</option>
                                    <option value="RA">RA (Re-Appear)</option>
                                    <option value="AB">AB (Absent)</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <span
                                    className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                      sg.resultStatus === 'PASS' || (sg.grade !== 'RA' && sg.grade !== 'AB')
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}
                                  >
                                    {sg.grade === 'RA' || sg.grade === 'AB' ? 'FAIL / ARREAR' : 'PASS'}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = subjectGradesList.filter((_: any, i: number) => i !== idx);
                                      updateGradesAndRecalculate(updated);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Delete subject grade"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {subjectGradesList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-3 text-center text-slate-400 italic text-[11px]">
                                  No subject grades logged yet. Click "+ Add Subject Grade" to enter mentor grade entry.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: DIMENSION 2 — SKILL DEVELOPMENT (Cap 15k) ----------------- */}
      {activeMainTab === 'dim2' && currentStudent && (
        <div className="space-y-6">
          {/* Dimension 2 Cap Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 border border-indigo-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                  Dimension 2: Skill Development & Certification Track — Cap Enforcement (Max 15,000 Coins)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sub-categories: NPTEL/MOOC (3k) • LeetCode Practice (2k) • Basic Certifications (1k) • Advanced Courses (2k) • Paper Presentations (2k)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-400">
                {totals.d2.cappedTotal.toLocaleString()} / 15,000 Capped Coins
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  totals.d2.rawTotal > 15000 ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-950 text-indigo-200'
                }`}
              >
                {totals.d2.rawTotal > 15000
                  ? `Raw: ${totals.d2.rawTotal.toLocaleString()} (+${(totals.d2.rawTotal - 15000).toLocaleString()} Overflow Clamped)`
                  : `Raw: ${totals.d2.rawTotal.toLocaleString()} Coins`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 5.1 NPTEL / MOOC / Swayam (Max 3,000 Coins) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>5.1 NPTEL / MOOC / Swayam (Max 3,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Registration (500) | Weekly Tests (500) | Exam Applied (500) | Result: Pass (500) - Gold (1,500)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d2.nptelCoins.toLocaleString()} Coins
                </span>
              </div>

              {/* Data Entry Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.nptelMonths.Jul.registrationDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const prev = currentStudent.nptelMonths.Jul;
                        const coins = (checked ? 500 : 0) + (prev.weeklyTestsDone ? 500 : 0) + (prev.examApplied ? 500 : 0) + (prev.resultStatus === 'Gold' ? 1500 : prev.resultStatus === 'Elite' ? 1000 : prev.resultStatus === 'Pass' ? 500 : 0);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          nptelMonths: {
                            ...currentStudent.nptelMonths,
                            Jul: { ...prev, registrationDone: checked, coinsEarned: coins },
                          },
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-bold">Course Registration Completed</span>
                  </div>
                  <span className="text-emerald-600 font-black">+500 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.nptelMonths.Jul.weeklyTestsDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const prev = currentStudent.nptelMonths.Jul;
                        const coins = (prev.registrationDone ? 500 : 0) + (checked ? 500 : 0) + (prev.examApplied ? 500 : 0) + (prev.resultStatus === 'Gold' ? 1500 : prev.resultStatus === 'Elite' ? 1000 : prev.resultStatus === 'Pass' ? 500 : 0);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          nptelMonths: {
                            ...currentStudent.nptelMonths,
                            Jul: { ...prev, weeklyTestsDone: checked, coinsEarned: coins },
                          },
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-bold">Weekly Assignment Tests Submitted</span>
                  </div>
                  <span className="text-emerald-600 font-black">+500 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.nptelMonths.Jul.examApplied}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const prev = currentStudent.nptelMonths.Jul;
                        const coins = (prev.registrationDone ? 500 : 0) + (prev.weeklyTestsDone ? 500 : 0) + (checked ? 500 : 0) + (prev.resultStatus === 'Gold' ? 1500 : prev.resultStatus === 'Elite' ? 1000 : prev.resultStatus === 'Pass' ? 500 : 0);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          nptelMonths: {
                            ...currentStudent.nptelMonths,
                            Jul: { ...prev, examApplied: checked, coinsEarned: coins },
                          },
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-bold">Proctored Exam Applied / Hall Ticket</span>
                  </div>
                  <span className="text-emerald-600 font-black">+500 Coins</span>
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Certification Grade/Result:</span>
                  <select
                    value={currentStudent.nptelMonths.Jul.resultStatus}
                    onChange={(e) => {
                      const res = e.target.value as any;
                      const prev = currentStudent.nptelMonths.Jul;
                      let addRes = 0;
                      if (res === 'Gold') addRes = 1500;
                      else if (res === 'Elite') addRes = 1000;
                      else if (res === 'Silver') addRes = 750;
                      else if (res === 'Pass') addRes = 500;

                      const coins = (prev.registrationDone ? 500 : 0) + (prev.weeklyTestsDone ? 500 : 0) + (prev.examApplied ? 500 : 0) + addRes;
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        nptelMonths: {
                          ...currentStudent.nptelMonths,
                          Jul: { ...prev, resultStatus: res, coinsEarned: coins },
                        },
                      });
                    }}
                    className="p-1.5 bg-white dark:bg-slate-900 border rounded-lg font-bold text-xs"
                  >
                    <option value="None">None (0)</option>
                    <option value="Pass">Pass (+500)</option>
                    <option value="Silver">Silver (+750)</option>
                    <option value="Elite">Elite (+1,000)</option>
                    <option value="Gold">Gold (+1,500)</option>
                  </select>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>NPTEL Certificate & Hallticket Proof</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ Verified by Mentor
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      NPTEL_Certificate_{currentStudent.studentProfile.registerNumber}_Jul2026.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '5.1 NPTEL / MOOC Certificate Proof',
                          category: 'Dimension 2: Skill Development',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `NPTEL_Certificate_${currentStudent.studentProfile.registerNumber}_Jul2026.pdf`,
                          uploadDate: 'July 18, 2026 10:30 AM',
                          status: 'Verified',
                          verifiedBy: currentStudent.studentProfile.mentorFaculty || 'M. Kaviyarasu',
                          coinsEarned: totals.d2.nptelCoins,
                          platform: 'NPTEL / Swayam National Portal',
                          remarks: 'Proctored Exam Gold Medalist Grade Score (88%)',
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Upload new proof file">
                      <FileUp className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded new NPTEL certificate proof: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 5.2 LeetCode Coding Platform (Max 2,000 Coins) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" />
                    <span>5.2 LeetCode Coding Practice (Max 2,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Monthly Task Completed (1,000) + Attendance/Solving Band (Up to 1,000)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d2.leetCodeCoins.toLocaleString()} Coins
                </span>
              </div>

              {/* Data Entry Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.leetCodeMonths.Jul.taskCompleted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const prev = currentStudent.leetCodeMonths.Jul;
                        let bandCoins = 1000;
                        if (prev.attendanceBand === '70-79%') bandCoins = 500;
                        if (prev.attendanceBand === '60-69%') bandCoins = 250;
                        if (prev.attendanceBand === '<60%') bandCoins = 0;
                        const coins = (checked ? 1000 : 0) + bandCoins;

                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          leetCodeMonths: {
                            ...currentStudent.leetCodeMonths,
                            Jul: { ...prev, taskCompleted: checked, coinsEarned: coins },
                          },
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-bold">Monthly Coding Target Completed</span>
                  </div>
                  <span className="text-emerald-600 font-black">+1,000 Coins</span>
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">LeetCode Solved / Attendance Band:</span>
                  <select
                    value={currentStudent.leetCodeMonths.Jul.attendanceBand}
                    onChange={(e) => {
                      const band = e.target.value as any;
                      const prev = currentStudent.leetCodeMonths.Jul;
                      let bandCoins = 1000;
                      if (band === '70-79%') bandCoins = 500;
                      if (band === '60-69%') bandCoins = 250;
                      if (band === '<60%') bandCoins = 0;
                      const coins = (prev.taskCompleted ? 1000 : 0) + bandCoins;

                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        leetCodeMonths: {
                          ...currentStudent.leetCodeMonths,
                          Jul: { ...prev, attendanceBand: band, coinsEarned: coins },
                        },
                      });
                    }}
                    className="p-1.5 bg-white dark:bg-slate-900 border rounded-lg font-bold text-xs"
                  >
                    <option value="90%+">90%+ Band (+1,000)</option>
                    <option value="70-79%">70-79% Band (+500)</option>
                    <option value="60-69%">60-69% Band (+250)</option>
                    <option value="<60%">&lt;60% Band (0)</option>
                  </select>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">LeetCode Handle:</span>
                  <input
                    type="text"
                    defaultValue={`leetcode.com/u/${(currentStudent?.studentProfile?.registerNumber || '').toLowerCase()}`}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border rounded text-[11px] font-mono font-bold w-48 text-right"
                  />
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>LeetCode Profile & Monthly Streak Screenshot</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      LeetCode_Jul2026_StreakProof_{currentStudent.studentProfile.registerNumber}.png
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '5.2 LeetCode Monthly Streak Proof',
                          category: 'Dimension 2: Skill Development',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `LeetCode_Jul2026_StreakProof_${currentStudent.studentProfile.registerNumber}.png`,
                          uploadDate: 'July 25, 2026 04:15 PM',
                          status: 'Verified',
                          verifiedBy: currentStudent.studentProfile.mentorFaculty || 'M. Kaviyarasu',
                          coinsEarned: totals.d2.leetCodeCoins,
                          platform: 'LeetCode Coding Platform',
                          remarks: 'Verified 120+ Problems Solved in July Streak',
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Upload new streak screenshot">
                      <FileUp className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded new LeetCode proof: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5.3 Basic Online Certifications (<15 Hrs) (Max 1,000 Coins) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span>5.3 Basic Online Certifications (&lt;15 Hrs Duration) (Max 1,000 Coins)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Infosys Springboard, Coursera, Udemy, NASSCOM, SkillRack, IBM (+100 Coins per verified course)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d2.onlineBasicCoins.toLocaleString()} / 1,000 Coins
                </span>
                <button
                  onClick={() => setIsAddBasicCertModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Basic Certificate</span>
                </button>
              </div>
            </div>

            {/* List of Basic Certificates */}
            {currentStudent.onlineCertBasic && currentStudent.onlineCertBasic.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentStudent.onlineCertBasic.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                          {cert.platform}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{cert.durationHrs} Hrs</span>
                      </div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-xs">
                        {cert.courseName}
                      </strong>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Proof Attached</span>
                      </span>
                    </div>

                    <div className="text-right space-y-1.5 shrink-0 ml-3">
                      <span className="font-black text-amber-500 text-sm block">+{cert.coinsEarned} Coins</span>
                      <button
                        onClick={() =>
                          setProofViewerData({
                            title: `5.3 Basic Certificate: ${cert.courseName}`,
                            category: 'Dimension 2: Skill Development',
                            studentName: currentStudent.studentProfile.studentName,
                            regNo: currentStudent.studentProfile.registerNumber,
                            fileName: `Basic_Cert_${cert.platform.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                            uploadDate: 'July 10, 2026',
                            status: 'Verified',
                            verifiedBy: currentStudent.studentProfile.mentorFaculty || 'M. Kaviyarasu',
                            coinsEarned: cert.coinsEarned,
                            platform: cert.platform,
                            remarks: `Duration: ${cert.durationHrs} Hours Course Completed`,
                          })
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 hover:border-indigo-500 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3 text-indigo-600" />
                        <span>View Proof</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                No basic online certificates logged yet. Click &quot;Add Basic Certificate&quot; to log Coursera/Springboard certificates and attach proof file.
              </div>
            )}
          </div>

          {/* 5.4 Advanced Professional Courses (>15 Hrs / Industry Certifications) (Max 2,000 Coins) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>5.4 Advanced Professional Courses (&gt;15 Hrs / Industry Certs) (Max 2,000 Coins)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AWS, Google Cloud, Cisco CCNA, Oracle, RedHat, Azure, IEEE (+200 Coins per verified advanced cert)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d2.advancedCourseCoins.toLocaleString()} / 2,000 Coins
                </span>
                <button
                  onClick={() => setIsAddAdvCourseModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Advanced Course</span>
                </button>
              </div>
            </div>

            {/* List of Advanced Courses */}
            {currentStudent.advancedCourses && currentStudent.advancedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentStudent.advancedCourses.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase">
                          {adv.platform}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{adv.durationHrs} Hrs</span>
                      </div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-xs">
                        {adv.courseName}
                      </strong>
                      <p className="text-[10px] text-slate-400">{adv.remarks}</p>
                    </div>

                    <div className="text-right space-y-1.5 shrink-0 ml-3">
                      <span className="font-black text-amber-500 text-sm block">+{adv.coinsEarned} Coins</span>
                      <button
                        onClick={() =>
                          setProofViewerData({
                            title: `5.4 Advanced Certification: ${adv.courseName}`,
                            category: 'Dimension 2: Skill Development',
                            studentName: currentStudent.studentProfile.studentName,
                            regNo: currentStudent.studentProfile.registerNumber,
                            fileName: `Advanced_Cert_${adv.platform.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                            uploadDate: 'July 15, 2026',
                            status: 'Verified',
                            verifiedBy: currentStudent.studentProfile.mentorFaculty || 'M. Kaviyarasu',
                            coinsEarned: adv.coinsEarned,
                            platform: adv.platform,
                            remarks: adv.remarks || `Duration: ${adv.durationHrs} Hours Advanced Professional Course`,
                          })
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 hover:border-indigo-500 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3 text-indigo-600" />
                        <span>View Proof</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                No advanced professional courses logged yet. Click &quot;Add Advanced Course&quot; to log AWS/Cisco certifications and attach proof file.
              </div>
            )}
          </div>

          {/* 5.5 Paper Presentation & Publication Logs (Max 2,000 Coins) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>5.5 Paper Presentation &amp; Publication Logs (Max 2,000 Coins)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inter-college, State, National, International Symposiums &amp; Conference Papers
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d2.paperCoins.toLocaleString()} / 2,000 Coins
                </span>
                <button
                  onClick={() => setIsAddPaperModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paper Entry</span>
                </button>
              </div>
            </div>

            {/* List of Paper Presentations */}
            {currentStudent.paperPresentations && currentStudent.paperPresentations.length > 0 ? (
              <div className="space-y-3">
                {currentStudent.paperPresentations.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase">
                          {p.level} Symposium
                        </span>
                        <span className="text-[10px] text-amber-600 font-bold">{p.prizeWon}</span>
                      </div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-xs">
                        {p.title}
                      </strong>
                      <p className="text-[10px] text-slate-400">
                        Symposium: {p.symposiumName} • Venue: {p.venue} • Date: {p.date || 'July 2026'}
                      </p>
                    </div>

                    <div className="text-right space-y-1.5 shrink-0 ml-3">
                      <span className="font-black text-amber-500 text-sm block">+{p.coinsEarned} Coins</span>
                      <button
                        onClick={() =>
                          setProofViewerData({
                            title: `5.5 Paper Presentation: ${p.title}`,
                            category: 'Dimension 2: Skill Development',
                            studentName: currentStudent.studentProfile.studentName,
                            regNo: currentStudent.studentProfile.registerNumber,
                            fileName: `Paper_Presentation_${p.level}_${currentStudent.studentProfile.registerNumber}.pdf`,
                            uploadDate: p.date || 'July 2026',
                            status: 'Verified',
                            verifiedBy: currentStudent.studentProfile.mentorFaculty || 'M. Kaviyarasu',
                            coinsEarned: p.coinsEarned,
                            platform: p.symposiumName,
                            remarks: `Presented at ${p.venue} (${p.level} Level). Result: ${p.prizeWon}`,
                          })
                        }
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 hover:border-indigo-500 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3 text-indigo-600" />
                        <span>View Certificate Proof</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                No paper presentation logs recorded yet. Click &quot;Add Paper Entry&quot; to log symposium papers and upload certificate proof.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: DIMENSION 3 — CAREER PREP (Cap 15k) ----------------- */}
      {activeMainTab === 'dim3' && currentStudent && (
        <div className="space-y-6">
          {/* Dimension 3 Cap Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 border border-emerald-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  Dimension 3: Internship &amp; Career Readiness — Cap Enforcement (Max 15,000 Coins)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sub-categories: Aptitude (3k) • ATS Resume (2k) • Mock Interviews (2k) • LinkedIn/GitHub (3k) • Hackathons (2k) • Internships (1k)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-400">
                {totals.d3.cappedTotal.toLocaleString()} / 15,000 Capped Coins
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  totals.d3.rawTotal > 15000 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-950 text-emerald-200'
                }`}
              >
                {totals.d3.rawTotal > 15000
                  ? `Raw: ${totals.d3.rawTotal.toLocaleString()} (+${(totals.d3.rawTotal - 15000).toLocaleString()} Overflow Clamped)`
                  : `Raw: ${totals.d3.rawTotal.toLocaleString()} Coins`}
              </span>
            </div>
          </div>

          {/* 6.1 Aptitude Test, 6.2 ATS Resume, 6.3 Mock Interview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6.1 Aptitude Test (Max 3,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>6.1 Aptitude Test (Max 3,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Score &ge;80% (2,000) + Test Attended (1,000)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d3.aptitudeCoins.toLocaleString()} / 3,000 Coins
                </span>
              </div>

              {/* Data Entry Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.aptitudeMonths?.Jul?.attended ?? true}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const prev = currentStudent.aptitudeMonths?.Jul || { attended: false, scoreBand: 'None', coinsEarned: 0 };
                        let addScore = 0;
                        if (prev.scoreBand === 'Score >= 80') addScore = 2000;
                        else if (prev.scoreBand === 'Score >= 60') addScore = 1500;
                        else if (prev.scoreBand === 'Score >= 50') addScore = 1000;

                        const coins = Math.min(3000, (checked ? 1000 : 0) + addScore);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          aptitudeMonths: {
                            ...currentStudent.aptitudeMonths,
                            Jul: { ...prev, attended: checked, coinsEarned: coins },
                          },
                        });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Aptitude Test Attended</span>
                  </div>
                  <span className="text-emerald-600 font-black">+1,000 Coins</span>
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Aptitude Assessment Score Band:
                  </label>
                  <select
                    value={currentStudent.aptitudeMonths?.Jul?.scoreBand || 'Score >= 80'}
                    onChange={(e) => {
                      const band = e.target.value as any;
                      const prev = currentStudent.aptitudeMonths?.Jul || { attended: true, scoreBand: 'Score >= 80', coinsEarned: 3000 };
                      let addScore = 0;
                      if (band === 'Score >= 80') addScore = 2000;
                      else if (band === 'Score >= 60') addScore = 1500;
                      else if (band === 'Score >= 50') addScore = 1000;

                      const coins = Math.min(3000, (prev.attended ? 1000 : 0) + addScore);
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        aptitudeMonths: {
                          ...currentStudent.aptitudeMonths,
                          Jul: { ...prev, scoreBand: band, coinsEarned: coins },
                        },
                      });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl font-bold text-xs"
                  >
                    <option value="Score >= 80">Score &ge; 80% (+2,000 Coins)</option>
                    <option value="Score >= 60">Score &ge; 60% (+1,500 Coins)</option>
                    <option value="Score >= 50">Score &ge; 50% (+1,000 Coins)</option>
                    <option value="None">Score &lt; 50% / None (0 Coins)</option>
                  </select>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aptitude Scorecard Proof</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ CDC Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      Aptitude_Jul2026_Scorecard_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '6.1 Aptitude Test Scorecard & Evaluation',
                          category: 'Dimension 3: Internship & Career Readiness',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `Aptitude_Jul2026_Scorecard_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'July 20, 2026',
                          status: 'Verified',
                          verifiedBy: 'Dept CDC Coordinator / Placement Officer',
                          coinsEarned: totals.d3.aptitudeCoins,
                          platform: 'CDC Online Aptitude Portal',
                          remarks: 'Verified Quantitative & Logical Reasoning Aptitude Score',
                        })
                      }
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer" title="Upload Scorecard">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Aptitude proof: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 6.2 ATS Resume Prep (Max 2,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>6.2 ATS Resume Prep (Max 2,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ATS Match &ge;85% (1,500) + CDC Workshop (500)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d3.resumeCoins.toLocaleString()} / 2,000 Coins
                </span>
              </div>

              {/* Data Entry Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.resume.workshopAttended}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(2000, (checked ? 500 : 0) + (currentStudent.resume.atsScorePct >= 85 ? 1500 : 0));
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          resume: {
                            ...currentStudent.resume,
                            workshopAttended: checked,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">CDC Resume Workshop Attended</span>
                  </div>
                  <span className="text-emerald-600 font-black">+500 Coins</span>
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300">ATS Resume Score (%):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={currentStudent.resume.atsScorePct}
                      onChange={(e) => {
                        const score = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        const coins = Math.min(2000, (currentStudent.resume.workshopAttended ? 500 : 0) + (score >= 85 ? 1500 : 0));
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          resume: {
                            ...currentStudent.resume,
                            atsScorePct: score,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-20 p-1.5 bg-white dark:bg-slate-900 border rounded-lg font-black text-xs text-center"
                    />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      currentStudent.resume.atsScorePct >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {currentStudent.resume.atsScorePct >= 85 ? '+1,500' : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ATS Resume Verification Report</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      ATS_Resume_Analysis_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '6.2 ATS Resume Match Analysis Report',
                          category: 'Dimension 3: Internship & Career Readiness',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `ATS_Resume_Analysis_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'July 15, 2026',
                          status: 'Verified',
                          verifiedBy: 'Dept CDC Coordinator',
                          coinsEarned: totals.d3.resumeCoins,
                          platform: 'CDC Resume Parser System',
                          remarks: `ATS Score Verified at ${currentStudent.resume.atsScorePct}% Format Alignment`,
                        })
                      }
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer" title="Upload Resume PDF">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Resume document: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 6.3 Mock Interview (Max 2,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>6.3 Mock Interview (Max 2,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Top Performer (1,500) + Attended (500)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d3.mockInterviewCoins.toLocaleString()} / 2,000 Coins
                </span>
              </div>

              {/* Data Entry Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.mockInterview.attended}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        let perfCoins = 0;
                        if (currentStudent.mockInterview.performanceBand === 'Top') perfCoins = 1500;
                        else if (currentStudent.mockInterview.performanceBand === 'Moderate') perfCoins = 750;
                        else if (currentStudent.mockInterview.performanceBand === 'Attended') perfCoins = 500;

                        const coins = Math.min(2000, (checked ? 500 : 0) + perfCoins);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          mockInterview: {
                            ...currentStudent.mockInterview,
                            attended: checked,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Mock Interview Attended</span>
                  </div>
                  <span className="text-emerald-600 font-black">+500 Coins</span>
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Interviewer Performance Evaluation:
                  </label>
                  <select
                    value={currentStudent.mockInterview.performanceBand}
                    onChange={(e) => {
                      const band = e.target.value as any;
                      let perfCoins = 0;
                      if (band === 'Top') perfCoins = 1500;
                      else if (band === 'Moderate') perfCoins = 750;
                      else if (band === 'Attended') perfCoins = 500;

                      const coins = Math.min(2000, (currentStudent.mockInterview.attended ? 500 : 0) + perfCoins);
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        mockInterview: {
                          ...currentStudent.mockInterview,
                          performanceBand: band,
                          coinsEarned: coins,
                        },
                      });
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl font-bold text-xs"
                  >
                    <option value="Top">Top Performer (+1,500 Coins)</option>
                    <option value="Moderate">Moderate Performance (+750 Coins)</option>
                    <option value="Attended">Basic Attendance (+500 Coins)</option>
                  </select>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mock Interview Score Card</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ CDC Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      CDC_MockInterview_Evaluation_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '6.3 Mock Technical Interview Evaluation Form',
                          category: 'Dimension 3: Internship & Career Readiness',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `CDC_MockInterview_Evaluation_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'July 18, 2026',
                          status: 'Verified',
                          verifiedBy: 'CDC Technical Panel / Industry Expert',
                          coinsEarned: totals.d3.mockInterviewCoins,
                          platform: 'CDC Placement Cell',
                          remarks: `Performance Grade: ${currentStudent.mockInterview.performanceBand}`,
                        })
                      }
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer" title="Upload Evaluation Sheet">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Evaluation proof: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6.4 & 6.5 LinkedIn & GitHub Developer Portfolio (Combined Cap Max 3,000) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>6.4 &amp; 6.5 LinkedIn &amp; GitHub Developer Portfolio (Max 3,000 Coins)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  LinkedIn Professional Brand (Max 2,000) + GitHub Open-Source Portfolio (Max 1,000)
                </p>
              </div>
              <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                {(totals.d3.linkedInCoins + totals.d3.gitHubCoins).toLocaleString()} / 3,000 Coins
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 6.4 LinkedIn Profile */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>6.4 LinkedIn Profile &amp; Technical Content</span>
                  </strong>
                  <span className="text-xs font-bold text-amber-500">
                    {totals.d3.linkedInCoins} / 2,000 Coins
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentStudent.linkedIn.profileCreated}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const postCoins = Math.min(10, currentStudent.linkedIn.originalPostCount) * 100;
                          const repostCoins = Math.min(10, currentStudent.linkedIn.repostCount) * 50;
                          const coins = Math.min(2000, (checked ? 500 : 0) + postCoins + repostCoins);
                          updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                            linkedIn: {
                              ...currentStudent.linkedIn,
                              profileCreated: checked,
                              coinsEarned: coins,
                            },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">LinkedIn Profile Created</span>
                    </div>
                    <span className="text-emerald-600 font-bold">+500 Coins</span>
                  </label>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-slate-600 dark:text-slate-300">Original Tech Posts Count:</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={currentStudent.linkedIn.originalPostCount}
                      onChange={(e) => {
                        const cnt = Math.max(0, parseInt(e.target.value) || 0);
                        const postCoins = Math.min(10, cnt) * 100;
                        const repostCoins = Math.min(10, currentStudent.linkedIn.repostCount) * 50;
                        const coins = Math.min(2000, (currentStudent.linkedIn.profileCreated ? 500 : 0) + postCoins + repostCoins);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          linkedIn: {
                            ...currentStudent.linkedIn,
                            originalPostCount: cnt,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-300">Industry Reposts / Articles:</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={currentStudent.linkedIn.repostCount}
                      onChange={(e) => {
                        const cnt = Math.max(0, parseInt(e.target.value) || 0);
                        const postCoins = Math.min(10, currentStudent.linkedIn.originalPostCount) * 100;
                        const repostCoins = Math.min(10, cnt) * 50;
                        const coins = Math.min(2000, (currentStudent.linkedIn.profileCreated ? 500 : 0) + postCoins + repostCoins);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          linkedIn: {
                            ...currentStudent.linkedIn,
                            repostCount: cnt,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-center font-bold"
                    />
                  </div>
                </div>

                {/* Proof Attachment */}
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-400 block font-mono">Proof File:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                      LinkedIn_Analytics_{currentStudent.studentProfile.registerNumber}.png
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setProofViewerData({
                        title: '6.4 LinkedIn Profile & Post Analytics Screenshot',
                        category: 'Dimension 3: Internship & Career Readiness',
                        studentName: currentStudent.studentProfile.studentName,
                        regNo: currentStudent.studentProfile.registerNumber,
                        fileName: `LinkedIn_Analytics_${currentStudent.studentProfile.registerNumber}.png`,
                        uploadDate: 'July 22, 2026',
                        status: 'Verified',
                        verifiedBy: 'Dept CDC Coordinator',
                        coinsEarned: totals.d3.linkedInCoins,
                        platform: 'LinkedIn Professional Platform',
                        remarks: `Verified ${currentStudent.linkedIn.originalPostCount} Original Posts & ${currentStudent.linkedIn.repostCount} Tech Reposts`,
                      })
                    }
                    className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Proof</span>
                  </button>
                </div>
              </div>

              {/* 6.5 GitHub Profile */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>6.5 GitHub Portfolio &amp; Commits</span>
                  </strong>
                  <span className="text-xs font-bold text-amber-500">
                    {totals.d3.gitHubCoins} / 1,000 Coins
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentStudent.gitHub.portfolioCompleted}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let bandCoins = 0;
                          const b = currentStudent.gitHub.assessmentBand;
                          if (b === '150+') bandCoins = 750;
                          else if (b === '100-149') bandCoins = 500;
                          else if (b === '75-99') bandCoins = 350;
                          else if (b === '50-74') bandCoins = 200;

                          const coins = Math.min(1000, (checked ? 250 : 0) + bandCoins);
                          updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                            gitHub: {
                              ...currentStudent.gitHub,
                              portfolioCompleted: checked,
                              coinsEarned: coins,
                            },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">GitHub Readme &amp; Repos Configured</span>
                    </div>
                    <span className="text-emerald-600 font-bold">+250 Coins</span>
                  </label>

                  <div className="pt-1 space-y-1">
                    <span className="text-slate-600 dark:text-slate-300 font-bold block">
                      Commit &amp; Code Assessment Band:
                    </span>
                    <select
                      value={currentStudent.gitHub.assessmentBand}
                      onChange={(e) => {
                        const band = e.target.value as any;
                        let bandCoins = 0;
                        if (band === '150+') bandCoins = 750;
                        else if (band === '100-149') bandCoins = 500;
                        else if (band === '75-99') bandCoins = 350;
                        else if (band === '50-74') bandCoins = 200;

                        const coins = Math.min(1000, (currentStudent.gitHub.portfolioCompleted ? 250 : 0) + bandCoins);
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          gitHub: {
                            ...currentStudent.gitHub,
                            assessmentBand: band,
                            coinsEarned: coins,
                          },
                        });
                      }}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border rounded font-bold text-xs"
                    >
                      <option value="150+">150+ Commits (+750 Coins)</option>
                      <option value="100-149">100-149 Commits (+500 Coins)</option>
                      <option value="75-99">75-99 Commits (+350 Coins)</option>
                      <option value="50-74">50-74 Commits (+200 Coins)</option>
                      <option value="<50">&lt;50 Commits (0 Coins)</option>
                    </select>
                  </div>
                </div>

                {/* Proof Attachment */}
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-400 block font-mono">Proof File:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                      GitHub_Contribution_Graph_{currentStudent.studentProfile.registerNumber}.png
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setProofViewerData({
                        title: '6.5 GitHub Open-Source Portfolio & Contribution Graph',
                        category: 'Dimension 3: Internship & Career Readiness',
                        studentName: currentStudent.studentProfile.studentName,
                        regNo: currentStudent.studentProfile.registerNumber,
                        fileName: `GitHub_Contribution_Graph_${currentStudent.studentProfile.registerNumber}.png`,
                        uploadDate: 'July 24, 2026',
                        status: 'Verified',
                        verifiedBy: 'Dept CDC Coordinator',
                        coinsEarned: totals.d3.gitHubCoins,
                        platform: 'GitHub.com',
                        remarks: `Commit Band: ${currentStudent.gitHub.assessmentBand} Commits`,
                      })
                    }
                    className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Proof</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 6.7 SIH / Hackathons & 6.8 Internship */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 6.7 Hackathons (Max 2,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>6.7 SIH / Hackathon / Codeathon (Max 2,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Participation (1,000) + Winner / Top Rank (1,000)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    {totals.d3.hackathonCoins.toLocaleString()} / 2,000 Coins
                  </span>
                  <button
                    onClick={() => setIsAddHackathonModalOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hackathon</span>
                  </button>
                </div>
              </div>

              {/* Hackathon Cards List */}
              {currentStudent.hackathons && currentStudent.hackathons.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.hackathons.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                            EDC Verified
                          </span>
                          {h.prizeWon && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                              🏆 Winner (+1,000)
                            </span>
                          )}
                        </div>
                        <strong className="text-slate-800 dark:text-slate-200 block text-xs">
                          {h.eventName}
                        </strong>
                        <p className="text-[10px] text-slate-400">
                          Participation verified by EDC / Hackathon Convener
                        </p>
                      </div>

                      <div className="text-right space-y-1.5 shrink-0 ml-3">
                        <span className="font-black text-amber-500 text-sm block">+{h.coinsEarned} Coins</span>
                        <button
                          onClick={() =>
                            setProofViewerData({
                              title: `6.7 Hackathon Certificate: ${h.eventName}`,
                              category: 'Dimension 3: Internship & Career Readiness',
                              studentName: currentStudent.studentProfile.studentName,
                              regNo: currentStudent.studentProfile.registerNumber,
                              fileName: `Hackathon_Certificate_${h.eventName.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                              uploadDate: 'July 2026',
                              status: 'Verified',
                              verifiedBy: 'EDC Coordinator / Hackathon Head',
                              coinsEarned: h.coinsEarned,
                              platform: h.eventName,
                              remarks: `Participated: Yes | Winner: ${h.prizeWon ? 'Yes' : 'No'}`,
                            })
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 hover:border-emerald-500 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>View Proof</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                  No hackathon entries logged yet. Click &quot;Add Hackathon&quot; to log SIH, Ideathons, or Codeathons and attach certificate proof.
                </div>
              )}
            </div>

            {/* 6.8 Internship / Industry Training (Max 1,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>6.8 Internship / Industry Training / Startup (Max 1,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Industry Internship (1,000 Coins Capped)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d3.internshipCoins.toLocaleString()} / 1,000 Coins
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                      Industry / Company:
                    </label>
                    <input
                      type="text"
                      value={currentStudent.internship.industryName}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          internship: { ...currentStudent.internship, industryName: val },
                        });
                      }}
                      className="w-full mt-0.5 p-1.5 bg-white dark:bg-slate-900 border rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                      Duration (Days):
                    </label>
                    <input
                      type="number"
                      value={currentStudent.internship.totalDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          internship: { ...currentStudent.internship, totalDays: days },
                        });
                      }}
                      className="w-full mt-0.5 p-1.5 bg-white dark:bg-slate-900 border rounded font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t dark:border-slate-700">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentStudent.internship.internshipDone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const coins = Math.min(1000,
                            (checked ? 1000 : 0) +
                            (currentStudent.internship.certificateReceived ? 500 : 0) +
                            (currentStudent.internship.reportCompleted ? 700 : 0)
                          );
                          updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                            internship: { ...currentStudent.internship, internshipDone: checked, coinsEarned: coins },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Internship Training Completed</span>
                    </div>
                    <span className="text-emerald-600 font-bold">+1,000 Coins</span>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentStudent.internship.certificateReceived}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const coins = Math.min(1000,
                            (currentStudent.internship.internshipDone ? 1000 : 0) +
                            (checked ? 500 : 0) +
                            (currentStudent.internship.reportCompleted ? 700 : 0)
                          );
                          updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                            internship: { ...currentStudent.internship, certificateReceived: checked, coinsEarned: coins },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Official Certificate Verified</span>
                    </div>
                    <span className="text-emerald-600 font-bold">Verified</span>
                  </label>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Internship Offer &amp; Completion Certificate</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ Placement Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      Internship_Certificate_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: `6.8 Internship Completion: ${currentStudent.internship.industryName}`,
                          category: 'Dimension 3: Internship & Career Readiness',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `Internship_Certificate_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'June 28, 2026',
                          status: 'Verified',
                          verifiedBy: 'Head of Placement & Internship Cell',
                          coinsEarned: totals.d3.internshipCoins,
                          platform: currentStudent.internship.industryName,
                          remarks: `Completed ${currentStudent.internship.totalDays} Days Industry Internship (${currentStudent.internship.type})`,
                        })
                      }
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer" title="Upload Certificate">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Internship document: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: DIMENSION 4 — CO-CURRICULAR (Cap 15k) ----------------- */}
      {activeMainTab === 'dim4' && currentStudent && (
        <div className="space-y-6">
          {/* Dimension 4 Cap Banner */}
          <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white rounded-2xl p-5 border border-amber-800/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/30 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    Dimension 4: Co-Curricular Track — Cap Enforcement (Max 15,000 Coins)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                    Dim 4 Capped
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Sub-categories: Technical Workshops (4k) • College Events &amp; VAC (4k) • Event Volunteering (4k) • Professional Memberships (3k)
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-amber-400">
                {totals.d4.cappedTotal.toLocaleString()} / 15,000 Capped Coins
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                  totals.d4.rawTotal > 15000 ? 'bg-rose-500 text-white font-black animate-pulse' : 'bg-amber-950 text-amber-200 border border-amber-800'
                }`}
              >
                {totals.d4.rawTotal > 15000
                  ? `Raw: ${totals.d4.rawTotal.toLocaleString()} (+${(totals.d4.rawTotal - 15000).toLocaleString()} Overflow Clamped)`
                  : `Raw: ${totals.d4.rawTotal.toLocaleString()} Coins`}
              </span>
            </div>
          </div>

          {/* Synchronized DIM 4.2 & DIM 4.3 Central Library Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-teal-800/80 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-300">
                      DIM 4.2 &amp; DIM 4.3 Central Library Skill Bank Log
                    </h4>
                    {currentStudent.libraryChecklist?.updatedByLibrarian ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                        ✓ Librarian Verified ({currentStudent.libraryChecklist?.librarianLastUpdatedDate || 'Updated'})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/30 text-amber-300 border border-amber-400/40 uppercase">
                        Central Library Log
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Entries entered by Central Librarian. Mentors view updated results in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 px-3.5 py-1.5 rounded-xl border border-teal-900 shrink-0">
                <span className="text-xs font-bold text-slate-400">Total Library Coins:</span>
                <span className="text-sm font-black text-amber-400">
                  {(totals.d1.libraryCoins + totals.d1.libraryUtilCoins).toLocaleString()} Coins
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* DIM 4.2 Checklist status */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-teal-400">DIM 4.2 Library Books Borrowed Checklist</span>
                  <span className="font-black text-amber-400">{totals.d1.libraryCoins} / 3,000 Coins</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={libChecklistData.min5BooksBorrowed ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {libChecklistData.min5BooksBorrowed ? "✓" : "✗"} Min 5 Books Borrowed (1,000 Coins)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={libChecklistData.onTimeReturnVerified ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {libChecklistData.onTimeReturnVerified ? "✓" : "✗"} On-Time Return Verified (500 Coins)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={libChecklistData.referenceAndJournalsBorrowed ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {libChecklistData.referenceAndJournalsBorrowed ? "✓" : "✗"} Reference &amp; Journals Access (500 Coins)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={libChecklistData.digitalLibraryAccess ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {libChecklistData.digitalLibraryAccess ? "✓" : "✗"} Digital Library Access (500 Coins)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={libChecklistData.bookReviewSubmitted ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {libChecklistData.bookReviewSubmitted ? "✓" : "✗"} Written Book Review Submitted (500 Coins)
                    </span>
                  </div>
                </div>
                {currentStudent.libraryChecklist?.librarianNotes && (
                  <div className="mt-2 text-[11px] text-amber-300 italic bg-amber-950/40 p-2 rounded border border-amber-800/40">
                    Librarian Note: {currentStudent.libraryChecklist.librarianNotes}
                  </div>
                )}
              </div>

              {/* DIM 4.3 Utilization status */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-teal-400">DIM 4.3 Library Utilization Visits Log</span>
                  <span className="font-black text-amber-400">{totals.d1.libraryUtilCoins} / 500 Coins</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Total Verified Visits: <strong>{currentStudent.libraryVisits.length}</strong> ({currentStudent.libraryVisits.length * 20} coins calculated @ 20 coins/visit).
                </p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {currentStudent.libraryVisits.length === 0 ? (
                    <span className="text-slate-500 italic">No library visit logs recorded yet.</span>
                  ) : (
                    currentStudent.libraryVisits.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-slate-900 px-2.5 py-1 rounded text-[11px]">
                        <span>{v.date} ({v.inTime} - {v.outTime})</span>
                        <span className="text-emerald-400 font-bold">✓ Verified</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7.1 Technical Workshops / Seminars (Max 4,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>7.1 Technical Workshops &amp; Seminars (Max 4,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cert (2,000) + Learning Report (1,000) + Industrial Visit (1,000)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d4.workshopCoins.toLocaleString()} / 4,000 Coins
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.workshop.certificationCompleted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (checked ? 2000 : 0) +
                          (currentStudent.workshop.reportOnLearning ? 1000 : 0) +
                          (currentStudent.workshop.industrialVisitParticipation ? 1000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          workshop: { ...currentStudent.workshop, certificationCompleted: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Technical Workshop Certification Completed</span>
                  </div>
                  <span className="text-amber-600 font-bold">+2,000 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.workshop.reportOnLearning}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.workshop.certificationCompleted ? 2000 : 0) +
                          (checked ? 1000 : 0) +
                          (currentStudent.workshop.industrialVisitParticipation ? 1000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          workshop: { ...currentStudent.workshop, reportOnLearning: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Learning Abstract &amp; Summary Report Submitted</span>
                  </div>
                  <span className="text-amber-600 font-bold">+1,000 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.workshop.industrialVisitParticipation}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.workshop.certificationCompleted ? 2000 : 0) +
                          (currentStudent.workshop.reportOnLearning ? 1000 : 0) +
                          (checked ? 1000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          workshop: { ...currentStudent.workshop, industrialVisitParticipation: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Industrial Visit / Plant Tour Attended</span>
                  </div>
                  <span className="text-amber-600 font-bold">+1,000 Coins</span>
                </label>
              </div>

              {/* Proof Box */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Workshop Certificate &amp; Industrial Visit Proof</span>
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                    ✓ Dept CDC Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      Workshop_Cert_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '7.1 Technical Workshop & Seminar Participation Proof',
                          category: 'Dimension 4: Co-Curricular Track',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `Workshop_Cert_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'July 10, 2026',
                          status: 'Verified',
                          verifiedBy: 'Dept Workshop Convener',
                          coinsEarned: totals.d4.workshopCoins,
                          platform: 'IEEE / Industry Workshop',
                          remarks: 'Verified 3-Day Hands-on Workshop on AI & Cloud Computing',
                        })
                      }
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-amber-600 cursor-pointer" title="Upload Certificate">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Workshop Certificate: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 7.2 & 7.3 College Events & VAC (Max 4,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>7.2 &amp; 7.3 College Events &amp; Value-Added Courses (Max 4,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Paid VAC (3,000) + Event Participation (1,500) + Winner (4,000)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d4.eventCoins.toLocaleString()} / 4,000 Coins
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.collegeEvent.paidValueAddedCourse}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (checked ? 3000 : 0) +
                          (currentStudent.collegeEvent.eventWinner ? 4000 : currentStudent.collegeEvent.eventParticipation ? 1500 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          collegeEvent: { ...currentStudent.collegeEvent, paidValueAddedCourse: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Paid Value-Added Course (VAC) Completed</span>
                  </div>
                  <span className="text-amber-600 font-bold">+3,000 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.collegeEvent.eventParticipation}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.collegeEvent.paidValueAddedCourse ? 3000 : 0) +
                          (currentStudent.collegeEvent.eventWinner ? 4000 : checked ? 1500 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          collegeEvent: { ...currentStudent.collegeEvent, eventParticipation: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">College Technical Event Participation</span>
                  </div>
                  <span className="text-amber-600 font-bold">+1,500 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.collegeEvent.eventWinner}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.collegeEvent.paidValueAddedCourse ? 3000 : 0) +
                          (checked ? 4000 : currentStudent.collegeEvent.eventParticipation ? 1500 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          collegeEvent: { ...currentStudent.collegeEvent, eventWinner: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Inter-College / Symposium Winner (1st/2nd)</span>
                  </div>
                  <span className="text-amber-600 font-bold">+4,000 Coins</span>
                </label>
              </div>

              {/* Proof Box */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>VAC &amp; Symposium Winner Proof</span>
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                    ✓ Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      CollegeEvent_Proof_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '7.2 & 7.3 College Event Winner & VAC Certificate',
                          category: 'Dimension 4: Co-Curricular Track',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `CollegeEvent_Proof_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'July 12, 2026',
                          status: 'Verified',
                          verifiedBy: 'Dept Academic Coordinator',
                          coinsEarned: totals.d4.eventCoins,
                          platform: 'Value Added Course Portal',
                          remarks: 'Verified VAC Course Completion & National Level Symposium Award',
                        })
                      }
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-amber-600 cursor-pointer" title="Upload Proof">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded VAC Proof: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 7.4 Event Volunteering (Max 4,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>7.4 Event Volunteering &amp; Extension Activities (Max 4,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    NSS/NCC (2,000) + Community Drive (3,000) + Leadership Role (4,000)
                  </p>
                </div>
                <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {totals.d4.volunteeringCoins.toLocaleString()} / 4,000 Coins
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.volunteering.nssNccActivity}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (checked ? 2000 : 0) +
                          (currentStudent.volunteering.communityAwareness ? 3000 : 0) +
                          (currentStudent.volunteering.leadershipRole ? 4000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          volunteering: { ...currentStudent.volunteering, nssNccActivity: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">NSS / NCC / YRC Extension Activity</span>
                  </div>
                  <span className="text-amber-600 font-bold">+2,000 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.volunteering.communityAwareness}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.volunteering.nssNccActivity ? 2000 : 0) +
                          (checked ? 3000 : 0) +
                          (currentStudent.volunteering.leadershipRole ? 4000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          volunteering: { ...currentStudent.volunteering, communityAwareness: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Community Outreach &amp; Social Awareness Drive</span>
                  </div>
                  <span className="text-amber-600 font-bold">+3,000 Coins</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentStudent.volunteering.leadershipRole}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const coins = Math.min(4000,
                          (currentStudent.volunteering.nssNccActivity ? 2000 : 0) +
                          (currentStudent.volunteering.communityAwareness ? 3000 : 0) +
                          (checked ? 4000 : 0)
                        );
                        updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                          volunteering: { ...currentStudent.volunteering, leadershipRole: checked, coinsEarned: coins },
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Student Convener / Event Leadership Role</span>
                  </div>
                  <span className="text-amber-600 font-bold">+4,000 Coins</span>
                </label>
              </div>

              {/* Proof Box */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>NSS / Volunteering Activity Certificate</span>
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                    ✓ NSS Coordinator Verified
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      Volunteering_Cert_{currentStudent.studentProfile.registerNumber}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setProofViewerData({
                          title: '7.4 NSS / Extension Activity Certificate',
                          category: 'Dimension 4: Co-Curricular Track',
                          studentName: currentStudent.studentProfile.studentName,
                          regNo: currentStudent.studentProfile.registerNumber,
                          fileName: `Volunteering_Cert_${currentStudent.studentProfile.registerNumber}.pdf`,
                          uploadDate: 'June 20, 2026',
                          status: 'Verified',
                          verifiedBy: 'NSS Program Officer / Staff Advisor',
                          coinsEarned: totals.d4.volunteeringCoins,
                          platform: 'NSS Sasurie Cell',
                          remarks: 'Verified Active Volunteering in Tree Plantation & Health Camp',
                        })
                      }
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Proof</span>
                    </button>
                    <label className="p-1 text-slate-500 hover:text-amber-600 cursor-pointer" title="Upload Certificate">
                      <FileUp className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            alert(`Uploaded Volunteering Certificate: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 7.5 Professional Memberships (Max 3,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>7.5 Professional Body Memberships (Max 3,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    IEEE, CSI, ISTE, IEI, ACM (Annual: 1.5k, Life: 2k)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    {totals.d4.membershipCoins.toLocaleString()} / 3,000 Coins
                  </span>
                  <button
                    onClick={() => setIsAddMembershipModalOpen(true)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Membership</span>
                  </button>
                </div>
              </div>

              {currentStudent.professionalMemberships && currentStudent.professionalMemberships.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.professionalMemberships.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 uppercase">
                            {pm.membershipType} Member
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Issued: {pm.dateOfIssue}</span>
                        </div>
                        <strong className="text-slate-800 dark:text-slate-200 block text-xs">
                          {pm.bodyName}
                        </strong>
                        <p className="text-[10px] text-slate-400">
                          Validity: {pm.validity || 'AY 2026-2027'}
                        </p>
                      </div>

                      <div className="text-right space-y-1.5 shrink-0 ml-3">
                        <span className="font-black text-amber-500 text-sm block">+{pm.coinsEarned} Coins</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setProofViewerData({
                                title: `7.5 Professional Membership Card: ${pm.bodyName}`,
                                category: 'Dimension 4: Co-Curricular Track',
                                studentName: currentStudent.studentProfile.studentName,
                                regNo: currentStudent.studentProfile.registerNumber,
                                fileName: `Membership_Card_${pm.bodyName.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                                uploadDate: 'July 2026',
                                status: 'Verified',
                                verifiedBy: 'Professional Body Faculty Advisor',
                                coinsEarned: pm.coinsEarned,
                                platform: pm.bodyName,
                                remarks: `Verified Active ${pm.membershipType} Professional Body Membership`,
                              })
                            }
                            className="px-2 py-1 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 hover:border-amber-500 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-amber-600" />
                            <span>View Proof</span>
                          </button>
                          <button
                            onClick={() => {
                              const updated = currentStudent.professionalMemberships.filter((x) => x.id !== pm.id);
                              updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                                professionalMemberships: updated,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove Membership"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                  No professional body memberships added yet. Click &quot;Add Membership&quot; to log IEEE, CSI, or ISTE membership and upload proof.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: DIMENSION 5 — TALENT & SPORTS (Cap 15k) ----------------- */}
      {activeMainTab === 'dim5' && currentStudent && (
        <div className="space-y-6">
          {/* Dimension 5 Cap Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-purple-800/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider">
                    Dimension 5: Talent, Sports &amp; Club Activities — Cap Enforcement (Max 15,000 Coins)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-400 text-slate-950 uppercase">
                    Dim 5 Capped
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Sub-categories: Sports &amp; Fitness (5k) • Fine Arts &amp; Cultural (5k) • Student Clubs &amp; Activity Logs (5k)
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-amber-400">
                {totals.d5.cappedTotal.toLocaleString()} / 15,000 Capped Coins
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                  totals.d5.rawTotal > 15000 ? 'bg-rose-500 text-white font-black animate-pulse' : 'bg-purple-950 text-purple-200 border border-purple-800'
                }`}
              >
                {totals.d5.rawTotal > 15000
                  ? `Raw: ${totals.d5.rawTotal.toLocaleString()} (+${(totals.d5.rawTotal - 15000).toLocaleString()} Overflow Clamped)`
                  : `Raw: ${totals.d5.rawTotal.toLocaleString()} Coins`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 8.1 Sports & Fitness (Max 5,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>8.1 Sports &amp; Games (Max 5,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    College / Zonal / State / National Sports
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    {totals.d5.sportsCoins.toLocaleString()} / 5,000 Coins
                  </span>
                  <button
                    onClick={() => setIsAddSportsModalOpen(true)}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sports</span>
                  </button>
                </div>
              </div>

              {currentStudent.sportsLogs && currentStudent.sportsLogs.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.sportsLogs.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-black uppercase rounded">
                            {sp.participationLevel}
                          </span>
                          <strong className="text-slate-800 dark:text-slate-200 block mt-1">
                            {sp.gameSport}
                          </strong>
                          <p className="text-[10px] text-slate-400">
                            {sp.venue} • {sp.date}
                          </p>
                        </div>
                        <span className="font-black text-amber-500 text-xs shrink-0">+{sp.coinsEarned} Coins</span>
                      </div>

                      <div className="pt-2 border-t dark:border-slate-700 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Physical Director Verified
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setProofViewerData({
                                title: `8.1 Sports & Games Certificate: ${sp.gameSport}`,
                                category: 'Dimension 5: Extra-Curricular & Talent Track',
                                studentName: currentStudent.studentProfile.studentName,
                                regNo: currentStudent.studentProfile.registerNumber,
                                fileName: `Sports_Cert_${sp.gameSport.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                                uploadDate: sp.date,
                                status: 'Verified',
                                verifiedBy: 'Physical Director / Sports Council',
                                coinsEarned: sp.coinsEarned,
                                platform: sp.venue,
                                remarks: `Result: ${sp.resultPosition || sp.participationLevel}`,
                              })
                            }
                            className="px-2 py-0.5 bg-purple-600 text-white rounded font-bold"
                          >
                            Proof
                          </button>
                          <button
                            onClick={() => {
                              const updated = currentStudent.sportsLogs.filter((x) => x.id !== sp.id);
                              updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                                sportsLogs: updated,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                  No sports logs added yet. Click &quot;Add Sports&quot; to log athletic achievements.
                </div>
              )}
            </div>

            {/* 8.2 Arts & Cultural (Max 5,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>8.2 Fine Arts &amp; Cultural (Max 5,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dance, Music, Drama, Painting, Debate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    {totals.d5.artsCoins.toLocaleString()} / 5,000 Coins
                  </span>
                  <button
                    onClick={() => setIsAddArtsModalOpen(true)}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cultural</span>
                  </button>
                </div>
              </div>

              {currentStudent.artsLogs && currentStudent.artsLogs.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.artsLogs.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-black uppercase rounded">
                            {art.culturalCategory}
                          </span>
                          <strong className="text-slate-800 dark:text-slate-200 block mt-1">
                            {art.position || art.participationLevel}
                          </strong>
                          <p className="text-[10px] text-slate-400">
                            Date: {art.date}
                          </p>
                        </div>
                        <span className="font-black text-amber-500 text-xs shrink-0">+{art.coinsEarned} Coins</span>
                      </div>

                      <div className="pt-2 border-t dark:border-slate-700 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Fine Arts Convener Verified
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setProofViewerData({
                                title: `8.2 Cultural Achievement Proof: ${art.culturalCategory}`,
                                category: 'Dimension 5: Extra-Curricular & Talent Track',
                                studentName: currentStudent.studentProfile.studentName,
                                regNo: currentStudent.studentProfile.registerNumber,
                                fileName: `Cultural_Cert_${art.culturalCategory.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                                uploadDate: art.date,
                                status: 'Verified',
                                verifiedBy: 'Fine Arts Club Convener',
                                coinsEarned: art.coinsEarned,
                                platform: 'Cultural Festival',
                                remarks: `Category: ${art.culturalCategory} | Level: ${art.participationLevel}`,
                              })
                            }
                            className="px-2 py-0.5 bg-purple-600 text-white rounded font-bold"
                          >
                            Proof
                          </button>
                          <button
                            onClick={() => {
                              const updated = currentStudent.artsLogs.filter((x) => x.id !== art.id);
                              updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                                artsLogs: updated,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                  No cultural activity logs added yet. Click &quot;Add Cultural&quot; to log drama, music, or fine arts awards.
                </div>
              )}
            </div>

            {/* 8.3 Student Club Activity Logs (Max 5,000) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>8.3 Student Club Activity Logs (Max 5,000)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rotaract, Fine Arts, YRC, Coding Club, IEEE
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    {totals.d5.clubCoins.toLocaleString()} / 5,000 Coins
                  </span>
                  <button
                    onClick={() => setIsAddClubModalOpen(true)}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Club Log</span>
                  </button>
                </div>
              </div>

              {currentStudent.clubLogs && currentStudent.clubLogs.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.clubLogs.map((cl) => (
                    <div
                      key={cl.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-black uppercase rounded">
                            {cl.role}
                          </span>
                          <strong className="text-slate-800 dark:text-slate-200 block mt-1">
                            {cl.clubName}
                          </strong>
                          <p className="text-[10px] text-slate-400">
                            {cl.activityDetails} • {cl.date}
                          </p>
                        </div>
                        <span className="font-black text-amber-500 text-xs shrink-0">+{cl.coinsEarned} Coins</span>
                      </div>

                      <div className="pt-2 border-t dark:border-slate-700 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Faculty Advisor Verified
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setProofViewerData({
                                title: `8.3 Club Activity Proof: ${cl.clubName}`,
                                category: 'Dimension 5: Extra-Curricular & Talent Track',
                                studentName: currentStudent.studentProfile.studentName,
                                regNo: currentStudent.studentProfile.registerNumber,
                                fileName: `Club_Activity_${cl.clubName.replace(/\s+/g, '_')}_${currentStudent.studentProfile.registerNumber}.pdf`,
                                uploadDate: cl.date,
                                status: 'Verified',
                                verifiedBy: 'Club Faculty Advisor',
                                coinsEarned: cl.coinsEarned,
                                platform: cl.clubName,
                                remarks: `Role: ${cl.role} | Activity: ${cl.activityDetails}`,
                              })
                            }
                            className="px-2 py-0.5 bg-purple-600 text-white rounded font-bold"
                          >
                            Proof
                          </button>
                          <button
                            onClick={() => {
                              const updated = currentStudent.clubLogs.filter((x) => x.id !== cl.id);
                              updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                                clubLogs: updated,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                  No club activity logs added yet. Click &quot;Add Club Log&quot; to log Rotaract, YRC, or Coding Club event participation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 7: CODE OF CONDUCT & RETRACTIONS ----------------- */}
      {activeMainTab === 'retraction' && currentStudent && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Code of Conduct — Disciplinary Coin Retraction Policy</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deductions calculated dynamically against cumulative earned coins (<strong className="text-slate-800 dark:text-slate-200 font-bold">{totals.totalGrossEarned.toLocaleString()} Gross Coins</strong>).
              </p>
            </div>
            <div className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 font-black text-xs rounded-xl border border-rose-300 dark:border-rose-900 shadow-sm text-right">
              <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Total Retracted</div>
              <div className="text-sm">-{totals.totalDeductions.toLocaleString()} Coins</div>
            </div>
          </div>

          {/* Policy Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-amber-50 dark:bg-slate-800/80 rounded-xl border border-amber-200 dark:border-slate-700">
              <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center justify-between">
                <span>Minor / Behavioral Violations</span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-950 px-2 py-0.5 rounded font-black text-amber-900 dark:text-amber-300">
                  Step Deductions
                </span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Late coming, Improper Dress, Late Submission, No ID Card, Attendance Shortage (&lt;75%).
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">1st occurrence → <strong className="text-amber-600">-3%</strong></div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">2nd occurrence → <strong className="text-amber-600">-5%</strong></div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">3rd occurrence → <strong className="text-amber-600">-15%</strong></div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">&gt;3 occurrences → <strong className="text-rose-600">-50%</strong></div>
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-slate-800/80 rounded-xl border border-rose-200 dark:border-slate-700">
              <h4 className="font-bold text-rose-900 dark:text-rose-300 mb-1 flex items-center justify-between">
                <span>Disciplinary Violations</span>
                <span className="text-[10px] bg-rose-200 dark:bg-rose-950 px-2 py-0.5 rounded font-black text-rose-900 dark:text-rose-300">
                  Major Retraction
                </span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Misconduct, Insubordination, Campus Disruption, Lab Safety Breach.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">1st occurrence → <strong className="text-rose-600">-10%</strong></div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border">2nd occurrence → <strong className="text-rose-600">-25%</strong></div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border fill-span col-span-2">&gt;2 occurrences → <strong className="text-rose-700 font-black">-50% of earned coins</strong></div>
              </div>
            </div>
          </div>

          {/* Impact Net Total Box */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-rose-950 text-white rounded-xl flex items-center justify-between border border-rose-900">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Dynamic Conduct Balance</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                Gross Coins ({totals.totalGrossEarned.toLocaleString()}) - Retractions ({totals.totalDeductions.toLocaleString()})
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-300">Net Final Grade Coins</div>
              <div className="text-xl font-black text-amber-400">{totals.grandTotalNetCoins.toLocaleString()} Coins</div>
            </div>
          </div>

          {/* Violation Log Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Recorded Disciplinary Violation Logs</span>
              </h4>
              <button
                onClick={() => setIsAddViolationModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Disciplinary Violation</span>
              </button>
            </div>

            {currentStudent.violations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed">
                ✓ No disciplinary violations recorded for {currentStudent.studentProfile.studentName}. Clean code of conduct record!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b dark:border-slate-700">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Violation Type</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Occurrence</th>
                      <th className="p-3">% Deduction</th>
                      <th className="p-3">Coins Deducted</th>
                      <th className="p-3">Recorded By</th>
                      <th className="p-3">Proof / Remarks</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {currentStudent.violations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{v.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            v.type === 'Disciplinary' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {v.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{v.category}</td>
                        <td className="p-3 font-bold text-slate-600 dark:text-slate-400">#{v.occurrenceNo}</td>
                        <td className="p-3 font-bold text-rose-600">-{v.deductionPct}%</td>
                        <td className="p-3 font-black text-rose-600">-{v.coinsDeducted.toLocaleString()} Coins</td>
                        <td className="p-3 text-slate-500">{v.recordedBy}</td>
                        <td className="p-3 max-w-xs truncate text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{v.remarks || 'No remarks'}</span>
                            <button
                              onClick={() =>
                                setProofViewerData({
                                  title: `Disciplinary Violation Report: ${v.category}`,
                                  category: 'Code of Conduct & Disciplinary Action',
                                  studentName: currentStudent.studentProfile.studentName,
                                  regNo: currentStudent.studentProfile.registerNumber,
                                  fileName: `Disciplinary_Notice_${v.id}_${currentStudent.studentProfile.registerNumber}.pdf`,
                                  uploadDate: v.date,
                                  status: 'Disciplinary Memo Issued',
                                  verifiedBy: v.recordedBy || 'Disciplinary Committee / HOD',
                                  coinsEarned: -v.coinsDeducted,
                                  platform: 'Disciplinary Action Portal',
                                  remarks: `Type: ${v.type} | Category: ${v.category} | Occurrence #${v.occurrenceNo} (-${v.deductionPct}%)`,
                                })
                              }
                              className="px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded shrink-0 cursor-pointer"
                            >
                              Memo
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                                violations: currentStudent.violations.filter((x) => x.id !== v.id),
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Revoke / Remove Violation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 8: TRANSFORMATION JOURNEY & LOGS ----------------- */}
      {activeMainTab === 'journey' && currentStudent && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>My Transformation Journey & Grade Coins Progress</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <h4 className="text-xs font-black uppercase text-blue-600">Reflective Transformation Journal</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-500">Academic Growth:</label>
                  <textarea
                    rows={2}
                    value={currentStudent.transformationJourney.academicReflection}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        transformationJourney: {
                          ...currentStudent.transformationJourney,
                          academicReflection: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border rounded-lg resize-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Skill Development Growth:</label>
                  <textarea
                    rows={2}
                    value={currentStudent.transformationJourney.skillReflection}
                    onChange={(e) =>
                      updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                        transformationJourney: {
                          ...currentStudent.transformationJourney,
                          skillReflection: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border rounded-lg resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-amber-50/50 dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase text-amber-600">Grade Coins Progress Summary</h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span>Checkpoint 1 (As-on {currentStudent.transformationJourney.checkpoint1Date}):</span>
                  <span className="font-black text-amber-600">{currentStudent.transformationJourney.checkpoint1Coins} Coins ({currentStudent.transformationJourney.checkpoint1Grade})</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span>Checkpoint 2 (As-on {currentStudent.transformationJourney.checkpoint2Date}):</span>
                  <span className="font-black text-amber-600">{currentStudent.transformationJourney.checkpoint2Coins} Coins ({currentStudent.transformationJourney.checkpoint2Grade})</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-lg">
                  <span>Final Semester Grade:</span>
                  <span className="text-sm">{totals.grandTotalNetCoins.toLocaleString()} Coins ({totals.percentageOfTarget >= 90 ? 'O - Outstanding' : 'A+ - Exemplary'})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 9: CLASS LEADERBOARD ----------------- */}
      {activeMainTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>Class Leaderboard — Sasurie Skill Bank (SSB)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by Net Earned Grade Coins across 5 Dimensions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b">
                <tr>
                  <th className="p-2.5">Rank</th>
                  <th className="p-2.5">Reg Number</th>
                  <th className="p-2.5">Student Name</th>
                  <th className="p-2.5">Dim 1</th>
                  <th className="p-2.5">Dim 2</th>
                  <th className="p-2.5">Dim 3</th>
                  <th className="p-2.5">Dim 4</th>
                  <th className="p-2.5">Dim 5</th>
                  <th className="p-2.5">Gross Coins</th>
                  <th className="p-2.5">Retracted</th>
                  <th className="p-2.5">Net Grand Total</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scopedStudents
                  .map((s) => ({ student: s, t: calculateStudentTotals(s) }))
                  .sort((a, b) => b.t.grandTotalNetCoins - a.t.grandTotalNetCoins)
                  .map(({ student, t }, idx) => (
                    <tr key={student.studentProfile.registerNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-black text-amber-500">#{idx + 1}</td>
                      <td className="p-2.5 font-mono">{student.studentProfile.registerNumber}</td>
                      <td className="p-2.5 font-bold">{student.studentProfile.studentName}</td>
                      <td className="p-2.5">{t.d1.cappedTotal}</td>
                      <td className="p-2.5">{t.d2.cappedTotal}</td>
                      <td className="p-2.5">{t.d3.cappedTotal}</td>
                      <td className="p-2.5">{t.d4.cappedTotal}</td>
                      <td className="p-2.5">{t.d5.cappedTotal}</td>
                      <td className="p-2.5 font-bold">{t.totalGrossEarned}</td>
                      <td className="p-2.5 text-rose-600">-{t.totalDeductions}</td>
                      <td className="p-2.5 font-black text-amber-500 text-sm">
                        {t.grandTotalNetCoins.toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => {
                            setSelectedRegisterNo(student.studentProfile.registerNumber);
                            setActiveMainTab('profile');
                          }}
                          className="px-2 py-1 bg-blue-600 text-white rounded font-bold text-[10px]"
                        >
                          View Passbook
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Google Sheets Web App Config Modal */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>Google Sheets Backend Config</span>
              </h3>
              <button onClick={() => setIsSheetsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Enter your deployed <strong>Google Apps Script Web App URL</strong> to sync student Grade Coins directly into your Google Spreadsheet workbook. Each sync pushes one row per student containing <strong>Name, Department, Year-wise cohort, Mentor</strong> and all <strong>5 Dimension coin totals</strong> (D1–D5) so HODs can monitor &amp; update the matrix easily.
              </p>
              <button
                type="button"
                onClick={handleDownload5DSampleSheet}
                className="w-full px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download 5D Sample Sheet (.xlsx)</span>
              </button>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Web App Executable URL:</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={googleSheetsConfig.webAppUrl}
                  onChange={(e) => updateGoogleSheetsConfig({ webAppUrl: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-[11px]"
                />
              </div>

              {googleSheetsConfig.lastSyncedAt && (
                <p className="text-emerald-600 font-bold">
                  ✓ Last Synced: {googleSheetsConfig.lastSyncedAt}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSheetsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await handleSyncToSheets();
                  setIsSheetsModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Save & Sync Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-black text-slate-900 dark:text-white">Add New Student Profile</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const regNo = formData.get('regNo') as string;
                const name = formData.get('name') as string;
                const section = formData.get('section') as string;

                if (!regNo || !name) return;

                const newStudent = createDefaultStudentSkillBankRecord({
                  registerNumber: regNo,
                  studentName: name,
                  section: section || 'A',
                  skillBankAccountNo: `SSB-2026-CS-${Math.floor(100 + Math.random() * 900)}`,
                  degreeBranch: 'B.E. Computer Science & Engineering',
                  department: currentUser?.department || 'Computer Science & Engineering',
                  batch: '2023-2027',
                  academicYear: '2026-2027',
                  semester: 'Odd Semester (Sem V)',
                  admissionNumber: `SCE2023CS${Math.floor(100 + Math.random() * 900)}`,
                  studentEmail: `${(name || '').toLowerCase().replace(/\s+/g, '.')}@sasurie.ac.in`,
                  personalEmail: `${(name || '').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                  mentorFaculty: currentUser?.facultyName || 'Dr. M. Karthikeyan',
                  mentorStaffId: currentUser?.id || 'STF001',
                });

                addSkillBankStudent(newStudent);
                setSelectedRegisterNo(regNo);
                setIsAddStudentModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Register Number:</label>
                <input
                  name="regNo"
                  required
                  placeholder="e.g. 732422104050"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Student Name:</label>
                <input
                  name="name"
                  required
                  placeholder="Full Student Name"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Section:</label>
                <input
                  name="section"
                  defaultValue="A"
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Student Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOD Bulk Excel Upload Modal */}
      {isExcelUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    HOD Bulk Student Upload via Excel Sheet (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload an Excel file to automatically create Skill Bank accounts for students in bulk. Mentors will access their assigned students only.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExcelUploadModalOpen(false);
                  setExcelPreviewStudents([]);
                  setExcelImportStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & Instructions */}
            <div className="bg-blue-50 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-300 block">
                  Need the Excel Format Template?
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Columns: Register Number, Student Name, Degree & Branch, Department, Batch, Semester, Mentor Faculty Name, Mobile, Email
                </span>
              </div>
              <button
                type="button"
                onClick={downloadHODStudentTemplate}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template (.xlsx)</span>
              </button>
            </div>

            {/* Default Mentor Assignment selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Default Mentor Faculty (If empty in sheet):
                </label>
                <select
                  value={selectedDefaultMentorForExcel}
                  onChange={(e) => setSelectedDefaultMentorForExcel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="M. Kaviyarasu (Asst. Prof / III Year Mentor)">
                    M. Kaviyarasu (Asst. Prof / III Year Mentor)
                  </option>
                  <option value="Dr. M. Karthikeyan (Asst. Prof / CSE)">
                    Dr. M. Karthikeyan (Asst. Prof / CSE)
                  </option>
                  <option value="Prof. S. Tamilselvan (Asst. Prof / ECE)">
                    Prof. S. Tamilselvan (Asst. Prof / ECE)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Select Excel / CSV File:
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1"
                />
              </div>
            </div>

            {/* Status Message */}
            {isUploadingExcel && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>Parsing Excel sheet contents...</span>
              </div>
            )}

            {excelImportStatus && !isUploadingExcel && (
              <div className={`p-3 text-xs rounded-xl flex items-center gap-2 ${
                excelImportStatus.includes('Failed')
                  ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
              }`}>
                {excelImportStatus.includes('Failed') ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{excelImportStatus}</span>
              </div>
            )}

            {/* Excel Preview Table */}
            {excelPreviewStudents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Parsed Student Records Preview ({excelPreviewStudents.length})</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                    Ready to import into Master Database
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold border-b dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Reg No</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Batch / Sem</th>
                        <th className="p-2.5">Assigned Mentor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {excelPreviewStudents.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {st.studentProfile.registerNumber}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {st.studentProfile.studentName}
                          </td>
                          <td className="p-2.5">
                            {st.studentProfile.batch} ({st.studentProfile.section})
                          </td>
                          <td className="p-2.5 font-medium text-amber-700 dark:text-amber-400">
                            {st.studentProfile.mentorFaculty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsExcelUploadModalOpen(false);
                  setExcelPreviewStudents([]);
                  setExcelImportStatus(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmExcelImport}
                disabled={excelPreviewStudents.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Confirm & Import {excelPreviewStudents.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

{/* HOD 5-Dimension Monitoring Sheet Upload Modal */}
      {isMonitoringUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    HOD 5-Dimension Skill Bank Monitoring Upload
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload the filled Sample Workbook (name, department, year-wise, mentor + all 5 Dimension coin columns) to update every student record instantly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMonitoringUploadModalOpen(false);
                  setMonitoringPreviewUpdated([]);
                  setMonitoringPreviewCreated([]);
                  setMonitoringImportStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & Instructions */}
            <div className="bg-teal-50 dark:bg-slate-800/80 p-4 rounded-xl border border-teal-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-teal-900 dark:text-teal-300 block">
                  Step 1 — Download the 5D Sample Workbook
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Contains the 5D_Monitoring_Matrix, HOD_Upload_Template (identity pre-filled), Instructions_HOD & Dimension_Matrix sheets.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownload5DSampleSheet}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download 5D Sample Workbook (.xlsx)</span>
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 block">Step 2 — Fill & Upload the Filled Workbook</span>
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                Enter the Grade Coins per category (D1_Attendance … D5_Clubs). Leave 0 where nothing was earned. Register Number is the unique key — existing students are updated, new register numbers get a fresh SSB account.
              </span>
            </div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleMonitoringFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1"
            />

            {isImportingMonitoring && <p className="text-xs text-slate-500">⏳ Parsing monitoring workbook…</p>}
            {monitoringImportStatus && (
              <p className={`text-xs font-bold ${monitoringImportStatus.startsWith('Failed') ? 'text-rose-600' : 'text-emerald-600'}`}>
                {monitoringImportStatus}
              </p>
            )}
{(monitoringPreviewUpdated.length > 0 || monitoringPreviewCreated.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>
                    Monitoring Preview — {monitoringPreviewUpdated.length} to Update · {monitoringPreviewCreated.length} to Create
                  </span>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">
                    Totals are re-computed by the system with hard caps (D1 40k · D2–D5 15k each · Target 1,00,000)
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold border-b dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Reg No</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Dept / Year</th>
                        <th className="p-2.5">Mentor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {monitoringPreviewUpdated.map((st, idx) => (
                        <tr key={`upd-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">UPDATE</span></td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{st.studentProfile.registerNumber}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{st.studentProfile.studentName}</td>
                          <td className="p-2.5">{st.studentProfile.department} · {st.studentProfile.academicYear}</td>
                          <td className="p-2.5 font-medium text-amber-700 dark:text-amber-400">{st.studentProfile.mentorFaculty}</td>
                        </tr>
                      ))}
                      {monitoringPreviewCreated.map((st, idx) => (
                        <tr key={`new-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">NEW</span></td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{st.studentProfile.registerNumber}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{st.studentProfile.studentName}</td>
                          <td className="p-2.5">{st.studentProfile.department} · {st.studentProfile.academicYear}</td>
                          <td className="p-2.5 font-medium text-amber-700 dark:text-amber-400">{st.studentProfile.mentorFaculty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsMonitoringUploadModalOpen(false);
                  setMonitoringPreviewUpdated([]);
                  setMonitoringPreviewCreated([]);
                  setMonitoringImportStatus(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMonitoringImport}
                disabled={monitoringPreviewUpdated.length === 0 && monitoringPreviewCreated.length === 0}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Confirm & Update {monitoringPreviewUpdated.length + monitoringPreviewCreated.length} Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VALIDATION DIAGNOSTICS & CAP REPORT MODAL ----------------- */}
      {isValidationDiagnosticsOpen && validationResult && currentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    validationResult.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Skill Bank Cap Validation Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {currentStudent.studentProfile.studentName}
                    </strong>{' '}
                    ({currentStudent.studentProfile.registerNumber}) • {currentStudent.studentProfile.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsValidationDiagnosticsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Compliance Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Overall Cap Compliance
                  </span>
                  <span
                    className={`text-base font-black ${
                      validationResult.isValid
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {validationResult.isValid ? '100% Compliant' : 'Threshold Exceeded'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Raw Coins Submitted
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {validationResult.totalRawEarned.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Capped Net Coins
                  </span>
                  <span className="text-base font-black text-amber-500">
                    {validationResult.totalCappedEarned.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Truncated Overflow
                  </span>
                  <span className="text-base font-black text-rose-500">
                    +{validationResult.totalOverflowCoins.toLocaleString()} Coins
                  </span>
                </div>
              </div>

              {/* 5 Dimension Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  5 Dimensions Hard Cap Audit
                </h4>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3">Dimension</th>
                        <th className="p-3">Hard Cap</th>
                        <th className="p-3">Raw Earned</th>
                        <th className="p-3">Capped Total</th>
                        <th className="p-3">Overflow</th>
                        <th className="p-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {validationResult.dimensionSummaries.map((dim) => (
                        <tr key={dim.dimensionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {dim.dimensionName}
                          </td>
                          <td className="p-3 text-slate-500">{dim.capLimit.toLocaleString()}</td>
                          <td className="p-3 font-mono">{dim.rawTotal.toLocaleString()}</td>
                          <td className="p-3 font-black text-amber-500">{dim.cappedTotal.toLocaleString()}</td>
                          <td className="p-3 font-mono text-rose-500">
                            {dim.overflowTotal > 0 ? `+${dim.overflowTotal.toLocaleString()}` : '0'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                dim.status === 'OK'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : dim.status === 'WARNING_90'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {dim.status === 'OK'
                                ? '✓ OK'
                                : dim.status === 'WARNING_90'
                                ? '⚠️ 90% Threshold'
                                : '❌ Cap Exceeded'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-Category Detail Violations & Warnings */}
              {validationResult.allViolations.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Sub-Category Cap Alerts & Warnings ({validationResult.allViolations.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {validationResult.allViolations.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-rose-900 dark:text-rose-200">
                            {v.dimensionName} → {v.categoryLabel}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{v.message}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            Raw: {v.rawCoins.toLocaleString()} / Cap: {v.capLimit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-200">
                      Zero Sub-category Cap Violations
                    </h5>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      All individual sub-categories are well within permissible limit boundaries.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                SSB Engine Policy Rules • Auto-clamping {strictEnforcementMode ? 'ACTIVE' : 'INACTIVE'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Audit Report</span>
                </button>
                <button
                  onClick={() => setIsValidationDiagnosticsOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close Diagnostics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PROOF VERIFICATION & DOCUMENT VIEWER MODAL ----------------- */}
      {proofViewerData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full my-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                    {proofViewerData.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {proofViewerData.category} • {proofViewerData.studentName} ({proofViewerData.regNo})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProofViewerData(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Coins Awarded</span>
                  <span className="text-amber-500 font-black text-sm">{proofViewerData.coinsEarned} Coins</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Verification Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-black uppercase ${
                      proofViewerData.status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ✓ {proofViewerData.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Verified By Mentor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{proofViewerData.verifiedBy}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Upload Timestamp</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{proofViewerData.uploadDate}</span>
                </div>
              </div>

              {/* Visual Render Certificate Preview Frame */}
              <div className="border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl p-6 bg-gradient-to-b from-amber-50/40 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-inner text-center space-y-4 relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-20">
                  <Award className="w-24 h-24 text-indigo-600" />
                </div>

                <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-950 rounded-full text-indigo-600 mb-1">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Official Verification Seal • Skill Bank System
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    CERTIFICATE OF ACHIEVEMENT
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified Proof Document for Dimension 2 Skill Track
                  </p>
                </div>

                <div className="my-4 py-3 border-y border-indigo-100 dark:border-indigo-900/60 max-w-lg mx-auto space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">This certifies that student record for</p>
                  <strong className="text-base font-black text-indigo-900 dark:text-indigo-300 block">
                    {proofViewerData.studentName} ({proofViewerData.regNo})
                  </strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    has successfully submitted valid proof for <span className="font-bold text-slate-800 dark:text-slate-200">{proofViewerData.title}</span> ({proofViewerData.platform || 'National Portal'}).
                  </p>
                </div>

                {proofViewerData.remarks && (
                  <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 inline-block">
                    Remarks: {proofViewerData.remarks}
                  </p>
                )}

                <div className="pt-4 flex items-center justify-around text-slate-500 text-[11px] font-mono border-t border-dashed">
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-300">File Attachment:</span>
                    <span>{proofViewerData.fileName}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-300">Mentor Verification Seal:</span>
                    <span className="text-emerald-600 font-bold">APPROVED &amp; AUDITED</span>
                  </div>
                </div>
              </div>

              {/* Mentor Status Change Controls */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Mentor Decision Action:</span>
                  <p className="text-[11px] text-slate-500">Toggle verification status for this student proof submission.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setProofViewerData({ ...proofViewerData, status: 'Verified' });
                      alert('Proof verified and approved for Skill Bank coins calculation!');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      proofViewerData.status === 'Verified'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ✓ Verify &amp; Lock
                  </button>
                  <button
                    onClick={() => {
                      setProofViewerData({ ...proofViewerData, status: 'Rejected' });
                      alert('Proof status updated to Rejected. Student notified to re-upload clear certificate.');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      proofViewerData.status === 'Rejected'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Request Re-upload
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Proof ID: PRF-2026-D2-{currentStudent.studentProfile.registerNumber.slice(-4)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate Proof</span>
                </button>
                <button
                  onClick={() => setProofViewerData(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADD BASIC CERTIFICATE MODAL ----------------- */}
      {isAddBasicCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  5.3 Add Basic Online Certificate (&lt;15 Hrs)
                </h3>
              </div>
              <button onClick={() => setIsAddBasicCertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newLog = {
                  id: `basic_${Date.now()}`,
                  month: 'Jul' as any,
                  platform: basicCertForm.platform,
                  courseName: basicCertForm.courseName,
                  durationHrs: Number(basicCertForm.durationHrs),
                  proofAttached: true,
                  coinsEarned: 100, // 100 coins per basic course
                };

                const existing = currentStudent.onlineCertBasic || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  onlineCertBasic: [...existing, newLog],
                });

                setIsAddBasicCertModalOpen(false);
                setBasicCertForm({ courseName: '', platform: 'Infosys Springboard', durationHrs: 12, fileName: '' });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Course / Certificate Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Programming Fundamentals"
                  value={basicCertForm.courseName}
                  onChange={(e) => setBasicCertForm({ ...basicCertForm, courseName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Platform / Provider:</label>
                  <select
                    value={basicCertForm.platform}
                    onChange={(e) => setBasicCertForm({ ...basicCertForm, platform: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Infosys Springboard">Infosys Springboard</option>
                    <option value="Coursera">Coursera</option>
                    <option value="Udemy">Udemy</option>
                    <option value="NASSCOM">NASSCOM FutureSkills</option>
                    <option value="SkillRack">SkillRack</option>
                    <option value="IBM SkillsBuild">IBM SkillsBuild</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Duration (Hours):</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={basicCertForm.durationHrs}
                    onChange={(e) => setBasicCertForm({ ...basicCertForm, durationHrs: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Certificate Proof (PDF / Image):</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setBasicCertForm({ ...basicCertForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-300 font-medium">
                ✓ Adding this basic certificate awards <strong>+100 Skill Bank Coins</strong> (capped at 1,000 coins max for sub-category 5.3).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBasicCertModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD ADVANCED COURSE MODAL ----------------- */}
      {isAddAdvCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  5.4 Add Advanced Professional Course (&gt;15 Hrs)
                </h3>
              </div>
              <button onClick={() => setIsAddAdvCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newLog = {
                  id: `adv_${Date.now()}`,
                  month: 'Jul' as any,
                  platform: advCourseForm.platform,
                  courseName: advCourseForm.courseName,
                  durationHrs: Number(advCourseForm.durationHrs),
                  verifiedProof: true,
                  remarks: advCourseForm.remarks,
                  coinsEarned: 200, // 200 coins per advanced course
                };

                const existing = currentStudent.advancedCourses || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  advancedCourses: [...existing, newLog],
                });

                setIsAddAdvCourseModalOpen(false);
                setAdvCourseForm({ courseName: '', platform: 'AWS Academy / Cloud', durationHrs: 30, remarks: '', fileName: '' });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Course / Certification Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect Associate"
                  value={advCourseForm.courseName}
                  onChange={(e) => setAdvCourseForm({ ...advCourseForm, courseName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Issuing Body / Platform:</label>
                  <select
                    value={advCourseForm.platform}
                    onChange={(e) => setAdvCourseForm({ ...advCourseForm, platform: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="AWS Academy / Cloud">AWS Academy</option>
                    <option value="Google Cloud Platform">Google Cloud</option>
                    <option value="Cisco Networking">Cisco CCNA</option>
                    <option value="Oracle Java / DB">Oracle Java / DB</option>
                    <option value="RedHat Academy">RedHat Linux</option>
                    <option value="Microsoft Learn / Azure">Microsoft Azure</option>
                    <option value="IEEE Xplore Track">IEEE Track</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Duration (Hours):</label>
                  <input
                    type="number"
                    min={15}
                    value={advCourseForm.durationHrs}
                    onChange={(e) => setAdvCourseForm({ ...advCourseForm, durationHrs: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Specialization / Credly Badge Remarks:</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Architecture &amp; Infrastructure Security"
                  value={advCourseForm.remarks}
                  onChange={(e) => setAdvCourseForm({ ...advCourseForm, remarks: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Professional Certificate Proof:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setAdvCourseForm({ ...advCourseForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                ✓ Adding this advanced course awards <strong>+200 Skill Bank Coins</strong> (capped at 2,000 coins max for sub-category 5.4).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAdvCourseModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD PAPER PRESENTATION MODAL ----------------- */}
      {isAddPaperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  5.5 Add Paper Presentation / Publication Log
                </h3>
              </div>
              <button onClick={() => setIsAddPaperModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let coins = 500;
                if (paperForm.prizeWon.includes('1st Prize')) coins = 1000;
                else if (paperForm.prizeWon.includes('2nd Prize')) coins = 750;

                const newLog = {
                  id: `paper_${Date.now()}`,
                  month: 'Jul' as any,
                  level: paperForm.level,
                  symposiumName: paperForm.symposiumName,
                  title: paperForm.title,
                  venue: paperForm.venue,
                  date: 'July 2026',
                  prizeWon: paperForm.prizeWon,
                  hasCertificate: true,
                  coinsEarned: coins,
                  remarks: 'Certificate verified by mentor',
                };

                const existing = currentStudent.paperPresentations || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  paperPresentations: [...existing, newLog],
                });

                setIsAddPaperModalOpen(false);
                setPaperForm({
                  title: '',
                  symposiumName: '',
                  venue: '',
                  level: 'National',
                  prizeWon: '1st Prize (1,000 Coins)',
                  coinsEarned: 1000,
                  fileName: '',
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Paper Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Based Crop Disease Detection using Deep Learning"
                  value={paperForm.title}
                  onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Symposium / Conference:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INVENTO 2026 Tech Fest"
                    value={paperForm.symposiumName}
                    onChange={(e) => setPaperForm({ ...paperForm, symposiumName: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Venue / Institution:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PSG College of Tech"
                    value={paperForm.venue}
                    onChange={(e) => setPaperForm({ ...paperForm, venue: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Level:</label>
                  <select
                    value={paperForm.level}
                    onChange={(e) => setPaperForm({ ...paperForm, level: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Inter-college">Inter-college</option>
                    <option value="State">State Level</option>
                    <option value="National">National Level</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Prize / Result:</label>
                  <select
                    value={paperForm.prizeWon}
                    onChange={(e) => setPaperForm({ ...paperForm, prizeWon: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="1st Prize (1,000 Coins)">1st Prize (+1,000 Coins)</option>
                    <option value="2nd Prize (750 Coins)">2nd Prize (+750 Coins)</option>
                    <option value="Participation Certificate (500 Coins)">Participation (+500 Coins)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Presentation Certificate (PDF/PNG):</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPaperForm({ ...paperForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                ✓ Adding this paper presentation entry awards coins based on prize result (capped at 2,000 coins max for sub-category 5.5).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPaperModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hackathon Modal */}
      {isAddHackathonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Add Hackathon / Codeathon Log</span>
              </h3>
              <button
                onClick={() => setIsAddHackathonModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!hackathonForm.eventName) return;
                const coinsEarned = Math.min(2000, (hackathonForm.participated ? 1000 : 0) + (hackathonForm.prizeWon ? 1000 : 0));
                const newHack = {
                  id: `HACK-${Date.now()}`,
                  month: hackathonForm.month,
                  eventName: hackathonForm.eventName,
                  participated: hackathonForm.participated,
                  prizeWon: hackathonForm.prizeWon,
                  verifiedByEDC: true,
                  coinsEarned,
                };
                const updatedList = [...(currentStudent.hackathons || []), newHack];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  hackathons: updatedList,
                });
                setIsAddHackathonModalOpen(false);
                setHackathonForm({
                  eventName: '',
                  month: 'Jul',
                  participated: true,
                  prizeWon: true,
                  fileName: '',
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Hackathon / Event Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026 / Internal Codeathon"
                  value={hackathonForm.eventName}
                  onChange={(e) => setHackathonForm({ ...hackathonForm, eventName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hackathonForm.participated}
                    onChange={(e) => setHackathonForm({ ...hackathonForm, participated: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Participated (+1,000 Coins)</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hackathonForm.prizeWon}
                    onChange={(e) => setHackathonForm({ ...hackathonForm, prizeWon: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Prize Winner (+1,000 Coins)</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Certificate Proof (PDF/PNG):</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setHackathonForm({ ...hackathonForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                ✓ EDC Coordinator verification tag will be attached automatically upon saving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddHackathonModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD PROFESSIONAL MEMBERSHIP MODAL ----------------- */}
      {isAddMembershipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  7.5 Add Professional Body Membership
                </h3>
              </div>
              <button onClick={() => setIsAddMembershipModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const coins = membershipForm.membershipType === 'Life' ? 2000 : 1500;
                const newMem = {
                  id: `mem_${Date.now()}`,
                  bodyName: membershipForm.bodyName,
                  membershipType: membershipForm.membershipType,
                  dateOfIssue: membershipForm.dateOfIssue,
                  validity: membershipForm.validity,
                  coinsEarned: coins,
                  verifiedProof: true,
                };

                const existing = currentStudent.professionalMemberships || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  professionalMemberships: [...existing, newMem],
                });

                setIsAddMembershipModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Professional Body / Society Name:</label>
                <select
                  value={membershipForm.bodyName}
                  onChange={(e) => setMembershipForm({ ...membershipForm, bodyName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="IEEE Student Branch">IEEE (Institute of Electrical and Electronics Engineers)</option>
                  <option value="CSI - Computer Society of India">CSI (Computer Society of India)</option>
                  <option value="ISTE - Indian Society for Technical Education">ISTE (Indian Society for Technical Education)</option>
                  <option value="IEI - Institution of Engineers India">IEI (Institution of Engineers India)</option>
                  <option value="ACM Student Chapter">ACM (Association for Computing Machinery)</option>
                  <option value="IETE - Institution of Electronics & Telecom Engineers">IETE</option>
                  <option value="SAE India Student Chapter">SAE India</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Membership Type:</label>
                  <select
                    value={membershipForm.membershipType}
                    onChange={(e) => setMembershipForm({ ...membershipForm, membershipType: e.target.value as 'Annual' | 'Life' })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Annual">Annual Membership (+1,500 Coins)</option>
                    <option value="Life">Life / Long-term Member (+2,000 Coins)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Issue Date:</label>
                  <input
                    type="date"
                    required
                    value={membershipForm.dateOfIssue}
                    onChange={(e) => setMembershipForm({ ...membershipForm, dateOfIssue: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Validity Period:</label>
                <input
                  type="text"
                  placeholder="e.g. AY 2026-2027 / Valid till Dec 2027"
                  value={membershipForm.validity}
                  onChange={(e) => setMembershipForm({ ...membershipForm, validity: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Membership Card / Receipt Proof:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setMembershipForm({ ...membershipForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                ✓ Faculty Advisor verification badge will be attached automatically upon saving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMembershipModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD SPORTS LOG MODAL ----------------- */}
      {isAddSportsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  8.1 Add Sports &amp; Games Log
                </h3>
              </div>
              <button onClick={() => setIsAddSportsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let coins = 1000;
                if (sportsForm.participationLevel === 'District' || sportsForm.participationLevel === 'Zonal') coins = 2000;
                else if (sportsForm.participationLevel === 'State') coins = 3500;
                else if (sportsForm.participationLevel === 'National') coins = 4500;
                else if (sportsForm.participationLevel === 'Winner/Runner') coins = 5000;

                const newSport = {
                  id: `sp_${Date.now()}`,
                  gameSport: sportsForm.gameSport,
                  participationLevel: sportsForm.participationLevel,
                  venue: sportsForm.venue,
                  date: sportsForm.date,
                  resultPosition: sportsForm.resultPosition,
                  coinsEarned: coins,
                  verifiedByPD: true,
                };

                const existing = currentStudent.sportsLogs || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  sportsLogs: [...existing, newSport],
                });

                setIsAddSportsModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Game / Sport Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Athletics / 100m Sprint, Volleyball, Cricket, Chess"
                  value={sportsForm.gameSport}
                  onChange={(e) => setSportsForm({ ...sportsForm, gameSport: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Level of Participation:</label>
                  <select
                    value={sportsForm.participationLevel}
                    onChange={(e) => setSportsForm({ ...sportsForm, participationLevel: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Inter-college">Inter-college / Friendly (+1,000 Coins)</option>
                    <option value="Zonal">District / Zonal (+2,000 Coins)</option>
                    <option value="State">State Level (+3,500 Coins)</option>
                    <option value="National">National Level (+4,500 Coins)</option>
                    <option value="Winner/Runner">Tournament Winner / Runner (+5,000 Coins)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date of Event:</label>
                  <input
                    type="date"
                    required
                    value={sportsForm.date}
                    onChange={(e) => setSportsForm({ ...sportsForm, date: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Venue &amp; Host Institution:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anna University Sports Ground, Chennai"
                  value={sportsForm.venue}
                  onChange={(e) => setSportsForm({ ...sportsForm, venue: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Result / Position Won:</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Place (Gold Medal), Runner-up, Participant"
                  value={sportsForm.resultPosition}
                  onChange={(e) => setSportsForm({ ...sportsForm, resultPosition: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Certificate / Physical Director Endorsement:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSportsForm({ ...sportsForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                ✓ Physical Director verification stamp will be attached automatically upon saving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSportsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD CULTURAL / FINE ARTS MODAL ----------------- */}
      {isAddArtsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  8.2 Add Fine Arts &amp; Cultural Activity Log
                </h3>
              </div>
              <button onClick={() => setIsAddArtsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let coins = 1000;
                if (artsForm.participationLevel === 'Dance/Music/Drama') coins = 1500;
                else if (artsForm.participationLevel === 'State Level') coins = 2500;
                else if (artsForm.participationLevel === 'National Level') coins = 3500;
                else if (artsForm.participationLevel === 'Winner/Best Performer') coins = 5000;

                const newArt = {
                  id: `art_${Date.now()}`,
                  culturalCategory: artsForm.culturalCategory,
                  participationLevel: artsForm.participationLevel,
                  date: artsForm.date,
                  position: artsForm.position,
                  coinsEarned: coins,
                  verifiedProof: true,
                };

                const existing = currentStudent.artsLogs || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  artsLogs: [...existing, newArt],
                });

                setIsAddArtsModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Cultural Category / Event:</label>
                <select
                  value={artsForm.culturalCategory}
                  onChange={(e) => setArtsForm({ ...artsForm, culturalCategory: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Fine Arts / Painting">Fine Arts / Painting &amp; Sketching</option>
                  <option value="Classical & Modern Dance">Classical / Western Dance</option>
                  <option value="Music & Vocal Performance">Music / Instrumental / Vocal</option>
                  <option value="Drama & Mime Act">Drama / Mime / Skit</option>
                  <option value="Debate & Elocution">Debate / Elocution / Quiz</option>
                  <option value="Photography & Short Film">Photography &amp; Short Film Making</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Level &amp; Award Category:</label>
                  <select
                    value={artsForm.participationLevel}
                    onChange={(e) => setArtsForm({ ...artsForm, participationLevel: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Cultural Participation">Cultural Participation (+1,000 Coins)</option>
                    <option value="Dance/Music/Drama">Dance / Music / Drama Performance (+1,500 Coins)</option>
                    <option value="State Level">State Level Fest (+2,500 Coins)</option>
                    <option value="National Level">National Level Cultural (+3,500 Coins)</option>
                    <option value="Winner/Best Performer">1st Prize Winner / Best Performer (+5,000 Coins)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Event Date:</label>
                  <input
                    type="date"
                    required
                    value={artsForm.date}
                    onChange={(e) => setArtsForm({ ...artsForm, date: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Award Position / Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Winner (1st Prize), Special Performance Award"
                  value={artsForm.position}
                  onChange={(e) => setArtsForm({ ...artsForm, position: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Cultural Certificate Proof:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setArtsForm({ ...artsForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                ✓ Fine Arts Club Convener verification badge will be attached upon saving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddArtsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD CLUB ACTIVITY LOG MODAL ----------------- */}
      {isAddClubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  8.3 Add Student Club Activity Log
                </h3>
              </div>
              <button onClick={() => setIsAddClubModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let coins = 500;
                if (clubForm.role === 'Event Organizer' || clubForm.role === 'Coordinator/Lead') coins = 1000;
                else if (clubForm.role === 'Workshop Instructor') coins = 2000;

                const newClub = {
                  id: `club_${Date.now()}`,
                  clubName: clubForm.clubName,
                  role: clubForm.role,
                  activityDetails: clubForm.activityDetails,
                  date: clubForm.date,
                  coinsEarned: coins,
                  verifiedProof: true,
                };

                const existing = currentStudent.clubLogs || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  clubLogs: [...existing, newClub],
                });

                setIsAddClubModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Student Club / Forum Name:</label>
                <select
                  value={clubForm.clubName}
                  onChange={(e) => setClubForm({ ...clubForm, clubName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Rotaract Club of Sasurie">Rotaract Club of Sasurie</option>
                  <option value="Youth Red Cross (YRC) & RRC">Youth Red Cross (YRC) &amp; Red Ribbon</option>
                  <option value="Sasurie Coding & AI Club">Sasurie Coding &amp; AI Club</option>
                  <option value="Fine Arts & Heritage Club">Fine Arts &amp; Heritage Club</option>
                  <option value="IEEE Student Branch Chapter">IEEE Student Branch Chapter</option>
                  <option value="Entrepreneurship Development Cell (EDC)">Entrepreneurship Development Cell (EDC)</option>
                  <option value="Higher Education & Competitive Exam Club">Higher Education &amp; GATE Forum</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Role Held:</label>
                  <select
                    value={clubForm.role}
                    onChange={(e) => setClubForm({ ...clubForm, role: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Member">Club Member (+500 Coins)</option>
                    <option value="Active Participant">Active Event Volunteer (+500 Coins)</option>
                    <option value="Event Organizer">Event Organizer / Lead (+1,000 Coins)</option>
                    <option value="Coordinator/Lead">President / Student Coordinator (+1,000 Coins)</option>
                    <option value="Workshop Instructor">Peer Instructor / Workshop Speaker (+2,000 Coins)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Activity Date:</label>
                  <input
                    type="date"
                    required
                    value={clubForm.date}
                    onChange={(e) => setClubForm({ ...clubForm, date: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Activity Description &amp; Outcome:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organized Blood Donation Camp &amp; Tech Hackathon"
                  value={clubForm.activityDetails}
                  onChange={(e) => setClubForm({ ...clubForm, activityDetails: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Activity Log Proof / Report PDF:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setClubForm({ ...clubForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                ✓ Club Faculty Advisor verification tag will be attached upon saving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClubModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Save &amp; Award Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- LOG DISCIPLINARY VIOLATION MODAL ----------------- */}
      {isAddViolationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Record Disciplinary Coin Retraction Violation
                </h3>
              </div>
              <button onClick={() => setIsAddViolationModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let pct = 3;
                if (violationForm.type === 'Minor/Behavioral') {
                  if (violationForm.occurrenceNo === 1) pct = 3;
                  else if (violationForm.occurrenceNo === 2) pct = 5;
                  else if (violationForm.occurrenceNo === 3) pct = 15;
                  else pct = 50;
                } else {
                  if (violationForm.occurrenceNo === 1) pct = 10;
                  else if (violationForm.occurrenceNo === 2) pct = 25;
                  else pct = 50;
                }

                const coinsDeducted = Math.round(totals.totalGrossEarned * (pct / 100));

                const newViol = {
                  id: `VIOL-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  type: violationForm.type,
                  category: violationForm.category,
                  occurrenceNo: Number(violationForm.occurrenceNo),
                  deductionPct: pct,
                  coinsDeducted: coinsDeducted,
                  recordedBy: violationForm.recordedBy || currentUser?.name || 'Chief Mentor',
                  remarks: violationForm.remarks,
                };

                const existing = currentStudent.violations || [];
                updateSkillBankStudent(currentStudent.studentProfile.registerNumber, {
                  violations: [...existing, newViol],
                });

                setIsAddViolationModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Violation Type:</label>
                  <select
                    value={violationForm.type}
                    onChange={(e) => setViolationForm({ ...violationForm, type: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Minor/Behavioral">Minor / Behavioral Violation</option>
                    <option value="Disciplinary">Major Disciplinary Incident</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Occurrence #:</label>
                  <select
                    value={violationForm.occurrenceNo}
                    onChange={(e) => setViolationForm({ ...violationForm, occurrenceNo: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value={1}>1st Occurrence</option>
                    <option value={2}>2nd Occurrence</option>
                    <option value={3}>3rd Occurrence</option>
                    <option value={4}>4th+ Occurrence (&gt;3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Violation Category:</label>
                <select
                  value={violationForm.category}
                  onChange={(e) => setViolationForm({ ...violationForm, category: e.target.value as any })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Late coming">Late coming / Morning Session Delay</option>
                  <option value="Improper Dress">Improper Dress Code / Uniform Violation</option>
                  <option value="Late Submission">Late Submission of Assignments / Records</option>
                  <option value="No ID Card">No College ID Card / Tag Missing</option>
                  <option value="Attendance Shortage (<75%)">Attendance Shortage (&lt;75%)</option>
                  <option value="Misconduct">Misconduct in Class / Campus</option>
                  <option value="Insubordination">Insubordination to Faculty / Staff</option>
                  <option value="Campus Disruption">Campus Disruption / Property Damage</option>
                  <option value="Other">Other Disciplinary Reason</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Recorded By (Staff / Authority):</label>
                <input
                  type="text"
                  required
                  value={violationForm.recordedBy}
                  onChange={(e) => setViolationForm({ ...violationForm, recordedBy: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Remarks &amp; Action Details:</label>
                <textarea
                  rows={2}
                  required
                  value={violationForm.remarks}
                  onChange={(e) => setViolationForm({ ...violationForm, remarks: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl resize-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload Official Disciplinary Notice / Memo PDF:</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setViolationForm({ ...violationForm, fileName: e.target.files[0].name });
                    }
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-600"
                />
              </div>

              {/* Live Deduction Preview Calculation */}
              {(() => {
                let pct = 3;
                if (violationForm.type === 'Minor/Behavioral') {
                  if (violationForm.occurrenceNo === 1) pct = 3;
                  else if (violationForm.occurrenceNo === 2) pct = 5;
                  else if (violationForm.occurrenceNo === 3) pct = 15;
                  else pct = 50;
                } else {
                  if (violationForm.occurrenceNo === 1) pct = 10;
                  else if (violationForm.occurrenceNo === 2) pct = 25;
                  else pct = 50;
                }
                const estimatedDeduction = Math.round(totals.totalGrossEarned * (pct / 100));

                return (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-black text-rose-900 dark:text-rose-200">
                      <span>Calculated Coin Deduction:</span>
                      <span className="text-sm">-{estimatedDeduction.toLocaleString()} Coins (-{pct}%)</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Calculated as {pct}% against cumulative earned coins ({totals.totalGrossEarned.toLocaleString()} Gross Coins).
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddViolationModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Confirm &amp; Retract Coins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- STUDENT-WISE SKILL BANK REPORT MODAL ----------------- */}
      {isStudentReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            {/* Modal Control Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-4 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-400/30">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                    Student-Wise Official SKILL BANK REPORT Generator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official 5-Dimension Grade Coin Performance Record for HOD Verification &amp; Printing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Select Student Selector in Modal */}
                <select
                  value={selectedReportRegisterNo || currentStudent?.studentProfile?.registerNumber || ''}
                  onChange={(e) => setSelectedReportRegisterNo(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
                >
                  {scopedStudents.map((s) => (
                    <option key={s.studentProfile.registerNumber} value={s.studentProfile.registerNumber}>
                      {s.studentProfile.studentName} ({s.studentProfile.registerNumber} - {s.studentProfile.batch || 'III Year'})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report (PDF)</span>
                </button>

                <button
                  onClick={() => setIsStudentReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Printable Report Content Body */}
            {(() => {
              const repStudent =
                scopedStudents.find((s) => s.studentProfile.registerNumber === (selectedReportRegisterNo || currentStudent?.studentProfile?.registerNumber)) ||
                currentStudent ||
                scopedStudents[0];
              const repTotals = repStudent ? calculateStudentTotals(repStudent) : defaultTotals;

              let gradeTitle = 'A Grade (Very Good)';
              if (repTotals.grandTotalNetCoins >= 90000) gradeTitle = 'S Grade (Outstanding Performance)';
              else if (repTotals.grandTotalNetCoins >= 80000) gradeTitle = 'A+ Grade (Excellent Performance)';
              else if (repTotals.grandTotalNetCoins >= 70000) gradeTitle = 'A Grade (Very Good Performance)';
              else if (repTotals.grandTotalNetCoins >= 60000) gradeTitle = 'B Grade (Good Performance)';
              else gradeTitle = 'C Grade (Progressing)';

              if (!repStudent) {
                return (
                  <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">
                    No student record selected or available in database. Please add or import student data first.
                  </div>
                );
              }

              return (
                <div className="p-6 bg-white text-black font-sans space-y-6 rounded-2xl border border-slate-200 shadow-inner text-xs">
                  {/* Institutional Header */}
                  <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                    <div className="text-lg font-black uppercase tracking-tight text-slate-900">
                      {dailyReport.collegeName || 'SASURIE COLLEGE OF ENGINEERING (AUTONOMOUS)'}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase">
                      Vijayamangalam, Tirupur District - 638056 • Approved by AICTE, Affiliated to Anna University
                    </div>
                    <div className="text-xs font-black uppercase text-amber-800 bg-amber-50 border border-amber-300 py-1.5 px-4 rounded-lg inline-block mt-2">
                      DEPARTMENT OF {(repStudent.studentProfile.department || 'Artificial Intelligence & Data Science').toUpperCase()} — SKILL BANK REPORT
                    </div>
                  </div>

                  {/* Student Demographic Profile Block */}
                  <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3.5 rounded-xl bg-slate-50">
                    <div className="space-y-1">
                      <div><strong>Student Name:</strong> {repStudent.studentProfile.studentName}</div>
                      <div><strong>Register Number:</strong> {repStudent.studentProfile.registerNumber}</div>
                      <div><strong>Degree &amp; Branch:</strong> {repStudent.studentProfile.degreeBranch}</div>
                      <div><strong>Class Section:</strong> Section {repStudent.studentProfile.section}</div>
                    </div>
                    <div className="space-y-1">
                      <div><strong>SSB Account Number:</strong> {repStudent.studentProfile.skillBankAccountNo}</div>
                      <div><strong>Academic Year &amp; Batch:</strong> AY 2026–2027 ({repStudent.studentProfile.batch})</div>
                      <div><strong>Semester:</strong> {repStudent.studentProfile.semester}</div>
                      <div><strong>Assigned Faculty Mentor:</strong> {repStudent.studentProfile.mentorFaculty}</div>
                    </div>
                  </div>

                  {/* 5 Dimensions Table Breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-black text-xs uppercase border-b border-slate-400 pb-1 flex items-center justify-between">
                      <span>5-Dimension Grade Coin Capped Score Sheet</span>
                      <span className="text-[10px] text-slate-600 font-bold">Hard Cap Enforcement: CAPPED AT 1,00,000 COINS</span>
                    </h4>

                    <table className="w-full text-xs border border-collapse border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-100 font-black border-b border-slate-300 text-slate-900">
                          <th className="p-2.5 border border-slate-300">#</th>
                          <th className="p-2.5 border border-slate-300">Dimension Track Description</th>
                          <th className="p-2.5 border border-slate-300 text-center">Weightage</th>
                          <th className="p-2.5 border border-slate-300 text-center">Dimension Cap</th>
                          <th className="p-2.5 border border-slate-300 text-center">Raw Earned</th>
                          <th className="p-2.5 border border-slate-300 text-center font-bold">Capped Awarded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="p-2.5 border border-slate-300 font-bold">Dim 1</td>
                          <td className="p-2.5 border border-slate-300">Academic Performance (Credits, CGPA, Library)</td>
                          <td className="p-2.5 border border-slate-300 text-center">40%</td>
                          <td className="p-2.5 border border-slate-300 text-center">40,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.d1.rawTotal.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-black text-blue-700">{repTotals.d1.cappedTotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300 font-bold">Dim 2</td>
                          <td className="p-2.5 border border-slate-300">Skill Development &amp; Certification (Infosys, AWS, NPTEL)</td>
                          <td className="p-2.5 border border-slate-300 text-center">15%</td>
                          <td className="p-2.5 border border-slate-300 text-center">15,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.d2.rawTotal.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-black text-indigo-700">{repTotals.d2.cappedTotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300 font-bold">Dim 3</td>
                          <td className="p-2.5 border border-slate-300">Internship, Research &amp; Patents Track</td>
                          <td className="p-2.5 border border-slate-300 text-center">15%</td>
                          <td className="p-2.5 border border-slate-300 text-center">15,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.d3.rawTotal.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-black text-emerald-700">{repTotals.d3.cappedTotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300 font-bold">Dim 4</td>
                          <td className="p-2.5 border border-slate-300">Co-Curricular Performance (Workshops, VAC, EDC)</td>
                          <td className="p-2.5 border border-slate-300 text-center">15%</td>
                          <td className="p-2.5 border border-slate-300 text-center">15,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.d4.rawTotal.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-black text-amber-700">{repTotals.d4.cappedTotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border border-slate-300 font-bold">Dim 5</td>
                          <td className="p-2.5 border border-slate-300">Extra-Curricular, Sports &amp; Cultural Track</td>
                          <td className="p-2.5 border border-slate-300 text-center">15%</td>
                          <td className="p-2.5 border border-slate-300 text-center">15,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.d5.rawTotal.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-black text-purple-700">{repTotals.d5.cappedTotal.toLocaleString()}</td>
                        </tr>

                        <tr className="font-black bg-slate-100">
                          <td colSpan={3} className="p-2.5 border border-slate-300 text-right uppercase">CUMULATIVE GROSS EARNED:</td>
                          <td className="p-2.5 border border-slate-300 text-center">1,00,000</td>
                          <td className="p-2.5 border border-slate-300 text-center">{repTotals.totalGrossEarned.toLocaleString()}</td>
                          <td className="p-2.5 border border-slate-300 text-center text-slate-900">{repTotals.totalGrossEarned.toLocaleString()}</td>
                        </tr>

                        {repTotals.totalDeductions > 0 && (
                          <tr className="font-bold text-rose-700 bg-rose-50">
                            <td colSpan={5} className="p-2.5 border border-slate-300 text-right uppercase">LESS: DISCIPLINARY RETRACTION DEDUCTIONS:</td>
                            <td className="p-2.5 border border-slate-300 text-center">-{repTotals.totalDeductions.toLocaleString()}</td>
                          </tr>
                        )}

                        <tr className="font-black text-sm bg-amber-100 text-amber-950">
                          <td colSpan={5} className="p-3 border border-slate-300 text-right uppercase">FINAL CONSOLIDATED NET GRADE COINS:</td>
                          <td className="p-3 border border-slate-300 text-center text-base font-black">{repTotals.grandTotalNetCoins.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Grade Award Banner */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-400">Awarded Semester Grade Classification</div>
                      <div className="text-base font-black text-white">{gradeTitle}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-400">{repTotals.percentageOfTarget}%</div>
                      <div className="text-[10px] text-slate-300">Of 1,00,000 Target Coins</div>
                    </div>
                  </div>

                  {/* Institutional Signatures Block */}
                  <div className="pt-10 grid grid-cols-3 gap-6 text-center font-bold text-xs">
                    <div>
                      <div className="border-t-2 border-slate-800 pt-2 text-slate-800">Faculty Mentor Signature</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-slate-800 pt-2 text-slate-800">Head of Department (HOD) Signature</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-slate-800 pt-2 text-slate-800">Principal Signature</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-slate-800 no-print">
              <button
                onClick={() => setIsStudentReportModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer text-xs"
              >
                Close Report
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Report PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div id="printable-passbook" className="hidden print:block p-8 bg-white text-black font-sans space-y-6">
        <div className="border-b-2 border-black pb-4 text-center">
          <div className="text-xl font-black uppercase">
            {dailyReport.collegeName || 'SASURIE COLLEGE OF ENGINEERING (AUTONOMOUS)'}
          </div>
          <div className="text-xs font-bold uppercase mt-1">
            Vijayamangalam, Tirupur District - 638056 • Approved by AICTE, Affiliated to Anna University
          </div>
          <div className="text-sm font-black uppercase mt-3 bg-black text-white py-1">
            SASURIE SKILL BANK (SSB) — GRADE COIN PASSBOOK (AY 2026–2027)
          </div>
        </div>

        {currentStudent ? (
          <div className="grid grid-cols-2 gap-4 text-xs border p-3">
            <div>
              <div><strong>Student Name:</strong> {currentStudent.studentProfile.studentName}</div>
              <div><strong>Register Number:</strong> {currentStudent.studentProfile.registerNumber}</div>
              <div><strong>Degree & Branch:</strong> {currentStudent.studentProfile.degreeBranch}</div>
            </div>
            <div>
              <div><strong>SSB Account No:</strong> {currentStudent.studentProfile.skillBankAccountNo}</div>
              <div><strong>Semester & Batch:</strong> {currentStudent.studentProfile.semester} ({currentStudent.studentProfile.batch})</div>
              <div><strong>Faculty Mentor:</strong> {currentStudent.studentProfile.mentorFaculty}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs italic p-3 border">No student profile selected.</div>
        )}

        <div className="space-y-2">
          <h4 className="font-black text-xs uppercase border-b pb-1">5 Dimensions Summary & Caps</h4>
          <table className="w-full text-xs border border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-100 font-bold">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Dimension of Excellence</th>
                <th className="p-2 border">Max Cap</th>
                <th className="p-2 border">Coins Earned</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border">1</td>
                <td className="p-2 border">Academic Performance</td>
                <td className="p-2 border">40,000</td>
                <td className="p-2 border font-bold">{totals.d1.cappedTotal}</td>
              </tr>
              <tr>
                <td className="p-2 border">2</td>
                <td className="p-2 border">Skill Development and Certification</td>
                <td className="p-2 border">15,000</td>
                <td className="p-2 border font-bold">{totals.d2.cappedTotal}</td>
              </tr>
              <tr>
                <td className="p-2 border">3</td>
                <td className="p-2 border">Internship and Career Readiness</td>
                <td className="p-2 border">15,000</td>
                <td className="p-2 border font-bold">{totals.d3.cappedTotal}</td>
              </tr>
              <tr>
                <td className="p-2 border">4</td>
                <td className="p-2 border">Co-Curricular Performance</td>
                <td className="p-2 border">15,000</td>
                <td className="p-2 border font-bold">{totals.d4.cappedTotal}</td>
              </tr>
              <tr>
                <td className="p-2 border">5</td>
                <td className="p-2 border">Extra-Curricular and Talent Track</td>
                <td className="p-2 border">15,000</td>
                <td className="p-2 border font-bold">{totals.d5.cappedTotal}</td>
              </tr>
              <tr className="font-black bg-gray-100">
                <td colSpan={2} className="p-2 border text-right">TOTAL GROSS EARNED:</td>
                <td className="p-2 border">1,00,000</td>
                <td className="p-2 border">{totals.totalGrossEarned}</td>
              </tr>
              <tr className="font-bold text-red-600">
                <td colSpan={3} className="p-2 border text-right">LESS: DISCIPLINARY RETRACTION DEDUCTIONS:</td>
                <td className="p-2 border">-{totals.totalDeductions}</td>
              </tr>
              <tr className="font-black text-sm bg-gray-200">
                <td colSpan={3} className="p-2 border text-right">FINAL NET GRADE COINS:</td>
                <td className="p-2 border">{totals.grandTotalNetCoins.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-4 text-center text-xs font-bold">
          <div>
            <div className="border-t pt-2">Student Signature</div>
          </div>
          <div>
            <div className="border-t pt-2">Faculty Mentor Signature</div>
          </div>
          <div>
            <div className="border-t pt-2">HoD Signature</div>
          </div>
        </div>
      </div>

      {/* MODAL: Batch Class CIAT Entry */}
      {isBatchCiatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  ⚡ Batch Class CIAT Mark Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Bulk mark entry for all students in {fallbackDept}
                </p>
              </div>
              <button
                onClick={() => setIsBatchCiatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination
                </label>
                <select
                  value={batchCiatExam}
                  onChange={(e) => {
                    const newExam = e.target.value as 'CIAT 1' | 'CIAT 2';
                    setBatchCiatExam(newExam);
                    // refresh marks
                    const updated: Record<string, number> = {};
                    scopedStudents.forEach((st) => {
                      const sub = (st.subjectMarkDetails || []).find(
                        (s) => s.subjectCode.toUpperCase() === batchSubjectCode.toUpperCase()
                      );
                      updated[st.studentProfile.registerNumber] =
                        newExam === 'CIAT 1' ? sub?.ciat1Marks || 0 : sub?.ciat2Marks || 0;
                    });
                    setBatchStudentMarks(updated);
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-purple-600"
                >
                  <option value="CIAT 1">CIAT 1 (Continuous Internal Assessment 1)</option>
                  <option value="CIAT 2">CIAT 2 (Continuous Internal Assessment 2)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={batchSubjectCode}
                  onChange={(e) => setBatchSubjectCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase"
                  placeholder="e.g. CS3401"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={batchSubjectName}
                  onChange={(e) => setBatchSubjectName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  placeholder="e.g. Data Structures"
                />
              </div>
            </div>

            {/* Table of Students */}
            <div className="overflow-x-auto border rounded-xl border-slate-200 dark:border-slate-800 max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold">
                  <tr>
                    <th className="p-2.5">S.No</th>
                    <th className="p-2.5">Register No</th>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Year / Sec</th>
                    <th className="p-2.5 text-center">{batchCiatExam} Mark (/100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {scopedStudents.map((st, idx) => (
                    <tr key={st.studentProfile.registerNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {st.studentProfile.registerNumber}
                      </td>
                      <td className="p-2.5 font-bold">{st.studentProfile.studentName}</td>
                      <td className="p-2.5 text-slate-500">
                        {st.studentProfile.academicYear} ({st.studentProfile.section})
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={batchStudentMarks[st.studentProfile.registerNumber] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBatchStudentMarks((prev) => ({
                              ...prev,
                              [st.studentProfile.registerNumber]: val,
                            }));
                          }}
                          className="w-20 p-1.5 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                    </tr>
                  ))}
                  {scopedStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        No students found for current department scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Saving will update {batchCiatExam} marks &amp; recalculate coins for {scopedStudents.length} students.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchCiatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    scopedStudents.forEach((st) => {
                      const regNo = st.studentProfile.registerNumber;
                      const mark = batchStudentMarks[regNo] ?? 0;
                      const subjects = [...(st.subjectMarkDetails || [])];
                      const existingIdx = subjects.findIndex(
                        (s) => s.subjectCode.toUpperCase() === batchSubjectCode.toUpperCase()
                      );

                      if (existingIdx >= 0) {
                        if (batchCiatExam === 'CIAT 1') {
                          subjects[existingIdx] = { ...subjects[existingIdx], ciat1Marks: mark };
                        } else {
                          subjects[existingIdx] = { ...subjects[existingIdx], ciat2Marks: mark };
                        }
                      } else {
                        subjects.push({
                          id: `SM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          subjectCode: batchSubjectCode.toUpperCase(),
                          subjectName: batchSubjectName,
                          ciat1Marks: batchCiatExam === 'CIAT 1' ? mark : 0,
                          ciat2Marks: batchCiatExam === 'CIAT 2' ? mark : 0,
                          assignment1Marks: 10,
                          assignment2Marks: 10,
                          modelLabMarks: 85,
                        });
                      }

                      // Recalculate average CIAT 1 & CIAT 2 %
                      const sum1 = subjects.reduce((acc, s) => acc + (Number(s.ciat1Marks) || 0), 0);
                      const sum2 = subjects.reduce((acc, s) => acc + (Number(s.ciat2Marks) || 0), 0);
                      const avg1 = subjects.length > 0 ? Math.round(sum1 / subjects.length) : 0;
                      const avg2 = subjects.length > 0 ? Math.round(sum2 / subjects.length) : 0;

                      const ep = st.examPerformance || {
                        ciat1Appeared: true,
                        ciat1Pct: 80,
                        ciat2Appeared: true,
                        ciat2Pct: 80,
                        endSemAllPass: true,
                        arrearCount: 0,
                        coinsEarned: 8000,
                      };

                      let coins = 0;
                      if (ep.ciat1Appeared) {
                        if (avg1 >= 90) coins += 5000;
                        else if (avg1 >= 80) coins += 4000;
                        else if (avg1 >= 70) coins += 3000;
                        else if (avg1 >= 60) coins += 2000;
                        else if (avg1 > 0) coins += 1000;
                      }
                      if (ep.ciat2Appeared) {
                        if (avg2 >= 90) coins += 5000;
                        else if (avg2 >= 80) coins += 4000;
                        else if (avg2 >= 70) coins += 3000;
                        else if (avg2 >= 60) coins += 2000;
                        else if (avg2 > 0) coins += 1000;
                      }
                      if (ep.ciat1Appeared && ep.ciat2Appeared && (ep.arrearCount === 0 || ep.endSemAllPass)) {
                        coins += 2000;
                      }

                      updateSkillBankStudent(regNo, {
                        subjectMarkDetails: subjects,
                        examPerformance: {
                          ...ep,
                          ciat1Pct: avg1,
                          ciat2Pct: avg2,
                          coinsEarned: Math.min(12000, coins),
                        },
                      });
                    });

                    alert(`Successfully saved ${batchCiatExam} marks for ${batchSubjectCode} across ${scopedStudents.length} students.`);
                    setIsBatchCiatModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  Save All Class Marks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
