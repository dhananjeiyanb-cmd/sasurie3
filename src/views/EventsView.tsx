import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS } from '../types';
import {
  EventRecord,
  EventType,
  EventAssociation,
  EventParticipant,
  EventDocument,
  EventFeedbackResponse,
} from '../types';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  FileText,
  Upload,
  BarChart2,
  Users,
  Award,
  DollarSign,
  Download,
  Trash2,
  Eye,
  Edit,
  Mail,
  Phone,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const EventsView: React.FC = () => {
  const {
    currentUser,
    eventsList,
    addEvent,
    updateEvent,
    deleteEvent,
    addEventParticipant,
    importEventParticipants,
    addEventDocument,
    deleteEventDocument,
    addEventFeedback,
    skillBankStudents,
    staffList,
    dailyReport,
  } = useApp();

  const userDept = currentUser?.department || 'Artificial Intelligence & Data Science (AI & DS)';
  const isPrincipalOrAdmin = true; // HOD Login, Principal, Admin, and Faculty have full edit & delete permissions in Event Master & Analytics Portal
  const isHodOrAdmin = true;

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Selected Event Inspector State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    eventsList.length > 0 ? eventsList[0].id : null
  );
  const [activeEventTab, setActiveEventTab] = useState<
    'master' | 'participants' | 'guest' | 'documents' | 'feedback'
  >('master');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isSubmitFeedbackModalOpen, setIsSubmitFeedbackModalOpen] = useState(false);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);

  // Edit Event Form State
  const [editAcademicYear, setEditAcademicYear] = useState('2025-2026');
  const [editSemester, setEditSemester] = useState<'Odd' | 'Even'>('Odd');
  const [editDepartment, setEditDepartment] = useState(userDept);
  const [editAssociation, setEditAssociation] = useState<string>('Department Association');
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventType, setEditEventType] = useState<EventType>('Workshop');
  const [editMode, setEditMode] = useState<'Internal' | 'External'>('Internal');
  const [editPlannedDate, setEditPlannedDate] = useState('');
  const [editActualDate, setEditActualDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editResourcePersonName, setEditResourcePersonName] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editFundingType, setEditFundingType] = useState<'Sponsored' | 'Self Supported' | 'Institute'>('Institute');
  const [editBudget, setEditBudget] = useState<number>(10000);
  const [editFacultyCoordinator, setEditFacultyCoordinator] = useState('');
  const [editEventStatus, setEditEventStatus] = useState<'Planned' | 'Completed' | 'Cancelled'>('Planned');
  const [editHodApproval, setEditHodApproval] = useState<'Pending' | 'Approved' | 'Rejected'>('Approved');
  const [editPrincipalApproval, setEditPrincipalApproval] = useState<'Pending' | 'Approved' | 'Rejected'>('Approved');

  // New Event Form State
  const [newAcademicYear, setNewAcademicYear] = useState('2025-2026');
  const [newSemester, setNewSemester] = useState<'Odd' | 'Even'>('Odd');
  const [newDepartment, setNewDepartment] = useState(userDept);
  const [newAssociation, setNewAssociation] = useState<string>('Department Association');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('Workshop');
  const [newMode, setNewMode] = useState<'Internal' | 'External'>('Internal');
  const [newPlannedDate, setNewPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newActualDate, setNewActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVenue, setNewVenue] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newResourcePersonName, setNewResourcePersonName] = useState('');
  const [newOrganization, setNewOrganization] = useState('');
  const [newFundingType, setNewFundingType] = useState<'Sponsored' | 'Self Supported' | 'Institute'>('Institute');
  const [newBudget, setNewBudget] = useState<number>(10000);
  const [newFacultyCoordinator, setNewFacultyCoordinator] = useState(currentUser?.name || 'Faculty Coordinator');

  // Manual Participant Form
  const [partRollNo, setPartRollNo] = useState('');
  const [partName, setPartName] = useState('');
  const [partDept, setPartDept] = useState(userDept);
  const [partYear, setPartYear] = useState('3rd Year');
  const [partSection, setPartSection] = useState('A');
  const [partInstitution, setPartInstitution] = useState(dailyReport.collegeName || 'Sasurie College of Engineering');
  const [partAttendance, setPartAttendance] = useState<'Present' | 'Absent'>('Present');

  // Document Upload Form
  const [docType, setDocType] = useState<EventDocument['docType']>('Invitation');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docFileName, setDocFileName] = useState('');

  // Guest Details Form
  const [guestName, setGuestName] = useState('');
  const [guestDesignation, setGuestDesignation] = useState('');
  const [guestOrg, setGuestOrg] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestProfile, setGuestProfile] = useState('');
  const [guestPhotoUrl, setGuestPhotoUrl] = useState('');

  // Feedback Form State (9 questions 1-5)
  const [fbRollNo, setFbRollNo] = useState('');
  const [fbName, setFbName] = useState('');
  const [fbDept, setFbDept] = useState(userDept);
  const [fbRatings, setFbRatings] = useState({
    overallRating: 5,
    courseDelivery: 5,
    communication: 5,
    courseMaterial: 5,
    arrangements: 5,
    doubtClarification: 5,
    practicalSessions: 5,
    hospitality: 5,
    examination: 5,
  });
  const [fbSuggestions, setFbSuggestions] = useState('');

  const selectedEvent = eventsList.find((e) => e.id === selectedEventId) || eventsList[0] || null;

  // Filtered Events
  const filteredEvents = eventsList.filter((event) => {
    const q = (searchQuery || '').toLowerCase();
    const titleMatch = (event.eventTitle || '').toLowerCase().includes(q);
    const idMatch = (event.id || '').toLowerCase().includes(q);
    const topicMatch = (event.topic || '').toLowerCase().includes(q);
    const rpMatch = (event.resourcePersonName || '').toLowerCase().includes(q);
    const matchesSearch = titleMatch || idMatch || topicMatch || rpMatch;

    const matchesDept =
      selectedDeptFilter === 'all' ||
      (event.department || '').toLowerCase() === (selectedDeptFilter || '').toLowerCase();

    const matchesType =
      selectedTypeFilter === 'all' ||
      (event.eventType || '').toLowerCase() === (selectedTypeFilter || '').toLowerCase();

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (event.eventStatus || '').toLowerCase() === (selectedStatusFilter || '').toLowerCase();

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  // Auto-fetch student details from ERP / Skill Bank
  const handleRollNoLookup = (rollNo: string) => {
    setPartRollNo(rollNo);
    if (!rollNo.trim()) return;
    const cleanRoll = rollNo.trim().toLowerCase();
    const student = skillBankStudents.find(
      (s) => (s.studentProfile?.registerNumber || '').toLowerCase() === cleanRoll
    );
    if (student) {
      setPartName(student.studentProfile.studentName || '');
      setPartDept(student.studentProfile.department || userDept);
      setPartYear(student.studentProfile.year || '3rd Year');
      setPartSection(student.studentProfile.section || 'A');
    }
  };

  // Create Event Handler
  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      alert('Please enter an Event Title.');
      return;
    }
    addEvent({
      academicYear: newAcademicYear,
      semester: newSemester,
      department: newDepartment,
      association: newAssociation,
      eventTitle: newEventTitle,
      eventType: newEventType,
      mode: newMode,
      plannedDate: newPlannedDate,
      actualDate: newActualDate,
      venue: newVenue || 'Main Auditorium',
      topic: newTopic || newEventTitle,
      resourcePersonName: newResourcePersonName || 'TBD',
      organization: newOrganization || dailyReport.collegeName || 'Sasurie College of Engineering',
      fundingType: newFundingType,
      budget: Number(newBudget) || 0,
      facultyCoordinator: newFacultyCoordinator,
      hodApproval: currentUser?.role === 'admin' ? 'Approved' : 'Pending',
      principalApproval: currentUser?.role === 'principal' ? 'Approved' : 'Pending',
      eventStatus: 'Planned',
      participants: [],
      documents: [],
      feedbackResponses: [],
    });

    setIsCreateModalOpen(false);
    setNewEventTitle('');
    setNewVenue('');
    setNewTopic('');
    setNewResourcePersonName('');
    setNewOrganization('');
  };

  // Open Edit Event Modal
  const openEditEventModal = (eventToEdit: EventRecord) => {
    setEditAcademicYear(eventToEdit.academicYear || '2025-2026');
    setEditSemester(eventToEdit.semester || 'Odd');
    setEditDepartment(eventToEdit.department || userDept);
    setEditAssociation(eventToEdit.association || 'Department Association');
    setEditEventTitle(eventToEdit.eventTitle || '');
    setEditEventType(eventToEdit.eventType || 'Workshop');
    setEditMode(eventToEdit.mode || 'Internal');
    setEditPlannedDate(eventToEdit.plannedDate || '');
    setEditActualDate(eventToEdit.actualDate || eventToEdit.plannedDate || '');
    setEditVenue(eventToEdit.venue || '');
    setEditTopic(eventToEdit.topic || '');
    setEditResourcePersonName(eventToEdit.resourcePersonName || '');
    setEditOrganization(eventToEdit.organization || '');
    setEditFundingType(eventToEdit.fundingType || 'Institute');
    setEditBudget(eventToEdit.budget || 0);
    setEditFacultyCoordinator(eventToEdit.facultyCoordinator || '');
    setEditEventStatus(eventToEdit.eventStatus || 'Planned');
    setEditHodApproval(eventToEdit.hodApproval || 'Approved');
    setEditPrincipalApproval(eventToEdit.principalApproval || 'Approved');
    setIsEditEventModalOpen(true);
  };

  // Edit Event Handler
  const handleEditEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!editEventTitle.trim()) {
      alert('Please enter an Event Title.');
      return;
    }
    updateEvent(selectedEvent.id, {
      academicYear: editAcademicYear,
      semester: editSemester,
      department: editDepartment,
      association: editAssociation,
      eventTitle: editEventTitle,
      eventType: editEventType,
      mode: editMode,
      plannedDate: editPlannedDate,
      actualDate: editActualDate,
      venue: editVenue,
      topic: editTopic,
      resourcePersonName: editResourcePersonName,
      organization: editOrganization,
      fundingType: editFundingType,
      budget: Number(editBudget) || 0,
      facultyCoordinator: editFacultyCoordinator,
      eventStatus: editEventStatus,
      hodApproval: editHodApproval,
      principalApproval: editPrincipalApproval,
    });

    setIsEditEventModalOpen(false);
    alert('Event Master record updated successfully!');
  };

  // Manual Add Participant
  const handleAddParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!partRollNo || !partName) {
      alert('Please fill in Roll No and Student Name.');
      return;
    }
    addEventParticipant(selectedEvent.id, {
      rollNo: partRollNo.toUpperCase(),
      name: partName,
      department: partDept,
      year: partYear,
      section: partSection,
      institution: partInstitution,
      attendance: partAttendance,
    });
    setPartRollNo('');
    setPartName('');
    setIsAddParticipantModalOpen(false);
  };

  // Excel Upload for Participants
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvent) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const newParts: Omit<EventParticipant, 'id'>[] = data.map((row) => {
          const roll = row['Roll No'] || row['RollNo'] || row['Register No'] || row['Roll Number'] || '7327231';
          const name = row['Name'] || row['Student Name'] || 'Student';
          const dept = row['Department'] || row['Dept'] || selectedEvent.department;
          const year = row['Year'] || '3rd Year';
          const sec = row['Section'] || 'A';
          const inst = row['Institution'] || row['College'] || 'Sasurie College of Engineering';
          const att = (row['Attendance'] || '').toLowerCase() === 'absent' ? 'Absent' : 'Present';

          return {
            rollNo: String(roll).toUpperCase(),
            name: String(name),
            department: String(dept),
            year: String(year),
            section: String(sec),
            institution: String(inst),
            attendance: att,
          };
        });

        if (newParts.length > 0) {
          importEventParticipants(selectedEvent.id, newParts);
          alert(`Successfully imported ${newParts.length} participants from Excel!`);
        } else {
          alert('No valid participant records found in the Excel sheet.');
        }
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        alert('Failed to read Excel file. Please ensure correct column headers (Roll No, Name, Department, Year, Section, Institution, Attendance).');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Document Upload Submit
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!docTitle) {
      alert('Please enter a Document Title.');
      return;
    }
    addEventDocument(selectedEvent.id, {
      docType,
      title: docTitle,
      fileUrl: docUrl || '#',
      fileName: docFileName || `${docType.replace(/\s+/g, '_')}.pdf`,
      uploadedAt: new Date().toISOString().split('T')[0],
    });
    setDocTitle('');
    setDocUrl('');
    setDocFileName('');
    setIsAddDocModalOpen(false);
  };

  // Guest Details Save
  const handleSaveGuestDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    updateEvent(selectedEvent.id, {
      guestDetails: {
        name: guestName,
        designation: guestDesignation,
        organization: guestOrg,
        email: guestEmail,
        mobile: guestMobile,
        profile: guestProfile,
        photoUrl: guestPhotoUrl,
      },
    });
    setIsEditGuestModalOpen(false);
  };

  // Feedback Submission
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    addEventFeedback(selectedEvent.id, {
      participantRollNo: fbRollNo,
      participantName: fbName,
      department: fbDept,
      ...fbRatings,
      suggestions: fbSuggestions,
    });
    setFbRollNo('');
    setFbName('');
    setFbSuggestions('');
    setIsSubmitFeedbackModalOpen(false);
  };

  // Calculate feedback metrics
  const feedbackList = selectedEvent?.feedbackResponses || [];
  const fbCount = feedbackList.length;

  const avgOverall = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.overallRating || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgDelivery = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.courseDelivery || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgComm = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.communication || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgMat = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.courseMaterial || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgArr = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.arrangements || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgDoubt = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.doubtClarification || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgPrac = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.practicalSessions || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgHosp = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.hospitality || 0), 0) / fbCount).toFixed(1) : '0.0';
  const avgExam = fbCount > 0 ? (feedbackList.reduce((acc, f) => acc + (f.examination || 0), 0) / fbCount).toFixed(1) : '0.0';

  const feedbackScorePct = fbCount > 0 ? Math.round((Number(avgOverall) / 5) * 100) : 0;

  const chartData = [
    { name: 'Overall Rating', score: Number(avgOverall) },
    { name: 'Course Delivery', score: Number(avgDelivery) },
    { name: 'Communication', score: Number(avgComm) },
    { name: 'Course Material', score: Number(avgMat) },
    { name: 'Arrangements', score: Number(avgArr) },
    { name: 'Doubt Clarification', score: Number(avgDoubt) },
    { name: 'Practical Sessions', score: Number(avgPrac) },
    { name: 'Hospitality', score: Number(avgHosp) },
    { name: 'Examination', score: Number(avgExam) },
  ];

  // Department-wise breakdown
  const deptBreakdownMap: Record<string, { count: number; totalRating: number }> = {};
  feedbackList.forEach((fb) => {
    const d = fb.department || 'Other';
    if (!deptBreakdownMap[d]) deptBreakdownMap[d] = { count: 0, totalRating: 0 };
    deptBreakdownMap[d].count += 1;
    deptBreakdownMap[d].totalRating += fb.overallRating || 0;
  });

  const deptChartData = Object.keys(deptBreakdownMap).map((d) => ({
    department: d.replace(/^Department of\s+/i, '').replace(/\(.*\)/, '').trim(),
    count: deptBreakdownMap[d].count,
    avg: (deptBreakdownMap[d].totalRating / deptBreakdownMap[d].count).toFixed(1),
  }));

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Roll No': '732723243001',
        'Name': 'Aakash V',
        'Department': 'Artificial Intelligence & Data Science (AI & DS)',
        'Year': '3rd Year',
        'Section': 'A',
        'Institution': 'Sasurie College of Engineering',
        'Attendance': 'Present',
      },
      {
        'Roll No': '732723243002',
        'Name': 'Bhavani S',
        'Department': 'Artificial Intelligence & Data Science (AI & DS)',
        'Year': '3rd Year',
        'Section': 'A',
        'Institution': 'Sasurie College of Engineering',
        'Attendance': 'Present',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, 'Event_Participants_Template.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Institutional Activity Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Event Master & Analytics Portal
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Plan, manage, track, and analyze department workshops, guest lectures, hackathons, and FDPs with automated feedback metrics and document archives.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create Event Master
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Event List, Right Event Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Event Selector List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                All Events ({eventsList.length})
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, resource person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <select
                aria-label="Filter by Event Type"
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Event Types</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="FDP">FDP</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Competition">Competition</option>
                <option value="Club Activity">Club Activity</option>
                <option value="Industrial Visit">Industrial Visit</option>
              </select>

              <select
                aria-label="Filter by Event Status"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Event Cards List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No events match your current filter.
              </div>
            ) : (
              filteredEvents.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {event.id}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventId(event.id);
                            openEditEventModal(event);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Edit Event Master"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${event.eventTitle}"?`)) {
                              deleteEvent(event.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Event Master"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${
                            event.eventStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : event.eventStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {event.eventStatus}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {event.eventTitle}
                    </h3>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {event.eventType}
                      </span>
                      <span>•</span>
                      <span>{event.plannedDate}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{event.department.replace(/^Department of\s+/i, '')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Event Inspector & Detail Modules (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedEvent ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              {/* Event Inspector Top Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {selectedEvent.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/60 px-2.5 py-0.5 rounded">
                        AY {selectedEvent.academicYear} ({selectedEvent.semester} Sem)
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded">
                        {selectedEvent.association}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedEvent.eventTitle}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Department: <strong className="text-slate-700 dark:text-slate-200">{selectedEvent.department}</strong> • Coordinator:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">{selectedEvent.facultyCoordinator}</strong>
                    </p>
                  </div>

                  {/* Actions & Approvals status */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* HOD Approval Badge / Action */}
                    <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">HOD Approval</div>
                      <div className="text-xs font-bold mt-0.5 flex items-center gap-1 justify-center">
                        {selectedEvent.hodApproval === 'Approved' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : selectedEvent.hodApproval === 'Rejected' ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </div>
                      {(currentUser?.role === 'admin' || currentUser?.role === 'principal') && selectedEvent.hodApproval === 'Pending' && (
                        <div className="mt-1 flex gap-1 justify-center">
                          <button
                            onClick={() => {
                              updateEvent(selectedEvent.id, { hodApproval: 'Approved' });
                              alert(`Event approved by HOD and sent to Principal login for final approval!`);
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              updateEvent(selectedEvent.id, { hodApproval: 'Rejected' });
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Principal Approval Badge / Action */}
                    <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Principal Approval</div>
                      <div className="text-xs font-bold mt-0.5 flex items-center gap-1 justify-center">
                        {selectedEvent.principalApproval === 'Approved' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : selectedEvent.principalApproval === 'Rejected' ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </div>
                      {currentUser?.role === 'principal' && selectedEvent.principalApproval === 'Pending' && (
                        <div className="mt-1 flex gap-1 justify-center">
                          <button
                            onClick={() => {
                              updateEvent(selectedEvent.id, { principalApproval: 'Approved' });
                              alert(`Event sanctioned and approved by Principal!`);
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              updateEvent(selectedEvent.id, { principalApproval: 'Rejected' });
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* HOD / Admin Edit & Delete Master Buttons */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => openEditEventModal(selectedEvent)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Edit Event Master Details"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Event
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete event "${selectedEvent.eventTitle}"?`)) {
                            deleteEvent(selectedEvent.id);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Delete Event Master Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Workflow Review Banners */}
              {selectedEvent.hodApproval === 'Pending' && currentUser?.role === 'admin' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>HOD Review Pending:</strong> Event Coordinator submitted this event proposal. Review details and approve to forward to Principal.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        updateEvent(selectedEvent.id, { hodApproval: 'Approved' });
                        alert(`Event "${selectedEvent.eventTitle}" approved by HOD and forwarded to Principal login for final approval!`);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Send to Principal
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reject this event proposal?')) {
                          updateEvent(selectedEvent.id, { hodApproval: 'Rejected' });
                        }
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedEvent.hodApproval === 'Approved' && selectedEvent.principalApproval === 'Pending' && currentUser?.role === 'principal' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-medium">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      <strong>Principal Sanction Required:</strong> HOD has approved this event proposal ({selectedEvent.department}). Sanction to finalize event.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        updateEvent(selectedEvent.id, { principalApproval: 'Approved' });
                        alert(`Event "${selectedEvent.eventTitle}" has been fully sanctioned & approved by Principal!`);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sanction &amp; Approve Event
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reject this event?')) {
                          updateEvent(selectedEvent.id, { principalApproval: 'Rejected' });
                        }
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedEvent.hodApproval === 'Approved' && selectedEvent.principalApproval === 'Approved' && (
                <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-semibold px-5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fully Sanctioned Event: Approved by both HOD ({selectedEvent.department}) and Principal Office.</span>
                </div>
              )}

              {/* Inspector Navigation Tabs */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveEventTab('master')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeEventTab === 'master'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  1. Event Master
                </button>

                <button
                  onClick={() => setActiveEventTab('participants')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeEventTab === 'participants'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  2. Participants ({selectedEvent.participants?.length || 0})
                </button>

                <button
                  onClick={() => setActiveEventTab('guest')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeEventTab === 'guest'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  3. Guest Details
                </button>

                <button
                  onClick={() => setActiveEventTab('documents')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeEventTab === 'documents'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  4. Documents ({selectedEvent.documents?.length || 0})
                </button>

                <button
                  onClick={() => setActiveEventTab('feedback')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeEventTab === 'feedback'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  5. Feedback & Metrics ({feedbackList.length})
                </button>
              </div>

              {/* Tab 1: Event Master Content */}
              {activeEventTab === 'master' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Event Type & Mode</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.eventType} ({selectedEvent.mode})
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Planned vs Actual Date</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.plannedDate} / {selectedEvent.actualDate || selectedEvent.plannedDate}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Venue</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.venue}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Topic / Theme</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.topic}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Resource Person & Org</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.resourcePersonName} ({selectedEvent.organization})
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Funding & Budget</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                        ₹{selectedEvent.budget.toLocaleString()} ({selectedEvent.fundingType})
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Faculty Coordinator</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {selectedEvent.facultyCoordinator}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Event Status</span>
                      <div className="mt-1 flex items-center gap-2">
                        <select
                          aria-label="Update Event Status"
                          value={selectedEvent.eventStatus}
                          onChange={(e) => updateEvent(selectedEvent.id, { eventStatus: e.target.value as any })}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="Planned">Planned</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Participants Content */}
              {activeEventTab === 'participants' && (
                <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Registered Participants List
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload participant records via Excel or manually search and add students from ERP.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleDownloadSampleExcel}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                        title="Download Sample Excel Template"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        Template
                      </button>

                      <label className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel Upload
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => setIsAddParticipantModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Manually
                      </button>

                      {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete ALL registered participants for this event?')) {
                              updateEvent(selectedEvent.id, { participants: [] });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5"
                          title="Clear all participants"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Roll No</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Year / Sec</th>
                          <th className="p-3">Institution</th>
                          <th className="p-3 text-center">Attendance</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(!selectedEvent.participants || selectedEvent.participants.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No participants added yet. Upload Excel or click "Add Manually".
                            </td>
                          </tr>
                        ) : (
                          selectedEvent.participants.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                                {p.rollNo}
                              </td>
                              <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                {p.name}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {p.department.replace(/^Department of\s+/i, '')}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {p.year} - {p.section}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                {p.institution}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.attendance === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {p.attendance}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete participant "${p.name}" (${p.rollNo})?`)) {
                                      const updated = selectedEvent.participants.filter((x) => x.id !== p.id);
                                      updateEvent(selectedEvent.id, { participants: updated });
                                    }
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                  title="Delete Participant"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Guest Details Content */}
              {activeEventTab === 'guest' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Guest Speaker & Resource Person Details
                      </h3>
                      <p className="text-xs text-slate-500">
                        Profile information of visiting guest faculty, keynotes, or industrial experts.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const g = selectedEvent.guestDetails;
                        setGuestName(g?.name || selectedEvent.resourcePersonName || '');
                        setGuestDesignation(g?.designation || '');
                        setGuestOrg(g?.organization || selectedEvent.organization || '');
                        setGuestEmail(g?.email || '');
                        setGuestMobile(g?.mobile || '');
                        setGuestProfile(g?.profile || '');
                        setGuestPhotoUrl(g?.photoUrl || '');
                        setIsEditGuestModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Guest Details
                    </button>
                  </div>

                  {selectedEvent.guestDetails ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start">
                      <img
                        src={
                          selectedEvent.guestDetails.photoUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedEvent.guestDetails.name
                          )}&background=10b981&color=fff`
                        }
                        alt={selectedEvent.guestDetails.name}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0 bg-slate-200 dark:bg-slate-700"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedEvent.guestDetails?.name || 'Guest'
                          )}&background=10b981&color=fff`;
                        }}
                      />

                      <div className="flex-1 space-y-3 text-xs">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {selectedEvent.guestDetails.name}
                          </h4>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {selectedEvent.guestDetails.designation || 'Resource Person'} •{' '}
                            {selectedEvent.guestDetails.organization}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedEvent.guestDetails.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedEvent.guestDetails.mobile || 'N/A'}</span>
                          </div>
                        </div>

                        {selectedEvent.guestDetails.profile && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong className="text-slate-900 dark:text-white block mb-0.5">Profile Writeup:</strong>
                            {selectedEvent.guestDetails.profile}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                      No detailed guest profile entered yet. Click "Edit Guest Details" above to fill out guest info.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Event Documents Content */}
              {activeEventTab === 'documents' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Event Documents Archive
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload and store official circulars, brochures, geo-tagged photos, feedback reports, and certificates.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddDocModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Upload Document
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(!selectedEvent.documents || selectedEvent.documents.length === 0) ? (
                      <div className="sm:col-span-3 p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                        No document files attached yet. Click "Upload Document" to add circulars, photos, or reports.
                      </div>
                    ) : (
                      selectedEvent.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {doc.docType}
                              </span>
                              <button
                                onClick={() => deleteEventDocument(selectedEvent.id, doc.id)}
                                className="text-slate-400 hover:text-rose-500"
                                title="Delete document"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                              {doc.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Uploaded: {doc.uploadedAt}
                            </p>
                          </div>

                          {doc.docType === 'Geo-tagged Photos' && doc.fileUrl && doc.fileUrl !== '#' ? (
                            <img
                              src={doc.fileUrl}
                              alt={doc.title}
                              className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          ) : null}

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {doc.fileName}
                            </span>
                            <a
                              href={doc.fileUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Feedback & Analytics Content */}
              {activeEventTab === 'feedback' && (
                <div className="p-6 space-y-6">
                  {/* Feedback Overview Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
                      <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                        Average Event Rating
                      </span>
                      <div className="text-3xl font-black mt-1 flex items-baseline gap-1">
                        {avgOverall} <span className="text-xs font-normal opacity-80">/ 5.0</span>
                      </div>
                      <span className="text-[10px] mt-1 block opacity-90">
                        Based on {fbCount} form responses
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800">
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        Feedback Score
                      </span>
                      <div className="text-3xl font-black mt-1 text-emerald-400">
                        {feedbackScorePct}%
                      </div>
                      <span className="text-[10px] mt-1 block text-slate-400">
                        Calculated Satisfaction Score
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Form Collector
                        </span>
                        <p className="text-[10px] text-slate-500">ERP & Google Form Sync</p>
                      </div>

                      <button
                        onClick={() => setIsSubmitFeedbackModalOpen(true)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Submit Feedback
                      </button>
                    </div>
                  </div>

                  {/* Rating Breakdown Bar Chart */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Feedback Question Score Analysis (1 to 5 Scale)
                    </h4>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                          />
                          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              color: '#fff',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.score >= 4.5
                                    ? '#10b981'
                                    : entry.score >= 3.5
                                    ? '#3b82f6'
                                    : '#f59e0b'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Department-wise Feedback Analysis */}
                  {deptChartData.length > 0 && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Department-Wise Feedback Analysis
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {deptChartData.map((d, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                                {d.department}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {d.count} student responses
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {d.avg}
                              </span>
                              <span className="text-[10px] text-slate-400 block">Avg Rating</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student Suggestions List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Attendee Suggestions & Remarks ({feedbackList.filter((f) => f.suggestions).length})
                      </h4>
                      {feedbackList.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to clear ALL feedback responses for this event?')) {
                              updateEvent(selectedEvent.id, { feedbackResponses: [] });
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear All Feedback
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {feedbackList.filter((f) => f.suggestions).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No suggestions provided yet.</p>
                      ) : (
                        feedbackList
                          .filter((f) => f.suggestions)
                          .map((f) => (
                            <div
                              key={f.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 relative group"
                            >
                              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {f.participantName || f.participantRollNo || 'Anonymous'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{f.submittedAt}</span>
                                  <button
                                    onClick={() => {
                                      if (confirm('Delete this feedback response?')) {
                                        const updated = (selectedEvent.feedbackResponses || []).filter((x) => x.id !== f.id);
                                        updateEvent(selectedEvent.id, { feedbackResponses: updated });
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Delete Feedback"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p>"{f.suggestions}"</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              Select an event from the left list or create a new Event Master record.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Event Master */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Create New Event Master Record
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester *
                  </label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Odd">Odd Semester</option>
                    <option value="Even">Even Semester</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department (Auto) *
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Association / Club / Cell *
                  </label>
                  <select
                    value={newAssociation}
                    onChange={(e) => setNewAssociation(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Department Association">Department Association</option>
                    <option value="IEEE Student Branch">IEEE Student Branch</option>
                    <option value="CSI Student Chapter">CSI Student Chapter</option>
                    <option value="Fine Arts Club">Fine Arts Club</option>
                    <option value="NSS (National Service Scheme)">NSS (National Service Scheme)</option>
                    <option value="YRC (Youth Red Cross)">YRC (Youth Red Cross)</option>
                    <option value="Sports Club">Sports Club</option>
                    <option value="Entrepreneurship Cell (E-Cell)">Entrepreneurship Cell (E-Cell)</option>
                    <option value="Women Empowerment Cell">Women Empowerment Cell</option>
                    <option value="Institution's Innovation Council (IIC)">Institution's Innovation Council (IIC)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Workshop on Generative AI & Cloud LLM"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as EventType)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="FDP">FDP</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Competition">Competition</option>
                    <option value="Club Activity">Club Activity</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Internal / External *
                  </label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Planned Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlannedDate}
                    onChange={(e) => setNewPlannedDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Date
                  </label>
                  <input
                    type="date"
                    value={newActualDate}
                    onChange={(e) => setNewActualDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Visvesvaraya Auditorium"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic / Key Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hands-on Gemini Cloud APIs"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. K. Senthil Kumar"
                    value={newResourcePersonName}
                    onChange={(e) => setNewResourcePersonName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Cloud Partner"
                    value={newOrganization}
                    onChange={(e) => setNewOrganization(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sponsored / Self Supported / Institute
                  </label>
                  <select
                    value={newFundingType}
                    onChange={(e) => setNewFundingType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Institute">Institute Sponsored</option>
                    <option value="Sponsored">External Sponsored</option>
                    <option value="Self Supported">Self Supported</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Coordinator (Auto Login)
                </label>
                <input
                  type="text"
                  value={newFacultyCoordinator}
                  onChange={(e) => setNewFacultyCoordinator(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Event Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Participant Manually */}
      {isAddParticipantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Add Event Participant
              </h3>
              <button
                onClick={() => setIsAddParticipantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipantSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Roll No / Register Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type Roll No to auto-fetch from ERP"
                  value={partRollNo}
                  onChange={(e) => handleRollNoLookup(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Student Full Name"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Year
                  </label>
                  <select
                    value={partYear}
                    onChange={(e) => setPartYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={partSection}
                    onChange={(e) => setPartSection(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={partDept}
                  onChange={(e) => setPartDept(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={partInstitution}
                  onChange={(e) => setPartInstitution(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attendance Status
                </label>
                <select
                  value={partAttendance}
                  onChange={(e) => setPartAttendance(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddParticipantModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Upload Document */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                Attach Event Document
              </h3>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                >
                  <option value="Invitation">Invitation</option>
                  <option value="Brochure">Brochure</option>
                  <option value="Circular">Circular</option>
                  <option value="Attendance Sheet">Attendance Sheet</option>
                  <option value="Geo-tagged Photos">Geo-tagged Photos</option>
                  <option value="Report PDF">Report PDF</option>
                  <option value="Budget Bills">Budget Bills</option>
                  <option value="Certificate Sample">Certificate Sample</option>
                  <option value="Feedback Report">Feedback Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workshop Inauguration Circular"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document File URL / Attachment Link
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... or image URL"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  File Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI_Workshop_Brochure.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Guest Details */}
      {isEditGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" />
                Edit Guest Speaker Details
              </h3>
              <button
                onClick={() => setIsEditGuestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuestDetails} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tech Lead / Professor"
                    value={guestDesignation}
                    onChange={(e) => setGuestDesignation(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Organization / Company *
                </label>
                <input
                  type="text"
                  required
                  value={guestOrg}
                  onChange={(e) => setGuestOrg(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={guestMobile}
                    onChange={(e) => setGuestMobile(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guest Photo URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={guestPhotoUrl}
                  onChange={(e) => setGuestPhotoUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profile Writeup / Bio
                </label>
                <textarea
                  rows={3}
                  value={guestProfile}
                  onChange={(e) => setGuestProfile(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditGuestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Submit Feedback Response */}
      {isSubmitFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                Submit Event Feedback (1 to 5 Stars)
              </h3>
              <button
                onClick={() => setIsSubmitFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Participant Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Student / Faculty Name"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Roll No / Reg No
                  </label>
                  <input
                    type="text"
                    placeholder="732723..."
                    value={fbRollNo}
                    onChange={(e) => setFbRollNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={fbDept}
                  onChange={(e) => setFbDept(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9 Rating Questions */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Rate the Following Aspects (1 = Poor, 5 = Excellent)
                </h4>

                {[
                  { key: 'overallRating', label: '1. Overall Rating of Event' },
                  { key: 'courseDelivery', label: '2. Course Delivery & Clarity' },
                  { key: 'communication', label: '3. Communication Skill of Speaker' },
                  { key: 'courseMaterial', label: '4. Quality of Course Material & PPT' },
                  { key: 'arrangements', label: '5. Venue & Hall Arrangements' },
                  { key: 'doubtClarification', label: '6. Doubt Clarification & Q&A' },
                  { key: 'practicalSessions', label: '7. Practical / Hands-on Sessions' },
                  { key: 'hospitality', label: '8. Hospitality & Logistics' },
                  { key: 'examination', label: '9. Assessment / Quiz Standard' },
                ].map((q) => (
                  <div key={q.key} className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{q.label}</span>
                    <select
                      value={(fbRatings as any)[q.key]}
                      onChange={(e) =>
                        setFbRatings((prev) => ({ ...prev, [q.key]: Number(e.target.value) }))
                      }
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 font-bold text-emerald-600"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Suggestions / Feedback Comments
                </label>
                <textarea
                  rows={2}
                  placeholder="Share your experience or suggestions for future workshops..."
                  value={fbSuggestions}
                  onChange={(e) => setFbSuggestions(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Edit Event Master Record */}
      {isEditEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-500" />
                Edit Event Master Record ({selectedEvent?.id})
              </h3>
              <button
                onClick={() => setIsEditEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEventSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={editAcademicYear}
                    onChange={(e) => setEditAcademicYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester *
                  </label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Odd">Odd Semester</option>
                    <option value="Even">Even Semester</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Association / Club / Cell *
                  </label>
                  <select
                    value={editAssociation}
                    onChange={(e) => setEditAssociation(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Department Association">Department Association</option>
                    <option value="IEEE Student Branch">IEEE Student Branch</option>
                    <option value="CSI Student Chapter">CSI Student Chapter</option>
                    <option value="Fine Arts Club">Fine Arts Club</option>
                    <option value="NSS (National Service Scheme)">NSS (National Service Scheme)</option>
                    <option value="YRC (Youth Red Cross)">YRC (Youth Red Cross)</option>
                    <option value="Sports Club">Sports Club</option>
                    <option value="Entrepreneurship Cell (E-Cell)">Entrepreneurship Cell (E-Cell)</option>
                    <option value="Women Empowerment Cell">Women Empowerment Cell</option>
                    <option value="Institution's Innovation Council (IIC)">Institution's Innovation Council (IIC)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editEventTitle}
                  onChange={(e) => setEditEventTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value as EventType)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="FDP">FDP</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Competition">Competition</option>
                    <option value="Club Activity">Club Activity</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Internal / External *
                  </label>
                  <select
                    value={editMode}
                    onChange={(e) => setEditMode(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={editPlannedDate}
                    onChange={(e) => setEditPlannedDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Conducted Date
                  </label>
                  <input
                    type="date"
                    value={editActualDate}
                    onChange={(e) => setEditActualDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Venue Location
                  </label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic / Key Focus
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Person Name
                  </label>
                  <input
                    type="text"
                    value={editResourcePersonName}
                    onChange={(e) => setEditResourcePersonName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={editOrganization}
                    onChange={(e) => setEditOrganization(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Funding Type
                  </label>
                  <select
                    value={editFundingType}
                    onChange={(e) => setEditFundingType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Institute">Institute</option>
                    <option value="Sponsored">Sponsored</option>
                    <option value="Self Supported">Self Supported</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Status
                  </label>
                  <select
                    value={editEventStatus}
                    onChange={(e) => setEditEventStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Coordinator
                  </label>
                  <input
                    type="text"
                    value={editFacultyCoordinator}
                    onChange={(e) => setEditFacultyCoordinator(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HOD Approval Status
                  </label>
                  <select
                    value={editHodApproval}
                    onChange={(e) => setEditHodApproval(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Principal Approval Status
                  </label>
                  <select
                    value={editPrincipalApproval}
                    onChange={(e) => setEditPrincipalApproval(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Master Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
