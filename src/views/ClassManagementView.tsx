import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassRoom, DEPARTMENTS } from '../types';
import { StudentAttendanceModal } from '../components/StudentAttendanceModal';
import { isSameDept } from '../utils/departmentUtils';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  DoorOpen,
  UserCheck,
  Calendar,
  X,
  BookOpen,
  Users,
  Edit3,
} from 'lucide-react';

interface ClassManagementViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const ClassManagementView: React.FC<ClassManagementViewProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { classList, addClass, updateClass, deleteClass, staffList, currentUser, filterState, dailyReport } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Form states
  const [year, setYear] = useState('3rd Year');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [section, setSection] = useState('A');
  const [classAdvisor, setClassAdvisor] = useState(staffList[0]?.facultyName || 'M. Kaviyarasu');
  const [roomNumber, setRoomNumber] = useState('CS-301');
  const [semester, setSemester] = useState('Semester 5');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [courseCode, setCourseCode] = useState('CS3501');
  const [courseName, setCourseName] = useState('Compiler Design');

  React.useEffect(() => {
    if (isAddModalOpen) setShowModal(true);
  }, [isAddModalOpen]);

  const openAddModal = () => {
    const defaultDept = currentUser?.department || DEPARTMENTS[0];
    const deptStaff = staffList.find((s) => isSameDept(s.department, defaultDept));
    setEditingClass(null);
    setYear('2nd Year');
    setDepartment(defaultDept);
    setSection('Sec A');
    setClassAdvisor(deptStaff?.facultyName || staffList[0]?.facultyName || '');
    setRoomNumber('ROOM-101');
    setSemester('Semester 3');
    setAcademicYear('2025-2026');
    setCourseCode('');
    setCourseName('');
    setShowModal(true);
  };

  const openEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setYear(cls.year);
    setDepartment(cls.department);
    setSection(cls.section);
    setClassAdvisor(cls.classAdvisor);
    setRoomNumber(cls.roomNumber);
    setSemester(cls.semester);
    setAcademicYear(cls.academicYear);
    setCourseCode(cls.courseCode || '');
    setCourseName(cls.courseName || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClass) {
      updateClass(editingClass.id, {
        year,
        department,
        section,
        classAdvisor,
        roomNumber,
        semester,
        academicYear,
        courseCode,
        courseName,
      });
    } else {
      addClass({
        year,
        department,
        section,
        classAdvisor,
        roomNumber,
        semester,
        academicYear,
        courseCode,
        courseName,
      });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete class record ${id}?`)) {
      deleteClass(id);
    }
  };

  const isHod = currentUser?.role === 'admin';
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const filteredClasses = classList.filter((c) => {
    // HOD Scope: Only see classes from their department
    if (isHod) {
      if (!isSameDept(c.department, hodDepartment)) return false;
    }

    const q = (search || filterState.searchQuery).toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(q) ||
      c.year.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q) ||
      c.classAdvisor.toLowerCase().includes(q) ||
      c.roomNumber.toLowerCase().includes(q) ||
      (c.courseCode && c.courseCode.toLowerCase().includes(q)) ||
      (c.courseName && c.courseName.toLowerCase().includes(q));

    const matchesDept =
      departmentFilter === 'all' ||
      c.department.toLowerCase() === departmentFilter.toLowerCase() ||
      c.department.toLowerCase().includes(departmentFilter.toLowerCase());

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Classroom & Academic Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure department class sections, assign class advisors, room numbers, and academic terms.
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            One-Click Add Class
          </button>
        )}
      </div>

      {/* Controls: Search & Department Dropdown Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class by year, section, room or advisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Department Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">🎓 All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            No class records found.
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                    {cls.year} — Section {cls.section}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {cls.semester}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {cls.department}
                </h3>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl mb-3 border border-slate-100 dark:border-slate-800">
                  {(cls.courseCode || cls.courseName) && (
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Course: <strong className="text-slate-900 dark:text-white">{cls.courseCode ? `[${cls.courseCode}] ` : ''}{cls.courseName}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Advisor: <strong className="text-slate-800 dark:text-slate-200">{cls.classAdvisor}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Room: <strong className="text-slate-800 dark:text-slate-200">{cls.roomNumber}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Academic Year: {cls.academicYear}</span>
                  </div>
                </div>

                {/* Today's Student Attendance Summary for this Class */}
                {(() => {
                  const attSummary = (dailyReport.studentAttendanceSummaries || []).find(
                    (s) =>
                      s.classId === cls.id ||
                      (isSameDept(s.department || s.className, cls.department) &&
                        s.className.toLowerCase().includes(cls.section.toLowerCase()))
                  );

                  return (
                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Today's Attendance:</span>
                      </div>
                      {attSummary ? (
                        <div className="flex items-center gap-2">
                          <div className="text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-emerald-600">P:{attSummary.presentStudents}</span>{' '}
                            <span className="text-rose-500">A:{attSummary.absentStudents ?? Math.max(0, attSummary.totalStudents - attSummary.presentStudents)}</span>{' '}
                            {attSummary.odStudents ? <span className="text-amber-600">OD:{attSummary.odStudents}</span> : null}
                          </div>
                          <span className="font-extrabold px-1.5 py-0.5 rounded text-[10px] bg-blue-600 text-white">
                            {attSummary.attendancePercentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not entered</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Enter Attendance
                </button>

                {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingClass ? 'Edit Class Details' : 'Add New Class Section'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. CS3501 / AD3401"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Name / Subject
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Compiler Design"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Advisor / Assigned Mentor
                  </label>
                  <select
                    value={classAdvisor}
                    onChange={(e) => setClassAdvisor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.facultyName}>
                        {s.facultyName} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="CS-301"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="Semester 5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />
    </div>
  );
};
