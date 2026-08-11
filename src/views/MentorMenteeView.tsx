import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getStudentsAssignedToMentor } from '../utils/departmentUtils';
import {
  Users,
  Search,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const MentorMenteeView: React.FC = () => {
  const { currentUser, skillBankStudents, mentorMappings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const myMappedStudents = useMemo(
    () => getStudentsAssignedToMentor(currentUser, skillBankStudents || []),
    [currentUser, skillBankStudents]
  );

  const myMapping = useMemo(
    () => mentorMappings.find((m) => m.mentorStaffId === (currentUser?.staffId || '').trim()) || null,
    [mentorMappings, currentUser]
  );

  const filteredStudents = useMemo(() => {
    return myMappedStudents.filter((s) => {
      const prof = s.studentProfile;
      const q = (searchQuery || '').toLowerCase();
      const matchesQuery =
        (prof.studentName || '').toLowerCase().includes(q) ||
        (prof.registerNumber || '').toLowerCase().includes(q) ||
        (prof.skillBankAccountNo || '').toLowerCase().includes(q);

      let matchesYear = true;
      if (selectedYearFilter !== 'all') {
        const sem = String(prof.semester || '').toLowerCase();
        const yearMap: Record<string, string[]> = {
          I: ['i', '1st', 'sem i', 'sem 1', '1'],
          II: ['ii', '2nd', 'sem ii', 'sem 2', '2'],
          III: ['iii', '3rd', 'sem iii', 'sem 3', '3'],
          IV: ['iv', '4th', 'sem iv', 'sem 4', '4'],
        };
        const allowed = yearMap[selectedYearFilter] || [];
        matchesYear = allowed.some((tok) => sem.includes(tok));
      }

      let matchesSection = true;
      if (selectedSectionFilter !== 'all') {
        const pSec = (prof.section || '').trim().toLowerCase();
        matchesSection = pSec === selectedSectionFilter.toLowerCase();
      }

      return matchesQuery && matchesYear && matchesSection;
    });
  }, [myMappedStudents, searchQuery, selectedYearFilter, selectedSectionFilter]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Mentor Dashboard
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                My Assigned Mentees
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {currentUser.name} • {currentUser.department}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                {myMappedStudents.length} Mentee{myMappedStudents.length === 1 ? '' : 's'}
              </div>
              {myMapping && (
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  Updated {new Date(myMapping.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Search className="w-4 h-4" />
              Search / Filter
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name / reg no / SSB"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white w-full sm:w-64"
              />
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="all">All Years</option>
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
                <option value="IV">IV Year</option>
              </select>
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="all">All Sections</option>
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
                <option value="C">Sec C</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold">No mentees assigned to you yet</p>
              <p className="text-xs mt-1">Contact your HOD to allocate students under your mentorship.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="p-3 font-semibold">#</th>
                    <th className="p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Register / SSB</th>
                    <th className="p-3 font-semibold">Year / Section</th>
                    <th className="p-3 font-semibold">Contact</th>
                    <th className="p-3 font-semibold">Academic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((s, idx) => {
                    const prof = s.studentProfile;
                    return (
                      <tr key={prof.registerNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                              {(prof.studentName || 'S')[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {prof.studentName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {prof.department}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {prof.registerNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {prof.skillBankAccountNo}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {prof.academicYear || prof.batch || '—'}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Sem {prof.semester} • Sec {prof.section}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {prof.studentEmail || prof.personalEmail || '—'}
                          </div>
                          {prof.studentMobile && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {prof.studentMobile}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            {prof.degreeBranch || '—'}
                          </div>
                          {prof.admissionCategory && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {prof.admissionCategory}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
