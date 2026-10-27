import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import {
  AnnualWorkPlan,
  Department,
  WorkPlanStatus,
  AlignmentOption,
  ReportingFrequencyOption,
  FundingSourceOption,
  ActivityTypeOption
} from '../types.js';
import { exportWorkPlansToExcel } from '../utils/workPlanExcelExport.js';
import {
  CalendarRange,
  Plus,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  Send,
  Building2,
  DollarSign,
  FileSpreadsheet,
  Download,
  Target,
  Compass,
  Layers,
  ListChecks,
  Wallet,
  UserCheck,
  Check,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

const ALIGNMENT_OPTIONS: AlignmentOption[] = [
  'National Development Plan',
  'Renewed Hope Agenda',
  'NSDS/Statistical Master Plan',
  'SDGs Indicator Framework',
  'Africa Agenda 2063',
  'Ministerial Deliverables',
  'Statistics Act Mandate'
];

const REPORTING_FREQUENCY_OPTIONS: ReportingFrequencyOption[] = [
  'Daily',
  'Once-Off',
  'Monthly',
  'Quarterly',
  'Annually',
  'Bi-Annually'
];

const FUNDING_SOURCE_OPTIONS: FundingSourceOption[] = [
  'Appropriation',
  'Donor',
  'Others'
];

const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  'Survey',
  'Administrative',
  'Capital Project',
  'Regulatory',
  'Ad-hoc'
];

export const WorkPlanView: React.FC = () => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();

  const [workPlans, setWorkPlans] = useState<AnnualWorkPlan[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alignmentFilter, setAlignmentFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');
  const [fundingFilter, setFundingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AnnualWorkPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<AnnualWorkPlan | null>(null);

  // -------------------------------------------------------------
  // DIGITAL FORM STATE: Section by Section
  // -------------------------------------------------------------
  // 1. OUTCOME
  const [outcome, setOutcome] = useState('');

  // 2. ALIGNMENT
  const [alignment, setAlignment] = useState<AlignmentOption>('National Development Plan');

  // 3. OUTPUT
  const [output, setOutput] = useState('');

  // 4. KEY ACTIVITIES
  const [keyActivities, setKeyActivities] = useState('');
  const [kpi, setKpi] = useState('');
  const [reportingFrequency, setReportingFrequency] = useState<ReportingFrequencyOption>('Quarterly');
  const [annualPerformanceIndicators, setAnnualPerformanceIndicators] = useState('');
  const [typeOfActivities, setTypeOfActivities] = useState<ActivityTypeOption>('Survey');
  const [meansOfVerification, setMeansOfVerification] = useState('');
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');
  const [annualTarget, setAnnualTarget] = useState('');
  const [q1, setQ1] = useState(false);
  const [q2, setQ2] = useState(false);
  const [q3, setQ3] = useState(false);
  const [q4, setQ4] = useState(false);

  // 5. INPUT
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [fundingSource, setFundingSource] = useState<FundingSourceOption>('Appropriation');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [division, setDivision] = useState('');

  // Administrative
  const [workPlanYear, setWorkPlanYear] = useState<number>(new Date().getFullYear());
  const [targetStatus, setTargetStatus] = useState<'Draft' | 'Submitted'>('Draft');
  const [adminSelectedDeptId, setAdminSelectedDeptId] = useState<string>('');

  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreate =
    isDeskOfficer && systemSettings?.reporting_stage === 'Work Plan Compilation';

  useEffect(() => {
    loadData();
  }, [selectedDeptFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wpRes, dRes] = await Promise.all([
        api.workPlans.getAll(selectedDeptFilter || undefined),
        api.departments.getAll()
      ]);
      setWorkPlans(wpRes.work_plans);
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load annual work plans');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setOutcome('');
    setAlignment('National Development Plan');
    setOutput('');
    setKeyActivities('');
    setKpi('');
    setReportingFrequency('Quarterly');
    setAnnualPerformanceIndicators('');
    setTypeOfActivities('Survey');
    setMeansOfVerification('Published Statistical Report');
    setBaseline('');
    setTarget('');
    setAnnualTarget('');
    setQ1(false);
    setQ2(false);
    setQ3(false);
    setQ4(false);
    setTotalBudget(0);
    setFundingSource('Appropriation');
    setResponsibleOfficer(user?.name || '');
    setDivision('');
    setWorkPlanYear(systemSettings?.current_work_plan_year || new Date().getFullYear());
    setTargetStatus('Draft');
    setAdminSelectedDeptId(departments.length > 0 ? departments[0].id : '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: AnnualWorkPlan) => {
    setEditingPlan(plan);
    setOutcome(plan.outcome || plan.objective || '');
    setAlignment((plan.alignment as AlignmentOption) || 'National Development Plan');
    setOutput(plan.output || plan.project_name || '');
    setKeyActivities(plan.key_activities || plan.activity_description || '');
    setKpi(plan.kpi || plan.annual_performance_indicator || '');
    setReportingFrequency((plan.reporting_frequency as ReportingFrequencyOption) || 'Quarterly');
    setAnnualPerformanceIndicators(plan.annual_performance_indicators || plan.annual_performance_indicator || '');
    setTypeOfActivities((plan.type_of_activities as ActivityTypeOption) || 'Survey');
    setMeansOfVerification(plan.means_of_verification || 'Published Statistical Report');
    setBaseline(plan.baseline || '');
    setTarget(plan.target || '');
    setAnnualTarget(plan.annual_target || plan.target || '');
    setQ1(plan.timeline_q1);
    setQ2(plan.timeline_q2);
    setQ3(plan.timeline_q3);
    setQ4(plan.timeline_q4);
    setTotalBudget(plan.total_budget || 0);
    setFundingSource((plan.funding_source as FundingSourceOption) || 'Appropriation');
    setResponsibleOfficer(plan.responsible_officer || plan.staff_responsible || user?.name || '');
    setDivision(plan.division || '');
    setWorkPlanYear(plan.work_plan_year);
    setTargetStatus(plan.status === 'Returned for Correction' ? 'Submitted' : (plan.status as any));
    setAdminSelectedDeptId(plan.department_id);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openDetailModal = (plan: AnnualWorkPlan) => {
    setViewingPlan(plan);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!outcome.trim()) {
      setModalError('OUTCOME: Please provide the strategic Outcome statement.');
      return;
    }

    if (!output.trim()) {
      setModalError('OUTPUT: Please provide the tangible Output description.');
      return;
    }

    if (!q1 && !q2 && !q3 && !q4) {
      setModalError('KEY ACTIVITIES: Please select at least one implementation quarter (Q1, Q2, Q3, or Q4) under Timeline.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        outcome: outcome.trim(),
        alignment,
        output: output.trim(),
        project_name: output.trim(),
        key_activities: keyActivities.trim() || output.trim(),
        activity_description: keyActivities.trim() || output.trim(),
        objective: outcome.trim(),
        kpi: kpi.trim(),
        reporting_frequency: reportingFrequency,
        annual_performance_indicators: annualPerformanceIndicators.trim(),
        annual_performance_indicator: annualPerformanceIndicators.trim(),
        type_of_activities: typeOfActivities,
        means_of_verification: meansOfVerification.trim() || 'Published Statistical Report',
        baseline: baseline.trim(),
        target: target.trim(),
        annual_target: (annualTarget || target).trim(),
        timeline_q1: q1,
        timeline_q2: q2,
        timeline_q3: q3,
        timeline_q4: q4,
        total_budget: Number(totalBudget) || 0,
        funding_source: fundingSource,
        responsible_officer: responsibleOfficer.trim(),
        staff_responsible: responsibleOfficer.trim(),
        division: division.trim(),
        work_plan_year: Number(workPlanYear),
        status: targetStatus,
        department_id: isAdmin ? adminSelectedDeptId : user?.department_id
      };

      if (editingPlan) {
        await api.workPlans.update(editingPlan.id, payload);
      } else {
        await api.workPlans.create(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save annual work plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSubmit = async (plan: AnnualWorkPlan) => {
    if (!window.confirm(`Submit work plan "${plan.activity_code}" for Administrative Review?`)) return;
    try {
      await api.workPlans.update(plan.id, { status: 'Submitted' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit work plan');
    }
  };

  const handleExportExcel = async (subset?: AnnualWorkPlan[]) => {
    const plansToExport = subset || filtered;
    if (plansToExport.length === 0) {
      alert('No work plans available to export under current filters.');
      return;
    }

    setIsExporting(true);
    try {
      const activeDeptObj = departments.find(d => d.id === selectedDeptFilter);
      const deptLabel = isDeskOfficer
        ? user?.department_name
        : activeDeptObj
        ? activeDeptObj.name
        : 'All_Departments';

      await exportWorkPlansToExcel(plansToExport, {
        departmentName: deptLabel,
        year: systemSettings?.current_work_plan_year || new Date().getFullYear(),
        filenamePrefix: 'NBS_Statutory_Work_Plan'
      });
    } catch (err: any) {
      console.error('Failed to export to Excel:', err);
      alert('Failed to generate Excel export: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status: WorkPlanStatus) => {
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
            <span>Submitted (Pending Review)</span>
          </span>
        );
      case 'Returned for Correction':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>Returned for Correction</span>
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

  const filtered = useMemo(() => {
    return workPlans.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (p.output || p.project_name || '').toLowerCase().includes(q) ||
        (p.outcome || p.objective || '').toLowerCase().includes(q) ||
        (p.key_activities || p.activity_description || '').toLowerCase().includes(q) ||
        (p.kpi || '').toLowerCase().includes(q) ||
        p.activity_code.toLowerCase().includes(q) ||
        (p.department_name || '').toLowerCase().includes(q) ||
        (p.responsible_officer || p.staff_responsible || '').toLowerCase().includes(q) ||
        (p.division || '').toLowerCase().includes(q) ||
        (p.alignment || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesAlignment = alignmentFilter === 'all' || p.alignment === alignmentFilter;
      const matchesFrequency = frequencyFilter === 'all' || p.reporting_frequency === frequencyFilter;
      const matchesFunding = fundingFilter === 'all' || p.funding_source === fundingFilter;

      return matchesSearch && matchesStatus && matchesAlignment && matchesFrequency && matchesFunding;
    });
  }, [workPlans, searchQuery, statusFilter, alignmentFilter, frequencyFilter, fundingFilter]);

  const totalFilteredBudget = useMemo(() => {
    return filtered.reduce((acc, p) => acc + (Number(p.total_budget) || 0), 0);
  }, [filtered]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarRange className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Annual Work Plan Matrix & Digital Form</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDeskOfficer
              ? `Department: ${user?.department_name} — Outcome, Alignment, Output, Key Activities, and Input Formulation`
              : 'Institutional statutory work plan compilation, alignment tracking, and multi-format Excel reporting.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Export to Excel Button */}
          <button
            id="btn-export-excel-work-plan"
            onClick={() => handleExportExcel()}
            disabled={isExporting || filtered.length === 0}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006B3F] border border-emerald-300 hover:border-emerald-400 text-xs font-bold rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            title="Export exact two-level grouped 15-column Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
          </button>

          {canCreate && (
            <button
              id="btn-add-work-plan"
              onClick={openCreateModal}
              className="px-3.5 py-2 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#F2C94C]" />
              <span>New Work Plan Project</span>
            </button>
          )}

          {isDeskOfficer && !canCreate && (
            <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
              Stage: <strong>{systemSettings?.reporting_stage}</strong>. Submissions currently closed.
            </div>
          )}

          {isAdmin && (
            <div className="text-xs text-[#006B3F] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006B3F]" />
              <span>Control &amp; Review Mode</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="input-search-work-plans"
                type="text"
                placeholder="Search output, outcome, KPI, officer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#006B3F] focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
              <select
                id="select-filter-status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Returned for Correction">Returned for Correction</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            {/* Alignment Filter */}
            <select
              id="select-filter-alignment"
              value={alignmentFilter}
              onChange={e => setAlignmentFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden font-medium"
            >
              <option value="all">All Alignments</option>
              {ALIGNMENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Frequency Filter */}
            <select
              id="select-filter-frequency"
              value={frequencyFilter}
              onChange={e => setFrequencyFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden font-medium"
            >
              <option value="all">All Frequencies</option>
              {REPORTING_FREQUENCY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  Freq: {opt}
                </option>
              ))}
            </select>

            {/* Funding Filter */}
            <select
              id="select-filter-funding"
              value={fundingFilter}
              onChange={e => setFundingFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden font-medium"
            >
              <option value="all">All Funding Sources</option>
              {FUNDING_SOURCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  Fund: {opt}
                </option>
              ))}
            </select>

            {!isDeskOfficer && (
              <select
                id="select-filter-dept"
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden font-medium"
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

          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Showing <strong className="text-gray-900">{filtered.length}</strong> of{' '}
            <strong className="text-gray-700">{workPlans.length}</strong> &bull; Total Budget:{' '}
            <strong className="text-[#006B3F] font-mono">{formatCurrency(totalFilteredBudget)}</strong>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center space-y-2">
            <Clock className="w-6 h-6 text-gray-400 animate-spin" />
            <span>Loading statutory work plans...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarRange className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-700">No Annual Work Plans found</h4>
            <p className="text-xs text-gray-400 mt-1">
              {canCreate
                ? 'Click "New Work Plan Project" to initiate a new statutory entry.'
                : 'No work plan records match the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Activity Code & Year</th>
                  <th className="py-3 px-3.5">Outcome & Alignment</th>
                  <th className="py-3 px-3.5">Output</th>
                  <th className="py-3 px-3.5">KPI & Freq</th>
                  <th className="py-3 px-3.5">Target & Quarters</th>
                  <th className="py-3 px-3.5">Input & Funding</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map(plan => {
                  const canEdit =
                    isDeskOfficer &&
                    (plan.status === 'Draft' || plan.status === 'Returned for Correction') &&
                    systemSettings?.reporting_stage === 'Work Plan Compilation';

                  const outputName = plan.output || plan.project_name;
                  const outcomeText = plan.outcome || plan.objective;
                  const activitiesText = plan.key_activities || plan.activity_description;
                  const kpiText = plan.kpi || plan.annual_performance_indicator;
                  const alignmentText = plan.alignment || 'National Development Plan';
                  const freqText = plan.reporting_frequency || 'Quarterly';
                  const fundingText = plan.funding_source || 'Appropriation';
                  const officerText = plan.responsible_officer || plan.staff_responsible;

                  return (
                    <tr key={plan.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* Code & Year */}
                      <td className="py-3 px-3.5 whitespace-nowrap align-top">
                        <span className="font-mono font-bold text-xs text-[#006B3F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          {plan.activity_code}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1 font-sans">
                          Year: <strong>{plan.work_plan_year}</strong>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium truncate max-w-[130px]">
                          {plan.department_name}
                        </div>
                      </td>

                      {/* Outcome & Alignment */}
                      <td className="py-3 px-3.5 max-w-xs align-top">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-1">
                          {alignmentText}
                        </span>
                        <p className="text-gray-900 font-medium text-xs line-clamp-2" title={outcomeText}>
                          {outcomeText || '—'}
                        </p>
                      </td>

                      {/* Output */}
                      <td className="py-3 px-3.5 max-w-xs align-top">
                        <div className="font-bold text-gray-900 text-xs">{outputName}</div>
                        {activitiesText && activitiesText !== outputName && (
                          <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5" title={activitiesText}>
                            {activitiesText}
                          </div>
                        )}
                        {plan.type_of_activities && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Type: <span className="text-gray-600 font-medium">{plan.type_of_activities}</span>
                          </div>
                        )}
                      </td>

                      {/* KPI & Reporting Frequency */}
                      <td className="py-3 px-3.5 max-w-[190px] align-top">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-1">
                          Freq: {freqText}
                        </span>
                        <div className="text-xs text-gray-800 line-clamp-2" title={kpiText}>
                          {kpiText || '—'}
                        </div>
                        {plan.annual_performance_indicators && (
                          <div className="text-[10px] text-emerald-700 line-clamp-1 mt-0.5">
                            Target: {plan.annual_performance_indicators}
                          </div>
                        )}
                      </td>

                      {/* Target & Quarters */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="text-xs text-gray-900 font-medium line-clamp-1" title={plan.annual_target || plan.target}>
                          {plan.annual_target || plan.target || '—'}
                        </div>
                        <div className="flex space-x-1 mt-1.5">
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              plan.timeline_q1 ? 'bg-[#006B3F] text-white' : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            Q1
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              plan.timeline_q2 ? 'bg-[#006B3F] text-white' : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            Q2
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              plan.timeline_q3 ? 'bg-[#006B3F] text-white' : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            Q3
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              plan.timeline_q4 ? 'bg-[#006B3F] text-white' : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            Q4
                          </span>
                        </div>
                      </td>

                      {/* Input (Budget & Funding Source & Officer) */}
                      <td className="py-3 px-3.5 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-gray-900 text-xs">
                          {formatCurrency(plan.total_budget)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Source: <strong className="text-gray-700">{fundingText}</strong>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[140px] mt-0.5">
                          Officer: <span className="text-gray-700 font-medium">{officerText || 'Unassigned'}</span>
                        </div>
                        {plan.division && (
                          <div className="text-[10px] text-emerald-800 font-semibold truncate max-w-[140px] mt-0.5">
                            Div: {plan.division}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap align-top">
                        {getStatusBadge(plan.status)}
                        {plan.review_comments && plan.status === 'Returned for Correction' && (
                          <div className="text-[10px] text-red-700 bg-red-50 p-1 rounded-sm mt-1 max-w-[140px] truncate border border-red-200">
                            {plan.review_comments}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap align-top space-x-1.5">
                        <button
                          id={`btn-view-wp-${plan.id}`}
                          onClick={() => openDetailModal(plan)}
                          title="View Digital Form Matrix"
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            id={`btn-edit-wp-${plan.id}`}
                            onClick={() => openEditModal(plan)}
                            title="Edit Digital Form"
                            className="p-1.5 text-[#006B3F] hover:bg-emerald-50 rounded-md border border-emerald-300 transition-colors inline-flex items-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isDeskOfficer && (plan.status === 'Draft' || plan.status === 'Returned for Correction') && (
                          <button
                            id={`btn-submit-wp-${plan.id}`}
                            onClick={() => handleQuickSubmit(plan)}
                            title="Submit for Administrative Approval"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold inline-flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Submit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* DIGITAL FORM MODAL: CREATE & EDIT */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    DIGITAL WORK PLAN FORM
                  </span>
                  {editingPlan && (
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {editingPlan.activity_code}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {editingPlan ? `Edit Work Plan: ${editingPlan.activity_code}` : 'New Annual Work Plan Submission'}
                </h3>
                <p className="text-xs text-gray-500">
                  Complete each statutory section according to the National Bureau of Statistics framework.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department selection for Admin only; automatic for Desk Officer */}
              {isAdmin && !editingPlan && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Target Department *
                  </label>
                  <select
                    id="modal-wp-dept"
                    required
                    value={adminSelectedDeptId}
                    onChange={e => setAdminSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* SECTION 1: OUTCOME */}
              {/* ------------------------------------------------------- */}
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-[#006B3F]" />
                  <h4 className="text-xs font-bold text-[#006B3F] tracking-wide uppercase">
                    OUTCOME
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Outcome Statement *
                  </label>
                  <textarea
                    id="modal-wp-outcome"
                    required
                    rows={2}
                    placeholder="Describe the high-level sectoral, institutional, or developmental change resulting from this intervention..."
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                  ></textarea>
                  <span className="text-[10px] text-gray-500">
                    Articulate the primary impact on statistical coordination, policy formulation, or socioeconomic indicators.
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 2: ALIGNMENT */}
              {/* ------------------------------------------------------- */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-amber-800" />
                  <h4 className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                    ALIGNMENT
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Policy Alignment Framework *
                  </label>
                  <select
                    id="modal-wp-alignment"
                    required
                    value={alignment}
                    onChange={e => setAlignment(e.target.value as AlignmentOption)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium text-gray-900"
                  >
                    {ALIGNMENT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500">
                    Mandatory linkage to national, regional, or statutory strategic agenda.
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 3: OUTPUT */}
              {/* ------------------------------------------------------- */}
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-800" />
                  <h4 className="text-xs font-bold text-blue-900 tracking-wide uppercase">
                    OUTPUT
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Output Deliverable *
                  </label>
                  <input
                    id="modal-wp-output"
                    type="text"
                    required
                    placeholder="e.g. Consumer Price Index (CPI) Monthly Report / NLSS Wave 5 Dataset"
                    value={output}
                    onChange={e => setOutput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium text-gray-900"
                  />
                  <span className="text-[10px] text-gray-500">
                    The concrete statistical product, survey, bulletin, infrastructure, or capacity service produced.
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 4: KEY ACTIVITIES */}
              {/* ------------------------------------------------------- */}
              <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-200 space-y-3.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <ListChecks className="w-4 h-4 text-purple-800" />
                    <h4 className="text-xs font-bold text-purple-900 tracking-wide uppercase">
                      KEY ACTIVITIES
                    </h4>
                  </div>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Performance framework, operational category, targets, and quarterly implementation schedule.
                  </p>
                </div>

                {/* KPI & Reporting Frequency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Key Performance Indicators (KPI) *
                    </label>
                    <input
                      id="modal-wp-kpi"
                      type="text"
                      required
                      placeholder="e.g. 100% timely monthly data compilation and release"
                      value={kpi}
                      onChange={e => setKpi(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Reporting Frequency *
                    </label>
                    <select
                      id="modal-wp-reporting-freq"
                      required
                      value={reportingFrequency}
                      onChange={e => setReportingFrequency(e.target.value as ReportingFrequencyOption)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
                    >
                      {REPORTING_FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Annual Performance Indicators & Type of Activities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Annual Performance Indicators
                    </label>
                    <input
                      id="modal-wp-annual-indicators"
                      type="text"
                      placeholder="e.g. 12 Consecutive Monthly CPI Bulletins Published"
                      value={annualPerformanceIndicators}
                      onChange={e => setAnnualPerformanceIndicators(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Type of Activity *
                    </label>
                    <select
                      id="modal-wp-type-of-activities"
                      required
                      value={typeOfActivities}
                      onChange={e => setTypeOfActivities(e.target.value as ActivityTypeOption)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium text-gray-900"
                    >
                      {ACTIVITY_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Means of Verification & Baseline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Means of Verification
                    </label>
                    <input
                      id="modal-wp-verification"
                      type="text"
                      placeholder="e.g. Published Bulletin, Survey Portal, Field Register"
                      value={meansOfVerification}
                      onChange={e => setMeansOfVerification(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Baseline
                    </label>
                    <input
                      id="modal-wp-baseline"
                      type="text"
                      placeholder="e.g. 12 Reports in 2025 / 0% automated"
                      value={baseline}
                      onChange={e => setBaseline(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                {/* Target & Annual Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Target (Quarterly/Periodic)
                    </label>
                    <input
                      id="modal-wp-target"
                      type="text"
                      placeholder="e.g. Publish 3 bulletins per quarter across 36 states"
                      value={target}
                      onChange={e => setTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Annual Target
                    </label>
                    <input
                      id="modal-wp-annual-target"
                      type="text"
                      placeholder="e.g. 12 Monthly Bulletins & 1 Annual Compendium"
                      value={annualTarget}
                      onChange={e => setAnnualTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                {/* Timeline / Quarter — Q1, Q2, Q3, Q4 */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Timeline / Quarter (Select all applicable quarters) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <label
                      className={`p-2.5 rounded-lg border text-center cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                        q1
                          ? 'bg-[#006B3F] border-[#006B3F] text-white font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={q1}
                        onChange={e => setQ1(e.target.checked)}
                        className="rounded text-[#006B3F] focus:ring-0"
                      />
                      <span className="text-xs">Q1 (Jan - Mar)</span>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border text-center cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                        q2
                          ? 'bg-[#006B3F] border-[#006B3F] text-white font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={q2}
                        onChange={e => setQ2(e.target.checked)}
                        className="rounded text-[#006B3F] focus:ring-0"
                      />
                      <span className="text-xs">Q2 (Apr - Jun)</span>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border text-center cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                        q3
                          ? 'bg-[#006B3F] border-[#006B3F] text-white font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={q3}
                        onChange={e => setQ3(e.target.checked)}
                        className="rounded text-[#006B3F] focus:ring-0"
                      />
                      <span className="text-xs">Q3 (Jul - Sep)</span>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border text-center cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                        q4
                          ? 'bg-[#006B3F] border-[#006B3F] text-white font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={q4}
                        onChange={e => setQ4(e.target.checked)}
                        className="rounded text-[#006B3F] focus:ring-0"
                      />
                      <span className="text-xs">Q4 (Oct - Dec)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 5: INPUT */}
              {/* ------------------------------------------------------- */}
              <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-200 space-y-3.5">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-teal-800" />
                  <h4 className="text-xs font-bold text-teal-900 tracking-wide uppercase">
                    INPUT
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Total Budget (NGN) *
                    </label>
                    <input
                      id="modal-wp-budget"
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={totalBudget}
                      onChange={e => setTotalBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white text-gray-900"
                    />
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Preview: {formatCurrency(totalBudget)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Funding Source *
                    </label>
                    <select
                      id="modal-wp-funding-source"
                      required
                      value={fundingSource}
                      onChange={e => setFundingSource(e.target.value as FundingSourceOption)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
                    >
                      {FUNDING_SOURCE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Responsible Officer *
                    </label>
                    <input
                      id="modal-wp-officer"
                      type="text"
                      required
                      placeholder="e.g. Desk Officer / Unit Lead"
                      value={responsibleOfficer}
                      onChange={e => setResponsibleOfficer(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Division
                    </label>
                    <input
                      id="modal-wp-division"
                      type="text"
                      placeholder="e.g. Price Statistics Division"
                      value={division}
                      onChange={e => setDivision(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Work Plan Fiscal Year *
                    </label>
                    <input
                      id="modal-wp-year"
                      type="number"
                      required
                      value={workPlanYear}
                      onChange={e => setWorkPlanYear(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Submission State
                    </label>
                    <div className="flex items-center space-x-4 pt-2">
                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="targetStatus"
                          value="Draft"
                          checked={targetStatus === 'Draft'}
                          onChange={() => setTargetStatus('Draft')}
                          className="text-[#006B3F]"
                        />
                        <span>Draft</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="targetStatus"
                          value="Submitted"
                          checked={targetStatus === 'Submitted'}
                          onChange={() => setTargetStatus('Submitted')}
                          className="text-[#006B3F]"
                        />
                        <span className="font-bold text-blue-700">Submit for Approval</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-work-plan"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-[#F2C94C]" />
                  <span>{isSaving ? 'Compiling...' : editingPlan ? 'Save Changes' : 'Save Work Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* DETAIL MODAL: READ-ONLY STRUCTURED MATRIX VIEW */}
      {/* ============================================================= */}
      {isDetailModalOpen && viewingPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-3 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-[#006B3F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {viewingPlan.activity_code}
                  </span>
                  <span className="text-xs text-gray-500">Fiscal Year: {viewingPlan.work_plan_year}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {viewingPlan.output || viewingPlan.project_name}
                </h3>
                <p className="text-xs text-gray-500">
                  Department: <strong>{viewingPlan.department_name}</strong>
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                {getStatusBadge(viewingPlan.status)}
                <button
                  onClick={() => handleExportExcel([viewingPlan])}
                  className="mt-1 text-[11px] font-bold text-[#006B3F] hover:text-[#004D2A] flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export this entry</span>
                </button>
              </div>
            </div>

            {/* Structured Card Grid */}
            <div className="space-y-4 text-xs">
              {/* 1. OUTCOME */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-[#006B3F] uppercase tracking-wider block mb-1">
                  1. OUTCOME
                </span>
                <p className="text-gray-900 font-medium">
                  {viewingPlan.outcome || viewingPlan.objective || '—'}
                </p>
              </div>

              {/* 2. ALIGNMENT */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                  2. ALIGNMENT
                </span>
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {viewingPlan.alignment || 'National Development Plan'}
                </span>
              </div>

              {/* 3. OUTPUT */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  3. OUTPUT
                </span>
                <p className="text-gray-900 font-bold text-sm">
                  {viewingPlan.output || viewingPlan.project_name}
                </p>
              </div>

              {/* 4. KEY ACTIVITIES */}
              <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-100 space-y-3">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                  4. KEY ACTIVITIES (PERFORMANCE FRAMEWORK & TIMELINE)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Key Performance Indicators (KPI)</span>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {viewingPlan.kpi || viewingPlan.annual_performance_indicator || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Reporting Frequency</span>
                    <p className="text-gray-900 font-bold mt-0.5">
                      {viewingPlan.reporting_frequency || 'Quarterly'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-purple-100">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Annual Performance Indicators</span>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {viewingPlan.annual_performance_indicators || viewingPlan.annual_performance_indicator || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Type of Activities</span>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {viewingPlan.type_of_activities || 'Survey'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-purple-100">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Means of Verification</span>
                    <p className="text-gray-900 mt-0.5">
                      {viewingPlan.means_of_verification || 'Published Statistical Report'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Baseline</span>
                    <p className="text-gray-900 mt-0.5">{viewingPlan.baseline || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-purple-100">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Target</span>
                    <p className="text-gray-900 font-medium mt-0.5">{viewingPlan.target || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Annual Target</span>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {viewingPlan.annual_target || viewingPlan.target || '—'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">
                    Timeline / Quarter Implementation
                  </span>
                  <div className="flex space-x-1.5">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
                      const active = [
                        viewingPlan.timeline_q1,
                        viewingPlan.timeline_q2,
                        viewingPlan.timeline_q3,
                        viewingPlan.timeline_q4
                      ][i];
                      return (
                        <span
                          key={q}
                          className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                            active
                              ? 'bg-[#006B3F] text-white shadow-2xs'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {q}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. INPUT */}
              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 space-y-3">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                  5. INPUT & FINANCIAL ALLOCATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Total Budget</span>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-0.5">
                      {formatCurrency(viewingPlan.total_budget)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Funding Source</span>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {viewingPlan.funding_source || 'Appropriation'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Responsible Officer</span>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">
                      {viewingPlan.responsible_officer || viewingPlan.staff_responsible || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Division</span>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">
                      {viewingPlan.division || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              {viewingPlan.review_comments && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <h4 className="font-bold text-[11px] text-amber-800">Administrative Review Decision Notes:</h4>
                  <p className="mt-0.5 text-xs">{viewingPlan.review_comments}</p>
                  {viewingPlan.reviewed_by && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      Reviewed by: <strong>{viewingPlan.reviewed_by}</strong> on{' '}
                      {new Date(viewingPlan.reviewed_at!).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleExportExcel([viewingPlan])}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006B3F] border border-emerald-300 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export This Record</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
