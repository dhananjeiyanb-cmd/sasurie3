import {
  CdcQuestion,
  CdcExam,
  CdcExamAttempt,
  CdcExamResultSummary,
  CdcWeaknessReport,
  CdcDepartmentGapReport,
  CdcDepartmentResult,
  CdcStudentRanks,
  CdcRankListEntry,
  CdcProctoringLogRow,
  CdcSuspiciousEvent,
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

const PARTICIPATED_STATUSES: CdcExamAttempt['status'][] = ['submitted', 'auto_submitted'];

/** Whether an attempt counts as having appeared for the exam. */
export function hasAppeared(a: Pick<CdcExamAttempt, 'status'>): boolean {
  return PARTICIPATED_STATUSES.includes(a.status);
}

/**
 * Assigns competitive (competition-style) ranks: students sharing the same
 * score receive the same rank; the next distinct score gets a gap.
 * Stored on the attempt via a private __ranks bag.
 */
function assignRanksToGroup(list: CdcExamAttempt[], key: string): void {
  const sorted = [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
  let lastScore: number | null = null;
  let lastRank = 0;
  sorted.forEach((a, i) => {
    if (a.score !== lastScore) {
      lastRank = i + 1;
      lastScore = a.score ?? null;
    }
    if (!(a as any).__ranks) (a as any).__ranks = {};
    (a as any).__ranks[key] = lastRank;
  });
}

/**
 * Computes four competitive ranks per student for a set of exam attempts:
 * - overall    → across everyone who appeared
 * - department → within the same department (e.g. CSE)
 * - branch     → within the same department + section (e.g. CSE · Sec A);
 *                falls back to the department group when no section is recorded
 * - year       → within the same academic year (e.g. 3rd Year), across departments
 *
 * Ranks are keyed by student register number. Students who did not appear are
 * omitted.
 */
export function calculateRanks(attempts: CdcExamAttempt[]): Map<string, CdcStudentRanks> {
  const participated = attempts.filter(hasAppeared);

  const byDepartments = new Map<string, CdcExamAttempt[]>();
  const byBranches = new Map<string, CdcExamAttempt[]>();
  const byYears = new Map<string, CdcExamAttempt[]>();

  participated.forEach((a) => {
    const dept = a.studentDepartment || 'Unknown';
    const section = (a.studentSection || '').trim();
    const branchKey = `${dept}${section ? ` · ${section}` : ''}`;
    const yearKey = (a.studentYear || '').trim() || 'Unknown';
    pushTo(dept, byDepartments, a);
    pushTo(branchKey, byBranches, a);
    pushTo(yearKey, byYears, a);
  });

  assignRanksToGroup(participated, 'overall');
  byDepartments.forEach((list) => assignRanksToGroup(list, 'department'));
  byBranches.forEach((list) => assignRanksToGroup(list, 'branch'));
  byYears.forEach((list) => assignRanksToGroup(list, 'year'));

  const rankMap = new Map<string, CdcStudentRanks>();
  participated.forEach((a) => {
    const dept = a.studentDepartment || 'Unknown';
    const section = (a.studentSection || '').trim();
    const branchKey = `${dept}${section ? ` · ${section}` : ''}`;
    const yearKey = (a.studentYear || '').trim() || 'Unknown';
    const ranks = (a as any).__ranks || {};
    rankMap.set(a.studentRegisterNumber, {
      overall: ranks['overall'] ?? 0,
      department: ranks['department'] ?? ranks[dept] ?? 0,
      branch: ranks['branch'] ?? ranks[branchKey] ?? 0,
      year: ranks['year'] ?? ranks[yearKey] ?? 0,
    });
  });

  return rankMap;
}

function pushTo(key: string, map: Map<string, CdcExamAttempt[]>, a: CdcExamAttempt): void {
  let arr = map.get(key);
  if (!arr) map.set(key, (arr = []));
  arr.push(a);
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

/** Builds the Rank List shown (and exported) from the CDC Dashboard. */
export function generateRankList(attempts: CdcExamAttempt[]): CdcRankListEntry[] {
  const rankMap = calculateRanks(attempts);
  return attempts
    .filter(hasAppeared)
    .sort(
      (a, b) =>
        (rankMap.get(a.studentRegisterNumber)?.overall ?? Number.MAX_SAFE_INTEGER) -
        (rankMap.get(b.studentRegisterNumber)?.overall ?? Number.MAX_SAFE_INTEGER)
    )
    .map((a) => {
      const r = rankMap.get(a.studentRegisterNumber);
      return {
        registerNumber: a.studentRegisterNumber,
        name: a.studentName,
        department: a.studentDepartment || '—',
        year: a.studentYear || '—',
        section: a.studentSection || '—',
        score: a.score || 0,
        percentage: a.percentage || 0,
        overallRank: r?.overall ?? a.overallRank ?? 0,
        departmentRank: r?.department ?? a.departmentRank ?? 0,
        branchRank: r?.branch ?? a.branchRank ?? 0,
        yearRank: r?.year ?? a.yearRank ?? 0,
      };
    });
}

/** Per-department result breakdown for the CDC Dashboard. */
export function generateDepartmentWiseResults(exam: CdcExam, attempts: CdcExamAttempt[]): CdcDepartmentResult[] {
  const examAttempts = attempts.filter((a) => a.examId === exam.id);
  const totalMarks = exam.totalMarks || 1;
  const baseThresholdPct =
    typeof exam.passingMarks === 'number' && exam.passingMarks > 0
      ? (exam.passingMarks / totalMarks) * 100
      : 40;

  const grouped = new Map<string, CdcExamAttempt[]>();
  examAttempts.forEach((a) => {
    const dept = a.studentDepartment || 'Unknown';
    const arr = grouped.get(dept) || [];
    arr.push(a);
    grouped.set(dept, arr);
  });

  const results: CdcDepartmentResult[] = [];
  grouped.forEach((list, department) => {
    const appeared = list.filter(hasAppeared);
    const absent = list.filter((a) => a.status === 'abandoned');
    const scores = appeared.map((a) => a.score || 0);
    const passCount = appeared.filter((a) => (a.percentage || 0) >= baseThresholdPct).length;
    results.push({
      department,
      totalStudents: list.length,
      appeared: appeared.length,
      absent: absent.length,
      averageMarks: scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100 : 0,
      highestMarks: scores.length > 0 ? Math.max(...scores) : 0,
      passPercentage: appeared.length > 0 ? Math.round((passCount / appeared.length) * 100) : 0,
      passCount,
      passThresholdPercent: Math.round(baseThresholdPct * 100) / 100,
    });
  });

  return results.sort((a, b) => b.totalStudents - a.totalStudents || a.department.localeCompare(b.department));
}

const EVENT_LABELS: Record<string, string> = {
  tab_switch: 'Tab / window switch',
  fullscreen_exit: 'Fullscreen exit',
  copy_paste: 'Copy / paste attempt',
  right_click: 'Right-click attempt',
  multi_face: 'Multiple faces detected',
  no_face: 'No face detected',
  text_selection: 'Text selection attempt',
};

/** Joins stored suspicious events with attempt info for the proctoring log view. */
export function generateProctoringLogs(
  examId: string,
  attempts: CdcExamAttempt[],
  suspiciousLogs: CdcSuspiciousEvent[]
): CdcProctoringLogRow[] {
  const attemptById = new Map(attempts.map((a) => [a.id, a]));
  return suspiciousLogs
    .filter((e) => attemptById.get(e.attemptId)?.examId === examId)
    .map((e) => {
      const attempt = attemptById.get(e.attemptId);
      return {
        id: e.id,
        attemptId: e.attemptId,
        studentRegisterNumber: attempt?.studentRegisterNumber || '—',
        studentName: attempt?.studentName || 'Unknown student',
        examId,
        type: e.type,
        timestamp: e.timestamp,
        details: e.details,
      };
    })
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export const suspiciousEventLabel = (type: CdcSuspiciousEvent['type']): string =>
  EVENT_LABELS[type] || type.replace(/_/g, ' ');