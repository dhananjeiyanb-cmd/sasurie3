import React, { useState } from 'react';
import { Brain, Sparkles, Send, Loader2, Copy, Check, X, Zap, BarChart2, BookOpen, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateHighThinkingResponse } from '../services/aiThinkingService';

interface AiHighThinkingAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiHighThinkingAdvisor: React.FC<AiHighThinkingAdvisorProps> = ({ isOpen, onClose }) => {
  const { staffList, taskList, observationList, dailyReport } = useApp();
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || promptText;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const systemInstruction = `You are an elite Academic Department HOD AI Advisor powered by Gemini 3.1 Pro in High Thinking Mode. Provide deep, structured, analytical, and actionable insights with clear headings, recommendations, and strategic priorities.`;
      const res = await generateHighThinkingResponse({
        prompt: finalPrompt,
        systemInstruction,
      });
      setResultText(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate response. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setLoading(false);
    }
  };

  const presetWorkloadAnalysis = () => {
    const totalStaff = staffList.length;
    const totalTasks = taskList.length;
    const pendingTasks = taskList.filter((t) => t.status !== 'Completed').length;
    const overdueTasks = taskList.filter((t) => t.status === 'Overdue').length;

    const taskSummary = taskList
      .map((t) => `- Title: "${t.title}", Assigned To: ${t.assignedToName}, Status: ${t.status}, Priority: ${t.priority}, Target Date: ${t.targetDate}`)
      .join('\n');

    const p = `Perform a comprehensive HOD workload and task distribution audit for the ${dailyReport.department || 'Department'}.\n\n` +
      `Current Metrics:\n- Total Faculty: ${totalStaff}\n- Total Tasks: ${totalTasks}\n- Pending Tasks: ${pendingTasks}\n- Overdue Tasks: ${overdueTasks}\n\n` +
      `Task Breakdown:\n${taskSummary}\n\n` +
      `Provide:\n1. Strategic Workload Balance Evaluation\n2. Risk Assessment of Overdue/Pending Tasks\n3. Actionable Re-allocation & Deadline Optimization Plan for HOD\n4. Key Performance Indicators for upcoming week.`;

    setPromptText(p);
    handleAnalyze(p);
  };

  const presetObservationAudit = () => {
    const obsSummary = observationList
      .map(
        (o) =>
          `- Staff: ${o.facultyName}, Subject: ${o.subjectName}, Class: ${o.classId}, Rating: ${o.overallRating}, Remarks: "${o.remarks}"`
      )
      .join('\n');

    const p = `Analyze the following classroom observation records for faculty development and pedagogical quality assurance:\n\n` +
      `${obsSummary || 'No recent classroom observations logged.'}\n\n` +
      `Provide:\n1. Departmental Teaching Efficiency Strengths\n2. Critical Pedagogical Gaps Identified\n3. Customized Faculty Mentorship & Quality Improvement Action Steps\n4. Follow-up Priority List.`;

    setPromptText(p);
    handleAnalyze(p);
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-400/30 rounded-xl">
              <Brain className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Gemini 3.1 High Thinking Advisor</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-purple-500/30 border border-purple-400/40 text-purple-200 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300" /> ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Deep analytical reasoning for department workload, faculty evaluations, and complex strategic planning.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Deep Thinking Audits:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={presetWorkloadAnalysis}
                disabled={loading}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl text-left transition-all hover:shadow-md group flex items-start gap-3"
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Department Workload Audit
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deep analysis of task balances, overdue items, and reallocation strategies.
                  </p>
                </div>
              </button>

              <button
                onClick={presetObservationAudit}
                disabled={loading}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl text-left transition-all hover:shadow-md group flex items-start gap-3"
              >
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Classroom Quality Audit
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evaluate observation feedback to plan targeted faculty mentorship.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              Custom Complex Academic Prompt
            </label>
            <div className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ask any complex query (e.g. Draft a 5-step strategy to improve student academic performance and syllabus coverage)..."
                rows={3}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none dark:text-slate-100 placeholder:text-slate-400"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !promptText.trim()}
                className="absolute right-3 bottom-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Run High Thinking
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* Result Display */}
          {loading && (
            <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex justify-center">
                <Brain className="w-10 h-10 text-purple-600 animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Gemini 3.1 Pro Thinking Mode Active...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Processing high-level reasoning across department metrics, task logs, and academic parameters.
              </p>
            </div>
          )}

          {resultText && !loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> High Thinking Analysis & Strategic Plan
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Response'}
                </button>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-sans shadow-xs max-h-96 overflow-y-auto">
                {resultText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
          >
            Close Advisor
          </button>
        </div>
      </div>
    </div>
  );
};
