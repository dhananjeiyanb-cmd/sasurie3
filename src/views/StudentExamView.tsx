import React, { useState, useEffect, useRef } from 'react';
import { useCdc } from '../context/CdcContext';
import { useApp } from '../context/AppContext';
import { WebcamVerification } from '../components/WebcamVerification';
import { CdcExam, CdcExamAttempt, CdcQuestion } from '../types/cdc';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle, CheckCircle2, XCircle, HelpCircle, BookOpen, Timer, ArrowLeft, BarChart2 } from 'lucide-react';

export const StudentExamView: React.FC = () => {
  const { cdcExams, cdcStudents, startExamAttempt, submitExamAttempt, addSuspiciousEvent, getQuestionsByIds, getAttemptByExamAndStudent } = useCdc();
  const { skillBankStudents } = useApp();
  const [selectedExam, setSelectedExam] = useState<CdcExam | null>(null);
  const [student, setStudent] = useState<{ id: string; registerNumber: string; name: string } | null>(null);
  const [loginRegNo, setLoginRegNo] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempt, setAttempt] = useState<CdcExamAttempt | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string>('');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [noFaceAlert, setNoFaceAlert] = useState(false);
  const [viewResultAttempt, setViewResultAttempt] = useState<CdcExamAttempt | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noFaceSinceRef = useRef<number | null>(null);
  const examEndedRef = useRef(false);
  const answersRef = useRef<Record<number, number>>({});
  const markedForReviewRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    markedForReviewRef.current = markedForReview;
  }, [markedForReview]);

  useEffect(() => {
    if (!examStarted || submitted) return;

    const disableCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addSuspiciousEvent(attempt!.id, 'copy_paste', 'Copy/paste blocked');
    };

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      addSuspiciousEvent(attempt!.id, 'right_click', 'Right-click blocked');
    };

    const handleTabSwitch = () => {
      if (document.hidden) {
        handleForcedAutoSubmit(
          'Your exam was auto-submitted because you switched tabs/windows during the test. This attempt cannot be retaken.',
          'tab_switch'
        );
      }
    };

    const handleFullscreenChange = () => {
      const isFs = document.fullscreenElement !== null;
      if (!isFs && examStarted && !submitted) {
        addSuspiciousEvent(attempt!.id, 'fullscreen_exit', 'Exited fullscreen');
      }
    };

    document.addEventListener('copy', disableCopyPaste);
    document.addEventListener('paste', disableCopyPaste);
    document.addEventListener('cut', disableCopyPaste);
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('visibilitychange', handleTabSwitch);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    document.body.style.userSelect = 'none';
    document.documentElement.requestFullscreen().catch(() => {});

    return () => {
      document.removeEventListener('copy', disableCopyPaste);
      document.removeEventListener('paste', disableCopyPaste);
      document.removeEventListener('cut', disableCopyPaste);
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('visibilitychange', handleTabSwitch);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.style.userSelect = '';
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, submitted, attempt, addSuspiciousEvent]);

  // Continuous webcam face-monitoring during the exam. Requests its own
  // camera stream (independent of the pre-exam WebcamVerification stream,
  // which is closed once verification completes).
  useEffect(() => {
    if (!examStarted || submitted) return;
    let cancelled = false;
    let localStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = mediaStream;
        setWebcamStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch(() => {
        // Camera unavailable/denied — proctoring monitoring simply won't run.
      });

    return () => {
      cancelled = true;
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
      noFaceSinceRef.current = null;
      setNoFaceAlert(false);
    };
  }, [examStarted, submitted]);

  useEffect(() => {
    if (!webcamStream || !videoRef.current || !canvasRef.current || !examStarted || submitted) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let alertLogged = false;

    const detectFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(
          canvas.width / 4,
          canvas.height / 4,
          canvas.width / 2,
          canvas.height / 2
        );
        const data = imageData.data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness /= data.length / 4;
        const faceLikelyPresent = brightness > 40 && brightness < 220;

        if (!faceLikelyPresent) {
          if (noFaceSinceRef.current === null) noFaceSinceRef.current = Date.now();
          const elapsed = Date.now() - noFaceSinceRef.current;
          if (elapsed >= 10000) {
            setNoFaceAlert(true);
            if (!alertLogged && attempt) {
              addSuspiciousEvent(attempt.id, 'no_face', 'No face detected for 10+ seconds');
              alertLogged = true;
            }
          }
        } else {
          noFaceSinceRef.current = null;
          alertLogged = false;
          setNoFaceAlert(false);
        }
      }
      animationId = requestAnimationFrame(detectFrame);
    };

    animationId = requestAnimationFrame(detectFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [webcamStream, examStarted, submitted, attempt, addSuspiciousEvent]);

  useEffect(() => {
    if (!examStarted || submitted || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, submitted, timeLeft]);

  const endExamMonitoring = () => {
    examEndedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    document.body.style.userSelect = '';
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleAutoSubmit = () => {
    if (!attempt || !selectedExam || examEndedRef.current) return;
    endExamMonitoring();
    submitExamAttempt(attempt.id, answersRef.current, Array.from(markedForReviewRef.current), 'auto_submitted');
    setSubmitted(true);
  };

  // Called when a proctoring violation (tab/window switch) is detected —
  // immediately auto-submits the exam and permanently blocks any retake.
  const handleForcedAutoSubmit = (reason: string, eventType: 'tab_switch') => {
    if (!attempt || !selectedExam || examEndedRef.current) return;
    endExamMonitoring();
    addSuspiciousEvent(attempt.id, eventType, 'Tab/window switched — exam auto-submitted');
    submitExamAttempt(attempt.id, answersRef.current, Array.from(markedForReviewRef.current), 'auto_submitted');
    setAutoSubmitReason(reason);
    setSubmitted(true);
  };

  const handleSubmit = () => {
    if (!attempt || !selectedExam || examEndedRef.current) return;
    endExamMonitoring();
    submitExamAttempt(attempt.id, answersRef.current, Array.from(markedForReviewRef.current), 'submitted');
    setSubmitted(true);
    setShowConfirmSubmit(false);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const enteredRegNo = loginRegNo.trim().toLowerCase();
    
    // First check in cdcStudents (if already imported)
    let found = cdcStudents.find((s) => s.registerNumber.trim().toLowerCase() === enteredRegNo);
    
    // If not found in cdcStudents, check in skillBankStudents (mentor-mentee data)
    if (!found) {
      const skillBankStudent = skillBankStudents.find(
        (s) => s.studentProfile.registerNumber.trim().toLowerCase() === enteredRegNo
      );
      if (skillBankStudent) {
        // Create a CDC student record from skillBank data
        const sp = skillBankStudent.studentProfile;
        found = {
          id: sp.registerNumber,
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
      }
    }
    
    if (!found) {
      setLoginError('Invalid Registration Number. Please check if you are registered in the system.');
      return;
    }
    setStudent({ id: found.id, registerNumber: found.registerNumber, name: found.name });
  };

  const handleExamSelect = (exam: CdcExam) => {
    if (!student) return;
    const existing = getAttemptByExamAndStudent(exam.id, student.registerNumber);
    if (existing) {
      alert('You have already attempted this exam. Retakes are not allowed.');
      return;
    }
    setSelectedExam(exam);
    setShowWebcam(true);
  };

  const handleWebcamVerified = () => {
    setShowWebcam(false);
    if (!student || !selectedExam) return;

    const existing = getAttemptByExamAndStudent(selectedExam.id, student.registerNumber);
    if (existing) {
      alert('You have already attempted this exam. Retakes are not allowed.');
      setSelectedExam(null);
      return;
    }

    const fullStudent = cdcStudents.find(
      (s) => s.registerNumber.trim().toLowerCase() === student.registerNumber.trim().toLowerCase()
    );

    const newAttempt = startExamAttempt(selectedExam.id, {
      id: student.id,
      registerNumber: student.registerNumber,
      name: student.name,
      department: fullStudent?.department || '',
      year: fullStudent?.year || '',
      section: fullStudent?.section || '',
      batch: fullStudent?.batch || '',
    } as any);

    examEndedRef.current = false;
    setAutoSubmitReason('');
    setSubmitted(false);
    setViewResultAttempt(null);
    setAnswers({});
    setMarkedForReview(new Set());
    setCurrentQuestionIndex(0);
    setAttempt(newAttempt);
    setTimeLeft(selectedExam.durationMinutes * 60);
    setExamStarted(true);
  };

  const toggleMarkForReview = (idx: number) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questions = selectedExam ? getQuestionsByIds(selectedExam.questionIds) : [];
  const currentQuestion = questions[currentQuestionIndex];

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Exam Portal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your Registration Number</p>
          </div>
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Registration Number</label>
              <input
                type="text"
                value={loginRegNo}
                onChange={(e) => setLoginRegNo(e.target.value)}
                placeholder="e.g. 713422104001"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-bold"
              />
            </div>
            {loginError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg">
              View Exams
            </button>
          </form>
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mb-1">Demo Students (from Mentor-Mentee):</p>
            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
              {(cdcStudents.length > 0 ? cdcStudents.slice(0, 3) : skillBankStudents.slice(0, 3).map(s => ({
                id: s.studentProfile.registerNumber,
                registerNumber: s.studentProfile.registerNumber,
                name: s.studentProfile.studentName
              }))).map((s) => (
                <div key={s.id}>{s.registerNumber} — {s.name}</div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStudent(null)}
            className="w-full mt-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!selectedExam) {
    const normalize = (v?: string) => (v || '').trim().toLowerCase();
    
    // First check in cdcStudents, then fall back to skillBankStudents
    let foundStudent = cdcStudents.find(
      (s) => s.registerNumber.trim().toLowerCase() === student!.registerNumber.trim().toLowerCase()
    );
    
    // If not found in cdcStudents, get student info from skillBankStudents
    if (!foundStudent) {
      const skillBankStudent = skillBankStudents.find(
        (s) => s.studentProfile.registerNumber.trim().toLowerCase() === student!.registerNumber.trim().toLowerCase()
      );
      if (skillBankStudent) {
        const sp = skillBankStudent.studentProfile;
        foundStudent = {
          id: sp.registerNumber,
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
      }
    }
    
    // Only expose scheduled/active exams that are assigned to this student.
    const availableExams = cdcExams.filter((exam) => {
      if (!foundStudent) return false;
      // Draft & Cancelled exams are not published, so students must not see them.
      if (exam.status === 'Draft' || exam.status === 'Cancelled') return false;
      return exam.assignments.some((a) => {
        const deptMatches = normalize(a.department) === normalize(foundStudent!.department);
        const yearMatches = normalize(a.year) === normalize(foundStudent!.year);
        if (!deptMatches || !yearMatches) return false;
        // If specific sections are set on the assignment, the student's section
        // must be included — unless the student has no section recorded, in which
        // case a newly added student must still see the exam.
        if (a.sections && a.sections.length > 0) {
          if (!foundStudent!.section || !foundStudent!.section.trim()) return true;
          return a.sections.some((sec) => normalize(sec) === normalize(foundStudent!.section));
        }
        // If specific register numbers are set, the student must be listed.
11        if (a.studentRegisterNumbers) {
          if (a.studentRegisterNumbers.length === 0) {
            return false;
          }
          return a.studentRegisterNumbers.some((r) => normalize(r) === normalize(foundStudent!.registerNumber));
        }
        return true;
      });
    });

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {student.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{student.registerNumber}</p>
              </div>
              <button onClick={() => setStudent(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold">
                Logout
              </button>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Available Exams</h2>
          {availableExams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <HelpCircle className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No exams assigned to you at this time.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableExams.map((exam) => {
                const priorAttempt = getAttemptByExamAndStudent(exam.id, student.registerNumber);
                const alreadyDone = !!priorAttempt;
                return (
                  <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{exam.description}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600 dark:text-slate-400">
                          <span>{exam.scheduledDate}</span>
                          <span>{exam.scheduledTime}</span>
                          <span>{exam.durationMinutes} min</span>
                          <span>{exam.questionIds.length} questions</span>
                          <span>{exam.totalMarks} marks</span>
                        </div>
                        {alreadyDone && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {priorAttempt?.status === 'auto_submitted' ? 'Auto-submitted (violation detected)' : 'Already completed'}
                            {typeof priorAttempt?.score === 'number' && ` — Score: ${priorAttempt.score}`}
                          </div>
                        )}
                      </div>
                      {alreadyDone ? (
                        <button
                          onClick={() => { setSelectedExam(exam); setViewResultAttempt(priorAttempt); }}
                          className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-1.5"
                        >
                          <BarChart2 className="w-4 h-4" /> View Result
                        </button>
                      ) : (
                        <button
                          onClick={() => handleExamSelect(exam)}
                          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold"
                        >
                          Start Exam
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showWebcam) {
    return <WebcamVerification onVerified={handleWebcamVerified} onCancel={() => { setShowWebcam(false); setSelectedExam(null); }} studentName={student.name} />;
  }

  // Show results both right after an exam is submitted AND when a student
  // opens "View Result" on an already-completed exam. We read the authoritative
  // attempt from context (which carries the computed score/correct/wrong/…)
  // so the figures always reflect the latest submission, instead of relying on
  // the in-component `attempt` snapshot (which has no evaluated score).
  if (viewResultAttempt || (submitted && attempt)) {
    const attemptToShow =
      viewResultAttempt ||
      (selectedExam && student
        ? getAttemptByExamAndStudent(selectedExam.id, student.registerNumber)
        : undefined) ||
      attempt;

    const result = {
      score: attemptToShow?.score || 0,
      correct: attemptToShow?.correctCount || 0,
      wrong: attemptToShow?.wrongCount || 0,
      unanswered: attemptToShow?.unansweredCount || 0,
      percentage: attemptToShow?.percentage || 0,
      accuracy: attemptToShow?.accuracy || 0,
    };

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            {autoSubmitReason ? (
              <>
                <AlertTriangle className="w-16 h-16 text-rose-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Exam Auto-Submitted</h1>
                <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl font-semibold">
                  {autoSubmitReason}
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Exam Submitted</h1>
              </>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{selectedExam.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-600">{result.score}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Score</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-600">{result.correct}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Correct</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-rose-600">{result.wrong}</p>
                <p className="text-xs text-rose-700 dark:text-rose-300">Wrong</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-600">{result.unanswered}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Unanswered</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.percentage}%</p>
                <p className="text-xs text-slate-500">Percentage</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.accuracy}%</p>
                <p className="text-xs text-slate-500">Accuracy</p>
              </div>
            </div>
            <button onClick={() => { setSelectedExam(null); setSubmitted(false); setAttempt(null); setViewResultAttempt(null); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm">
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">{selectedExam.title}</h2>
          <p className="text-xs text-slate-500">Student: {student.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${timeLeft < 60 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700' : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => setShowConfirmSubmit(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold">
            <Send className="w-4 h-4" /> Submit
          </button>
        </div>
      </div>

      {/* Hidden proctoring webcam feed used only for face-presence detection */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {noFaceAlert && (
        <div className="sticky top-[57px] z-40 bg-rose-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">
            ⚠ No face detected for over 10 seconds! Please stay visible in front of the camera or your exam may be flagged for review.
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        <div className="flex-1 p-4 sm:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                Q{currentQuestionIndex + 1}/{questions.length}
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold capitalize">
                {currentQuestion.difficulty}
              </span>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold">
                {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
              {currentQuestion.questionText}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const selected = answers[currentQuestionIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: idx }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-950 text-slate-600'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm ${selected ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50">
                <ChevronLeft className="w-4 h-4 inline mr-2" /> Previous
              </button>
              <button onClick={() => toggleMarkForReview(currentQuestionIndex)} className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm">
                <Flag className="w-4 h-4 inline mr-2" /> {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
              </button>
              <button onClick={() => setCurrentQuestionIndex((p) => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                Save & Next <ChevronRight className="w-4 h-4 inline ml-2" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-72 p-4 sm:p-6 lg:pl-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Question Palette</h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 mb-4">
              {questions.map((_, idx) => {
                let bg = 'bg-slate-100 dark:bg-slate-950 text-slate-600';
                if (answers[idx] !== undefined) bg = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700';
                if (markedForReview.has(idx)) bg = 'bg-amber-100 dark:bg-amber-950 text-amber-700';
                if (idx === currentQuestionIndex) bg = 'bg-blue-600 text-white';
                return (
                  <button key={idx} onClick={() => setCurrentQuestionIndex(idx)} className={`w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center ${bg}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950" /><span className="text-slate-600 dark:text-slate-400">Answered ({Object.keys(answers).length})</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950" /><span className="text-slate-600 dark:text-slate-400">Marked ({markedForReview.size})</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-950" /><span className="text-slate-600 dark:text-slate-400">Unanswered ({questions.length - Object.keys(answers).length})</span></div>
            </div>
            <button onClick={() => setShowConfirmSubmit(true)} className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm sm:hidden">
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Confirm Submission</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              You have answered {Object.keys(answers).length} out of {questions.length} questions. Submit now?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm">Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
