import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ClassObservation, ObservationRating } from '../types';
import { ObservationBadge } from '../components/StatusBadge';
import {
  Eye,
  Plus,
  Search,
  Calendar,
  UserCheck,
  GraduationCap,
  BookOpen,
  Clock,
  AlertCircle,
  X,
  CheckCircle2,
  Trash2,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Edit3,
  Award,
  ChevronRight,
} from 'lucide-react';

// Official Criteria list as requested
const OBSERVATION_CRITERIA = [
  'Introduced Learning Outcomes',
  'Subject Expertise',
  'Delivery',
  'Communication',
  'Student Engagement',
  'PPT Quality',
  'Confidence',
  'Time Management',
  'Explained Objectives Clearly',
  'Used Real-Life Examples',
] as const;

type CriteriaItem = typeof OBSERVATION_CRITERIA[number];
type RatingType = 'Excellent' | 'Good' | 'Average' | 'Poor';

// College Header Logos
const SasurieLogo: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div className={`flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <polygon points="10,15 38,15 24,85 0,85" fill="#dc2626" />
      <polygon points="42,15 70,15 56,85 28,85" fill="#dc2626" />
      <polygon points="74,15 102,15 88,85 60,85" fill="#dc2626" />
      <text x="51" y="97" textAnchor="middle" fontSize="11" fontWeight="900" fill="#dc2626" letterSpacing="1">
        SASURIE
      </text>
    </svg>
  </div>
);

const AccreditationLogo: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div className={`flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="39" fill="#fffbebe" stroke="#b45309" strokeWidth="1" strokeDasharray="2,2" />
      {/* 25th Silver Jubilee Emblem representation */}
      <path
        d="M50 12 L58 24 L72 20 L71 35 L85 42 L77 54 L85 66 L71 73 L72 88 L58 84 L50 96 L42 84 L28 88 L29 73 L15 66 L23 54 L15 42 L29 35 L28 20 L42 24 Z"
        fill="none"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="28" fill="#991b1b" />
      <text x="50" y="44" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fbbf24">
        NAAC
      </text>
      <text x="50" y="58" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff">
        NBA
      </text>
      <text x="50" y="69" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fef08a">
        ACCREDITED
      </text>
    </svg>
  </div>
);

export const ClassObservationView: React.FC = () => {
  const { observationList, addObservation, deleteObservation, staffList, classList, currentUser, filterState } = useApp();

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTabMode] = useState<'records' | 'official_form'>('records');
  const [selectedObsForForm, setSelectedObsForForm] = useState<ClassObservation | null>(null);

  // Form state for Record Observation Modal / Official Form
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [staffId, setStaffId] = useState(staffList[0]?.id || 'STF001');
  const [classId, setClassId] = useState(classList[0]?.id || '');
  const [customClassName, setCustomClassName] = useState('');
  const [useCustomClass, setUseCustomClass] = useState(false);
  const [startingTime, setStartingTime] = useState('09:30 AM');
  const [endingTime, setEndingTime] = useState('10:30 AM');
  const [hour, setHour] = useState('1st Hour (09:30 AM - 10:30 AM)');
  const [subject, setSubject] = useState('Design & Analysis of Algorithms');
  const [topic, setTopic] = useState('Dynamic Programming & Greedy Approaches');
  const [observedBy, setObservedBy] = useState(
    currentUser?.name || (currentUser?.role === 'principal' ? 'Prof. Dr. Kiruba Shankar R (Principal)' : 'DHANANJEIYAN B (HOD)')
  );
  const [overallRating, setOverallRating] = useState<ObservationRating>('Good');
  const [remarks, setRemarks] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  // Criteria ratings record
  const [criteriaRatings, setCriteriaRatings] = useState<Record<CriteriaItem, RatingType>>(() => {
    const initial: Record<string, RatingType> = {};
    OBSERVATION_CRITERIA.forEach((c) => {
      initial[c] = 'Good';
    });
    return initial as Record<CriteriaItem, RatingType>;
  });

  // Strengths (5 items) & Areas for Improvement (5 items)
  const [strengths, setStrengths] = useState<string[]>([
    'Excellent clarity in introducing topic learning outcomes.',
    'Effective subject knowledge and blackboard organization.',
    'Good student engagement with real-world technical examples.',
    'Punctual start and structured time management.',
    'Strong classroom control and interactive delivery.',
  ]);

  const [improvements, setImprovements] = useState<string[]>([
    'Increase usage of ICT / PPT slides for complex algorithms.',
    'Encourage queries from back-row students.',
    'Provide immediate summary before concluding the class.',
    'Formulate clear objective questions for continuous assessment.',
    'Maintain pace when covering mathematical proofs.',
  ]);

  const printRef = useRef<HTMLDivElement>(null);

  const handleRatingToggle = (criterion: CriteriaItem, rating: RatingType) => {
    setCriteriaRatings((prev) => ({
      ...prev,
      [criterion]: rating,
    }));
  };

  const handleStrengthChange = (index: number, val: string) => {
    const updated = [...strengths];
    updated[index] = val;
    setStrengths(updated);
  };

  const handleImprovementChange = (index: number, val: string) => {
    const updated = [...improvements];
    updated[index] = val;
    setImprovements(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === staffId);
    const cls = classList.find((c) => c.id === classId);

    const finalClassName =
      useCustomClass && customClassName.trim()
        ? customClassName.trim()
        : cls
        ? `${cls.year} ${cls.department.replace(/.*?\((.*?)\)/, '$1') || cls.department} - Sec ${cls.section}`
        : '3rd Year AI & DS - Sec A';

    addObservation({
      date,
      staffId,
      facultyName: staff?.facultyName || 'Faculty',
      classId: useCustomClass ? 'CUSTOM' : classId,
      className: finalClassName,
      hour,
      subject,
      topic,
      startingTime,
      endingTime,
      observedBy: observedBy || currentUser?.name || 'HOD / Principal',
      observation: overallRating,
      criteriaRatings,
      strengths: strengths.filter((s) => s.trim().length > 0),
      improvements: improvements.filter((i) => i.trim().length > 0),
      remarks: remarks || 'Class observation successfully completed as per NAAC/NBA Quality Assurance criteria.',
      followUpRequired,
    });

    setShowModal(false);
  };

  const isHod = currentUser?.role === 'admin';
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const availableStaffList = isHod
    ? staffList.filter((s) => {
        const staffDept = s.department.toLowerCase();
        const userDept = hodDepartment.toLowerCase();
        return staffDept === userDept || (staffDept.includes('ai & ds') && userDept.includes('ai & ds'));
      })
    : staffList;

  const filteredObservations = observationList.filter((obs) => {
    const q = (search || filterState.searchQuery).toLowerCase();
    const matchesSearch =
      obs.facultyName.toLowerCase().includes(q) ||
      obs.subject.toLowerCase().includes(q) ||
      obs.className.toLowerCase().includes(q) ||
      obs.remarks.toLowerCase().includes(q);

    const matchesRating = ratingFilter === 'all' || obs.observation === ratingFilter;

    let matchesYear = true;
    if (yearFilter !== 'all') {
      matchesYear = obs.className.toLowerCase().includes(yearFilter.toLowerCase());
    }

    return matchesSearch && matchesRating && matchesYear;
  });

  const handlePrint = () => {
    window.print();
  };

  // Determine current display faculty/class for official printable form preview
  const currentFaculty = staffList.find((s) => s.id === staffId);
  const currentClass = classList.find((c) => c.id === classId);

  const displayFacultyName = selectedObsForForm?.facultyName || currentFaculty?.facultyName || 'M. Kaviyarasu';
  const displaySubject = selectedObsForForm?.subject || subject;
  const displayTopic = selectedObsForForm?.topic || topic;
  const displayClassName = selectedObsForForm?.className || (currentClass ? `${currentClass.year} ${currentClass.department}` : 'Class Observation');
  const displayDate = selectedObsForForm?.date || date;
  const displayStartTime = selectedObsForForm?.startingTime || startingTime;
  const displayEndTime = selectedObsForForm?.endingTime || endingTime;
  const displayCriteria = selectedObsForForm?.criteriaRatings || criteriaRatings;
  const displayStrengths = selectedObsForForm?.strengths || strengths;
  const displayImprovements = selectedObsForForm?.improvements || improvements;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-red-600" />
            Class Observation Module
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Sasurie College of Engineering Classroom Observation Form & Pedagogical Evaluation Engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSelectedObsForForm(null);
              setActiveTabMode(activeTab === 'official_form' ? 'records' : 'official_form');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === 'official_form'
                ? 'bg-red-600 text-white border-red-700 shadow-md'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{activeTab === 'official_form' ? 'View Recorded Logs' : 'Official Form View'}</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record Observation
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Toggle: Records List vs Official Printable Observation Form */}
      {activeTab === 'official_form' ? (
        <div className="space-y-4">
          {/* Action Bar for Official Form */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-red-600 uppercase tracking-wider">Form Mode:</span>
              <span>{selectedObsForForm ? `Viewing Logged Record: ${selectedObsForForm.facultyName} (${selectedObsForForm.date})` : 'Interactive Official Print Template'}</span>
            </div>

            <div className="flex items-center gap-2">
              {selectedObsForForm && (
                <button
                  onClick={() => setSelectedObsForForm(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Official Observation Form
              </button>
            </div>
          </div>

          {/* -------------------- OFFICIAL CLASS OBSERVATION FORM (PRINT READY) -------------------- */}
          <div
            ref={printRef}
            className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto space-y-6 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full font-serif"
          >
            {/* Header Section */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: College Logo */}
                <SasurieLogo className="w-20 h-20" />

                {/* Center: College Name */}
                <div className="text-center flex-1">
                  <h1 className="text-red-600 font-extrabold text-2xl tracking-wider uppercase font-serif">
                    SASURIE COLLEGE OF ENGINEERING
                  </h1>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 tracking-wide">
                    (Autonomous)
                  </p>
                </div>

                {/* Right: Accreditation Logo */}
                <AccreditationLogo className="w-20 h-20" />
              </div>

              {/* Title Below Header */}
              <h2 className="text-center text-lg md:text-xl font-black uppercase tracking-widest text-slate-950 underline decoration-2 underline-offset-4 mt-4 font-sans">
                CLASS OBSERVATION
              </h2>
            </div>

            {/* Faculty Information Section */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-medium font-sans">
              <div className="flex items-baseline gap-2">
                <span className="font-bold w-48 shrink-0">Name of the Faculty :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {displayFacultyName}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold w-36 shrink-0">Date :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {displayDate}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold w-48 shrink-0">Subject Name / Topic :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900 truncate">
                  {displaySubject} {displayTopic ? `(${displayTopic})` : ''}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold w-36 shrink-0">Class / Dept :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {displayClassName}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold w-48 shrink-0">Observation Starting Time :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {displayStartTime}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold w-36 shrink-0">Observation Ending Time :</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {displayEndTime}
                </span>
              </div>
            </div>

            {/* Observation Criteria Table */}
            <div className="overflow-x-auto font-sans">
              <table className="w-full border-collapse border-2 border-slate-900 text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-900">
                    <th className="border border-slate-900 p-2.5 text-left font-extrabold w-1/2">Criteria</th>
                    <th className="border border-slate-900 p-2.5 text-center font-extrabold w-1/8">Excellent</th>
                    <th className="border border-slate-900 p-2.5 text-center font-extrabold w-1/8">Good</th>
                    <th className="border border-slate-900 p-2.5 text-center font-extrabold w-1/8">Average</th>
                    <th className="border border-slate-900 p-2.5 text-center font-extrabold w-1/8">Poor</th>
                  </tr>
                </thead>
                <tbody>
                  {OBSERVATION_CRITERIA.map((criterion, idx) => {
                    const currentRating = displayCriteria[criterion] || 'Good';
                    return (
                      <tr key={criterion} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-900 p-2.5 font-medium text-slate-900">
                          {criterion}
                        </td>
                        {(['Excellent', 'Good', 'Average', 'Poor'] as const).map((rating) => {
                          const isChecked = currentRating === rating;
                          return (
                            <td key={rating} className="border border-slate-900 p-2.5 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => handleRatingToggle(criterion, rating)}
                                className="inline-flex items-center justify-center w-5 h-5 cursor-pointer"
                              >
                                {isChecked ? (
                                  <div className="w-4 h-4 border-2 border-slate-900 bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                    ✓
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-slate-400 bg-white hover:border-slate-900 transition-colors" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Strengths & Areas for Improvement Section */}
            <div className="space-y-4 pt-2 font-sans text-sm">
              {/* Strengths */}
              <div>
                <h3 className="font-extrabold italic text-slate-950 mb-2">Strengths of the Faculty:</h3>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <li key={i} className="text-slate-800">
                      {selectedObsForForm ? (
                        <span className="border-b border-dotted border-slate-400 inline-block w-[92%] ml-1">
                          {displayStrengths[i] || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={strengths[i] || ''}
                          onChange={(e) => handleStrengthChange(i, e.target.value)}
                          placeholder={`Strength ${i + 1}...`}
                          className="border-b border-dotted border-slate-600 focus:border-slate-900 outline-none w-[92%] ml-1 px-1 bg-transparent text-sm"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h3 className="font-extrabold italic text-slate-950 mb-2">Areas for Improvement:</h3>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <li key={i} className="text-slate-800">
                      {selectedObsForForm ? (
                        <span className="border-b border-dotted border-slate-400 inline-block w-[92%] ml-1">
                          {displayImprovements[i] || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={improvements[i] || ''}
                          onChange={(e) => handleImprovementChange(i, e.target.value)}
                          placeholder={`Area for Improvement ${i + 1}...`}
                          className="border-b border-dotted border-slate-600 focus:border-slate-900 outline-none w-[92%] ml-1 px-1 bg-transparent text-sm"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Bottom Signature Line */}
            <div className="pt-12 flex justify-end font-sans">
              <div className="text-center w-48">
                <div className="border-b border-slate-900 mb-1 h-8 flex items-end justify-center font-semibold text-xs text-slate-700">
                  {selectedObsForForm?.observedBy || observedBy}
                </div>
                <span className="font-extrabold text-sm tracking-wider uppercase">HOD</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* -------------------- RECORDS LOG LIST VIEW -------------------- */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, faculty, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Academic Year Filter */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Year:</span>
              {[
                { id: 'all', label: 'All Years' },
                { id: '2nd', label: '2nd Year' },
                { id: '3rd', label: '3rd Year' },
                { id: '4th', label: '4th Year' },
              ].map((y) => (
                <button
                  key={y.id}
                  onClick={() => setYearFilter(y.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    yearFilter === y.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Rating:</span>
              {(['all', 'Excellent', 'Good', 'Average', 'Needs Improvement'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    ratingFilter === r
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredObservations.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  No classroom observation records found.
                </p>
                <p className="text-xs text-slate-500">
                  Click "Record Observation" above to evaluate classroom teaching outcomes.
                </p>
              </div>
            ) : (
              filteredObservations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between hover:border-red-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{obs.facultyName}</span>
                        </h3>
                        <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-0.5">
                          {obs.subject} {obs.topic ? `• ${obs.topic}` : ''}
                        </p>
                      </div>
                      <ObservationBadge rating={obs.observation} />
                    </div>

                    <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Class & Hour:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {obs.className} • {obs.hour}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Observed Timing & Date:</span>
                        <span>
                          {obs.startingTime ? `${obs.startingTime} - ${obs.endingTime}` : obs.date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Evaluated By:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{obs.observedBy}</span>
                      </div>
                    </div>

                    {/* Criteria Ratings Breakdown Pills */}
                    {obs.criteriaRatings && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Criteria Compliance Summary (10 Parameters):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(obs.criteriaRatings).map(([crit, rat]) => {
                            const ratingStr = String(rat);
                            return (
                              <span
                                key={crit}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  ratingStr === 'Excellent'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : ratingStr === 'Good'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                    : ratingStr === 'Average'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                }`}
                                title={`${crit}: ${ratingStr}`}
                              >
                                {crit.split(' ')[0]} ({ratingStr.charAt(0)})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-red-900 dark:text-red-300 block mb-1 font-sans">
                        Observation Feedback & Remarks:
                      </strong>
                      "{obs.remarks}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedObsForForm(obs);
                        setActiveTabMode('official_form');
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Printable Form
                    </button>

                    {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete observation record for ${obs.facultyName}?`)) {
                            deleteObservation(obs.id);
                          }
                        }}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------- RECORD OBSERVATION MODAL -------------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 my-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Record Classroom Observation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official Sasurie College of Engineering Evaluation Criteria Checklist
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Faculty Info Section */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  1. Faculty & Session Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Name of the Faculty *
                    </label>
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-medium"
                    >
                      {availableStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.facultyName} ({s.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject Name / Topic *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Design & Analysis of Algorithms"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Class / Department *
                    </label>
                    {!useCustomClass ? (
                      <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-medium"
                      >
                        {classList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.year} {c.department} - {c.section} (Room {c.roomNumber})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={customClassName}
                        onChange={(e) => setCustomClassName(e.target.value)}
                        placeholder="e.g. 3rd Year AI & DS - Sec A"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Observation Starting Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={startingTime}
                      onChange={(e) => setStartingTime(e.target.value)}
                      placeholder="09:30 AM"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Observation Ending Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={endingTime}
                      onChange={(e) => setEndingTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Observation Criteria Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    2. Observation Criteria Table (10 Checklist Parameters)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Select rating for each parameter
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                        <th className="p-2.5 text-left w-1/2">Criteria</th>
                        <th className="p-2.5 text-center">Excellent</th>
                        <th className="p-2.5 text-center">Good</th>
                        <th className="p-2.5 text-center">Average</th>
                        <th className="p-2.5 text-center">Poor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {OBSERVATION_CRITERIA.map((criterion) => {
                        const selectedRating = criteriaRatings[criterion];
                        return (
                          <tr key={criterion} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                              {criterion}
                            </td>
                            {(['Excellent', 'Good', 'Average', 'Poor'] as const).map((rating) => (
                              <td key={rating} className="p-2.5 text-center align-middle">
                                <input
                                  type="radio"
                                  name={`crit-${criterion}`}
                                  checked={selectedRating === rating}
                                  onChange={() => handleRatingToggle(criterion, rating)}
                                  className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strengths Section (1 to 5) */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  3. Strengths of the Faculty (Top 5 Points)
                </h4>
                <div className="space-y-1.5">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={strengths[idx] || ''}
                        onChange={(e) => handleStrengthChange(idx, e.target.value)}
                        placeholder={`Strength #${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas for Improvement Section (1 to 5) */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  4. Areas for Improvement (Top 5 Recommendations)
                </h4>
                <div className="space-y-1.5">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={improvements[idx] || ''}
                        onChange={(e) => handleImprovementChange(idx, e.target.value)}
                        placeholder={`Area for Improvement #${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Rating & Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Overall Summary Rating
                  </label>
                  <select
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value as ObservationRating)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-bold"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement font-bold text-rose-600">Needs Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Evaluated / Signed By
                  </label>
                  <input
                    type="text"
                    value={observedBy}
                    onChange={(e) => setObservedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  General Remarks & Key Takeaways
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional remarks..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Class Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
