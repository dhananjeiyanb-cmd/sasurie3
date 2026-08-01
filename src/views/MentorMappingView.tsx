import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSkillBankData, StudentProfile } from '../types/skillBank';
import { stripSkillBankDates, INITIAL_STUDENTS_SKILL_BANK } from '../data/mockSkillBank';
import { getScopedStudents, getScopedStaff } from '../utils/departmentUtils';
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  X,
  UserPlus,
  ChevronDown,
  Trash2,
  Filter,
  RefreshCw,
} from 'lucide-react';

export const MentorMappingView: React.FC = () => {
  const {
    currentUser,
    dailyReport,
    skillBankStudents,
    staffList,
    classList,
    bulkMapStudentsToMentor,
    importBulkSkillBankStudents,
    deleteSkillBankStudent,
    addSkillBankStudent,
  } = useApp();

  const fallbackDept = currentUser?.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)';
  const activeDeptName = currentUser?.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)';
  const shortDeptCode = React.useMemo(() => {
    const d = activeDeptName.toLowerCase();
    if (d.includes('electronics') || d.includes('ece')) return 'ECE';
    if (d.includes('computer science') || d.includes('cse')) return 'CSE';
    if (d.includes('electrical') || d.includes('eee')) return 'EEE';
    if (d.includes('mechanical') || d.includes('mech')) return 'MECH';
    if (d.includes('civil')) return 'CIVIL';
    if (d.includes('artificial') || d.includes('ai & ds') || d.includes('aids')) return 'AI & DS';
    return activeDeptName.split(' ')[0] || 'DEPT';
  }, [activeDeptName]);

  const scopedStudents = React.useMemo(() => getScopedStudents(skillBankStudents, currentUser, fallbackDept), [skillBankStudents, currentUser, fallbackDept]);
  const scopedStaff = React.useMemo(() => getScopedStaff(staffList, currentUser, fallbackDept), [staffList, currentUser, fallbackDept]);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection State
  const [selectedRegNumbers, setSelectedRegNumbers] = useState<string[]>([]);
  const [targetMentorStaffId, setTargetMentorStaffId] = useState<string>(scopedStaff[0]?.id || 'STF001');

  // Modals State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showAddManualModal, setShowAddManualModal] = useState<boolean>(false);
  const [parsedPreviewStudents, setParsedPreviewStudents] = useState<StudentSkillBankData[]>([]);
  const [importMentorStaffId, setImportMentorStaffId] = useState<string>(scopedStaff[0]?.id || 'STF001');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // Single Manual Student Form State
  const [manualForm, setManualForm] = useState({
    registerNumber: '',
    studentName: '',
    year: '2nd Year',
    department: currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)',
    section: 'A',
    email: '',
    mobile: '',
    mentorStaffId: scopedStaff[0]?.id || 'STF001',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Students
  const filteredStudents = scopedStudents.filter((s) => {
    const profile = s.studentProfile;
    // Year filter (e.g. 2nd Year / II YEAR)
    let matchesYear = true;
    if (selectedYear !== 'all') {
      const pYear = profile.academicYear?.toLowerCase() || '';
      const pSem = profile.semester?.toLowerCase() || '';
      const pBatch = profile.batch?.toLowerCase() || '';
      const targetYear = selectedYear.toLowerCase();
      matchesYear =
        pYear.includes(targetYear) ||
        pSem.includes(targetYear) ||
        pBatch.includes(targetYear) ||
        (targetYear === '2nd year' && (pSem.includes('sem iii') || pSem.includes('sem iv') || pYear.includes('2nd'))) ||
        (targetYear === '3rd year' && (pSem.includes('sem v') || pSem.includes('sem vi') || pYear.includes('3rd'))) ||
        (targetYear === '4th year' && (pSem.includes('sem vii') || pSem.includes('sem viii') || pYear.includes('4th')));
    }

    // Mentor Filter
    let matchesMentor = true;
    if (selectedMentorFilter === 'unassigned') {
      matchesMentor = !profile.mentorFaculty || profile.mentorFaculty === 'Unassigned' || profile.mentorFaculty === '';
    } else if (selectedMentorFilter !== 'all') {
      matchesMentor = profile.mentorFaculty === selectedMentorFilter || profile.mentorStaffId === selectedMentorFilter;
    }

    // Search Query
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      profile.studentName.toLowerCase().includes(q) ||
      profile.registerNumber.toLowerCase().includes(q) ||
      profile.skillBankAccountNo.toLowerCase().includes(q) ||
      (profile.mentorFaculty || '').toLowerCase().includes(q);

    return matchesYear && matchesMentor && matchesQuery;
  });

  // Calculate Stats
  const totalStudentsCount = scopedStudents.length;
  const mappedCount = scopedStudents.filter(
    (s) => s.studentProfile.mentorFaculty && s.studentProfile.mentorFaculty !== 'Unassigned' && s.studentProfile.mentorFaculty !== ''
  ).length;
  const unassignedCount = totalStudentsCount - mappedCount;
  const totalMentorsCount = scopedStaff.length;

  // Toggle Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRegNumbers(filteredStudents.map((s) => s.studentProfile.registerNumber));
    } else {
      setSelectedRegNumbers([]);
    }
  };

  const handleToggleSelect = (regNum: string) => {
    setSelectedRegNumbers((prev) =>
      prev.includes(regNum) ? prev.filter((id) => id !== regNum) : [...prev, regNum]
    );
  };

  // Perform Bulk Mapping
  const handleApplyBulkMapping = () => {
    if (selectedRegNumbers.length === 0) return;
    const targetStaff = staffList.find((s) => s.id === targetMentorStaffId);
    const mentorName = targetStaff?.facultyName || 'Staff Mentor';

    bulkMapStudentsToMentor(selectedRegNumbers, targetMentorStaffId, mentorName);
    setSelectedRegNumbers([]);
  };

  // Perform Unmap
  const handleUnmapSelected = () => {
    if (selectedRegNumbers.length === 0) return;
    bulkMapStudentsToMentor(selectedRegNumbers, '', 'Unassigned');
    setSelectedRegNumbers([]);
  };

  // Handle CSV File Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setUploadError('Uploaded file is empty.');
          return;
        }

        const lines = text.split(/\r\n|\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length <= 1) {
          setUploadError('File contains no student data rows.');
          return;
        }

        // Parse CSV lines
        const parsed: StudentSkillBankData[] = [];
        const defaultStaff = scopedStaff[0] || staffList[0];

        // Skip header if present
        const hasHeader = lines[0].toLowerCase().includes('register') || lines[0].toLowerCase().includes('name');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        dataLines.forEach((line, idx) => {
          // split by comma or tab
          const cols = line.includes('\t') ? line.split('\t') : line.split(',');
          const cleanCols = cols.map((c) => c.replace(/^["']|["']$/g, '').trim());

          const regNo = cleanCols[0] || `73242210${String(idx + 100).padStart(4, '0')}`;
          const name = cleanCols[1] || `Student ${idx + 1}`;
          const dept = cleanCols[2] || fallbackDept;
          const year = cleanCols[3] || '2nd Year';
          const sec = cleanCols[4] || 'A';
          const email = cleanCols[5] || `${name.toLowerCase().replace(/\s+/g, '.')}@sasurie.ac.in`;
          const mobile = cleanCols[6] || '9876543210';

          const baseStudent = INITIAL_STUDENTS_SKILL_BANK[0];
          const fullStudent: StudentSkillBankData = JSON.parse(JSON.stringify(baseStudent));

          fullStudent.studentProfile = {
            ...fullStudent.studentProfile,
            id: `STU-2026-${String(idx + 50).padStart(3, '0')}`,
            registerNumber: regNo,
            studentName: name,
            skillBankAccountNo: `SSB-2026-AIDS-${regNo.slice(-3)}`,
            degreeBranch: 'B.Tech. AI & DS',
            department: dept,
            batch: '2024-2028',
            academicYear: year,
            semester: year.includes('2nd') ? 'Sem III & IV' : year.includes('3rd') ? 'Sem V & VI' : 'Sem VII & VIII',
            section: sec,
            admissionNumber: `ADM-${regNo.slice(-4)}`,
            studentMobile: mobile,
            studentEmail: email,
            personalEmail: email,
            mentorFaculty: defaultStaff?.facultyName || 'M. Kaviyarasu',
            mentorStaffId: defaultStaff?.id || 'STF001',
          };

          parsed.push(stripSkillBankDates(fullStudent));
        });

        setParsedPreviewStudents(parsed);
      } catch (err: any) {
        setUploadError('Failed to parse file: ' + err.message);
      }
    };

    reader.readAsText(file);
  };

  // Save imported parsed students
  const handleConfirmImport = () => {
    if (parsedPreviewStudents.length === 0) return;
    const staff = staffList.find((s) => s.id === importMentorStaffId);
    const mentorName = staff?.facultyName || 'Staff Mentor';

    const updatedWithMentor = parsedPreviewStudents.map((s) => ({
      ...s,
      studentProfile: {
        ...s.studentProfile,
        mentorFaculty: mentorName,
        mentorStaffId: importMentorStaffId,
      },
    }));

    importBulkSkillBankStudents(updatedWithMentor);
    setShowUploadModal(false);
    setParsedPreviewStudents([]);
    setUploadFileName('');
  };

  // Download CSV Sample Template
  const handleDownloadSampleCsv = () => {
    const headers = ['Register Number', 'Student Name', 'Department', 'Year', 'Section', 'Email', 'Mobile'];
    const sampleRows = [
      ['732422104001', 'Aakash M', 'Artificial Intelligence & Data Science', '2nd Year', 'A', 'aakash.m@sasurie.ac.in', '9876543210'],
      ['732422104002', 'Ananya S', 'Artificial Intelligence & Data Science', '2nd Year', 'A', 'ananya.s@sasurie.ac.in', '9876543211'],
      ['732422104003', 'Bharath K', 'Artificial Intelligence & Data Science', '2nd Year', 'B', 'bharath.k@sasurie.ac.in', '9876543212'],
      ['732422104004', 'Dharshini R', 'Artificial Intelligence & Data Science', '3rd Year', 'A', 'dharshini.r@sasurie.ac.in', '9876543213'],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mentor_Mentee_Student_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Single Manual Student
  const handleSaveManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.registerNumber.trim() || !manualForm.studentName.trim()) return;

    const staff = staffList.find((s) => s.id === manualForm.mentorStaffId);
    const mentorName = staff?.facultyName || 'M. Kaviyarasu';

    const baseStudent = INITIAL_STUDENTS_SKILL_BANK[0];
    const fullStudent: StudentSkillBankData = JSON.parse(JSON.stringify(baseStudent));

    fullStudent.studentProfile = {
      ...fullStudent.studentProfile,
      id: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
      registerNumber: manualForm.registerNumber.trim(),
      studentName: manualForm.studentName.trim(),
      skillBankAccountNo: `SSB-2026-AIDS-${manualForm.registerNumber.slice(-3)}`,
      degreeBranch: 'B.Tech. AI & DS',
      department: manualForm.department,
      batch: '2024-2028',
      academicYear: manualForm.year,
      semester: manualForm.year.includes('2nd') ? 'Sem III & IV' : 'Sem V & VI',
      section: manualForm.section,
      admissionNumber: `ADM-${manualForm.registerNumber.slice(-4)}`,
      studentMobile: manualForm.mobile || '9876543210',
      studentEmail: manualForm.email || `${manualForm.studentName.toLowerCase().replace(/\s+/g, '.')}@sasurie.ac.in`,
      personalEmail: manualForm.email || `${manualForm.studentName.toLowerCase().replace(/\s+/g, '.')}@sasurie.ac.in`,
      mentorFaculty: mentorName,
      mentorStaffId: manualForm.mentorStaffId,
    };

    const newStudent = stripSkillBankDates(fullStudent);

    addSkillBankStudent(newStudent);
    setShowAddManualModal(false);
    setManualForm({
      registerNumber: '',
      studentName: '',
      year: '2nd Year',
      department: fallbackDept,
      section: 'A',
      email: '',
      mobile: '',
      mentorStaffId: scopedStaff[0]?.id || staffList[0]?.id || 'STF001',
    });
  };

  return (
    <div className="space-y-6">
      {/* Portal Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
              HOD Access Only
            </span>
            <span className="text-xs text-indigo-200 font-semibold">• Department Academic Governance</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Mentor-Mentee Mapping System
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Upload student Excel lists, select target academic year (e.g., II YEAR {shortDeptCode}), and map students to department faculty mentors. Assigned mentees will be available in staff logins for Skill Bank & Attendance monitoring.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Excel/CSV Template with columns"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Sample Excel</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Student Excel</span>
          </button>

          <button
            onClick={() => setShowAddManualModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Single Student</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Total Students</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{totalStudentsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">In Skill Bank Database</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Mapped Mentees</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {mappedCount}
            <span className="text-xs font-bold text-slate-400 ml-1.5">
              ({totalStudentsCount > 0 ? Math.round((mappedCount / totalStudentsCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Assigned to Faculty Mentors</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Unassigned Mentees</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">{unassignedCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Needs Mentor Allocation</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Faculty Mentors</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{totalMentorsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Available Department Staff</p>
        </div>
      </div>

      {/* Filter & Batch Mapping Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, reg no, mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Academic Year Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Year / Batch:</span>
            {[
              { id: 'all', label: 'All Batches' },
              { id: '1st Year', label: `I YEAR (${shortDeptCode})` },
              { id: '2nd Year', label: `II YEAR ${shortDeptCode}` },
              { id: '3rd Year', label: `III YEAR ${shortDeptCode}` },
              { id: '4th Year', label: `IV YEAR ${shortDeptCode}` },
            ].map((y) => (
              <button
                key={y.id}
                onClick={() => setSelectedYear(y.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedYear === y.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {y.label}
              </button>
            ))}
          </div>

          {/* Mentor Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Filter Mentor:</span>
            <select
              value={selectedMentorFilter}
              onChange={(e) => setSelectedMentorFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Mentors</option>
              <option value="unassigned">⚠️ Unassigned Only</option>
              {scopedStaff.map((s) => (
                <option key={s.id} value={s.facultyName}>
                  {s.facultyName} ({s.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls Bar (Active when students selected) */}
        {selectedRegNumbers.length > 0 ? (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {selectedRegNumbers.length} Student{selectedRegNumbers.length > 1 ? 's' : ''} Selected for Mentor Mapping
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={targetMentorStaffId}
                onChange={(e) => setTargetMentorStaffId(e.target.value)}
                className="flex-1 sm:w-64 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {scopedStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    Assign to: {s.facultyName} ({s.designation})
                  </option>
                ))}
              </select>

              <button
                onClick={handleApplyBulkMapping}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
              >
                Map Selected Mentees
              </button>

              <button
                onClick={handleUnmapSelected}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer shrink-0"
              >
                Unmap
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <span>
              Showing {filteredStudents.length} of {totalStudentsCount} Students
            </span>
            <span>Check student boxes to perform bulk mentor mapping</span>
          </div>
        )}
      </div>

      {/* Student Mapping Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedRegNumbers.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Student Info</th>
                <th className="p-3.5">Register & Roll No</th>
                <th className="p-3.5">Year & Section</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Assigned Faculty Mentor</th>
                <th className="p-3.5 text-center">Quick Change</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No students match your criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload an Excel list or add students using the top buttons.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const prof = student.studentProfile;
                  const isSelected = selectedRegNumbers.includes(prof.registerNumber);
                  const isAssigned = prof.mentorFaculty && prof.mentorFaculty !== 'Unassigned' && prof.mentorFaculty !== '';

                  return (
                    <tr
                      key={prof.registerNumber}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prof.registerNumber)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{prof.studentName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{prof.degreeBranch}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {prof.registerNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{prof.skillBankAccountNo}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                          {prof.academicYear} - Sec {prof.section}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <div>{prof.studentEmail}</div>
                        <div className="text-[10px] text-slate-400">{prof.studentMobile}</div>
                      </td>

                      <td className="p-3.5">
                        {isAssigned ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{prof.mentorFaculty}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Unassigned</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <select
                          value={staffList.find((s) => s.facultyName === prof.mentorFaculty)?.id || ''}
                          onChange={(e) => {
                            const newStaff = staffList.find((s) => s.id === e.target.value);
                            bulkMapStudentsToMentor(
                              [prof.registerNumber],
                              e.target.value,
                              newStaff?.facultyName || 'Unassigned'
                            );
                          }}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="">-- Assign Staff --</option>
                          {scopedStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.facultyName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3.5 text-right">
                        {isAssigned && (
                          <button
                            onClick={() => bulkMapStudentsToMentor([prof.registerNumber], '', 'Unassigned')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Unmap Mentor"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- EXCEL / CSV UPLOAD MODAL -------------------- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Upload Students Excel / CSV File
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import student details batchwise and assign default mentor immediately.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedPreviewStudents([]);
                  setUploadError('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dropzone Box */}
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-6 text-center bg-indigo-50/30 dark:bg-indigo-950/10 space-y-3">
                <Upload className="w-10 h-10 text-indigo-500 mx-auto" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Click to select CSV/Excel file or Drag & Drop here
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supported columns: Register Number, Student Name, Department, Year, Section, Email, Mobile
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Select File
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3.5 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold rounded-xl cursor-pointer"
                  >
                    Download Sample CSV
                  </button>
                </div>

                {uploadFileName && (
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Selected File: {uploadFileName}
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-semibold">
                  {uploadError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedPreviewStudents.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Parsed Preview: {parsedPreviewStudents.length} Students Ready to Import
                    </h4>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Assign Initial Mentor:</span>
                      <select
                        value={importMentorStaffId}
                        onChange={(e) => setImportMentorStaffId(e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                      >
                        {scopedStaff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.facultyName} ({s.designation})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2">Reg No</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Year & Sec</th>
                          <th className="p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {parsedPreviewStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-2 font-mono font-bold">{s.studentProfile.registerNumber}</td>
                            <td className="p-2 font-semibold">{s.studentProfile.studentName}</td>
                            <td className="p-2">{s.studentProfile.academicYear} - Sec {s.studentProfile.section}</td>
                            <td className="p-2 text-slate-500">{s.studentProfile.studentEmail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                    >
                      Save & Import {parsedPreviewStudents.length} Students
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADD SINGLE MANUAL STUDENT MODAL -------------------- */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Add Single Student & Assign Mentor
              </h3>
              <button
                onClick={() => setShowAddManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Register Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 732422104050"
                  value={manualForm.registerNumber}
                  onChange={(e) => setManualForm({ ...manualForm, registerNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vignesh K"
                  value={manualForm.studentName}
                  onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={manualForm.year}
                    onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="1st Year">1st Year (I YEAR {shortDeptCode})</option>
                    <option value="2nd Year">2nd Year (II YEAR {shortDeptCode})</option>
                    <option value="3rd Year">3rd Year (III YEAR {shortDeptCode})</option>
                    <option value="4th Year">4th Year (IV YEAR {shortDeptCode})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={manualForm.section}
                    onChange={(e) => setManualForm({ ...manualForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                    <option value="C">Sec C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Faculty Mentor
                </label>
                <select
                  value={manualForm.mentorStaffId}
                  onChange={(e) => setManualForm({ ...manualForm, mentorStaffId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                >
                  {scopedStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.facultyName} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  placeholder="student@sasurie.ac.in"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Student & Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
