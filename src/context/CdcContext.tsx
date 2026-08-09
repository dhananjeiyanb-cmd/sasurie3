import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { CdcQuestion, CdcExam, CdcStudent, CdcExamAttempt, CdcSuspiciousEvent } from '../types/cdc';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { syncDocToFirestore, deleteDocFromFirestore } from '../lib/firestoreSync';

const COLLECTIONS = {
  questions: 'cdcQuestions',
  exams: 'cdcExams',
  students: 'cdcStudents',
  attempts: 'cdcExamAttempts',
  suspicious: 'cdcSuspiciousLogs',
};

interface CdcContextType {
  cdcQuestions: CdcQuestion[];
  setCdcQuestions: React.Dispatch<React.SetStateAction<CdcQuestion[]>>;
  cdcExams: CdcExam[];
  setCdcExams: React.Dispatch<React.SetStateAction<CdcExam[]>>;
  cdcStudents: CdcStudent[];
  setCdcStudents: React.Dispatch<React.SetStateAction<CdcStudent[]>>;
  cdcExamAttempts: CdcExamAttempt[];
  setCdcExamAttempts: React.Dispatch<React.SetStateAction<CdcExamAttempt[]>>;
  cdcSuspiciousLogs: CdcSuspiciousEvent[];
  setCdcSuspiciousLogs: React.Dispatch<React.SetStateAction<CdcSuspiciousEvent[]>>;
  addQuestion: (q: Omit<CdcQuestion, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addExam: (e: Omit<CdcExam, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExam: (id: string, updates: Partial<CdcExam>) => void;
  deleteExam: (id: string) => void;
  addStudent: (s: Omit<CdcStudent, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<CdcStudent>) => void;
  deleteStudent: (id: string) => void;
  startExamAttempt: (examId: string, student: CdcStudent) => CdcExamAttempt;
  submitExamAttempt: (
    attemptId: string,
    answers: Record<number, number>,
    markedForReview: number[],
    status?: 'submitted' | 'auto_submitted' | 'abandoned'
  ) => void;
  addSuspiciousEvent: (attemptId: string, type: CdcSuspiciousEvent['type'], details?: string) => void;
  getExamById: (id: string) => CdcExam | undefined;
  getQuestionsByIds: (ids: string[]) => CdcQuestion[];
  getStudentByRegisterNumber: (regNo: string) => CdcStudent | undefined;
  getAttemptsByExam: (examId: string) => CdcExamAttempt[];
  getAttemptByExamAndStudent: (examId: string, regNo: string) => CdcExamAttempt | undefined;
}

const CdcContext = createContext<CdcContextType | undefined>(undefined);

export const CdcProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cdcQuestions, setCdcQuestions] = useState<CdcQuestion[]>([]);
  const [cdcExams, setCdcExams] = useState<CdcExam[]>([]);
  const [cdcStudents, setCdcStudents] = useState<CdcStudent[]>([]);
  const [cdcExamAttempts, setCdcExamAttempts] = useState<CdcExamAttempt[]>([]);
  const [cdcSuspiciousLogs, setCdcSuspiciousLogs] = useState<CdcSuspiciousEvent[]>([]);

  // Firestore is the single source of truth — load all CDC collections and keep
  // them in sync in real time. Nothing is auto-populated from seed data.
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(collection(db, COLLECTIONS.questions), (snap) => setCdcQuestions(snap.docs.map((d) => d.data() as CdcQuestion)), (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.questions)));
    unsubs.push(onSnapshot(collection(db, COLLECTIONS.exams), (snap) => setCdcExams(snap.docs.map((d) => d.data() as CdcExam)), (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.exams)));
    unsubs.push(onSnapshot(collection(db, COLLECTIONS.students), (snap) => setCdcStudents(snap.docs.map((d) => d.data() as CdcStudent)), (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.students)));
    unsubs.push(onSnapshot(collection(db, COLLECTIONS.attempts), (snap) => setCdcExamAttempts(snap.docs.map((d) => d.data() as CdcExamAttempt)), (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.attempts)));
    unsubs.push(onSnapshot(collection(db, COLLECTIONS.suspicious), (snap) => setCdcSuspiciousLogs(snap.docs.map((d) => d.data() as CdcSuspiciousEvent)), (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.suspicious)));

    return () => unsubs.forEach((u) => u());
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  const addQuestion = (q: Omit<CdcQuestion, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newQ: CdcQuestion = {
      ...q,
      id: 'CDCQ' + generateId().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    setCdcQuestions((prev) => [...prev, newQ]);
    syncDocToFirestore(COLLECTIONS.questions, newQ.id, newQ);
  };

  const addExam = (e: Omit<CdcExam, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newE: CdcExam = {
      ...e,
      id: 'EXAM' + generateId().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    setCdcExams((prev) => [...prev, newE]);
    syncDocToFirestore(COLLECTIONS.exams, newE.id, newE);
  };

  const updateExam = (id: string, updates: Partial<CdcExam>) => {
    setCdcExams((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...updates, updatedAt: new Date().toISOString() };
        syncDocToFirestore(COLLECTIONS.exams, id, updated);
        return updated;
      })
    );
  };

  const deleteExam = (id: string) => {
    setCdcExams((prev) => prev.filter((e) => e.id !== id));
    deleteDocFromFirestore(COLLECTIONS.exams, id);
  };

  const addStudent = (s: Omit<CdcStudent, 'id'>) => {
    const newS: CdcStudent = {
      ...s,
      id: 'STU' + generateId().toUpperCase(),
    };
    setCdcStudents((prev) => [...prev, newS]);
    syncDocToFirestore(COLLECTIONS.students, newS.id, newS);
  };

  const updateStudent = (id: string, updates: Partial<CdcStudent>) => {
    setCdcStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        syncDocToFirestore(COLLECTIONS.students, id, updated);
        return updated;
      })
    );
  };

  const deleteStudent = (id: string) => {
    setCdcStudents((prev) => prev.filter((s) => s.id !== id));
    deleteDocFromFirestore(COLLECTIONS.students, id);
  };

  const evaluateAttempt = (
    answers: Record<number, number>,
    questions: CdcQuestion[]
  ): Pick<CdcExamAttempt, 'score' | 'correctCount' | 'wrongCount' | 'unansweredCount' | 'percentage' | 'accuracy'> => {
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected === undefined || selected === null || selected === -1) {
        unansweredCount++;
      } else if (selected === q.correctOptionIndex) {
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
        score -= q.negativeMarks;
        if (score < 0) score = 0;
      }
    });

    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const accuracy = correctCount + wrongCount > 0 ? (correctCount / (correctCount + wrongCount)) * 100 : 0;

    return {
      score: Math.max(0, score),
      correctCount,
      wrongCount,
      unansweredCount,
      percentage: Math.round(percentage * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
    };
  };

  const startExamAttempt = (examId: string, student: CdcStudent): CdcExamAttempt => {
    const attempt: CdcExamAttempt = {
      id: 'ATT' + generateId().toUpperCase(),
      examId,
      studentRegisterNumber: student.registerNumber,
      studentName: student.name,
      studentDepartment: student.department,
      startTime: new Date().toISOString(),
      answers: {},
      markedForReview: [],
      suspiciousEvents: [],
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      copyPasteCount: 0,
      rightClickCount: 0,
      webcamVerified: false,
      multiFaceDetectedCount: 0,
      noFaceDetectedCount: 0,
      status: 'in_progress',
    };
    setCdcExamAttempts((prev) => [...prev, attempt]);
    syncDocToFirestore(COLLECTIONS.attempts, attempt.id, attempt);
    return attempt;
  };

  const submitExamAttempt = (
    attemptId: string,
    answers: Record<number, number>,
    markedForReview: number[],
    status: 'submitted' | 'auto_submitted' | 'abandoned' = 'submitted'
  ) => {
    setCdcExamAttempts((prev) =>
      prev.map((a) => {
        if (a.id !== attemptId) return a;
        const exam = cdcExams.find((e) => e.id === a.examId);
        const questions = exam
          ? exam.questionIds.map((qid) => cdcQuestions.find((q) => q.id === qid)).filter((q): q is CdcQuestion => !!q)
          : [];
        const score = evaluateAttempt(answers, questions);
        const updated = {
          ...a,
          answers,
          markedForReview,
          submittedAt: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status,
          ...score,
        };
        syncDocToFirestore(COLLECTIONS.attempts, attemptId, updated);
        return updated;
      })
    );
  };

  const addSuspiciousEvent = (attemptId: string, type: CdcSuspiciousEvent['type'], details?: string) => {
    const event: CdcSuspiciousEvent = {
      id: 'SUS' + generateId().toUpperCase(),
      attemptId,
      type,
      timestamp: new Date().toISOString(),
      details,
    };
    setCdcSuspiciousLogs((prev) => [...prev, event]);
    syncDocToFirestore(COLLECTIONS.suspicious, event.id, event);

    setCdcExamAttempts((prev) =>
      prev.map((a) => {
        if (a.id !== attemptId) return a;
        const updates: Partial<CdcExamAttempt> = {};
        if (type === 'tab_switch') updates.tabSwitchCount = (a.tabSwitchCount || 0) + 1;
        if (type === 'fullscreen_exit') updates.fullscreenExitCount = (a.fullscreenExitCount || 0) + 1;
        if (type === 'copy_paste') updates.copyPasteCount = (a.copyPasteCount || 0) + 1;
        if (type === 'right_click') updates.rightClickCount = (a.rightClickCount || 0) + 1;
        if (type === 'multi_face') updates.multiFaceDetectedCount = (a.multiFaceDetectedCount || 0) + 1;
        if (type === 'no_face') updates.noFaceDetectedCount = (a.noFaceDetectedCount || 0) + 1;
        const updated = { ...a, ...updates };
        syncDocToFirestore(COLLECTIONS.attempts, attemptId, updated);
        return updated;
      })
    );
  };

  const getExamById = (id: string) => cdcExams.find((e) => e.id === id);
  const getQuestionsByIds = (ids: string[]) => cdcQuestions.filter((q) => ids.includes(q.id));
  const getStudentByRegisterNumber = (regNo: string) => cdcStudents.find((s) => s.registerNumber === regNo);
  const getAttemptsByExam = (examId: string) => cdcExamAttempts.filter((a) => a.examId === examId);
  const getAttemptByExamAndStudent = (examId: string, regNo: string) =>
    cdcExamAttempts.find((a) => a.examId === examId && a.studentRegisterNumber === regNo);

  return (
    <CdcContext.Provider
      value={{
        cdcQuestions,
        setCdcQuestions,
        cdcExams,
        setCdcExams,
        cdcStudents,
        setCdcStudents,
        cdcExamAttempts,
        setCdcExamAttempts,
        cdcSuspiciousLogs,
        setCdcSuspiciousLogs,
        addQuestion,
        addExam,
        updateExam,
        deleteExam,
        addStudent,
        updateStudent,
        deleteStudent,
        startExamAttempt,
        submitExamAttempt,
        addSuspiciousEvent,
        getExamById,
        getQuestionsByIds,
        getStudentByRegisterNumber,
        getAttemptsByExam,
        getAttemptByExamAndStudent,
      }}
    >
      {children}
    </CdcContext.Provider>
  );
};

export const useCdc = () => {
  const ctx = useContext(CdcContext);
  if (!ctx) throw new Error('useCdc must be used within a CdcProvider');
  return ctx;
};

