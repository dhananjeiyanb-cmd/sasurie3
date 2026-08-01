import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getScopedStudents, getScopedStaff, getDeptHodName } from '../utils/departmentUtils';
import {
  MONTH_LIST,
  MonthKey,
  StudentSkillBankData,
} from '../types/skillBank';
import {
  calculateStudentTotals,
  calculateAttendanceCoins,
} from '../data/mockSkillBank';
import {
  downloadHODStudentTemplate,
  parseExcelStudentFile,
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
  
  // Mentor Scoping & User Access Role
  const [userScopeMode, setUserScopeMode] = useState<'hod' | 'mentor'>(
    currentUser?.role === 'staff' ? 'mentor' : 'hod'
  );
  const [activeMentorName, setActiveMentorName] = useState<string>(
    currentUser?.name || 'M. Kaviyarasu (Asst. Prof / III Year Mentor)'
  );

  const showDataEntryTabs = isStaff;

  // Synchronize Staff mode restrictions whenever currentUser changes
  React.useEffect(() => {
    if (isStaff) {
      if (userScopeMode !== 'mentor') {
        setUserScopeMode('mentor');
      }
      if (activeMainTab === 'hod_overview') {
        setActiveMainTab('profile');
      }
      if (currentUser?.name && !activeMentorName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) {
        setActiveMentorName(currentUser.name);
      }
    }
  }, [currentUser, isStaff, activeMainTab, userScopeMode, activeMentorName]);

  // Synchronize HOD mode restrictions so HOD doesn't access data entry tabs (Dim 1 to Transformation Logs)
  React.useEffect(() => {
    if (!isStaff && activeMainTab !== 'hod_overview' && activeMainTab !== 'profile' && activeMainTab !== 'leaderboard') {
      setActiveMainTab('hod_overview');
    }
  }, [isStaff, activeMainTab]);

  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Excel Bulk Import Modal State
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [excelPreviewStudents, setExcelPreviewStudents] = useState<StudentSkillBankData[]>([]);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelImportStatus, setExcelImportStatus] = useState<string | null>(null);
  const [selectedDefaultMentorForExcel, setSelectedDefaultMentorForExcel] = useState<string>(
    'M. Kaviyarasu (Asst. Prof / III Year Mentor)'
  );

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
    const matchesSearch =
      term === '' ||
      s.studentProfile.studentName.toLowerCase().includes(term) ||
      s.studentProfile.registerNumber.toLowerCase().includes(term);

    const matchesDept =
      selectedDeptFilter === 'all' || s.studentProfile.department === selectedDeptFilter;

    const matchesYear =
      selectedYearFilter === 'all' ||
      (selectedYearFilter === 'III Year' && (s.studentProfile.batch === '2023-2027' || s.studentProfile.semester.includes('Sem V') || s.studentProfile.semester.includes('Sem VI'))) ||
      (selectedYearFilter === 'II Year' && (s.studentProfile.batch === '2024-2028' || s.studentProfile.semester.includes('Sem III') || s.studentProfile.semester.includes('Sem IV'))) ||
      (selectedYearFilter === 'IV Year' && (s.studentProfile.batch === '2022-2026' || s.studentProfile.semester.includes('Sem VII') || s.studentProfile.semester.includes('Sem VIII'))) ||
      (selectedYearFilter === 'I Year' && (s.studentProfile.batch === '2025-2029' || s.studentProfile.semester.includes('Sem I') || s.studentProfile.semester.includes('Sem II')));

    let matchesMentor = true;
    if (selectedMentorFilter !== 'all') {
      matchesMentor = (s.studentProfile.mentorFaculty || '').toLowerCase().includes(selectedMentorFilter.toLowerCase());
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
        (s) => s.studentProfile.registerNumber.trim().toLowerCase() === selectedRegisterNo?.trim().toLowerCase()
      );
      if (!existsInDropdown) {
        setSelectedRegisterNo(dropdownStudents[0].studentProfile.registerNumber);
      }
    }
  }, [dropdownStudents, selectedRegisterNo]);

  // Selected Student Record
  const currentStudent =
    dropdownStudents.find((s) => s.studentProfile.registerNumber.trim().toLowerCase() === selectedRegisterNo?.trim().toLowerCase()) ||
    dropdownStudents[0] ||
    scopedStudents[0] ||
    skillBankStudents[0];

  const totals = currentStudent ? calculateStudentTotals(currentStudent) : null;

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

  // Quick Print Function for Skill Bank Passbook
  const handlePrintPassbook = () => {
    setIsPrintingPassbook(true);
    setTimeout(() => {
      window.print();
      setIsPrintingPassbook(false);
    }, 300);
  };

  if (!currentStudent || !totals) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        No student record found. Click "Add Student" to create a new profile.
      </div>
    );
  }

  const libChecklistData = currentStudent.libraryChecklist || {
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

          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Individual Student Header, Net Coins & Validation Engine (Staff Mentor Mode Only) */}
      {isStaff && (
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
                    const targetReg = selectedReportRegisterNo || currentStudent.studentProfile.registerNumber;
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
                const count = scopedStudents.filter((s) => {
                  if (yr === 'all') return true;
                  if (yr === 'I Year') return s.studentProfile.batch === '2025-2029' || s.studentProfile.semester.includes('Sem I') || s.studentProfile.semester.includes('Sem II');
                  if (yr === 'II Year') return s.studentProfile.batch === '2024-2028' || s.studentProfile.semester.includes('Sem III') || s.studentProfile.semester.includes('Sem IV');
                  if (yr === 'III Year') return s.studentProfile.batch === '2023-2027' || s.studentProfile.semester.includes('Sem V') || s.studentProfile.semester.includes('Sem VI');
                  if (yr === 'IV Year') return s.studentProfile.batch === '2022-2026' || s.studentProfile.semester.includes('Sem VII') || s.studentProfile.semester.includes('Sem VIII');
                  return true;
                }).length;

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
            const cohortStudents = scopedStudents.filter((s) => {
              if (hodYearFilterTab === 'all') return true;
              if (hodYearFilterTab === 'I Year') return s.studentProfile.batch === '2025-2029' || s.studentProfile.semester.includes('Sem I') || s.studentProfile.semester.includes('Sem II');
              if (hodYearFilterTab === 'II Year') return s.studentProfile.batch === '2024-2028' || s.studentProfile.semester.includes('Sem III') || s.studentProfile.semester.includes('Sem IV');
              if (hodYearFilterTab === 'III Year') return s.studentProfile.batch === '2023-2027' || s.studentProfile.semester.includes('Sem V') || s.studentProfile.semester.includes('Sem VI');
              if (hodYearFilterTab === 'IV Year') return s.studentProfile.batch === '2022-2026' || s.studentProfile.semester.includes('Sem VII') || s.studentProfile.semester.includes('Sem VIII');
              return true;
            });

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
                    setSelectedReportRegisterNo(currentStudent.studentProfile.registerNumber);
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
                      if (hodYearFilterTab === 'all') return true;
                      if (hodYearFilterTab === 'I Year') return s.studentProfile.batch === '2025-2029' || s.studentProfile.semester.includes('Sem I') || s.studentProfile.semester.includes('Sem II');
                      if (hodYearFilterTab === 'II Year') return s.studentProfile.batch === '2024-2028' || s.studentProfile.semester.includes('Sem III') || s.studentProfile.semester.includes('Sem IV');
                      if (hodYearFilterTab === 'III Year') return s.studentProfile.batch === '2023-2027' || s.studentProfile.semester.includes('Sem V') || s.studentProfile.semester.includes('Sem VI');
                      if (hodYearFilterTab === 'IV Year') return s.studentProfile.batch === '2022-2026' || s.studentProfile.semester.includes('Sem VII') || s.studentProfile.semester.includes('Sem VIII');
                      return true;
                    })
                    .map((st) => {
                      const stTotals = calculateStudentTotals(st);
                      const isSelected = st.studentProfile.registerNumber === currentStudent.studentProfile.registerNumber;

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

      {/* ----------------- TAB 1: STUDENT PROFILE MASTER ----------------- */}
      {activeMainTab === 'profile' && (
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
      {activeMainTab === 'dim1' && (
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
                    <th className="p-2.5">Auto Calculated Coins</th>
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
                        updatedEntry.coinsEarned = calculateAttendanceCoins(pct);
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
                        <td className="p-2.5 font-black text-amber-600 dark:text-amber-400">
                          {entry.coinsEarned.toLocaleString()} Coins
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
                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  4.5.2 ICT Tools Usage (Max 2,500)
                </h4>
                <span className="text-xs font-bold text-amber-500">
                  {totals.d1.ictToolsCoins} Coins
                </span>
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
        </div>
      )}

      {/* ----------------- TAB 3: DIMENSION 2 — SKILL DEVELOPMENT (Cap 15k) ----------------- */}
      {activeMainTab === 'dim2' && (
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
                    defaultValue={`leetcode.com/u/${currentStudent.studentProfile.registerNumber.toLowerCase()}`}
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
      {activeMainTab === 'dim3' && (
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
      {activeMainTab === 'dim4' && (
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
      {activeMainTab === 'dim5' && (
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
      {activeMainTab === 'retraction' && (
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
      {activeMainTab === 'journey' && (
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
                Enter your deployed <strong>Google Apps Script Web App URL</strong> to sync student Grade Coins directly into your 15-sheet Google Spreadsheet workbook.
              </p>
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

                const newStudent: StudentSkillBankData = {
                  studentProfile: {
                    id: `STU-${Date.now()}`,
                    registerNumber: regNo,
                    studentName: name,
                    skillBankAccountNo: `SSB-2026-CS-${Math.floor(100 + Math.random() * 900)}`,
                    degreeBranch: 'B.E. Computer Science & Engineering',
                    department: 'Computer Science & Engineering',
                    batch: '2023-2027',
                    academicYear: '2026-2027',
                    semester: 'Odd Semester (Sem V)',
                    section: section || 'A',
                    admissionNumber: `SCE2023CS${Math.floor(100 + Math.random() * 900)}`,
                    gender: 'Male',
                    age: 20,
                    bloodGroup: 'O+',
                    motherTongue: 'Tamil',
                    nationality: 'Indian',
                    aadhaarNo: 'XXXX-XXXX-XXXX',
                    dateOfBirth: '2005-01-01',
                    communicationAddress: 'Tirupur, Tamil Nadu',
                    pinCode: '638056',
                    studentMobile: '9000000000',
                    studentEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@sasurie.ac.in`,
                    personalEmail: `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                    fatherName: 'Parent Name',
                    fatherOccupation: 'Business',
                    fatherMobile: '9000000001',
                    fatherEmail: 'parent@gmail.com',
                    motherName: 'Mother Name',
                    motherOccupation: 'Homemaker',
                    motherMobile: '9000000002',
                    motherEmail: 'mother@gmail.com',
                    sslcSchool: 'School Name',
                    hscSchool: 'Higher Sec School',
                    yearOfPassing: '2023',
                    admissionCategory: 'Government Quota',
                    mentorFaculty: 'Dr. M. Karthikeyan',
                    dreamCompany: 'Zoho / TCS',
                    careerGoal: 'Software Development Engineer',
                    studentSigned: true,
                    studentSignedDate: new Date().toISOString().split('T')[0],
                    mentorSigned: true,
                    mentorSignedDate: new Date().toISOString().split('T')[0],
                    hodSigned: true,
                    hodSignedDate: new Date().toISOString().split('T')[0],
                  },
                  attendanceMonths: {
                    Jul: { totalDays: 20, daysAttended: 18, attendancePct: 90, additionalRemedialDays: 0, coinsEarned: 3000 },
                    Aug: { totalDays: 20, daysAttended: 19, attendancePct: 95, additionalRemedialDays: 0, coinsEarned: 5000 },
                    Sep: { totalDays: 20, daysAttended: 19, attendancePct: 95, additionalRemedialDays: 0, coinsEarned: 5000 },
                    Oct: { totalDays: 20, daysAttended: 18, attendancePct: 90, additionalRemedialDays: 0, coinsEarned: 3000 },
                    Nov: { totalDays: 20, daysAttended: 18, attendancePct: 90, additionalRemedialDays: 0, coinsEarned: 3000 },
                    Dec: { totalDays: 15, daysAttended: 15, attendancePct: 100, additionalRemedialDays: 0, coinsEarned: 8000 },
                  },
                  libraryBooks: [],
                  libraryVisits: [],
                  feePayment: {
                    tuitionFeePaid: true,
                    hostelFeePaid: false,
                    transportFeePaid: true,
                    scholarshipReceived: false,
                    examFeePaid: true,
                    dateOfPayment: '2026-07-20',
                    paymentBand: 'before_due',
                    coinsEarned: 5000,
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
                  miniProjectDetails: [],
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
                    ciat1Pct: 80,
                    ciat2Appeared: true,
                    ciat2Pct: 82,
                    endSemAllPass: true,
                    arrearCount: 0,
                    coinsEarned: 8000,
                  },
                  subjectMarkDetails: [],
                  learnerCategory: { ciat1Category: 'Moderate', ciat2Category: 'Fast', remedialAttendancePct: 90, remedialBonusEarned: false, coinsEarned: 2500 },
                  endSemResults: { allPass: true, arrearsCount: 0, gpa: 8.2, cgpa: 8.1, coinsEarned: 5000 },
                  nptelMonths: {
                    Jul: { registrationDone: true, weeklyTestsDone: true, examApplied: true, resultStatus: 'Pass', coinsEarned: 2000 },
                    Aug: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
                    Sep: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
                    Oct: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
                    Nov: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
                    Dec: { registrationDone: false, weeklyTestsDone: false, examApplied: false, resultStatus: 'None', coinsEarned: 0 },
                  },
                  leetCodeMonths: {
                    Jul: { taskCompleted: true, attendanceBand: '70-79%', coinsEarned: 1500 },
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
                    Jul: { attended: true, scoreBand: 'Score >= 60', coinsEarned: 2500 },
                    Aug: { attended: false, scoreBand: 'None', coinsEarned: 0 },
                    Sep: { attended: false, scoreBand: 'None', coinsEarned: 0 },
                    Oct: { attended: false, scoreBand: 'None', coinsEarned: 0 },
                    Nov: { attended: false, scoreBand: 'None', coinsEarned: 0 },
                    Dec: { attended: false, scoreBand: 'None', coinsEarned: 0 },
                  },
                  resume: { workshopAttended: true, atsScorePct: 85, enteredByCDC: true, coinsEarned: 2000 },
                  mockInterview: { attended: true, performanceBand: 'Moderate', enteredByCDC: true, coinsEarned: 1250 },
                  linkedIn: { profileCreated: true, originalPostCount: 2, repostCount: 2, coinsEarned: 800 },
                  gitHub: { portfolioCompleted: true, assessmentBand: '50-74', coinsEarned: 450 },
                  socialMedia: { profileCreated: true, originalPostCount: 1, repostCount: 1, coinsEarned: 400 },
                  hackathons: [],
                  internship: { industryName: 'TCS Internship', fromDate: '2026-06-01', toDate: '2026-06-15', totalDays: 15, type: 'Summer', internshipDone: true, certificateReceived: true, reportCompleted: true, fullTimeConverted: false, startupActivity: false, coinsEarned: 1000 },
                  workshop: { certificationCompleted: true, reportOnLearning: true, industrialVisitParticipation: true, coinsEarned: 4000 },
                  collegeEvent: { paidValueAddedCourse: true, eventParticipation: true, eventWinner: false, coinsEarned: 3000 },
                  volunteering: { nssNccActivity: true, communityAwareness: true, leadershipRole: false, coinsEarned: 3000 },
                  professionalMemberships: [],
                  sportsLogs: [],
                  artsLogs: [],
                  clubLogs: [],
                  violations: [],
                  counsellingLogs: [],
                  parentMeetingLogs: [],
                  transformationJourney: {
                    academicReflection: 'Good performance.',
                    skillReflection: 'Improving coding skills.',
                    careerReflection: 'Targeting campus placements.',
                    coCurricularReflection: 'Active participation.',
                    extraCurricularReflection: 'Member of sports team.',
                    checkpoint1Date: '2026-08-30',
                    checkpoint1Coins: 35000,
                    checkpoint1Grade: 'A',
                    checkpoint2Date: '2026-11-30',
                    checkpoint2Coins: 65000,
                    checkpoint2Grade: 'A+',
                    finalGradeCoin: 72000,
                    finalGradeLetter: 'A+',
                  },
                };

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
                  value={selectedReportRegisterNo || currentStudent.studentProfile.registerNumber}
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
                scopedStudents.find((s) => s.studentProfile.registerNumber === (selectedReportRegisterNo || currentStudent.studentProfile.registerNumber)) ||
                currentStudent;
              const repTotals = calculateStudentTotals(repStudent);

              let gradeTitle = 'A Grade (Very Good)';
              if (repTotals.grandTotalNetCoins >= 90000) gradeTitle = 'S Grade (Outstanding Performance)';
              else if (repTotals.grandTotalNetCoins >= 80000) gradeTitle = 'A+ Grade (Excellent Performance)';
              else if (repTotals.grandTotalNetCoins >= 70000) gradeTitle = 'A Grade (Very Good Performance)';
              else if (repTotals.grandTotalNetCoins >= 60000) gradeTitle = 'B Grade (Good Performance)';
              else gradeTitle = 'C Grade (Progressing)';

              return (
                <div className="p-6 bg-white text-black font-sans space-y-6 rounded-2xl border border-slate-200 shadow-inner text-xs">
                  {/* Institutional Header */}
                  <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                    <div className="text-lg font-black uppercase tracking-tight text-slate-900">
                      SASURIE COLLEGE OF ENGINEERING (AUTONOMOUS)
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
    </div>
  );
};
