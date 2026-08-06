import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  computeFacultyKpi,
  FACULTY_PILLAR_DEFINITIONS,
  GRADE_COLORS,
  PILLAR_MAX_COINS,
  MAX_OVERALL_COINS,
} from '../utils/kpiCalculator';
import type { FacultyPillarBreakdown } from '../utils/kpiCalculator';
import type { FacultyPillarClaim, FacultyPillar } from '../types/facultyKpi';
import { Staff } from '../types';
import {
  Coins,
  BarChart3,
  Award,
  Edit3,
  Save,
  X,
  Lightbulb,
  Shield,
} from 'lucide-react';

type Tab = 'my_kpi' | 'self_claims';

const GRADE_LABEL: Record<string, string> = {
  'S+': 'Outstanding (S+)',
  'A+': 'Excellent (A+)',
  A: 'Very Good (A)',
  B: 'Good (B)',
  C: 'Needs Improvement (C)',
};

function useCurrentStaff(): Staff | undefined {
  const { currentUser, staffList } = useApp();
  if (!currentUser) return undefined;
  const byId = staffList.find((s) => s.id === currentUser.staffId);
  if (byId) return byId;
  // Fallback: resolve via name / email match (demo staff users).
  const nameMatch = staffList.find(
    (s) =>
      (currentUser.name && s.facultyName && s.facultyName.toLowerCase() === currentUser.name.toLowerCase()) ||
      (currentUser.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
  );
  return nameMatch;
}

function GradeBadge({ grade }: { grade: string }) {
  const cls = GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || 'bg-slate-400 text-slate-900';
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[44px] h-6 px-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${cls}`}
      title={GRADE_LABEL[grade] || grade}
    >
      {grade}
    </span>
  );
}

function PillarCoinBar({ earned, claimed, maxCoins, auto }: { earned: number; claimed: number; maxCoins: number; auto: boolean }) {
  const display = auto ? earned : claimed;
  const fill = Math.max(0, Math.min(100, (display / Math.max(1, maxCoins)) * 100));
  return (
    <div className="mt-2">
      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${auto ? 'bg-blue-500' : 'bg-amber-500'}`}
          style={{ width: `${fill}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span>{display.toLocaleString()} / {maxCoins.toLocaleString()} coins</span>
        <span>{Math.round(fill)}% of pillar</span>
      </div>
    </div>
  );
}
function ClaimModal({
  open,
  onClose,
  facultyName,
  staffId,
  defaultPillar,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  facultyName: string;
  staffId: string;
  defaultPillar: FacultyPillar;
  onSubmit: (claim: Omit<FacultyPillarClaim, 'claimedAt'>) => void;
}) {
  const [pillar, setPillar] = useState<FacultyPillar>(defaultPillar);
  const [claimedCoins, setClaimedCoins] = useState<number>(0);
  const [claimSource, setClaimSource] = useState<string>('');
  const [evidence, setEvidence] = useState<string>('');

  const selfClaimable = FACULTY_PILLAR_DEFINITIONS.filter((d) => d.selfClaim);

  const handleSubmit = () => {
    if (!claimSource.trim()) {
      alert('Please describe what you are claiming (e.g. Journals published, FDPs attended).');
      return;
    }
    if (claimedCoins < 0 || claimedCoins > PILLAR_MAX_COINS) {
      alert(`Coins must be between 0 and ${PILLAR_MAX_COINS}.`);
      return;
    }
    onSubmit({
      pillar,
      claimedCoins,
      evidence,
      claimSource,
      claimedBy: facultyName,
      status: 'submitted',
    });
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" />
            Self-Claim a KPI Pillar
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pillar</label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as FacultyPillar)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {selfClaimable.map((d) => (
                <option key={d.pillar} value={d.pillar}>{d.pillar} — {d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Coins claimed (0 – {PILLAR_MAX_COINS})
            </label>
            <input
              type="number"
              min={0}
              max={PILLAR_MAX_COINS}
              value={claimedCoins}
              onChange={(e) => setClaimedCoins(Math.min(PILLAR_MAX_COINS, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              Higher claimed coins → higher pillar grade. Honest self-assessment; HOD may verify.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Claim source</label>
            <input
              type="text"
              value={claimSource}
              onChange={(e) => setClaimSource(e.target.value)}
              placeholder="e.g. 2 Scopus journals, 60L grant, 3 consultancy projects..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Evidence / link</label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Paste URLs, report references, or brief notes..."
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save claim ({staffId})
          </button>
        </div>
      </div>
    </div>
  );
}
const PILLAR_LETTER_COLOR: Record<string, string> = {
  A: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
  B: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
  C: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
  D: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300',
  E: 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300',
  F: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300',
};

const PillarCard: React.FC<{
  p: FacultyPillarBreakdown;
  onClaim: (pillar: FacultyPillar) => void;
}> = ({ p, onClaim }) => {
  const def = p.definition;
  const isAuto = def.auto;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${PILLAR_LETTER_COLOR[p.pillar] || 'bg-slate-100'}`}
            title={p.pillar}
          >
            P{p.pillar}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.label}</span>
        </div>
        <GradeBadge grade={p.grade} />
      </div>
      <PillarCoinBar earned={p.earnedCoins} claimed={p.claimedCoins} maxCoins={p.maxCoins} auto={isAuto} />
      <p
        className="mt-auto text-[10-xs] text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[3.5em]"
        title={p.source}
      >
        {p.source}
      </p>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-wrap">
          {def.auto ? <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><Coins className="w-3 h-3" /> Auto-derived</span> : null}
          {def.selfClaim ? <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Edit3 className="w-3 h-3" /> Self-claimed</span> : null}
          {def.hodAssigned ? <span className="inline-flex items-center gap-1 text-slate-500"><Shield className="w-3 h-3" /> HOD-assigned</span> : null}
        </div>
        {(def.selfClaim || def.hodAssigned) && (
          <button
            onClick={() => onClaim(p.pillar)}
            disabled={def.hodAssigned}
            className={`text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
              def.hodAssigned
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900'
            }`}
            title={def.hodAssigned ? 'Assigned by HOD in Phase 2' : `Claim ${p.pillar}`}
          >
            <Edit3 className="w-3 h-3" />
            {def.hodAssigned ? 'HOD' : 'Claim'}
          </button>
        )}
      </div>
    </div>
  );
};
const overallGradeWords: Record<string, string> = {
  'S+': 'Outstanding',
  'A+': 'Excellent',
  A: 'Very Good',
  B: 'Good',
  C: 'Needs Improvement',
};

export const FacultyKpiView: React.FC = () => {
  const {
    currentUser,
    staffList,
    skillBankStudents,
    facultyKpis,
    upsertFacultyKpiClaim,
    clearFacultyKpiForStaff,
  } = useApp();
  const currentStaff = useCurrentStaff();

  const staffId = (currentStaff?.id || currentUser?.staffId || '').trim();
  const facultyName = currentStaff?.facultyName || currentUser?.name || 'Faculty';
  const department = currentStaff?.department || currentUser?.department || '—';
  const institution = currentStaff?.institution || currentUser?.institution;

  const claimsForFaculty = useMemo<FacultyPillarClaim[]>(() => {
    const rec = facultyKpis.find((r) => r.staffId === staffId);
    return rec?.claims || [];
  }, [facultyKpis, staffId]);

  const academicYear =
    (currentUser as any)?.academicYear || (currentStaff as any)?.academicYear || '';

  const report = useMemo(
    () =>
      computeFacultyKpi({
        staff: currentStaff || {
          id: staffId,
          facultyName: facultyName,
          designation: currentUser?.coordinatorRole || 'Faculty',
          department: department,
          role: currentUser?.role || 'staff',
          status: 'Active',
        } as Staff,
        mentees: skillBankStudents,
        claims: claimsForFaculty,
        academicYear,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStaff, staffId, facultyName, department, currentUser, skillBankStudents, claimsForFaculty, academicYear]
  );

  const [activeTab, setActiveTab] = useState<Tab>('my_kpi');
  const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);
  const [claimPillar, setClaimPillar] = useState<FacultyPillar>('A');

  const openClaim = (pillar: FacultyPillar) => {
    setClaimPillar(pillar);
    setClaimModalOpen(true);
  };

  const handleClaimSubmit = (claim: Omit<FacultyPillarClaim, 'claimedAt'>) => {
    if (!staffId) {
      alert('No staff id resolved — cannot save KPI claim.');
      return;
    }
    upsertFacultyKpiClaim(staffId, claim);
  };

  const selfClaims = report.pillars.filter((p) => p.definition.selfClaim);

  const GradeChip = (grade: string) => (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || ''}`}
    >
      <Award className="w-3 h-3" />
      {grade}
    </span>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            My KPI — Faculty Performance Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {facultyName} · {department}
            {institution ? ` · ${institution}` : ''}
            {staffId ? ` · ID: ${staffId}` : ''}
          </p>
        </div>
        <button
          onClick={() => clearFacultyKpiForStaff(staffId)}
          className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Clear this faculty's stored KPI claims (local + Firestore)"
        >
          Reset my KPI claims
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('my_kpi')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'my_kpi'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          My KPI
        </button>
        <button
          onClick={() => setActiveTab('self_claims')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'self_claims'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Self-Claims
        </button>
      </div>

      {/* ===== MY KPI TAB ===== */}
      {activeTab === 'my_kpi' && (
        <div className="space-y-6">
          {/* Overall KPI Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Overall Faculty KPI
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {report.overallPct}%
                    </span>
                    {GradeChip(report.overallGrade)}
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {overallGradeWords[report.overallGrade] || report.overallGrade}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {report.overallCoins} / {MAX_OVERALL_COINS} overall coins · {report.menteeCount} mentee{report.menteeCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Pillars: B,C,E auto · A,D self-claim · F HOD-audit</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Auto-derived {Math.round(0.6 * 100)}% · Self-claimed {Math.round(0.4 * 100)}%
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Computed: {new Date(report.computedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Pillar breakdown grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.pillars.map((p) => (
              <PillarCard key={p.pillar} p={p} onClaim={openClaim} />
            ))}
          </div>
        </div>
      )}
      {/* ===== SELF-CLAIMS TAB ===== */}
      {activeTab === 'self_claims' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              Self-Claims — Pillar A & D
            </h2>
            <button
              onClick={() => openClaim('A')}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3" /> Add / Edit claim
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Declare your Publications, Grants, Consultancy (A) and MoUs / Consultancy / FDPs (D).
            These feed the 40% self-claimed share of your KPI. Coins are capped at
            {PILLAR_MAX_COINS} per pillar.
          </p>

          {selfClaims.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Coins className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No self-claims saved yet.</p>
              <button
                onClick={() => openClaim('A')}
                className="mt-3 text-sm px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Add your first claim
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selfClaims.map((p) => (
                <div key={p.pillar} className="flex items-stretch gap-3">
                  <div className="flex-1">
                    <PillarCard p={p} onClaim={openClaim} />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <button
                      onClick={() => openClaim(p.pillar)}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assumptions disclosure (framework PDF unreadable) */}
      <details className="mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <summary className="cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Assumptions made in the scoring engine (framework PDF unreadable)
        </summary>
        <ul className="mt-2 list-disc list-inside text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
          {report.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </details>

      {/* Claim Modal (A / D) */}
      <ClaimModal
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        facultyName={facultyName}
        staffId={staffId}
        defaultPillar={claimPillar}
        onSubmit={(claim) => {
          handleClaimSubmit(claim);
        }}
      />
    </div>
  );
};