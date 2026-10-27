import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import {
  MonthlyMeReport,
  OutsideWorkPlanActivity,
  AnnualWorkPlan,
  Department,
  SubmissionStatus
} from '../types.js';
import { OutsideActivityModal } from './OutsideActivityModal.js';
import { OutsideActivityDetailModal } from './OutsideActivityDetailModal.js';
import {
  ClipboardCheck,
  Plus,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Search,
  Calendar,
  Building2,
  Send,
  AlertOctagon,
  ShieldAlert,
  Layers,
  Sparkles,
  FileCheck,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

export const MonthlyMeView: React.FC = () => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();

  const [reports, setReports] = useState<MonthlyMeReport[]>([]);
  const [outsideActivities, setOutsideActivities] = useState<OutsideWorkPlanActivity[]>([]);
  const [approvedWorkPlans, setApprovedWorkPlans] = useState<AnnualWorkPlan[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'planned' | 'outside'>('planned');

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Planned Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<MonthlyMeReport | null>(null);
  const [viewingReport, setViewingReport] = useState<MonthlyMeReport | null>(null);

  // Outside Modal State
  const [isOutsideModalOpen, setIsOutsideModalOpen] = useState(false);
  const [isOutsideDetailModalOpen, setIsOutsideDetailModalOpen] = useState(false);
  const [editingOutsideActivity, setEditingOutsideActivity] = useState<OutsideWorkPlanActivity | null>(null);
  const [viewingOutsideActivity, setViewingOutsideActivity] = useState<OutsideWorkPlanActivity | null>(null);

  // Planned Form State
  const [selectedWorkPlanId, setSelectedWorkPlanId] = useState<string>('');
  const [reportingMonth, setReportingMonth] = useState<number>(
    systemSettings?.active_reporting_month || new Date().getMonth() + 1
  );
  const [reportingYear, setReportingYear] = useState<number>(
    systemSettings?.active_reporting_year || new Date().getFullYear()
  );
  const [actualStart, setActualStart] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [actualAchievement, setActualAchievement] = useState('');
  const [percentageCompleted, setPercentageCompleted] = useState<number>(0);
  const [outcome, setOutcome] = useState('');
  const [milestoneAchieved, setMilestoneAchieved] = useState('');
  const [challenges, setChallenges] = useState('');
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState('');
  const [kpiAchieved, setKpiAchieved] = useState<'Yes' | 'No'>('No');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('Submitted');

  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreate =
    isDeskOfficer && systemSettings?.reporting_stage === 'Monthly M&E Reporting';

  useEffect(() => {
    loadData();
  }, [selectedDeptFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [repRes, outRes, wpRes, dRes] = await Promise.all([
        api.meReports.getAll(selectedDeptFilter || undefined),
        api.outsideActivities.getAll(selectedDeptFilter || undefined),
        api.workPlans.getAll(selectedDeptFilter || undefined),
        api.departments.getAll()
      ]);
      setReports(repRes.me_reports);
      setOutsideActivities(outRes.outside_activities);
      const approvedOnly = wpRes.work_plans.filter(wp => wp.status === 'Approved');
      setApprovedWorkPlans(approvedOnly);
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load Monthly M&E data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWorkPlanObject = approvedWorkPlans.find(wp => wp.id === selectedWorkPlanId);

  // Planned Modals
  const openCreatePlannedModal = () => {
    setEditingReport(null);
    setSelectedWorkPlanId(approvedWorkPlans.length > 0 ? approvedWorkPlans[0].id : '');
    setReportingMonth(systemSettings?.active_reporting_month || new Date().getMonth() + 1);
    setReportingYear(systemSettings?.active_reporting_year || new Date().getFullYear());
    setActualStart('');
    setActualDuration('');
    setActualEnd('');
    setActualAchievement('');
    setPercentageCompleted(0);
    setOutcome('');
    setMilestoneAchieved('');
    setChallenges('');
    setRemarks('');
    setEvidence('');
    setKpiAchieved('No');
    setSubmissionStatus('Submitted');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditPlannedModal = (rep: MonthlyMeReport) => {
    setEditingReport(rep);
    setSelectedWorkPlanId(rep.work_plan_id);
    setReportingMonth(rep.reporting_month);
    setReportingYear(rep.reporting_year);
    setActualStart(rep.actual_start);
    setActualDuration(rep.actual_duration);
    setActualEnd(rep.actual_end);
    setActualAchievement(rep.actual_achievement);
    setPercentageCompleted(rep.percentage_completed);
    setOutcome(rep.outcome);
    setMilestoneAchieved(rep.milestone_achieved);
    setChallenges(rep.challenges);
    setRemarks(rep.remarks);
    setEvidence(rep.evidence);
    setKpiAchieved(rep.kpi_achieved || (rep.percentage_completed >= 100 ? 'Yes' : 'No'));
    setSubmissionStatus(rep.submission_status === 'Returned for Correction' ? 'Submitted' : rep.submission_status);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openDetailPlannedModal = (rep: MonthlyMeReport) => {
    setViewingReport(rep);
    setIsDetailModalOpen(true);
  };

  // Outside Modals
  const openCreateOutsideModal = () => {
    setEditingOutsideActivity(null);
    setIsOutsideModalOpen(true);
  };

  const openEditOutsideModal = (act: OutsideWorkPlanActivity) => {
    setEditingOutsideActivity(act);
    setIsOutsideModalOpen(true);
  };

  const openDetailOutsideModal = (act: OutsideWorkPlanActivity) => {
    setViewingOutsideActivity(act);
    setIsOutsideDetailModalOpen(true);
  };

  // Quick submit for draft planned report
  const handleQuickSubmitPlanned = async (rep: MonthlyMeReport) => {
    try {
      await api.meReports.update(rep.id, { submission_status: 'Submitted' });
      setSuccessMessage(`Planned report ${rep.activity_code} submitted successfully for review.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    }
  };

  // Quick submit for draft outside activity
  const handleQuickSubmitOutside = async (act: OutsideWorkPlanActivity) => {
    try {
      await api.outsideActivities.update(act.id, { submission_status: 'Submitted' });
      setSuccessMessage(`Ad-Hoc activity ${act.activity_code} submitted successfully for review.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit outside activity.');
    }
  };

  const handleSubmitPlanned = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedWorkPlanId) {
      setModalError('Please select an Approved Annual Work Plan project.');
      return;
    }

    if (!actualAchievement || !outcome) {
      setModalError('Actual Achievement and Outcome are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingReport) {
        await api.meReports.update(editingReport.id, {
          actual_start: actualStart,
          actual_duration: actualDuration,
          actual_end: actualEnd,
          actual_achievement: actualAchievement,
          percentage_completed: Number(percentageCompleted),
          outcome,
          milestone_achieved: milestoneAchieved,
          challenges,
          remarks,
          evidence,
          kpi_achieved: kpiAchieved,
          submission_status: submissionStatus
        });
      } else {
        await api.meReports.create({
          work_plan_id: selectedWorkPlanId,
          reporting_month: Number(reportingMonth),
          reporting_year: Number(reportingYear),
          actual_start: actualStart,
          actual_duration: actualDuration,
          actual_end: actualEnd,
          actual_achievement: actualAchievement,
          percentage_completed: Number(percentageCompleted),
          outcome,
          milestone_achieved: milestoneAchieved,
          challenges,
          remarks,
          evidence,
          kpi_achieved: kpiAchieved,
          submission_status: submissionStatus
        });
      }
      setIsModalOpen(false);
      setSuccessMessage(
        editingReport
          ? 'Monthly M&E report updated successfully.'
          : submissionStatus === 'Submitted'
          ? 'Monthly M&E report submitted for review.'
          : 'Draft monthly report saved.'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save Monthly M&E record.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved</span>
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Submitted</span>
          </span>
        );
      case 'Returned for Correction':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>Returned</span>
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <span>Draft</span>
          </span>
        );
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filtering for Planned Reports
  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.activity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.actual_achievement.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth = selectedMonthFilter === 'all' || String(r.reporting_month) === selectedMonthFilter;
    const matchesStatus = selectedStatusFilter === 'all' || r.submission_status === selectedStatusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  // Filtering for Outside Activities
  const filteredOutsideActivities = outsideActivities.filter(a => {
    const reason = a.reason_not_in_approved_plan || (a as any).reason_outside_plan || '';
    const achievement = a.actual_achievement || (a as any).output_achieved || '';
    const matchesSearch =
      a.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.activity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.toLowerCase().includes(searchQuery.toLowerCase());

    const m = a.reporting_month || (a as any).month_conducted || 1;
    const matchesMonth = selectedMonthFilter === 'all' || String(m) === selectedMonthFilter;
    const matchesStatus = selectedStatusFilter === 'all' || a.submission_status === selectedStatusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Monthly Monitoring & Evaluation (M&E)</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDeskOfficer
              ? `Department: ${user?.department_name}. Report and track approved projects and ad-hoc interventions.`
              : 'Institutional progress tracking, work plan deliverables, and ad-hoc intervention records.'}
          </p>
        </div>

        {canCreate && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-me-report"
              onClick={openCreatePlannedModal}
              disabled={approvedWorkPlans.length === 0}
              className="px-3.5 py-2 bg-[#006B3F] hover:bg-[#004D2A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              title={approvedWorkPlans.length === 0 ? 'Requires approved annual work plan project' : 'Log Approved Work Plan Monthly Report'}
            >
              <Plus className="w-4 h-4 text-[#F2C94C]" />
              <span>+ Approved Plan Report</span>
            </button>

            <button
              id="btn-add-outside-me-report"
              onClick={openCreateOutsideModal}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              title="Log activity executed outside approved work plan"
            >
              <AlertOctagon className="w-4 h-4 text-white" />
              <span>+ Ad-Hoc / Outside Plan Activity</span>
            </button>
          </div>
        )}

        {isDeskOfficer && !canCreate && (
          <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
            Stage is <strong>{systemSettings?.reporting_stage}</strong>. Monthly M&amp;E reporting opens during Monthly M&amp;E stage.
          </div>
        )}

        {isAdmin && (
          <div className="text-xs text-[#006B3F] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#006B3F]" />
            <span>Control &amp; Review Mode &bull; Official approvals in Reviews module</span>
          </div>
        )}
      </div>

      {/* Sub-Tab Switcher: Planned vs Outside Activities */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1">
        <button
          id="tab-me-planned"
          onClick={() => setActiveSubTab('planned')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
            activeSubTab === 'planned'
              ? 'border-[#006B3F] text-[#006B3F] bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Approved Work Plan Activities (Planned M&E)</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'planned' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {filteredReports.length}
          </span>
        </button>

        <button
          id="tab-me-outside"
          onClick={() => setActiveSubTab('outside')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
            activeSubTab === 'outside'
              ? 'border-amber-600 text-amber-800 bg-white shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-amber-600" />
          <span>Activities Outside Approved Work Plan / Ad-Hoc</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'outside' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {filteredOutsideActivities.length}
          </span>
          <span className="text-[10px] font-black text-red-700 bg-red-100 px-1.5 py-0.2 rounded border border-red-300">
            Compliance: NO
          </span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Specific Notices */}
      {activeSubTab === 'planned' && approvedWorkPlans.length === 0 && canCreate && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Notice: No Approved Annual Work Plans found for your department.</strong>
              <p className="mt-0.5 text-amber-800">
                Planned Monthly M&E records must link to an Approved Work Plan project.
                If you performed emergency or ad-hoc interventions, you can report them under the{' '}
                <strong className="underline cursor-pointer" onClick={() => setActiveSubTab('outside')}>
                  Activities Outside Approved Work Plan / Ad-Hoc
                </strong>{' '}
                tab.
              </p>
            </div>
          </div>
          <button
            onClick={openCreateOutsideModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs"
          >
            + Log Ad-Hoc Activity
          </button>
        </div>
      )}

      {activeSubTab === 'outside' && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Ad-Hoc & Emergency Intervention Accounting:</strong> Desk officers can record, edit, and submit activities conducted outside the approved annual work plan.
            Every ad-hoc activity is permanently accounted for with <span className="font-bold underline text-red-700">Work Plan Compliance = NO</span> for national audit transparency.
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-me"
              type="text"
              placeholder={activeSubTab === 'planned' ? 'Search code, achievement, project...' : 'Search ad-hoc activity, reason, code...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#006B3F] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
            <select
              id="select-filter-month"
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden"
            >
              <option value="all">All Reporting Months</option>
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1)}>
                  Month {i + 1}: {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <select
              id="select-filter-status"
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted (Pending Review)</option>
              <option value="Approved">Approved</option>
              <option value="Returned for Correction">Returned for Correction</option>
            </select>
          </div>

          {!isDeskOfficer && (
            <select
              id="select-filter-me-dept"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing:{' '}
          <strong className="text-gray-900">
            {activeSubTab === 'planned' ? filteredReports.length : filteredOutsideActivities.length}
          </strong>{' '}
          records
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: APPROVED WORK PLAN ACTIVITIES (PLANNED M&E) TABLE */}
      {/* ======================================================== */}
      {activeSubTab === 'planned' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading Monthly M&E reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-700">No Planned Monthly M&E Reports Found</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {canCreate
                  ? 'Click "+ Approved Plan Report" above to log monthly progress on approved work plans.'
                  : 'No monthly reports match the selected criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Activity Code & Project</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Progress %</th>
                    <th className="py-2.5 px-4 text-center">KPI (Quarter Met)</th>
                    <th className="py-2.5 px-4">Achievement / Milestone</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {filteredReports.map(rep => {
                    const isDraftOrReturned =
                      rep.submission_status === 'Draft' || rep.submission_status === 'Returned for Correction';
                    const canEditRow = isDeskOfficer && isDraftOrReturned;

                    return (
                      <tr key={rep.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">
                            {monthNames[rep.reporting_month - 1]} {rep.reporting_year}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">Month {rep.reporting_month}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-[#006B3F] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {rep.activity_code}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                              Planned
                            </span>
                          </div>
                          <div className="font-bold text-gray-900 truncate mt-1" title={rep.project_name}>
                            {rep.project_name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{rep.department_name}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#006B3F] h-full rounded-full"
                                style={{ width: `${rep.percentage_completed}%` }}
                              ></div>
                            </div>
                            <span className="font-mono font-bold text-gray-900">{rep.percentage_completed}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              rep.kpi_achieved === 'Yes'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                            title={`KPI: Target Achieved in Quarter: ${rep.kpi_achieved || 'No'}`}
                          >
                            {rep.kpi_achieved === 'Yes' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Yes</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5"></span>
                                <span>No</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-gray-900 truncate font-semibold" title={rep.actual_achievement}>
                            {rep.actual_achievement}
                          </div>
                          {rep.milestone_achieved && (
                            <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                              <span>Milestone:</span>
                              <span className="truncate">{rep.milestone_achieved}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(rep.submission_status)}
                          {rep.submission_status === 'Returned for Correction' && rep.review_comments && (
                            <div className="text-[10px] text-red-600 font-normal mt-0.5 line-clamp-1" title={rep.review_comments}>
                              Note: {rep.review_comments}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              id={`btn-view-me-${rep.id}`}
                              onClick={() => openDetailPlannedModal(rep)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {canEditRow && (
                              <button
                                id={`btn-edit-me-${rep.id}`}
                                onClick={() => openEditPlannedModal(rep)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors"
                                title="Edit Report"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isDeskOfficer && rep.submission_status === 'Draft' && (
                              <button
                                id={`btn-submit-me-${rep.id}`}
                                onClick={() => handleQuickSubmitPlanned(rep)}
                                className="px-2 py-1 bg-[#006B3F] hover:bg-[#004D2A] text-white rounded-md text-[11px] font-bold shadow-xs inline-flex items-center space-x-1"
                                title="Submit for M&E Review"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: ACTIVITIES OUTSIDE APPROVED WORK PLAN / AD-HOC TABLE */}
      {/* ======================================================================= */}
      {activeSubTab === 'outside' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading Ad-Hoc activities...</div>
          ) : filteredOutsideActivities.length === 0 ? (
            <div className="py-12 text-center">
              <AlertOctagon className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-700">No Outside Approved Plan Activities Recorded</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {canCreate
                  ? 'Click "+ Ad-Hoc / Outside Plan Activity" to report unplanned, emergency, or donor interventions.'
                  : 'Zero ad-hoc activities represents 100% adherence to the approved annual work plan.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Activity Name & Code</th>
                    <th className="py-2.5 px-4">Reason / Justification</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Progress %</th>
                    <th className="py-2.5 px-4 text-center">Compliance</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {filteredOutsideActivities.map(act => {
                    const m = act.reporting_month || (act as any).month_conducted || 1;
                    const y = act.reporting_year || (act as any).year || 2026;
                    const isDraftOrReturned =
                      act.submission_status === 'Draft' || act.submission_status === 'Returned for Correction';
                    const canEditRow = isDeskOfficer && isDraftOrReturned;

                    return (
                      <tr key={act.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">
                            {monthNames[m - 1]} {y}
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold">Ad-Hoc Track</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {act.activity_code}
                            </span>
                          </div>
                          <div className="font-bold text-gray-900 truncate mt-1" title={act.activity_name}>
                            {act.activity_name}
                          </div>
                          {act.target && (
                            <div className="text-[10px] text-gray-500 truncate mt-0.5">
                              Target: {act.target}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div
                            className="text-gray-800 text-[11px] line-clamp-2 bg-gray-50 p-1.5 rounded border border-gray-100"
                            title={act.reason_not_in_approved_plan || (act as any).reason_outside_plan}
                          >
                            {act.reason_not_in_approved_plan || (act as any).reason_outside_plan || 'Ad-hoc intervention'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{act.department_name}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-600 h-full rounded-full"
                                style={{ width: `${act.percentage_completed || 0}%` }}
                              ></div>
                            </div>
                            <span className="font-mono font-bold text-gray-900">{act.percentage_completed || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300">
                            NO (Ad-Hoc)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(act.submission_status)}
                          {act.submission_status === 'Returned for Correction' && act.review_comments && (
                            <div className="text-[10px] text-red-600 font-normal mt-0.5 line-clamp-1" title={act.review_comments}>
                              Note: {act.review_comments}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              id={`btn-view-out-${act.id}`}
                              onClick={() => openDetailOutsideModal(act)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {canEditRow && (
                              <button
                                id={`btn-edit-out-${act.id}`}
                                onClick={() => openEditOutsideModal(act)}
                                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md border border-amber-200 transition-colors"
                                title="Edit Ad-Hoc Activity"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isDeskOfficer && act.submission_status === 'Draft' && (
                              <button
                                id={`btn-submit-out-${act.id}`}
                                onClick={() => handleQuickSubmitOutside(act)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold shadow-xs inline-flex items-center space-x-1"
                                title="Submit for M&E Review"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PLANNED DETAIL MODAL                                     */}
      {/* ======================================================== */}
      {isDetailModalOpen && viewingReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#006B3F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {viewingReport.activity_code}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{viewingReport.project_name}</h3>
                <p className="text-xs text-gray-500">
                  Month {viewingReport.reporting_month} ({monthNames[viewingReport.reporting_month - 1]} {viewingReport.reporting_year}) &bull; Dept: <strong>{viewingReport.department_name}</strong>
                </p>
              </div>
              {getStatusBadge(viewingReport.submission_status)}
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-500 block mb-1">Target / Planned Objective:</span>
                <span className="font-semibold text-gray-800">{viewingReport.target || 'N/A'}</span>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                <span className="text-emerald-900 block mb-1 font-bold">Actual Achievement for the Month:</span>
                <span className="font-semibold text-emerald-950 leading-relaxed">{viewingReport.actual_achievement}</span>
              </div>

              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  viewingReport.kpi_achieved === 'Yes'
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Quarterly KPI Status: Target Achieved Completely
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Indicates if statutory target was achieved completely in this quarter
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center space-x-1 ${
                    viewingReport.kpi_achieved === 'Yes'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {viewingReport.kpi_achieved === 'Yes' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Yes — Achieved</span>
                    </>
                  ) : (
                    <span>No — Incomplete / Pending</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block mb-0.5">Cumulative Percentage Completed:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#006B3F] h-full rounded-full"
                        style={{ width: `${viewingReport.percentage_completed}%` }}
                      ></div>
                    </div>
                    <span className="font-mono font-bold text-gray-900">{viewingReport.percentage_completed}%</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block mb-0.5">Milestone Achieved:</span>
                  <span className="font-semibold text-gray-800">{viewingReport.milestone_achieved || 'None specified'}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-500 block mb-1">Statistical Outcome / Impact:</span>
                <span className="font-semibold text-gray-800">{viewingReport.outcome}</span>
              </div>

              {(viewingReport.challenges || viewingReport.remarks) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block mb-0.5">Challenges:</span>
                    <span className="text-gray-700">{viewingReport.challenges || 'None reported'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block mb-0.5">Remarks / Remedial Action:</span>
                    <span className="text-gray-700">{viewingReport.remarks || 'None'}</span>
                  </div>
                </div>
              )}

              {viewingReport.evidence && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <span className="text-blue-900 block mb-1 font-bold">Verification Reference / Evidence:</span>
                  <span className="text-blue-800 font-mono text-[11px]">{viewingReport.evidence}</span>
                </div>
              )}

              {viewingReport.review_comments && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-900 block mb-1 font-bold">Reviewer Feedback:</span>
                  <span className="text-red-800">{viewingReport.review_comments}</span>
                  {viewingReport.reviewed_by && (
                    <span className="block text-[10px] text-red-600 mt-1">
                      Reviewed by {viewingReport.reviewed_by} on {viewingReport.reviewed_at ? new Date(viewingReport.reviewed_at).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              {(isAdmin || (isDeskOfficer && (viewingReport.submission_status === 'Draft' || viewingReport.submission_status === 'Returned for Correction'))) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openEditPlannedModal(viewingReport);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs"
                >
                  Edit Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PLANNED CREATE / EDIT FORM MODAL                         */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
              <div>
                <span className="text-[11px] font-bold text-[#006B3F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Approved Work Plan Track
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">
                  {editingReport ? 'Edit Monthly M&E Report' : 'Log Monthly M&E Progress'}
                </h3>
                <p className="text-xs text-gray-500">
                  Submit monthly progress updates strictly against approved annual work plan projects.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitPlanned} className="space-y-3.5">
              {/* Select Approved Annual Work Plan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Approved Annual Work Plan Project *
                </label>
                <select
                  id="modal-me-workplan"
                  required
                  disabled={Boolean(editingReport)}
                  value={selectedWorkPlanId}
                  onChange={e => setSelectedWorkPlanId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white disabled:bg-gray-100"
                >
                  {approvedWorkPlans.map(wp => (
                    <option key={wp.id} value={wp.id}>
                      {wp.activity_code} - {wp.project_name} ({wp.department_name})
                    </option>
                  ))}
                </select>
                {selectedWorkPlanObject && (
                  <div className="mt-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Target: <strong className="text-gray-900">{selectedWorkPlanObject.target}</strong></span>
                      <span>Timeline: <strong>{selectedWorkPlanObject.timeline_start} to {selectedWorkPlanObject.timeline_end}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reporting Month & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reporting Month *
                  </label>
                  <select
                    id="modal-me-month"
                    required
                    value={reportingMonth}
                    onChange={e => setReportingMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                  >
                    {monthNames.map((m, i) => (
                      <option key={m} value={i + 1}>
                        Month {i + 1}: {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reporting Year *
                  </label>
                  <input
                    id="modal-me-year"
                    type="number"
                    required
                    value={reportingYear}
                    onChange={e => setReportingYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Actual Start & End */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Actual Start Date
                  </label>
                  <input
                    id="modal-me-actual-start"
                    type="date"
                    value={actualStart}
                    onChange={e => setActualStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Actual Duration
                  </label>
                  <input
                    id="modal-me-actual-duration"
                    type="text"
                    placeholder="e.g. 3 weeks"
                    value={actualDuration}
                    onChange={e => setActualDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Actual End Date
                  </label>
                  <input
                    id="modal-me-actual-end"
                    type="date"
                    value={actualEnd}
                    onChange={e => setActualEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Actual Achievement */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Actual Achievement for the Month *
                </label>
                <textarea
                  id="modal-me-achievement"
                  required
                  rows={2}
                  placeholder="Specific outputs, enumerations completed, reports drafted, or targets met this month..."
                  value={actualAchievement}
                  onChange={e => setActualAchievement(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                ></textarea>
              </div>

              {/* Progress & Milestone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cumulative Progress (0 - 100%) *
                  </label>
                  <input
                    id="modal-me-pct"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={percentageCompleted}
                    onChange={e => setPercentageCompleted(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Milestone Achieved
                  </label>
                  <input
                    id="modal-me-milestone"
                    type="text"
                    placeholder="e.g. Fieldwork Completed"
                    value={milestoneAchieved}
                    onChange={e => setMilestoneAchieved(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Statistical Outcome / Deliverable *
                </label>
                <input
                  id="modal-me-outcome"
                  type="text"
                  required
                  placeholder="Immediate statistical outcome, release, or institutional impact..."
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              {/* KPI Field - Dropdown with Yes or No */}
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="modal-me-kpi" className="block text-xs font-bold text-gray-800">
                    KPI Achieved Completely in this Quarter? *
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    kpiAchieved === 'Yes'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {kpiAchieved === 'Yes' ? 'Target Achieved (Yes)' : 'Target Incomplete (No)'}
                  </span>
                </div>
                <select
                  id="modal-me-kpi"
                  required
                  value={kpiAchieved}
                  onChange={e => setKpiAchieved(e.target.value as 'Yes' | 'No')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Select <strong>Yes</strong> if the performance target was achieved completely in this quarter, or <strong>No</strong> if ongoing or partially met.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Challenges Encountered
                  </label>
                  <input
                    id="modal-me-challenges"
                    type="text"
                    placeholder="e.g. Inaccessible enumeration areas"
                    value={challenges}
                    onChange={e => setChallenges(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks & Remedial Measures
                  </label>
                  <input
                    id="modal-me-remarks"
                    type="text"
                    placeholder="e.g. Mobilized additional supervisors"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Evidence / Verification Reference
                </label>
                <input
                  id="modal-me-evidence"
                  type="text"
                  placeholder="e.g. NLSS-Wave4-Summary-Tables.pdf / Memo Ref NBS/ESD/NLSS/04"
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Submission Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="subStatus"
                      value="Draft"
                      checked={submissionStatus === 'Draft'}
                      onChange={() => setSubmissionStatus('Draft')}
                      className="text-[#006B3F]"
                    />
                    <span>Save as Draft</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="subStatus"
                      value="Submitted"
                      checked={submissionStatus === 'Submitted'}
                      onChange={() => setSubmissionStatus('Submitted')}
                      className="text-[#006B3F]"
                    />
                    <span className="font-bold text-blue-800">Submit for Administrative M&E Review</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-me-report"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingReport
                    ? 'Save Changes'
                    : submissionStatus === 'Submitted'
                    ? 'Submit Monthly Report'
                    : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* OUTSIDE / AD-HOC CREATE & EDIT MODAL                     */}
      {/* ======================================================== */}
      <OutsideActivityModal
        isOpen={isOutsideModalOpen}
        onClose={() => setIsOutsideModalOpen(false)}
        onSaved={loadData}
        activityToEdit={editingOutsideActivity}
        departments={departments}
      />

      {/* ======================================================== */}
      {/* OUTSIDE / AD-HOC DETAIL MODAL                           */}
      {/* ======================================================== */}
      <OutsideActivityDetailModal
        isOpen={isOutsideDetailModalOpen}
        onClose={() => setIsOutsideDetailModalOpen(false)}
        activity={viewingOutsideActivity}
        canEdit={
          isAdmin ||
          (isDeskOfficer &&
            (viewingOutsideActivity?.submission_status === 'Draft' ||
              viewingOutsideActivity?.submission_status === 'Returned for Correction'))
        }
        onEdit={() => {
          if (viewingOutsideActivity) {
            openEditOutsideModal(viewingOutsideActivity);
          }
        }}
      />
    </div>
  );
};
