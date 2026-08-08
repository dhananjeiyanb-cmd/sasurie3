import React, { useState } from 'react';
import { useCdc } from '../context/CdcContext';
import { DEPARTMENTS } from '../types';
import { CdcQuestion, CdcExam, QuestionCategory, DifficultyLevel } from '../types/cdc';

const CDC_YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  BookOpen,
  Calendar,
  Clock,
  Flag,
  Upload,
  Download,
  Users,
  ChevronDown,
  AlertTriangle,
  Timer,
} from 'lucide-react';

export const CdcExamManagementView: React.FC = () => {
  const {
    cdcQuestions,
    cdcExams,
    cdcStudents,
    addQuestion,
    addExam,
    updateExam,
    deleteExam,
    addStudent,
  } = useCdc();

  const [activeTab, setActiveTab] = useState<'exams' | 'questions' | 'students'>('exams');

  // Exam form state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examDuration, setExamDuration] = useState(60);
  const [examTotalMarks, setExamTotalMarks] = useState(10);
  const [examNegMarks, setExamNegMarks] = useState(0.25);
  const [examPassing, setExamPassing] = useState(4);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [examDept, setExamDept] = useState(DEPARTMENTS[0]);
  const [examYear, setExamYear] = useState(CDC_YEAR_OPTIONS[0]);
  const [examBatch, setExamBatch] = useState('');
  const [examSections, setExamSections] = useState<string>('');

  // Question form state
  const [showQForm, setShowQForm] = useState(false);
  const [qCategory, setQCategory] = useState<QuestionCategory>('CSE Cluster');
  const [qSubject, setQSubject] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('Medium');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qMarks, setQMarks] = useState(1);
  const [qNegMarks, setQNegMarks] = useState(0.25);

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question.');
      return;
    }

    const examData = {
      title: examTitle,
      description: examDesc,
      status: 'Scheduled' as const,
      scheduledDate: examDate,
      scheduledTime: examTime,
      durationMinutes: examDuration,
      totalMarks: examTotalMarks,
      negativeMarksPerWrong: examNegMarks,
      passingMarks: examPassing,
      questionIds: selectedQuestions,
      assignments: [
        {
          department: examDept,
          year: examYear,
          batch: examBatch,
          sections: examSections ? examSections.split(',').map((s) => s.trim()) : undefined,
        },
      ],
      createdBy: 'CDC Coordinator',
    };

    if (editingExamId) {
      updateExam(editingExamId, examData);
    } else {
      addExam(examData);
    }

    setShowExamForm(false);
    setEditingExamId(null);
    setExamTitle('');
    setExamDesc('');
    setExamDate('');
    setExamTime('');
    setSelectedQuestions([]);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    addQuestion({
      category: qCategory,
      subject: qSubject,
      topic: qTopic,
      difficulty: qDifficulty,
      questionText: qText,
      options: qOptions,
      correctOptionIndex: qCorrect,
      marks: qMarks,
      negativeMarks: qNegMarks,
    });
    setShowQForm(false);
    setQText('');
    setQSubject('');
    setQTopic('');
    setQOptions(['', '', '', '']);
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Excel upload would be implemented with XLSX library
    alert('Excel upload feature: Parse the file and call addQuestion for each row.');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CDC Exam Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
            >
              Exams
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'questions' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
            >
              Students
            </button>
          </div>
        </div>

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">{cdcQuestions.length} questions in bank</p>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Excel
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
                </label>
                <button onClick={() => setShowQForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            </div>

            {showQForm && (
              <form onSubmit={handleCreateQuestion} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Question</h3>
                  <button type="button" onClick={() => setShowQForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select value={qCategory} onChange={(e) => setQCategory(e.target.value as QuestionCategory)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                      {['CSE Cluster', 'Core Engineering', 'Circuits Branches', 'AI & DS', 'CSE / Cyber Security', 'IT', 'Other departments'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <input type="text" value={qSubject} onChange={(e) => setQSubject(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                    <input type="text" value={qTopic} onChange={(e) => setQTopic(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                    <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value as DifficultyLevel)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                      {['Easy', 'Medium', 'Hard'].map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marks</label>
                    <input type="number" step="0.25" value={qMarks} onChange={(e) => setQMarks(parseFloat(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Question Text</label>
                  <textarea value={qText} onChange={(e) => setQText(e.target.value)} required rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                </div>
                {qOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={qCorrect === idx}
                      onChange={() => setQCorrect(idx)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => { const n = [...qOptions]; n[idx] = e.target.value; setQOptions(n); }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      required
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>
                ))}
                <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Question
                </button>
              </form>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Topic</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Difficulty</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cdcQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.category}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.subject}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.topic}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${q.difficulty === 'Easy' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : q.difficulty === 'Medium' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-700'}`}>{q.difficulty}</span></td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cdcQuestions.length === 0 && (
                <div className="p-10 text-center text-slate-500">No questions yet. Add your first question above.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">{cdcExams.length} exams</p>
              <button onClick={() => setShowExamForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            </div>

            {showExamForm && (
              <form onSubmit={handleSaveExam} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingExamId ? 'Edit Exam' : 'Create New Exam'}</h3>
                  <button type="button" onClick={() => { setShowExamForm(false); setEditingExamId(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Title</label>
                    <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea value={examDesc} onChange={(e) => setExamDesc(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                    <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (min)</label>
                    <input type="number" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Marks</label>
                    <input type="number" value={examTotalMarks} onChange={(e) => setExamTotalMarks(Number(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Negative Marks</label>
                    <input type="number" step="0.25" value={examNegMarks} onChange={(e) => setExamNegMarks(parseFloat(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Passing Marks</label>
                    <input type="number" value={examPassing} onChange={(e) => setExamPassing(Number(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select value={examDept} onChange={(e) => setExamDept(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Year</label>
                    <select value={examYear} onChange={(e) => setExamYear(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                      {CDC_YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                    <input type="text" value={examBatch} onChange={(e) => setExamBatch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Select Questions ({selectedQuestions.length} selected)</label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1">
                    {cdcQuestions.map((q) => (
                      <label key={q.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q.id)}
                          onChange={() => toggleQuestionSelection(q.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{q.subject} - {q.topic} ({q.difficulty})</span>
                        <span className="text-xs text-slate-500">{q.marks} marks</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Create Exam
                </button>
              </form>
            )}

            <div className="grid gap-4">
              {cdcExams.map((exam) => (
                <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${exam.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : exam.status === 'Scheduled' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700' : 'bg-slate-100 dark:bg-slate-950 text-slate-600'}`}>{exam.status}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{exam.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {exam.scheduledDate}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.scheduledTime}</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {exam.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {exam.questionIds.length} Qs</span>
                        <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> {exam.totalMarks} marks</span>
                      </div>
                      {exam.assignments.map((a, i) => (
                        <div key={i} className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {a.department} — {a.year} {a.batch ? `(${a.batch})` : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <button onClick={() => {
                        setEditingExamId(exam.id);
                        setExamTitle(exam.title);
                        setExamDesc(exam.description);
                        setExamDate(exam.scheduledDate);
                        setExamTime(exam.scheduledTime);
                        setExamDuration(exam.durationMinutes);
                        setExamTotalMarks(exam.totalMarks);
                        setExamNegMarks(exam.negativeMarksPerWrong);
                        setExamPassing(exam.passingMarks);
                        setSelectedQuestions(exam.questionIds);
                        const savedDept = exam.assignments[0]?.department;
                        const savedYear = exam.assignments[0]?.year;
                        setExamDept((savedDept && (DEPARTMENTS as readonly string[]).includes(savedDept)) ? savedDept : DEPARTMENTS[0]);
                        setExamYear((savedYear && CDC_YEAR_OPTIONS.includes(savedYear)) ? savedYear : CDC_YEAR_OPTIONS[0]);
                        setExamBatch(exam.assignments[0]?.batch || '');
                        setExamSections(exam.assignments[0]?.sections?.join(',') || '');
                        setShowExamForm(true);
                      }} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this exam?')) deleteExam(exam.id); }} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg ml-4">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cdcExams.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500">
                  No exams created yet. Click "Create Exam" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">{cdcStudents.length} students</p>
              <button onClick={() => {
                const name = prompt('Student Name:');
                const reg = prompt('Register Number:');
                const dept = prompt('Department:');
                const year = prompt('Year:');
                const section = prompt('Section:');
                const batch = prompt('Batch:');
                if (name && reg && dept && year) addStudent({ name, registerNumber: reg, department: dept, year, section: section || '', batch: batch || '', password: 'student' });
              }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Reg No</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Year</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cdcStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.registerNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.name}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.department}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.year}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
