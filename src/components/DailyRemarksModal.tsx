import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  FileText,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';

interface DailyRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'events' | 'discipline' | 'hod' | 'naac';
}

export const DailyRemarksModal: React.FC<DailyRemarksModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'discipline',
}) => {
  const { dailyReport, updateDailyReport } = useApp();

  const [activeTab, setActiveTab] = useState<'events' | 'discipline' | 'hod' | 'naac'>(initialTab);
  const [eventsConducted, setEventsConducted] = useState('');
  const [naacWorkDone, setNaacWorkDone] = useState('');
  const [disciplineIssues, setDisciplineIssues] = useState('');
  const [specialRemarks, setSpecialRemarks] = useState('');
  const [hodRemarks, setHodRemarks] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEventsConducted(dailyReport.eventsConducted || '');
      setNaacWorkDone(dailyReport.naacWorkDone || '');
      setDisciplineIssues(dailyReport.disciplineIssues || '');
      setSpecialRemarks(dailyReport.specialRemarks || '');
      setHodRemarks(dailyReport.hodRemarks || '');
      setActiveTab(initialTab);
    }
  }, [isOpen, dailyReport, initialTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateDailyReport({
      eventsConducted,
      naacWorkDone,
      disciplineIssues,
      specialRemarks,
      hodRemarks,
    });
    onClose();
  };

  const applyPresetDiscipline = (preset: string) => {
    setDisciplineIssues(preset);
  };

  const applyPresetRemarks = (preset: string) => {
    setSpecialRemarks(preset);
  };

  const applyPresetHod = (preset: string) => {
    setHodRemarks(preset);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Daily Department Remarks & Reports
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter and update Discipline Issues, Special Remarks, Events, and HOD Overall Remarks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('naac')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'naac'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            NAAC / NBA Work Done
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discipline')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'discipline'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Discipline & Remarks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hod')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'hod'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            HOD Overall Remarks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Events Conducted
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'naac' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  NAAC & NBA Accreditation Work Done (Today's Progress)
                </label>
                <textarea
                  rows={5}
                  value={naacWorkDone}
                  onChange={(e) => setNaacWorkDone(e.target.value)}
                  placeholder="e.g. • Criteria 1: Course Outcome (CO) & Program Outcome (PO) attainment files updated for CSE.\n• Criteria 2: ICT tools usage and student feedback data uploaded."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />

                <div className="mt-3 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick NAAC Criteria Preset Injectors:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• Criteria 1 (Curricular Aspects): CO-PO mapping and syllabus delivery logs verified.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      + Criteria 1: Curricular & CO-PO
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• Criteria 2 (Teaching-Learning): e-Content, PPTs, and ICT teaching tools logs uploaded.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      + Criteria 2: Teaching-Learning & ICT
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• Criteria 3 (Research & Extension): Faculty publication list and project proposals compiled.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      + Criteria 3: Research & Consultancy
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• Criteria 4 (Infrastructure): Lab equipment maintenance logs and software licenses audited.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      + Criteria 4: Infrastructure & Labs
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• Criteria 5 (Student Support): Placement records, higher education data, and alumni files updated.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      + Criteria 5: Student Progression
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNaacWorkDone(
                          (prev) =>
                            (prev ? prev + '\n' : '') +
                            '• IQAC Annual Quality Audit: Criteria 1 to 7 documentation compiled for NAAC peer review.'
                        )
                      }
                      className="p-1.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 text-left border border-slate-200 dark:border-slate-700 font-medium col-span-1 sm:col-span-2"
                    >
                      + IQAC Full Audit Dossier Compiled
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discipline' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Discipline Issues (Today)
                </label>
                <textarea
                  rows={3}
                  value={disciplineIssues}
                  onChange={(e) => setDisciplineIssues(e.target.value)}
                  placeholder="e.g. No discipline issues reported today. All classes proceeded according to schedule."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetDiscipline('None reported.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "None reported."
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDiscipline('Minor dress code and punctuality warnings issued during 1st hour.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Dress code / punctuality warnings"
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDiscipline('All classes conducted smoothly without any discipline issues.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Smooth & disciplined"
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Special Remarks
                </label>
                <textarea
                  rows={3}
                  value={specialRemarks}
                  onChange={(e) => setSpecialRemarks(e.target.value)}
                  placeholder="e.g. Lab equipment maintenance in AI Lab scheduled for Saturday. Guest lecture pre-arrangements completed."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetRemarks('No special remarks recorded.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "No special remarks recorded."
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetRemarks('Internal assessment answer sheets valuation under progress.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "IA Valuation in progress"
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetRemarks('Project review reviews scheduled for final year students tomorrow.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Project reviews scheduled"
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hod' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  7. HOD Overall Remarks
                </label>
                <textarea
                  rows={4}
                  value={hodRemarks}
                  onChange={(e) => setHodRemarks(e.target.value)}
                  placeholder="e.g. Satisfactory performance across all academic activities today. Syllabi coverage is on track for upcoming mid-term examinations."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetHod('Satisfactory academic progress observed. Classes and practicals conducted as per the master timetable.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Satisfactory progress"
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetHod('Attendance in 3rd year classes was exemplary. Faculty members completed scheduled syllabus topics effectively.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Exemplary attendance"
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetHod('All department tasks completed on time. Faculty classroom observations showed strong student engagement.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Strong engagement"
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  5. Events Conducted & Departmental Activities
                </label>
                <textarea
                  rows={4}
                  value={eventsConducted}
                  onChange={(e) => setEventsConducted(e.target.value)}
                  placeholder="e.g. Departmental technical seminar on AI/ML conducted in Seminar Hall 2 with 120 student participants."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => setEventsConducted('No departmental events recorded today.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "No events recorded"
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventsConducted('Expert guest lecture on Data Analytics conducted for 3rd and 4th year students.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Guest Lecture"
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventsConducted('Weekly Departmental Faculty Progress Meeting held at 4:00 PM.')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    "Faculty Meeting"
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Remarks & Report
          </button>
        </div>
      </div>
    </div>
  );
};
