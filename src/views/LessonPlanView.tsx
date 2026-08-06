import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LessonPlanItem, DEPARTMENTS } from '../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  Shield,
  Filter,
} from 'lucide-react';

export const LessonPlanView: React.FC = () => {
  const {
    currentUser,
    lessonPlanList,
    addLessonPlanItem,
    updateLessonPlanItem,
    deleteLessonPlanItem,
    classList,
    staffList,
    dailyReport,
  } = useApp();

  const isStaff = currentUser?.role === 'staff';
  const isHod = currentUser?.role === 'admin';
  const isPrincipal = currentUser?.role === 'principal';

  // HOD's Department
  const hodDepartment = currentUser?.department || dailyReport?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  // Principal's Selected Department Filter
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Faculty Member Filter
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  // Other Filters
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<LessonPlanItem | null>(null);

  // Form Fields
  const [formStaffName, setFormStaffName] = useState<string>(currentUser?.name || staffList[0]?.facultyName || 'M. Kaviyarasu');
  const [formClassName, setFormClassName] = useState<string>('III Year AI & DS - Sec A');
  const [formCourseCode, setFormCourseCode] = useState<string>('CS3501');
  const [formCourseName, setFormCourseName] = useState<string>('Compiler Design');
  const [formUnitNo, setFormUnitNo] = useState<'Unit 1' | 'Unit 2' | 'Unit 3' | 'Unit 4' | 'Unit 5'>('Unit 1');
  const [formUnitName, setFormUnitName] = useState<string>('');
  const [formTopicName, setFormTopicName] = useState<string>('');
  const [formPlanHours, setFormPlanHours] = useState<number>(1);
  const [formPlanDate, setFormPlanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCoLevel, setFormCoLevel] = useState<'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5' | 'NA'>('CO1');
  const [formPtLevel, setFormPtLevel] = useState<
    'K1 - Remember' | 'K2 - Understand' | 'K3 - Apply' | 'K4 - Analyze' | 'K5 - Evaluate' | 'K6 - Create' | 'NA'
  >('K2 - Understand');
  const [formPedagogy, setFormPedagogy] = useState<
    'Chalk & Talk' | 'PPT / ICT' | 'Flipped Classroom' | 'Group Discussion' | 'Problem Based Learning' | 'Seminar' | 'NA'
  >('Chalk & Talk');
  const [formStatus, setFormStatus] = useState<'Planned' | 'In Progress' | 'Completed'>('Planned');
  const [formRemarks, setFormRemarks] = useState<string>('');

  // Determine allowed staff list based on role and department selection
  const allowedStaffList = staffList.filter((s) => {
    if (isStaff) {
      return (
        (s.facultyName || '').toLowerCase() === (currentUser?.name || '').toLowerCase() ||
        s.id === currentUser?.staffId ||
        (currentUser?.email && (s.email || '').toLowerCase() === (currentUser.email || '').toLowerCase())
      );
    }
    if (isHod) {
      return (s.department || '').toLowerCase() === (hodDepartment || '').toLowerCase();
    }
    if (isPrincipal) {
      if (selectedDepartment === 'all') return true;
      return (s.department || '').toLowerCase() === (selectedDepartment || '').toLowerCase();
    }
    return true;
  });

  // Filter base lesson plan items strictly by Role and Department
  const roleFilteredLessonPlans = lessonPlanList.filter((item) => {
    const ownerStaff = staffList.find(
      (s) => s.id === item.staffId || (s.facultyName || '').toLowerCase() === (item.staffName || '').toLowerCase()
    );
    const itemDept = ownerStaff?.department || hodDepartment;

    // RULE 1: Staff Login -> ONLY show their own lesson plans
    if (isStaff) {
      const isOwner =
        (currentUser?.staffId && item.staffId === currentUser.staffId) ||
        (currentUser?.name && (item.staffName || '').toLowerCase() === (currentUser.name || '').toLowerCase()) ||
        (currentUser?.email && ownerStaff?.email && ownerStaff.email.toLowerCase() === (currentUser.email || '').toLowerCase());
      return isOwner;
    }

    // RULE 2: HOD Login -> ONLY show lesson plans of faculty members in HOD's department
    if (isHod) {
      return (itemDept || '').toLowerCase() === (hodDepartment || '').toLowerCase();
    }

    // RULE 3: Principal Login -> Department-wise lesson plans selection
    if (isPrincipal) {
      if (selectedDepartment === 'all') return true;
      return (itemDept || '').toLowerCase() === (selectedDepartment || '').toLowerCase();
    }

    return true;
  });

  // Reset Form
  const resetForm = () => {
    setEditingItem(null);
    setFormStaffName(allowedStaffList[0]?.facultyName || currentUser?.name || 'M. Kaviyarasu');
    setFormClassName('III Year AI & DS - Sec A');
    setFormCourseCode('CS3501');
    setFormCourseName('Compiler Design');
    setFormUnitNo('Unit 1');
    setFormUnitName('');
    setFormTopicName('');
    setFormPlanHours(1);
    setFormPlanDate(new Date().toISOString().split('T')[0]);
    setFormCoLevel('CO1');
    setFormPtLevel('K2 - Understand');
    setFormPedagogy('Chalk & Talk');
    setFormStatus('Planned');
    setFormRemarks('');
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LessonPlanItem) => {
    setEditingItem(item);
    setFormStaffName(item.staffName);
    setFormClassName(item.className);
    setFormCourseCode(item.courseCode);
    setFormCourseName(item.courseName);
    setFormUnitNo(item.unitNo);
    setFormUnitName(item.unitName);
    setFormTopicName(item.topicName);
    setFormPlanHours(item.planHours || 1);
    setFormPlanDate(item.planDate);
    setFormCoLevel(item.coLevel);
    setFormPtLevel(item.ptLevel);
    setFormPedagogy(item.pedagogy);
    setFormStatus(item.status);
    setFormRemarks(item.remarks || '');
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedStaff = staffList.find((s) => s.facultyName === formStaffName);
    const staffId = matchedStaff ? matchedStaff.id : currentUser?.staffId || 'STF001';

    const itemData = {
      staffId,
      staffName: formStaffName,
      className: formClassName,
      courseCode: formCourseCode,
      courseName: formCourseName,
      unitNo: formUnitNo,
      unitName: formUnitName || `${formUnitNo} Topic`,
      topicName: formTopicName,
      planHours: Number(formPlanHours) || 1,
      planDate: formPlanDate,
      coLevel: formCoLevel,
      ptLevel: formPtLevel,
      pedagogy: formPedagogy,
      status: formStatus,
      completedDate: formStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
      actualHours: formStatus === 'Completed' ? Number(formPlanHours) : undefined,
      remarks: formRemarks,
    };

    if (editingItem) {
      updateLessonPlanItem(editingItem.id, itemData);
    } else {
      addLessonPlanItem(itemData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Display Items after secondary user filter controls
  const displayItems = roleFilteredLessonPlans.filter((item) => {
    // Secondary Staff Filter Dropdown
    const matchesStaff =
      selectedStaffFilter === 'all' ||
      (item.staffName || '').toLowerCase().includes((selectedStaffFilter || '').toLowerCase()) ||
      item.staffId === selectedStaffFilter;

    // Unit filter
    const matchesUnit = unitFilter === 'all' || item.unitNo === unitFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // Search query
    const matchesQuery =
      searchQuery === '' ||
      (item.unitName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.topicName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.courseName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.staffName || '').toLowerCase().includes((searchQuery || '').toLowerCase());

    return matchesStaff && matchesUnit && matchesStatus && matchesQuery;
  });

  // Calculate Unit 1 to 5 stats
  const getUnitCompletionStats = () => {
    const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'] as const;

    return units.map((u) => {
      const unitItems = displayItems.filter((lp) => lp.unitNo === u);
      const total = unitItems.length;
      const completed = unitItems.filter((lp) => lp.status === 'Completed').length;
      const inProgress = unitItems.filter((lp) => lp.status === 'In Progress').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        unitNo: u,
        total,
        completed,
        inProgress,
        pct,
        status: completed === total && total > 0 ? 'Completed' : inProgress > 0 ? 'In Progress' : 'Planned',
      };
    });
  };

  const currentUnitStats = getUnitCompletionStats();
  const overallCompleted = displayItems.filter((i) => i.status === 'Completed').length;
  const overallTotal = displayItems.length;
  const overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner with Role-based Context */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Academic Planning & 5-Unit Syllabus Execution
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Faculty Lesson Plan Management
            {isStaff && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-300">
                Personal Faculty View
              </span>
            )}
            {isHod && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-400 text-slate-950 border border-teal-300">
                Department HOD View
              </span>
            )}
            {isPrincipal && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-400 text-slate-950 border border-purple-300">
                Principal College View
              </span>
            )}
          </h1>

          <p className="text-xs text-blue-100/90 mt-1">
            {isStaff && `Showing ONLY your personal lesson plans (${currentUser?.name})`}
            {isHod && `Showing ONLY faculty members & lesson plans for ${hodDepartment}`}
            {isPrincipal && `Select a department below to view department-wise faculty lesson plans.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow border border-amber-300 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Lesson Topic
          </button>
        </div>
      </div>

      {/* PRINCIPAL SPECIFIC ROLE CONTROL: Department Selector Banner */}
      {isPrincipal && (
        <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-white p-4 rounded-2xl border border-purple-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Principal Department Selection Filter
              </div>
              <div className="text-sm font-black text-white">Select Department to View Department-Wise Lesson Plans</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedStaffFilter('all');
              }}
              className="w-full sm:w-80 px-4 py-2.5 bg-slate-900/90 text-amber-300 font-extrabold text-xs rounded-xl border-2 border-purple-400/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">🏢 All Departments (College-Wide)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* HOD SPECIFIC ROLE BANNER */}
      {isHod && (
        <div className="bg-teal-950/80 border border-teal-500/30 text-teal-100 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>
              <strong>HOD View Locked:</strong> Showing only faculty members from <strong>{hodDepartment}</strong>
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
            {allowedStaffList.length} Department Faculty Members
          </span>
        </div>
      )}

      {/* STAFF SPECIFIC ROLE BANNER */}
      {isStaff && (
        <div className="bg-amber-950/80 border border-amber-500/30 text-amber-100 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Personal Faculty Log:</strong> Logged in as <strong>{currentUser?.name}</strong>. Only your assigned course syllabus topics are displayed.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            Strict Role Isolation
          </span>
        </div>
      )}

      {/* 5-Unit Progress Completion Dashboard */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> 5-Unit Syllabus Completion Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isStaff
                ? 'Your personal syllabus progress across Units 1 to 5'
                : isHod
                ? `${hodDepartment} 5-Unit Syllabus Completion`
                : selectedDepartment === 'all'
                ? 'College-Wide 5-Unit Syllabus Completion'
                : `${selectedDepartment} 5-Unit Syllabus Completion`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Faculty Selector (Available for HOD or Principal) */}
            {!isStaff && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Faculty Filter:</span>
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                >
                  <option value="all">👥 All Department Faculty ({allowedStaffList.length})</option>
                  {allowedStaffList.map((stf) => (
                    <option key={stf.id} value={stf.facultyName}>
                      {stf.facultyName} ({(stf.department || '').split('(')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs font-black px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
              Overall: {overallPct}% Completed ({overallCompleted}/{overallTotal} Topics)
            </div>
          </div>
        </div>

        {/* 5 Units Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {currentUnitStats.map((uStat) => {
            const isDone = uStat.completed > 0 && uStat.completed === uStat.total;
            const isInProg = uStat.inProgress > 0 || (uStat.completed > 0 && uStat.completed < uStat.total);

            return (
              <div
                key={uStat.unitNo}
                onClick={() => setUnitFilter(unitFilter === uStat.unitNo ? 'all' : uStat.unitNo)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  unitFilter === uStat.unitNo
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{uStat.unitNo}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : isInProg
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isDone ? 'Completed' : isInProg ? 'In Progress' : 'Planned'}
                  </span>
                </div>

                <div className="text-lg font-black text-slate-900 dark:text-white mb-1">{uStat.pct}%</div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : isInProg ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${uStat.pct}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{uStat.completed} Done</span>
                  <span>{uStat.total} Topics</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topic, unit name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Unit Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
            >
              <option value="all">📚 All 5 Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 4">Unit 4</option>
              <option value="Unit 5">Unit 5</option>
            </select>
          </div>
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'Completed', 'In Progress', 'Planned'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Plan Topics Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Syllabus Lesson Topics ({displayItems.length})
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click status button to toggle Planned → In Progress → Completed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-black text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5">Faculty / Course</th>
                <th className="p-3.5">Unit Name & Topic Details</th>
                <th className="p-3.5">Plan Details</th>
                <th className="p-3.5">CO & Bloom's Level</th>
                <th className="p-3.5">Pedagogy Method</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No lesson plan topics found matching the criteria.
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-md border border-blue-300 dark:border-blue-800 font-extrabold text-[11px]">
                        {item.unitNo}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{item.staffName}</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                        {item.courseName} ({item.courseCode})
                      </div>
                      <div className="text-[10px] text-slate-400">{item.className}</div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.unitName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.topicName}
                      </div>
                      {item.remarks && (
                        <div className="text-[10px] italic text-slate-400 mt-1">Note: {item.remarks}</div>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Plan Hours: {item.planHours} Hour(s)
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date: {item.planDate}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded text-[10px] font-black border border-amber-300">
                          {item.coLevel}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 rounded text-[10px] font-extrabold border border-purple-300">
                          {item.ptLevel}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-600">
                        {item.pedagogy}
                      </span>
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus =
                            item.status === 'Planned'
                              ? 'In Progress'
                              : item.status === 'In Progress'
                              ? 'Completed'
                              : 'Planned';
                          updateLessonPlanItem(item.id, {
                            status: nextStatus,
                            completedDate: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 mx-auto ${
                          item.status === 'Completed'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : item.status === 'In Progress'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        {item.status === 'Completed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </>
                        ) : item.status === 'In Progress' ? (
                          <>
                            <Clock className="w-3.5 h-3.5" /> In Progress
                          </>
                        ) : (
                          'Planned'
                        )}
                      </button>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg"
                          title="Edit Lesson Topic"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this lesson plan item?')) {
                              deleteLessonPlanItem(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                          title="Delete Lesson Topic"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lesson Plan Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">
                  {editingItem ? 'Edit Lesson Plan Topic' : 'Add New Lesson Plan Topic'}
                </h3>
                <p className="text-xs text-blue-100">Specify Unit, CO Level, Bloom's Taxonomy & Pedagogy</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Faculty Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Member Name
                  </label>
                  {isStaff ? (
                    <input
                      type="text"
                      disabled
                      value={currentUser?.name || 'M. Kaviyarasu'}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold cursor-not-allowed opacity-80"
                    />
                  ) : (
                    <select
                      value={formStaffName}
                      onChange={(e) => setFormStaffName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                    >
                      {allowedStaffList.map((stf) => (
                        <option key={stf.id} value={stf.facultyName}>
                          {stf.facultyName} ({(stf.department || '').split('(')[0].trim()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Class / Department */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Class</label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    {classList.map((cls) => (
                      <option key={cls.id} value={`${cls.year} ${(cls.department || '').split('(')[0].trim()} - ${cls.section}`}>
                        {cls.year} {(cls.department || '').split('(')[0].trim()} - {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Code & Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formCourseCode}
                    onChange={(e) => setFormCourseCode(e.target.value)}
                    placeholder="e.g. CS3501"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Name</label>
                  <input
                    type="text"
                    required
                    value={formCourseName}
                    onChange={(e) => setFormCourseName(e.target.value)}
                    placeholder="e.g. Compiler Design"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                {/* Unit No Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Number</label>
                  <select
                    value={formUnitNo}
                    onChange={(e) => setFormUnitNo(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black"
                  >
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 3">Unit 3</option>
                    <option value="Unit 4">Unit 4</option>
                    <option value="Unit 5">Unit 5</option>
                  </select>
                </div>

                {/* Plan Hours */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Hours</label>
                  <select
                    value={formPlanHours}
                    onChange={(e) => setFormPlanHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value={1}>1 Hours</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={5}>5 Hours</option>
                  </select>
                </div>
              </div>

              {/* Unit Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Title / Name</label>
                <input
                  type="text"
                  required
                  value={formUnitName}
                  onChange={(e) => setFormUnitName(e.target.value)}
                  placeholder="e.g. Syntax Analysis & Parsing Techniques"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* Topic / Content Details */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Content / Sub-topics Covered
                </label>
                <textarea
                  rows={2}
                  required
                  value={formTopicName}
                  onChange={(e) => setFormTopicName(e.target.value)}
                  placeholder="Enter detailed syllabus topics to be covered in this lecture hour..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Dropdowns row: Plan Date, CO Level, PT Level, Pedagogy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Date</label>
                  <input
                    type="date"
                    required
                    value={formPlanDate}
                    onChange={(e) => setFormPlanDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">CO Level</label>
                  <select
                    value={formCoLevel}
                    onChange={(e) => setFormCoLevel(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="CO1">CO1</option>
                    <option value="CO2">CO2</option>
                    <option value="CO3">CO3</option>
                    <option value="CO4">CO4</option>
                    <option value="CO5">CO5</option>
                    <option value="NA">NA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PT Level (Bloom's)
                  </label>
                  <select
                    value={formPtLevel}
                    onChange={(e) => setFormPtLevel(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="K1 - Remember">K1 - Remember</option>
                    <option value="K2 - Understand">K2 - Understand</option>
                    <option value="K3 - Apply">K3 - Apply</option>
                    <option value="K4 - Analyze">K4 - Analyze</option>
                    <option value="K5 - Evaluate">K5 - Evaluate</option>
                    <option value="K6 - Create">K6 - Create</option>
                    <option value="NA">NA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pedagogy Method</label>
                  <select
                    value={formPedagogy}
                    onChange={(e) => setFormPedagogy(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Chalk & Talk">Chalk & Talk</option>
                    <option value="PPT / ICT">PPT / ICT</option>
                    <option value="Flipped Classroom">Flipped Classroom</option>
                    <option value="Group Discussion">Group Discussion</option>
                    <option value="Problem Based Learning">Problem Based Learning</option>
                    <option value="Seminar">Seminar</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
              </div>

              {/* Status and Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Execution Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="e.g. Demonstration done, notes shared on Classroom"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {editingItem ? 'Save Changes' : 'Create Topic Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
