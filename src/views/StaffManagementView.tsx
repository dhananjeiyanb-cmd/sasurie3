import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Staff, DEPARTMENTS, CoordinatorRole, Role, SASURIE_COLLEGES } from '../types';
import { getCollegeLogoText, getUserCollege, isStaffInCollege, isSameCollege } from '../utils/departmentUtils';
import { StaffStatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  X,
  Shield,
  UserCheck,
  CheckCircle,
  Award,
  Sparkles,
} from 'lucide-react';

interface StaffManagementViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { staffList, addStaff, updateStaff, deleteStaff, clearAllStaff, currentUser, loginAsDemo, filterState, updateUserPassword, dailyReport, updateDailyReport } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states
  const [facultyId, setFacultyId] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [institution, setInstitution] = useState<string>(dailyReport?.collegeName || 'Sasurie College of Engineering');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('sasurie');
  const [role, setRole] = useState<Role>('staff');
  const [coordinatorRole, setCoordinatorRole] = useState<CoordinatorRole>('General Faculty');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [idError, setIdError] = useState('');

  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingStaff(null);
    const nextNum = staffList.length + 1;
    setFacultyId(`FAC${String(nextNum).padStart(3, '0')}`);
    setFacultyName('');
    setDesignation('Assistant Professor');
    setDepartment(DEPARTMENTS[0]);
    setInstitution(dailyReport?.collegeName || 'Sasurie College of Engineering');
    setMobile('');
    setEmail('');
    setMemberPassword('sasurie');
    setRole('staff');
    setCoordinatorRole('General Faculty');
    setStatus('Active');
    setIdError('');
    setShowModal(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFacultyId(staff.id);
    setFacultyName(staff.facultyName);
    setDesignation(staff.designation);
    setDepartment(staff.department);
    setInstitution(staff.institution || dailyReport?.collegeName || 'Sasurie College of Engineering');
    setMobile(staff.mobile);
    setEmail(staff.email);
    setMemberPassword(staff.password || 'sasurie');
    setRole(staff.role);
    setCoordinatorRole(staff.coordinatorRole || 'General Faculty');
    setStatus(staff.status);
    setIdError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIdError('');
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyName.trim()) return;

    const cleanId = facultyId.trim().toUpperCase() || `FAC${String(staffList.length + 1).padStart(3, '0')}`;
    
    // Validate uniqueness of Faculty ID
    const duplicate = staffList.find(
      (s) => s.id.toUpperCase() === cleanId && s.id !== editingStaff?.id
    );

    if (duplicate) {
      setIdError(`Faculty ID "${cleanId}" is already assigned to ${duplicate.facultyName}. Please enter a unique Faculty ID.`);
      return;
    }

    const pass = memberPassword || 'sasurie';

    // Auto-update global college name and logo text for PDF headers
    updateDailyReport({
      collegeName: institution,
      collegeLogoText: getCollegeLogoText(institution),
    });

    if (editingStaff) {
      updateStaff(editingStaff.id, {
        id: cleanId,
        facultyName,
        designation,
        department,
        institution,
        mobile,
        email,
        password: pass,
        role,
        coordinatorRole,
        status,
      });
      updateUserPassword(cleanId, pass);
      if (email) updateUserPassword(email, pass);
    } else {
      addStaff({
        id: cleanId,
        facultyName,
        designation,
        department,
        institution,
        mobile,
        email,
        password: pass,
        role,
        coordinatorRole,
        status,
      });
      updateUserPassword(cleanId, pass);
      if (email) updateUserPassword(email, pass);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string, name: string) => {
    if ((name || '').toUpperCase().includes('DHANANJEIYAN')) {
      alert('DHANANJEIYAN B cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete staff member "${name}" (${id})?`)) {
      deleteStaff(id);
    }
  };

  const isHod = currentUser?.role === 'admin';
  const isSecretary = currentUser?.role === 'secretary' || currentUser?.role === 'secretary_pa';
  const isPrincipalUser = currentUser?.role === 'principal' || currentUser?.role === 'principal_pa';
  const principalCollege = getUserCollege(currentUser, dailyReport?.collegeName);
  const hodDepartment = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';

  const [collegeFilter, setCollegeFilter] = useState<string>('all');

  const filteredStaff = staffList.filter((s) => {
    // Principal Scope: ONLY see staff belonging to their college
    if (isPrincipalUser) {
      if (!isStaffInCollege(s, principalCollege)) return false;
    }

    // Secretary Scope: See all staff across all colleges, or filter by specific college
    if (isSecretary && collegeFilter !== 'all') {
      if (!isStaffInCollege(s, collegeFilter)) return false;
    }

    // HOD Scope: Only see staff from their own department
    if (isHod) {
      const staffDept = (s.department || '').toLowerCase();
      const userDept = (hodDepartment || '').toLowerCase();
      const isSameDept = staffDept === userDept || (staffDept.includes('ai & ds') && userDept.includes('ai & ds'));
      if (!isSameDept) return false;
    }

    const q = (search || filterState?.searchQuery || '').toLowerCase();
    const matchesSearch =
      (s.facultyName || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q) ||
      (s.designation || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    const matchesDept =
      departmentFilter === 'all' ||
      (s.department || '').toLowerCase() === (departmentFilter || '').toLowerCase() ||
      (s.department || '').toLowerCase().includes((departmentFilter || '').toLowerCase());

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Staff Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage department faculty members, contact details, designations, and system roles.
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
          <div className="flex items-center gap-2 shrink-0">
            {staffList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all extra faculty members from the database except DHANANJEIYAN B? This action cannot be undone.')) {
                    clearAllStaff();
                  }
                }}
                className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Clear all extra faculty members (except DHANANJEIYAN B)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Extra Faculty
              </button>
            )}

            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              One-Click Add Staff
            </button>
          </div>
        )}
      </div>

      {/* Controls: Search, Department Dropdown & Status Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">🏢 All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Secretary College Filter */}
          {isSecretary && (
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-extrabold text-purple-900 dark:text-purple-200 shrink-0">🎓 College:</span>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="text-xs font-bold bg-transparent text-purple-950 dark:text-purple-100 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">🌐 All Colleges</option>
                {SASURIE_COLLEGES.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Principal College Scope Badge */}
          {isPrincipalUser && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 shrink-0">🎓 College Scope:</span>
              <span className="text-xs font-black text-amber-950 dark:text-amber-100 truncate max-w-[220px]">
                {principalCollege}
              </span>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'Active', 'Inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Staff' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
            No faculty members found matching your search.
          </div>
        ) : (
          filteredStaff.map((staff, idx) => (
            <div
              key={staff.id ? `${staff.id}-${idx}` : `staff-${idx}`}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {(staff.facultyName || '')
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'ST'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {staff.facultyName}
                      </h3>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                        {staff.designation}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StaffStatusBadge status={staff.status} />
                    {staff.role === 'principal' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300/50">
                        Principal
                      </span>
                    )}
                    {staff.role === 'secretary' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300/50">
                        Secretary
                      </span>
                    )}
                    {staff.role === 'principal_pa' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300/50">
                        Principal PA
                      </span>
                    )}
                    {staff.role === 'secretary_pa' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-300/50">
                        Secretary PA
                      </span>
                    )}
                    {staff.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 border border-sky-300/50">
                        Admin (HOD)
                      </span>
                    )}
                    {staff.role === 'staff' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300/50">
                        Faculty
                      </span>
                    )}
                    {staff.coordinatorRole && staff.coordinatorRole !== 'General Faculty' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300/60 flex items-center gap-1 shadow-2xs">
                        <Award className="w-3 h-3 text-purple-600" />
                        {staff.coordinatorRole}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl mb-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16 text-[10px] uppercase">
                      Staff ID:
                    </span>
                    <code className="text-slate-800 dark:text-slate-200 font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      {staff.id}
                    </code>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.department}</span>
                  </div>

                  {staff.institution && (
                    <div className="flex items-center gap-2 truncate text-amber-800 dark:text-amber-300 font-bold">
                      <span className="shrink-0 text-[10px]">🎓</span>
                      <span className="truncate text-[11px]">{staff.institution}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{staff.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                </div>
              </div>

              {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && (
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => loginAsDemo(staff.role === 'admin' ? 'admin' : 'staff', staff.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
                      staff.role === 'admin'
                        ? 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    }`}
                    title={`Switch session to view as ${staff.facultyName}`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> {staff.role === 'admin' ? 'Login as HOD' : 'Login as Staff'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.facultyName)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal for Add / Edit Staff */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingStaff ? 'Edit Staff Member' : 'Add New Faculty Member'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {idError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <X className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{idError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty ID (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC001"
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value.toUpperCase());
                      setIdError('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aris Thorne"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="faculty@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                  >
                    <option value="staff">Faculty (Staff)</option>
                    <option value="admin">HOD (Department Admin)</option>
                    <option value="principal">College Principal</option>
                    <option value="secretary">College Secretary</option>
                    <option value="principal_pa">Principal PA</option>
                    <option value="secretary_pa">Secretary PA</option>
                    <option value="librarian">Central Librarian</option>
                    <option value="incucula">Incucula Cell Head</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coordinator / Special Role *
                  </label>
                  <select
                    value={coordinatorRole}
                    onChange={(e) => setCoordinatorRole(e.target.value as CoordinatorRole)}
                    className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-200 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="General Faculty">General Faculty (Standard)</option>
                    <option value="Event Coordinator">🎪 Event Coordinator (Events Master & Analytics)</option>
                    <option value="Timetable Coordinator">📅 Timetable Coordinator (Schedules & Lesson Plans)</option>
                    <option value="CDC Coordinator">💡 CDC Coordinator (Career & Skill Bank SSB)</option>
                    <option value="Placement Coordinator">💼 Placement Coordinator</option>
                    <option value="Exam Coordinator">📝 Exam Coordinator</option>
                    <option value="Class Advisor">🎓 Class Advisor</option>
                  </select>
                </div>
              </div>

              {/* Institution / College Selection */}
              <div>
                <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center justify-between">
                  <span>Institution / College *</span>
                  {role === 'principal' && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                      🎓 Principal College
                    </span>
                  )}
                </label>
                <select
                  value={institution}
                  onChange={(e) => {
                    const newInst = e.target.value;
                    setInstitution(newInst);
                    // Sync immediately to global dailyReport so PDF headers & app headers update instantly
                    updateDailyReport({
                      collegeName: newInst,
                      collegeLogoText: getCollegeLogoText(newInst),
                    });
                  }}
                  className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-lg text-slate-900 dark:text-amber-100 font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  {SASURIE_COLLEGES.map((col) => (
                    <option key={col} value={col} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                      🎓 {col}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Selecting institution updates all official PDF and print headers across all portal pages.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Portal Login Password
                </label>
                <input
                  type="text"
                  placeholder="Enter custom password"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Custom passwords are saved securely in local storage.</p>
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
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
