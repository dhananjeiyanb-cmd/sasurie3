import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS, SASURIE_COLLEGES } from '../types';
import { getCollegeLogoText } from '../utils/departmentUtils';
import { X, Building, UserCheck, ShieldCheck, Image as ImageIcon, Save, Check, Upload, Trash2, Camera, Mail, Database, Download, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { dailyReport, updateDailyReport, exportFullDatabase, importFullDatabase, syncAllDataToFirestore, resetToDefaultData, currentUser } = useApp();

  const rawDept = currentUser?.department || dailyReport.department || '';
  const cleanDept = rawDept.replace(/^Department of\s+/i, '');
  const matchedDept = DEPARTMENTS.find((d) => d.toLowerCase() === cleanDept.toLowerCase()) || DEPARTMENTS[0];

  const [collegeName, setCollegeName] = useState(dailyReport.collegeName || 'Sasurie College of Engineering');
  const [department, setDepartment] = useState(matchedDept);
  const [hodName, setHodName] = useState(dailyReport.hodName || '');
  const [hodEmail, setHodEmail] = useState(dailyReport.hodEmail || 'hodcs@sasurie.com');
  const [principalName, setPrincipalName] = useState(dailyReport.principalName || '');
  const [collegeLogoText, setCollegeLogoText] = useState(dailyReport.collegeLogoText || 'SCE');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState(dailyReport.collegeLogoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCollegeLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDailyReport({
      collegeName,
      department,
      hodName,
      hodEmail,
      principalName,
      collegeLogoText,
      collegeLogoUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Institutional & Department Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update College Name, Logo, HOD Name, Principal Name & Department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Department Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Popular choice: Artificial Intelligence & Data Science (AI & DS) or Cyber Security (CYBER)
            </p>
          </div>

          {/* College Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Sasurie Institution / College *
            </label>
            <select
              value={collegeName}
              onChange={(e) => {
                const newCol = e.target.value;
                setCollegeName(newCol);
                setCollegeLogoText(getCollegeLogoText(newCol));
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {SASURIE_COLLEGES.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* HOD Name */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                HOD Name *
              </label>
              <input
                type="text"
                required
                value={hodName}
                onChange={(e) => setHodName(e.target.value)}
                placeholder="Dr. V. Henderson, Ph.D."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* HOD Email */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                HOD Official Email ID *
              </label>
              <input
                type="email"
                required
                value={hodEmail}
                onChange={(e) => setHodEmail(e.target.value)}
                placeholder="hod.cse@apex.edu.in"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Principal Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Principal Name *
            </label>
            <input
              type="text"
              required
              value={principalName}
              onChange={(e) => setPrincipalName(e.target.value)}
              placeholder="Prof. Dr. Kiruba Shankar R"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Institutional Logo Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                College / Institutional Logo
              </label>
              <span className="text-[10px] text-slate-400">PNG, JPG, SVG or Data URL</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Logo Preview Card */}
              <div className="relative group shrink-0">
                {collegeLogoUrl ? (
                  <div className="relative">
                    <img
                      src={collegeLogoUrl}
                      alt="College Logo Preview"
                      className="w-16 h-16 object-contain bg-white rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setCollegeLogoUrl('')}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center font-black text-xs border-2 border-amber-400 shadow-xs">
                    <span>{collegeLogoText || 'LOGO'}</span>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">Preview</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image File
                  </button>

                  {collegeLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCollegeLogoUrl('')}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>Or paste image URL:</span>
                </div>
                <input
                  type="url"
                  value={collegeLogoUrl}
                  onChange={(e) => setCollegeLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Initials fallback text */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Logo Badge Text (Used if no image is uploaded)
              </label>
              <input
                type="text"
                value={collegeLogoText}
                onChange={(e) => setCollegeLogoText(e.target.value)}
                placeholder="AI&DS / CSE / CYBER"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white uppercase font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Database Backup & Code Export Support */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Full System Database Backup & Offline Export</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">JSON Format</span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Export all faculty records, tasks, daily monitoring, skill bank students, and settings into a single backup file before downloading your project code.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  syncAllDataToFirestore();
                  setDbStatusMsg('All collections updated & saved to Firebase Firestore!');
                  setTimeout(() => setDbStatusMsg(null), 3500);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                Save All to Firebase
              </button>

              <button
                type="button"
                onClick={() => {
                  exportFullDatabase();
                  setDbStatusMsg('Database exported successfully as JSON!');
                  setTimeout(() => setDbStatusMsg(null), 3000);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Backup (.json)
              </button>

              <input
                type="file"
                ref={dbFileInputRef}
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      const ok = importFullDatabase(text);
                      if (ok) {
                        setDbStatusMsg('Database restored successfully!');
                      } else {
                        setDbStatusMsg('Error: Invalid database JSON file format.');
                      }
                      setTimeout(() => setDbStatusMsg(null), 3500);
                    };
                    reader.readAsText(file);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => dbFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Restore Database (.json)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all database collections to default seed data?')) {
                    resetToDefaultData();
                    setDbStatusMsg('Database reset to default seed data.');
                    setTimeout(() => setDbStatusMsg(null), 3000);
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                title="Reset database to initial seed state"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Data
              </button>
            </div>

            {dbStatusMsg && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {dbStatusMsg}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings Updated!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Changes apply instantly across all reports & views.
              </span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
