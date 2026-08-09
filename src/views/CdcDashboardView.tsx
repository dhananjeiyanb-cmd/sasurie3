import React, { useMemo, useEffect } from 'react';
import { useCdc } from '../context/CdcContext';
import { generateExamSummary, generateStudentWeaknessReport, generateDepartmentGapAnalysis } from '../utils/cdcExamUtils';
import { CdcExamAttempt, CdcExamResultSummary, CdcWeaknessReport, CdcDepartmentGapReport, CdcQuestion } from '../types/cdc';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  AlertTriangle,
  Download,
  Printer,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';

export const CdcDashboardView: React.FC = () => {
  const { cdcExams, cdcExamAttempts, cdcQuestions } = useCdc();

  const [selectedExamId, setSelectedExamId] = React.useState<string>('');

  useEffect(() => {
    if (cdcExams.length === 0) {
      setSelectedExamId('');
      return;
    }
    if (!selectedExamId || !cdcExams.some((exam) => exam.id === selectedExamId)) {
      setSelectedExamId(cdcExams[0].id);
    }
  }, [cdcExams, selectedExamId]);

  const summaries = useMemo(() => {
    return cdcExams.map((exam) => generateExamSummary(exam.id, exam.title, cdcExamAttempts));
  }, [cdcExams, cdcExamAttempts]);

  const selectedSummary = summaries.find((s) => s.examId === selectedExamId);
  const selectedAttempts = cdcExamAttempts.filter((a) => a.examId === selectedExamId);

  const weaknessReports = useMemo(() => {
    return selectedAttempts
      .filter((a) => a.status === 'submitted' || a.status === 'auto_submitted')
      .map((a) => {
        const exam = cdcExams.find((e) => e.id === a.examId);
        const questions = exam ? exam.questionIds.map((qid) => cdcQuestions.find((q) => q.id === qid)).filter((q): q is CdcQuestion => !!q) : [];
        return generateStudentWeaknessReport(a, questions);
      });
  }, [selectedAttempts, cdcExams, cdcQuestions]);

  const departmentGaps = useMemo(() => {
    const exam = cdcExams.find((e) => e.id === selectedExamId);
    if (!exam) return [];
    const questions = exam.questionIds.map((qid) => cdcQuestions.find((q) => q.id === qid)).filter((q): q is CdcQuestion => !!q);
    return generateDepartmentGapAnalysis(selectedAttempts, questions);
  }, [selectedExamId, cdcExams, cdcQuestions, selectedAttempts]);

  const handleExportResults = () => {
    if (!selectedSummary) return;
    const data = selectedAttempts.map((a) => ({
      RegisterNumber: a.studentRegisterNumber,
      Name: a.studentName,
      Department: a.studentDepartment,
      Status: a.status,
      Score: a.score || 0,
      Correct: a.correctCount || 0,
      Wrong: a.wrongCount || 0,
      Unanswered: a.unansweredCount || 0,
      Percentage: a.percentage || 0,
      Accuracy: a.accuracy || 0,
    }));
    exportToExcel(data, `exam_results_${selectedSummary.examId}`);
  };

  const handleExportRankList = () => {
    const sorted = [...selectedAttempts]
      .filter((a) => a.status === 'submitted' || a.status === 'auto_submitted')
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    const data = sorted.map((a, i) => ({
      Rank: i + 1,
      RegisterNumber: a.studentRegisterNumber,
      Name: a.studentName,
      Department: a.studentDepartment,
      Score: a.score || 0,
      Percentage: a.percentage || 0,
    }));
    exportToExcel(data, `rank_list_${selectedExamId}`);
  };

  if (cdcExams.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">CDC Dashboard</h1>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500">
            <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-3" />
            <p>No exams available. Create an exam first to view analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CDC Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Results · Rank List</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExportResults} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
              <Download className="w-4 h-4" /> Results
            </button>
            <button onClick={handleExportRankList} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4" /> Rank List
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Exam / Placement</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
          >
            <option value="" disabled>{cdcExams.length > 0 ? 'Select Exam / Placement' : 'No exams available'}</option>
            {cdcExams.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {selectedSummary ? (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-xs text-slate-500">Total Students</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSummary.totalStudents}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <p className="text-xs text-slate-500">Appeared</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSummary.appeared}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <p className="text-xs text-slate-500">Average Marks</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSummary.averageMarks}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-rose-600" />
                  <p className="text-xs text-slate-500">Highest Marks</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSummary.highestMarks}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-xs text-slate-500 mb-1">Absent</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedSummary.absent}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-xs text-slate-500 mb-1">Pass Count</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedSummary.passCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-xs text-slate-500 mb-1">Pass Percentage</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedSummary.passPercentage}%</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-xs text-slate-500 mb-1">Passed</p>
                <p className="text-xl font-bold text-emerald-600">{selectedSummary.passCount}/{selectedSummary.appeared}</p>
              </div>
            </div>

            {/* Department-wise gaps */}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Department Skill Gap Analysis
            </h2>
            <div className="grid gap-4 mb-6">
              {departmentGaps.map((gap) => (
                <div key={gap.department} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{gap.department}</h3>
                  {gap.weakSubjects.length === 0 && gap.weakTopics.length === 0 ? (
                    <p className="text-xs text-emerald-600">No significant skill gaps detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {gap.weakSubjects.map((s) => (
                        <div key={s.subject} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300">{s.subject}</span>
                          <span className="text-amber-600 font-bold">{s.avgPercentage}% ({s.affectedStudents} students)</span>
                        </div>
                      ))}
                      {gap.weakTopics.map((t) => (
                        <div key={t.topic} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300">{t.topic}</span>
                          <span className="text-amber-600 font-bold">{t.avgPercentage}% ({t.affectedStudents} students)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Student weakness reports */}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Student Weakness Analysis
            </h2>
            <div className="grid gap-4">
              {weaknessReports.map((r) => (
                <div key={r.studentRegisterNumber} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.studentName}</h3>
                      <p className="text-xs text-slate-500">{r.studentRegisterNumber} — {r.department}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.overallPercentage >= 60 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-700'}`}>
                      {r.overallPercentage}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Subject-wise</p>
                      <div className="space-y-1">
                        {r.subjectWeaknesses.map((sw) => (
                          <div key={sw.subject} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300">{sw.subject}</span>
                            <span className={`font-bold ${sw.percentage < 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{sw.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Topic-wise</p>
                      <div className="space-y-1">
                        {r.topicWeaknesses.map((tw) => (
                          <div key={tw.topic} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300">{tw.topic}</span>
                            <span className={`font-bold ${tw.percentage < 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{tw.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {weaknessReports.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500">
                  No results yet. Students need to complete exams first.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500">
            {cdcExams.length > 0 ? 'Loading exam summary...' : 'No exams available. Create an exam first to view analytics.'}
          </div>
        )}
      </div>
    </div>
  );
};
