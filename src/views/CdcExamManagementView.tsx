import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useCdc } from '../context/CdcContext';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS } from '../types';
import { CdcQuestion, CdcExam, CdcStudent, CdcExamAssignment, QuestionCategory, DifficultyLevel } from '../types/cdc';

const CDC_YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const CDC_ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];
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
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Filter,
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
  
  const { skillBankStudents } = useApp();

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
  const [examAssignments, setExamAssignments] = useState<CdcExamAssignment[]>([
    { department: DEPARTMENTS[0], year: CDC_YEAR_OPTIONS[0], batch: '', sections: [] },
  ]);

  const [studentDeptFilter, setStudentDeptFilter] = useState('All Departments');
  const [studentYearFilter, setStudentYearFilter] = useState('All Years');

  const resetExamForm = () => {
    setEditingExamId(null);
    setExamTitle('');
    setExamDesc('');
    setExamDate('');
    setExamTime('');
    setExamDuration(60);
    setExamTotalMarks(10);
    setExamNegMarks(0.25);
    setExamPassing(4);
    setSelectedQuestions([]);
    setExamAssignments([{ department: DEPARTMENTS[0], year: CDC_YEAR_OPTIONS[0], batch: '', sections: [] }]);
  };

  const openManageMappedStudentsModal = (examId: string) => {
    setManageMappedExamId(examId);
  };

  // Question form state
  const [showQForm, setShowQForm] = useState(false);
  // Manage mapped students modal state
  const [manageMappedExamId, setManageMappedExamId] = useState<string | null>(null);
  const [qCategory, setQCategory] = useState<QuestionCategory>('CSE Cluster');
  const [qSubject, setQSubject] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('Medium');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qMarks, setQMarks] = useState(1);
  const [qNegMarks, setQNegMarks] = useState(0.25);

  // Student import from SkillBank state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDeptFilter, setImportDeptFilter] = useState('');
  const [importYearFilter, setImportYearFilter] = useState('');
  
  // Filter students from skillBank based on department and year
  const filteredSkillBankStudents = useMemo(() => {
    return skillBankStudents.filter(s => {
      const sp = s.studentProfile;
      const deptMatch = !importDeptFilter || sp.department === importDeptFilter;
      const yearMatch = !importYearFilter || (sp.academicYear || sp.batch) === importYearFilter;
      return deptMatch && yearMatch;
    });
  }, [skillBankStudents, importDeptFilter, importYearFilter]);

  // Get unique departments and years from skillBank
  const availableDepartments = useMemo(() => {
    const depts = new Set(skillBankStudents.map(s => s.studentProfile.department));
    return Array.from(depts).filter(Boolean);
  }, [skillBankStudents]);

  const availableYears = useMemo(() => {
    const years = new Set(skillBankStudents.map(s => s.studentProfile.academicYear || s.studentProfile.batch));
    return Array.from(years).filter(Boolean);
  }, [skillBankStudents]);

  const availableStudentDepartments = useMemo(() => {
    const departments = new Set(cdcStudents.map((s) => s.department));
    return ['All Departments', ...Array.from(departments).sort()];
  }, [cdcStudents]);

  const availableStudentYears = useMemo(() => {
    const years = new Set(cdcStudents.map((s) => s.year));
    return ['All Years', ...Array.from(years).sort()];
  }, [cdcStudents]);

  const filteredCdcStudents = useMemo(() => {
    return cdcStudents.filter((s) => {
      const departmentMatches = studentDeptFilter === 'All Departments' || s.department === studentDeptFilter;
      const yearMatches = studentYearFilter === 'All Years' || s.year === studentYearFilter;
      return departmentMatches && yearMatches;
    });
  }, [cdcStudents, studentDeptFilter, studentYearFilter]);

  const normalizeReg = (reg: string) => reg.trim().toLowerCase();

  const getStudentsForAssignment = (assignment: CdcExamAssignment) => {
    const explicitRegs = assignment.studentRegisterNumbers?.map(normalizeReg) || [];
    if (explicitRegs.length > 0) {
      return cdcStudents.filter((student) => explicitRegs.includes(normalizeReg(student.registerNumber)));
    }

    return cdcStudents.filter((student) => {
      const departmentMatch = student.department === assignment.department;
      const yearMatch = student.year === assignment.year;
      const batchMatch = !assignment.batch || student.batch === assignment.batch;
      const sectionMatch = !assignment.sections || assignment.sections.length === 0 || assignment.sections.includes(student.section);
      return departmentMatch && yearMatch && batchMatch && sectionMatch;
    });
  };

  const getMappedStudentsForExam = (exam: CdcExam) => {
    const studentMap = new Map<string, CdcStudent>();
    exam.assignments.forEach((assignment) => {
      getStudentsForAssignment(assignment).forEach((student) => {
        studentMap.set(student.registerNumber, student);
      });
    });
    return Array.from(studentMap.values());
  };

  const updateExamAssignment = (index: number, field: keyof CdcExamAssignment, value: string) => {
    setExamAssignments((prev) =>
      prev.map((assignment, idx) =>
        idx === index ? { ...assignment, [field]: field === 'sections' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value } : assignment
      )
    );
  };

  const addExamAssignment = () => {
    setExamAssignments((prev) => [
      ...prev,
      { department: DEPARTMENTS[0], year: CDC_YEAR_OPTIONS[0], batch: '', sections: [] },
    ]);
  };

  const removeExamAssignment = (index: number) => {
    setExamAssignments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImportStudents = () => {
    const studentsToImport = filteredSkillBankStudents.map(s => {
      const sp = s.studentProfile;
      return {
        registerNumber: sp.registerNumber,
        name: sp.studentName,
        department: sp.department,
        year: sp.academicYear || '',
        section: sp.section,
        batch: sp.batch,
        email: sp.studentEmail,
        mobile: sp.studentMobile,
        password: 'student',
      };
    });
    
    // Add each student to CDC (skip if already exists)
    let importedCount = 0;
    studentsToImport.forEach(student => {
      const exists = cdcStudents.some(s => s.registerNumber === student.registerNumber);
      if (!exists) {
        addStudent(student);
        importedCount++;
      }
    });
    
    alert(`Successfully imported ${importedCount} students to CDC database!`);
    setShowImportModal(false);
  };

  const downloadQuestionsTemplate = () => {
    const headers = ['Category', 'Subject', 'Topic', 'Difficulty', 'Question Text', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer (1-4)', 'Marks', 'Negative Marks'];
    const sampleRow = ['CSE Cluster', 'Data Structures', 'Arrays', 'Medium', 'What is the time complexity of accessing an element in an array?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', '1', '1', '0.25'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    XLSX.writeFile(workbook, 'cdc_questions_template.xlsx');
  };

  const downloadStudentMappingTemplate = () => {
    const headers = ['RegisterNumber', 'StudentName', 'Department', 'AcademicYear', 'Batch', 'Section', 'MentorStaffId', 'MentorFaculty', 'HodDepartment', 'YearGroup'];
    const sampleRow = ['732723243001', 'Aakash V', 'Artificial Intelligence & Data Science (AI & DS)', '2025-2026', '2025', 'A', 'STF001', 'Dr. M. Kaviyarasu', 'AI & DS', '2nd Year'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'cdc_student_mapping_template.xlsx');
  };

  const parseExcelFile = (file: File) => {
    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) {
          reject(new Error('No file data available.'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        resolve(rows);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleQuestionExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      let importedCount = 0;
      rows.forEach((row) => {
        const category = String(row['Category'] || row['category'] || '').trim();
        const subject = String(row['Subject'] || row['subject'] || '').trim();
        const topic = String(row['Topic'] || row['topic'] || '').trim();
        const difficulty = String(row['Difficulty'] || row['difficulty'] || 'Medium').trim() as DifficultyLevel;
        const questionText = String(row['Question Text'] || row['questionText'] || row['question text'] || '').trim();
        const options = [
          String(row['Option 1'] || row['option1'] || row['Option1'] || row['option 1'] || '').trim(),
          String(row['Option 2'] || row['option2'] || row['Option2'] || row['option 2'] || '').trim(),
          String(row['Option 3'] || row['option3'] || row['Option3'] || row['option 3'] || '').trim(),
          String(row['Option 4'] || row['option4'] || row['Option4'] || row['option 4'] || '').trim(),
        ];
        const correctAnswer = Number(row['Correct Answer (1-4)'] || row['CorrectAnswer'] || row['correctAnswer'] || row['correct answer'] || row['Correct Answer'] || 1);
        const marks = Number(row['Marks'] || row['marks'] || 1);
        const negativeMarks = Number(row['Negative Marks'] || row['negativeMarks'] || row['negative marks'] || 0.25);

        if (!category || !subject || !topic || !questionText || options.some((opt) => !opt) || ![1, 2, 3, 4].includes(correctAnswer)) {
          return;
        }

        addQuestion({
          category: category as QuestionCategory,
          subject,
          topic,
          difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? (difficulty as DifficultyLevel) : 'Medium',
          questionText,
          options,
          correctOptionIndex: correctAnswer - 1,
          marks: marks || 1,
          negativeMarks: negativeMarks || 0,
        });
        importedCount++;
      });
      alert(`Imported ${importedCount} questions from the file.`);
    } catch (error) {
      console.error('Failed to import questions:', error);
      alert('Failed to parse the uploaded file. Use the sample questions template and try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleStudentExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      let importedCount = 0;
      rows.forEach((row) => {
        const registerNumber = String(row['RegisterNumber'] || row['registerNumber'] || row['Register Number'] || '').trim();
        const name = String(row['StudentName'] || row['studentName'] || row['Student Name'] || '').trim();
        const department = String(row['Department'] || row['department'] || '').trim();
        const year = String(row['AcademicYear'] || row['academicYear'] || row['Year'] || '').trim();
        const section = String(row['Section'] || row['section'] || '').trim();
        const batch = String(row['Batch'] || row['batch'] || '').trim();

        if (!registerNumber || !name || !department || !year) {
          return;
        }

        const exists = cdcStudents.some((s) => s.registerNumber === registerNumber);
        if (!exists) {
          addStudent({
            registerNumber,
            name,
            department,
            year,
            section,
            batch,
            password: 'student',
          });
          importedCount++;
        }
      });

      alert(`Imported ${importedCount} students from the file.`);
    } catch (error) {
      console.error('Failed to import students:', error);
      alert('Failed to parse the uploaded file. Use the sample student mapping template and try again.');
    } finally {
      e.target.value = '';
    }
  };

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
      assignments: examAssignments.map((assignment) => {
        const matchedStudents = getStudentsForAssignment(assignment);
        const studentRegisterNumbers = matchedStudents.length > 0
          ? matchedStudents.map((student) => student.registerNumber)
          : undefined;
        return {
          department: assignment.department,
          year: assignment.year,
          batch: assignment.batch,
          sections: assignment.sections && assignment.sections.length > 0 ? assignment.sections : undefined,
          ...(studentRegisterNumbers ? { studentRegisterNumbers } : {}),
        };
      }),
      createdBy: 'CDC Coordinator',
    };

    if (editingExamId) {
      updateExam(editingExamId, examData);
    } else {
      addExam(examData);
    }

    setShowExamForm(false);
    resetExamForm();
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
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
        </div>
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">{cdcQuestions.length} questions in bank</p>
              <div className="flex gap-2 flex-wrap">
                <label className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Questions
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleQuestionExcelUpload} />
                </label>
                <button onClick={downloadQuestionsTemplate} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download Sample Template
                </button>
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
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Question</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Options</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Correct Answer</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Difficulty</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cdcQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 align-top">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-md">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{q.questionText}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{q.category} • {q.subject} • {q.topic}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        <ol className="list-inside space-y-0.5 text-xs">
                          {q.options.map((opt, i) => (
                            <li key={i} className={i === q.correctOptionIndex ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                              {String.fromCharCode(65 + i)}. {opt}
                            </li>
                          ))}
                        </ol>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {q.options[q.correctOptionIndex] || '-'}
                        </span>
                      </td>
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
              <button onClick={() => { resetExamForm(); setShowExamForm(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            </div>

            {showExamForm && (
              <form onSubmit={handleSaveExam} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingExamId ? 'Edit Exam' : 'Create New Exam'}</h3>
                  <button type="button" onClick={() => { setShowExamForm(false); resetExamForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
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
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Exam Assignments</label>
                      <button type="button" onClick={addExamAssignment} className="text-xs text-blue-600 hover:text-blue-500 font-semibold">+ Add Mapping</button>
                    </div>
                    <div className="space-y-4">
                      {examAssignments.map((assignment, idx) => (
                        <div key={`assignment-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                            <select value={assignment.department} onChange={(e) => updateExamAssignment(idx, 'department', e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                              {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Year</label>
                            <select value={assignment.year} onChange={(e) => updateExamAssignment(idx, 'year', e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                              {CDC_YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                            <input type="text" value={assignment.batch} onChange={(e) => updateExamAssignment(idx, 'batch', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sections</label>
                            <div className="flex gap-2 items-center">
                              <input type="text" value={assignment.sections?.join(', ') || ''} onChange={(e) => updateExamAssignment(idx, 'sections', e.target.value)} placeholder="A, B" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                              {examAssignments.length > 1 && (
                                <button type="button" onClick={() => removeExamAssignment(idx)} className="px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 rounded-xl text-xs font-semibold">Unmap</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                        setExamAssignments(
                          exam.assignments.length > 0
                            ? exam.assignments.map((assignment) => ({
                                department: assignment.department,
                                year: assignment.year,
                                batch: assignment.batch || '',
                                sections: assignment.sections || [],
                              }))
                            : [{ department: DEPARTMENTS[0], year: CDC_YEAR_OPTIONS[0], batch: '', sections: [] }]
                        );
                        setShowExamForm(true);
                      }} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this exam?')) deleteExam(exam.id); }} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg ml-4">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {/* Manage mapped students */}
                      <button onClick={() => openManageMappedStudentsModal(exam.id)} className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-4">
                        <Users className="w-4 h-4" />
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

         {/* Manage Mapped Students Modal */}
         {manageMappedExamId && (
           <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60">
             <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Manage Mapped Students</h3>
                <button onClick={() => setManageMappedExamId(null)} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white">Close</button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  const exam = cdcExams.find((ex) => ex.id === manageMappedExamId);
                  if (!exam) return <div className="text-sm text-slate-500">Exam not found.</div>;
                  const mappedStudents = getMappedStudentsForExam(exam);
                  if (mappedStudents.length === 0) return <div className="text-sm text-slate-500">No students are currently mapped to this exam.</div>;
                  return mappedStudents.map((student) => (
                    <div key={student.registerNumber} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.registerNumber} • {student.department}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const exam = cdcExams.find((ex) => ex.id === manageMappedExamId);
                          if (!exam) return;
                          const updatedAssignments = exam.assignments.map((assignment) => {
                            const assignmentStudents = getStudentsForAssignment(assignment);
                            const currentRegs = assignment.studentRegisterNumbers && assignment.studentRegisterNumbers.length > 0
                              ? assignment.studentRegisterNumbers
                              : assignmentStudents.map((s) => s.registerNumber);
                            const filtered = currentRegs.filter((reg) => normalizeReg(reg) !== normalizeReg(student.registerNumber));
                            if (filtered.length === 0) {
                              return { ...assignment, studentRegisterNumbers: [] } as CdcExamAssignment;
                            }
                            return { ...assignment, studentRegisterNumbers: filtered } as CdcExamAssignment;
                          });
                          updateExam(exam.id, { assignments: updatedAssignments });
                        }} className="px-3 py-1 rounded bg-rose-600 text-white text-xs">Unmap</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
             </div>
           </div>
         )}

         {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500">Showing {filteredCdcStudents.length} of {cdcStudents.length} students</p>
                <select value={studentDeptFilter} onChange={(e) => setStudentDeptFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                  {availableStudentDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select value={studentYearFilter} onChange={(e) => setStudentYearFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                  {availableStudentYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button type="button" onClick={() => { setStudentDeptFilter('All Departments'); setStudentYearFilter('All Years'); }} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white">Reset Filters</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <label className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Student Mapping
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleStudentExcelUpload} />
                </label>
                <button onClick={downloadStudentMappingTemplate} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download Sample Excel
                </button>
                <button onClick={handleImportStudents} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> Import from SkillBank
                </button>
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
                  {filteredCdcStudents.map((s) => (
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
