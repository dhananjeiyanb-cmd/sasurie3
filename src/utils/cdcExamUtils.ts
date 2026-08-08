import {
  CdcQuestion,
  CdcExam,
  CdcExamAttempt,
  CdcExamResultSummary,
  CdcWeaknessReport,
  CdcDepartmentGapReport,
} from '../types/cdc';

export function evaluateExamAttempt(
  attempt: Partial<CdcExamAttempt>,
  questions: CdcQuestion[]
): CdcExamAttempt {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  questions.forEach((q, idx) => {
    const selected = attempt.answers?.[idx];
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
  const attemptedCount = correctCount + wrongCount;
  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
  return {
    ...attempt,
    score: Math.max(0, score),
    correctCount,
    wrongCount,
    unansweredCount,
    percentage: Math.round(percentage * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
  } as CdcExamAttempt;
}

export function calculateRanks(
  attempts: CdcExamAttempt[]
): Map<string, { overall: number; department: number; branch: number; year: number }> {
  const rankMap = new Map<string, { overall: number; department: number; branch: number; year: number }>();

  const sortedOverall = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0));
  sortedOverall.forEach((a, i) => {
    const existing = rankMap.get(a.studentRegisterNumber) || { overall: 0, department: 0, branch: 0, year: 0 };
    existing.overall = i + 1;
    rankMap.set(a.studentRegisterNumber, existing);
  });

  const byDept = new Map<string, CdcExamAttempt[]>();
  attempts.forEach((a) => {
    const arr = byDept.get(a.studentDepartment) || [];
    arr.push(a);
    byDept.set(a.studentDepartment, arr);
  });
  byDept.forEach((list) => {
    const sorted = list.sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.forEach((a, i) => {
      const existing = rankMap.get(a.studentRegisterNumber) || { overall: 0, department: 0, branch: 0, year: 0 };
      existing.department = i + 1;
      rankMap.set(a.studentRegisterNumber, existing);
    });
  });

  return rankMap;
}

export function generateStudentWeaknessReport(
  attempt: CdcExamAttempt,
  questions: CdcQuestion[]
): CdcWeaknessReport {
  const subjectMap = new Map<string, { total: number; correct: number }>();
  const topicMap = new Map<string, { total: number; correct: number }>();

  questions.forEach((q, idx) => {
    const selected = attempt.answers?.[idx];
    const isCorrect = selected === q.correctOptionIndex;

    const s = subjectMap.get(q.subject) || { total: 0, correct: 0 };
    s.total++;
    if (isCorrect) s.correct++;
    subjectMap.set(q.subject, s);

    const t = topicMap.get(q.topic) || { total: 0, correct: 0 };
    t.total++;
    if (isCorrect) t.correct++;
    topicMap.set(q.topic, t);
  });

  const subjectWeaknesses = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    totalQuestions: data.total,
    correctAnswers: data.correct,
  }));

  const topicWeaknesses = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    totalQuestions: data.total,
    correctAnswers: data.correct,
  }));

  return {
    studentRegisterNumber: attempt.studentRegisterNumber,
    studentName: attempt.studentName,
    department: attempt.studentDepartment,
    subjectWeaknesses,
    topicWeaknesses,
    overallPercentage: attempt.percentage || 0,
  };
}

export function generateDepartmentGapAnalysis(
  attempts: CdcExamAttempt[],
  questions: CdcQuestion[]
): CdcDepartmentGapReport[] {
  const deptMap = new Map<string, { subjects: Map<string, { total: number; correct: number; students: Set<string> }>; topics: Map<string, { total: number; correct: number; students: Set<string> }> }>();

  attempts.forEach((a) => {
    if (a.status !== 'submitted' && a.status !== 'auto_submitted') return;

    const dept = deptMap.get(a.studentDepartment) || {
      subjects: new Map(),
      topics: new Map(),
    };

    questions.forEach((q, idx) => {
      const selected = a.answers?.[idx];
      const isCorrect = selected === q.correctOptionIndex;

      const subj = dept.subjects.get(q.subject) || { total: 0, correct: 0, students: new Set() };
      subj.total++;
      if (isCorrect) subj.correct++;
      subj.students.add(a.studentRegisterNumber);
      dept.subjects.set(q.subject, subj);

      const topic = dept.topics.get(q.topic) || { total: 0, correct: 0, students: new Set() };
      topic.total++;
      if (isCorrect) topic.correct++;
      topic.students.add(a.studentRegisterNumber);
      dept.topics.set(q.topic, topic);
    });

    deptMap.set(a.studentDepartment, dept);
  });

  const reports: CdcDepartmentGapReport[] = [];
  deptMap.forEach((data, dept) => {
    const weakSubjects = Array.from(data.subjects.entries())
      .map(([subject, d]) => ({
        subject,
        avgPercentage: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
        affectedStudents: d.students.size,
      }))
      .filter((s) => s.avgPercentage < 60)
      .sort((a, b) => a.avgPercentage - b.avgPercentage);

    const weakTopics = Array.from(data.topics.entries())
      .map(([topic, d]) => ({
        topic,
        avgPercentage: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
        affectedStudents: d.students.size,
      }))
      .filter((t) => t.avgPercentage < 60)
      .sort((a, b) => a.avgPercentage - b.avgPercentage);

    reports.push({ department: dept, weakSubjects, weakTopics });
  });

  return reports;
}

export function generateExamSummary(
  examId: string,
  examTitle: string,
  attempts: CdcExamAttempt[]
): CdcExamResultSummary {
  const examAttempts = attempts.filter((a) => a.examId === examId);
  const appeared = examAttempts.filter((a) => a.status === 'submitted' || a.status === 'auto_submitted');
  const absent = examAttempts.filter((a) => a.status === 'abandoned');
  const scores = appeared.map((a) => a.score || 0);
  const totalStudents = examAttempts.length;
  const passCount = appeared.filter((a) => {
    const pct = a.percentage || 0;
    return pct >= 40;
  }).length;

  return {
    examId,
    examTitle,
    totalStudents,
    appeared: appeared.length,
    absent: absent.length,
    averageMarks: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
    highestMarks: scores.length > 0 ? Math.max(...scores) : 0,
    passPercentage: appeared.length > 0 ? Math.round((passCount / appeared.length) * 100) : 0,
    passCount,
  };
}

// placeholder