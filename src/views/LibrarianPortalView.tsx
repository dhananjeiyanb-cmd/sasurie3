import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSkillBankData, LibraryBookLog, LibraryVisitLog, MonthKey } from '../types/skillBank';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Filter,
  User,
  Building2,
  GraduationCap,
  Sparkles,
  Save,
  X,
  Lock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const LibrarianPortalView: React.FC = () => {
  const { skillBankStudents, updateSkillBankStudent, classList, staffList } = useApp();

  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedStudentReg, setSelectedStudentReg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'dim42' | 'dim43'>('dim42');

  // Modal Editing Draft States
  const [editingChecklist, setEditingChecklist] = useState({
    min5BooksBorrowed: false,
    onTimeReturnVerified: false,
    referenceAndJournalsBorrowed: false,
    digitalLibraryAccess: false,
    bookReviewSubmitted: false,
  });
  const [editingBooks, setEditingBooks] = useState<LibraryBookLog[]>([]);
  const [editingVisits, setEditingVisits] = useState<LibraryVisitLog[]>([]);
  const [librarianNotes, setLibrarianNotes] = useState<string>('');

  // Form inputs for adding a new book
  const [newBookName, setNewBookName] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookIssueDate, setNewBookIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBookReturnDate, setNewBookReturnDate] = useState('');

  // Form inputs for adding a visit
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVisitInTime, setNewVisitInTime] = useState('10:00 AM');
  const [newVisitOutTime, setNewVisitOutTime] = useState('11:30 AM');

  // Notification Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter student list
  const filteredStudents = skillBankStudents.filter((st) => {
    const prof = st.studentProfile;
    const matchesDept =
      departmentFilter === 'all' ||
      prof.department?.toLowerCase() === departmentFilter.toLowerCase() ||
      prof.degreeBranch?.toLowerCase().includes(departmentFilter.toLowerCase());
    const matchesYear =
      yearFilter === 'all' ||
      prof.year?.toLowerCase() === yearFilter.toLowerCase() ||
      prof.yearSemester?.toLowerCase().includes(yearFilter.toLowerCase());
    const matchesSearch =
      searchQuery.trim() === '' ||
      prof.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesYear && matchesSearch;
  });

  // Calculate stats
  const totalStudents = filteredStudents.length;
  const updatedStudents = filteredStudents.filter((st) => st.libraryChecklist?.updatedByLibrarian).length;
  const totalBooksCount = filteredStudents.reduce((acc, st) => acc + (st.libraryBooks?.length || 0), 0);
  const totalVisitsCount = filteredStudents.reduce((acc, st) => acc + (st.libraryVisits?.length || 0), 0);

  // Open Edit Modal for a student
  const handleOpenModal = (st: StudentSkillBankData) => {
    setSelectedStudentReg(st.studentProfile.registerNumber);
    setEditingChecklist({
      min5BooksBorrowed: st.libraryChecklist?.min5BooksBorrowed ?? false,
      onTimeReturnVerified: st.libraryChecklist?.onTimeReturnVerified ?? false,
      referenceAndJournalsBorrowed: st.libraryChecklist?.referenceAndJournalsBorrowed ?? false,
      digitalLibraryAccess: st.libraryChecklist?.digitalLibraryAccess ?? false,
      bookReviewSubmitted: st.libraryChecklist?.bookReviewSubmitted ?? false,
    });
    setEditingBooks(st.libraryBooks ? [...st.libraryBooks] : []);
    setEditingVisits(st.libraryVisits ? [...st.libraryVisits] : []);
    setLibrarianNotes(st.libraryChecklist?.librarianNotes || '');
    setIsModalOpen(true);
  };

  // Calculate Dim 4.2 Coins from current checklist state
  const calcDim42Coins = (chk: typeof editingChecklist) => {
    let sum = 0;
    if (chk.min5BooksBorrowed) sum += 1000;
    if (chk.onTimeReturnVerified) sum += 500;
    if (chk.referenceAndJournalsBorrowed) sum += 500;
    if (chk.digitalLibraryAccess) sum += 500;
    if (chk.bookReviewSubmitted) sum += 500;
    return Math.min(3000, sum);
  };

  // Calculate Dim 4.3 Coins from current visits log count
  const calcDim43Coins = (visits: LibraryVisitLog[]) => {
    return Math.min(500, visits.length * 20);
  };

  // Add Book Handler
  const handleAddBook = () => {
    if (!newBookName.trim()) {
      alert('Please enter Book Title');
      return;
    }
    const newBook: LibraryBookLog = {
      id: `BK-${Date.now()}`,
      month: 'Jul',
      bookName: newBookName.trim(),
      author: newBookAuthor.trim() || 'Central Library Catalog',
      issueDate: newBookIssueDate,
      returnDate: newBookReturnDate || '2026-08-15',
      returnedOnTime: true,
      verifiedByLibrarian: true,
      mentorSigned: false,
    };
    const updatedBooks = [newBook, ...editingBooks];
    setEditingBooks(updatedBooks);

    // Auto check min5BooksBorrowed if >= 5 books
    if (updatedBooks.length >= 5 && !editingChecklist.min5BooksBorrowed) {
      setEditingChecklist((prev) => ({ ...prev, min5BooksBorrowed: true }));
    }

    setNewBookName('');
    setNewBookAuthor('');
  };

  // Delete Book Handler
  const handleDeleteBook = (id: string) => {
    setEditingBooks(editingBooks.filter((b) => b.id !== id));
  };

  // Add Visit Handler
  const handleAddVisit = () => {
    const newVisit: LibraryVisitLog = {
      id: `VIS-${Date.now()}`,
      month: 'Jul',
      date: newVisitDate,
      inTime: newVisitInTime,
      outTime: newVisitOutTime,
      verified: true,
    };
    setEditingVisits([newVisit, ...editingVisits]);
  };

  // Delete Visit Handler
  const handleDeleteVisit = (id: string) => {
    setEditingVisits(editingVisits.filter((v) => v.id !== id));
  };

  // Save changes to Student record
  const handleSaveStudentRecords = () => {
    if (!selectedStudentReg) return;
    const targetStudent = skillBankStudents.find((s) => s.studentProfile.registerNumber === selectedStudentReg);
    if (!targetStudent) return;

    const dim42Coins = calcDim42Coins(editingChecklist);
    const updatedChecklist = {
      ...editingChecklist,
      coinsEarned: dim42Coins,
      updatedByLibrarian: true,
      librarianLastUpdatedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      librarianNotes: librarianNotes.trim(),
    };

    updateSkillBankStudent(selectedStudentReg, {
      libraryChecklist: updatedChecklist,
      libraryBooks: editingBooks,
      libraryVisits: editingVisits,
    });

    setIsModalOpen(false);
    showToast(
      `✓ DIM 4.2 & DIM 4.3 updated for ${targetStudent.studentProfile.studentName} (${selectedStudentReg}). Mentors will see the updated status in SSB.`
    );
  };

  const selectedStudentObj = skillBankStudents.find(
    (s) => s.studentProfile.registerNumber === selectedStudentReg
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-bold leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white rounded-2xl p-6 border border-teal-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/20 rounded-2xl border border-teal-400/40 text-teal-300 shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950">
                  Librarian Authorized Portal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  DIM 4.2 &amp; DIM 4.3 ONLY
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                Central Library Skill Bank Entry Portal
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Enter and manage student library records for <strong>DIM 4.2 (Library Books Borrowed &amp; Checklist)</strong> and <strong>DIM 4.3 (Library Utilization Visits)</strong>. Mentors can view these entries in read-only mode in the Student Skill Bank (SSB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-teal-800/60 shrink-0">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px]">
              <div className="font-bold text-slate-200">Strict Permission Lock:</div>
              <div className="text-slate-400 text-[10px]">Mentors CANNOT edit Dim 4.2 &amp; Dim 4.3</div>
            </div>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-teal-800/60">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Students</span>
            <span className="text-lg font-black text-white">{totalStudents}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Librarian Verified</span>
            <span className="text-lg font-black text-emerald-400">{updatedStudents} / {totalStudents}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Books Logged</span>
            <span className="text-lg font-black text-cyan-300">{totalBooksCount}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Library Visits Logged</span>
            <span className="text-lg font-black text-amber-300">{totalVisitsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Departments</option>
              <option value="Artificial Intelligence & Data Science">AI &amp; DS</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Electronics & Communication Engineering">ECE</option>
              <option value="Electrical & Electronics Engineering">EEE</option>
              <option value="Mechanical Engineering">MECH</option>
              <option value="Civil Engineering">CIVIL</option>
              <option value="MBA">MBA</option>
              <option value="ME-CSE">ME-CSE</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Academic Years</option>
              <option value="1st Year">1st Year (I Year)</option>
              <option value="2nd Year">2nd Year (II Year)</option>
              <option value="3rd Year">3rd Year (III Year)</option>
              <option value="4th Year">4th Year (IV Year)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or Reg No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Students List for Library Skill Bank Entry ({filteredStudents.length})</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Showing results for selected Department &amp; Year
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 font-black">
                <th className="p-3.5">Student Info</th>
                <th className="p-3.5">Dept &amp; Year</th>
                <th className="p-3.5">Assigned Mentor</th>
                <th className="p-3.5 text-center">DIM 4.2 (Books &amp; Checklist)</th>
                <th className="p-3.5 text-center">DIM 4.3 (Library Visits)</th>
                <th className="p-3.5 text-center">Librarian Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-semibold">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const prof = st.studentProfile;
                  const d42Coins = st.libraryChecklist?.coinsEarned || 0;
                  const d43Visits = st.libraryVisits?.length || 0;
                  const d43Coins = Math.min(500, d43Visits * 20);
                  const isUpdated = st.libraryChecklist?.updatedByLibrarian;

                  return (
                    <tr
                      key={prof.registerNumber}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {prof.studentName}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {prof.registerNumber}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {prof.department || prof.degreeBranch}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prof.year} ({prof.section ? `Sec ${prof.section}` : 'Sec A'})
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {prof.mentorFaculty || 'Unassigned'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {d42Coins.toLocaleString()} / 3,000 Coins
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          {d43Coins} Coins ({d43Visits} Visits)
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        {isUpdated ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              ✓ Updated by Librarian
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {st.libraryChecklist?.librarianLastUpdatedDate || 'Recently'}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            Pending Entry
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenModal(st)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Manage Dim 4.2 &amp; 4.3</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No students found matching your filters. Try selecting a different department or year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODAL FOR EDITING DIM 4.2 & 4.3 ---------------- */}
      {isModalOpen && selectedStudentObj && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-teal-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                    Librarian Skill Bank Entry
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {selectedStudentObj.studentProfile.studentName} ({selectedStudentObj.studentProfile.registerNumber})
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedStudentObj.studentProfile.department} • {selectedStudentObj.studentProfile.year} • Mentor: {selectedStudentObj.studentProfile.mentorFaculty || 'Unassigned'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('dim42')}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeModalTab === 'dim42'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>DIM 4.2: Library Books Borrowed ({calcDim42Coins(editingChecklist)} / 3,000 Coins)</span>
              </button>

              <button
                onClick={() => setActiveModalTab('dim43')}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeModalTab === 'dim43'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>DIM 4.3: Library Visits Log ({calcDim43Coins(editingVisits)} / 500 Coins)</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* TAB 1: DIM 4.2 LIBRARY BOOKS BORROWED */}
              {activeModalTab === 'dim42' && (
                <div className="space-y-6">
                  {/* Checklist Section */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <h4 className="text-xs font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">
                        Dimension 4.2 Library Borrowing Checklist
                      </h4>
                      <span className="text-xs font-black text-amber-500">
                        {calcDim42Coins(editingChecklist)} / 3,000 Coins
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        {
                          key: 'min5BooksBorrowed',
                          label: '1. Minimum 5 Textbooks Borrowed in Semester (+1,000 Coins)',
                          desc: 'Borrowed course textbooks, reference manuals, or syllabus recommended titles.',
                        },
                        {
                          key: 'onTimeReturnVerified',
                          label: '2. On-Time Book Return Record Verified (+500 Coins)',
                          desc: 'Returned all library books on or before due date without overdue fine.',
                        },
                        {
                          key: 'referenceAndJournalsBorrowed',
                          label: '3. Reference Books & Research Journals Borrowing (+500 Coins)',
                          desc: 'Consulted reference volumes, handbooks, or IEEE print journals.',
                        },
                        {
                          key: 'digitalLibraryAccess',
                          label: '4. Digital Library & E-Resources Portal Access (+500 Coins)',
                          desc: 'Logged into N-LIST, DELNET, IEEE Xplore, or Swayam e-resources.',
                        },
                        {
                          key: 'bookReviewSubmitted',
                          label: '5. Book Review & Abstract Summary Submitted (+500 Coins)',
                          desc: 'Submitted written book review synopsis to library.',
                        },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                            (editingChecklist as any)[item.key]
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={(editingChecklist as any)[item.key]}
                            onChange={(e) =>
                              setEditingChecklist({
                                ...editingChecklist,
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {item.label}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add New Borrowed Book Entry */}
                  <div className="bg-teal-50/50 dark:bg-slate-800/80 p-4 rounded-xl border border-teal-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-black uppercase text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-teal-600" />
                      <span>Log New Borrowed Book for Student</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Book Title / Accession No:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Data Structures & Algorithms by Tanenbaum"
                          value={newBookName}
                          onChange={(e) => setNewBookName(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Author / Publisher:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. A. Tanenbaum / Pearson Education"
                          value={newBookAuthor}
                          onChange={(e) => setNewBookAuthor(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Issue Date:
                        </label>
                        <input
                          type="date"
                          value={newBookIssueDate}
                          onChange={(e) => setNewBookIssueDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Due / Return Date:
                        </label>
                        <input
                          type="date"
                          value={newBookReturnDate}
                          onChange={(e) => setNewBookReturnDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddBook}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Book Record to List</span>
                    </button>
                  </div>

                  {/* Existing Books Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Logged Books History ({editingBooks.length})
                    </h4>
                    {editingBooks.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editingBooks.map((b) => (
                          <div
                            key={b.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-slate-900 dark:text-slate-100 block font-bold">
                                {b.bookName}
                              </strong>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Author: {b.author} • Issued: {b.issueDate} • Return: {b.returnDate}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">
                                ✓ Librarian Verified
                              </span>
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Book Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                        No book records logged for this student yet. Use the form above to log books.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DIM 4.3 LIBRARY UTILIZATION VISITS */}
              {activeModalTab === 'dim43' && (
                <div className="space-y-6">
                  {/* Info Header */}
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-black uppercase text-cyan-900 dark:text-cyan-300">
                        Dimension 4.3 Library Utilization &amp; Frequency Log
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                        20 coins per verified visit, capped at a maximum of 500 coins per semester.
                      </p>
                    </div>
                    <span className="text-sm font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 shrink-0">
                      {calcDim43Coins(editingVisits)} / 500 Coins
                    </span>
                  </div>

                  {/* Add New Visit Form */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-black uppercase text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-cyan-600" />
                      <span>Log Library Visit Entry</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Visit Date:
                        </label>
                        <input
                          type="date"
                          value={newVisitDate}
                          onChange={(e) => setNewVisitDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          In-Time:
                        </label>
                        <input
                          type="text"
                          value={newVisitInTime}
                          onChange={(e) => setNewVisitInTime(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Out-Time:
                        </label>
                        <input
                          type="text"
                          value={newVisitOutTime}
                          onChange={(e) => setNewVisitOutTime(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddVisit}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Visit Log Entry (+20 Coins)</span>
                    </button>
                  </div>

                  {/* Logged Visits List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Logged Visits ({editingVisits.length})
                    </h4>
                    {editingVisits.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {editingVisits.map((v) => (
                          <div
                            key={v.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-cyan-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  Date: {v.date}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                  Time: {v.inTime} - {v.outTime}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-amber-500 text-xs">
                                +20 Coins
                              </span>
                              <button
                                onClick={() => handleDeleteVisit(v.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove Visit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed rounded-xl text-center text-xs text-slate-500">
                        No library visits logged yet. Use the form above to add visits.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Librarian Notes Field */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Librarian Verification Remarks / Notes for Mentor:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified library card & accession register logs. Books returned on time."
                  value={librarianNotes}
                  onChange={(e) => setLibrarianNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Will sync immediately to Student Skill Bank (SSB)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveStudentRecords}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save &amp; Update Student SSB</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
