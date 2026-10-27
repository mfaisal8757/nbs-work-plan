import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { Department, AnnualWorkPlan, MonthlyMeReport, OutsideWorkPlanActivity, BudgetRecord } from '../types.js';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { NbsLogo } from './NbsLogo.js';

import { exportWorkPlansToExcel } from '../utils/workPlanExcelExport.js';

type ReportType =
  | 'annual-work-plans'
  | 'monthly-me-summary'
  | 'compliance-report'
  | 'outside-activities-report'
  | 'budget-execution-report';

export const ReportsView: React.FC = () => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();

  const [selectedReportType, setSelectedReportType] = useState<ReportType>('annual-work-plans');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [workPlans, setWorkPlans] = useState<AnnualWorkPlan[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyMeReport[]>([]);
  const [outsideActivities, setOutsideActivities] = useState<OutsideWorkPlanActivity[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [deptFilter, yearFilter, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Administrator Access Required</h3>
        <p className="text-xs text-gray-500 mt-1">
          Statutory Reports and Data Exports are strictly restricted to System Administrators.
        </p>
      </div>
    );
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wpRes, meRes, outRes, bRes, dRes] = await Promise.all([
        api.workPlans.getAll(deptFilter || undefined),
        api.meReports.getAll(deptFilter || undefined),
        api.outsideActivities.getAll(deptFilter || undefined),
        api.budgets.getAll(deptFilter || undefined),
        api.departments.getAll()
      ]);
      setWorkPlans(wpRes.work_plans.filter(wp => wp.work_plan_year === yearFilter));
      setMonthlyReports(meRes.me_reports.filter(r => r.reporting_year === yearFilter));
      setOutsideActivities(outRes.outside_activities.filter(a => a.reporting_year === yearFilter));
      setBudgets(bRes.budgets.filter(b => b.year === yearFilter));
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report records');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = async () => {
    if (workPlans.length === 0) {
      alert('No annual work plans found for the selected filter.');
      return;
    }
    setIsExportingExcel(true);
    try {
      const activeDept = departments.find(d => d.id === deptFilter);
      await exportWorkPlansToExcel(workPlans, {
        departmentName: activeDept ? activeDept.name : 'All_Departments',
        year: yearFilter,
        filenamePrefix: 'NBS_Statutory_Work_Plan_Report'
      });
    } catch (err: any) {
      alert('Failed to generate Excel export: ' + (err.message || 'Error'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (selectedReportType === 'annual-work-plans') {
      csvContent += 'Outcome,Alignment,Output,KPI,Reporting Frequency,Annual Performance Indicators,Type of Activities,Means of Verification,Baseline,Target,Annual Target,Total Budget,Funding Source,Responsible Officer,Division\n';
      workPlans.forEach(wp => {
        const outcomeVal = (wp.outcome || wp.objective || '').replace(/"/g, '""');
        const alignmentVal = (wp.alignment || 'National Development Plan').replace(/"/g, '""');
        const outputVal = (wp.output || wp.project_name || '').replace(/"/g, '""');
        const kpiVal = (wp.kpi || wp.annual_performance_indicator || '').replace(/"/g, '""');
        const freqVal = (wp.reporting_frequency || 'Quarterly').replace(/"/g, '""');
        const annualIndVal = (wp.annual_performance_indicators || wp.annual_performance_indicator || '').replace(/"/g, '""');
        const typeActVal = (wp.type_of_activities || 'Survey').replace(/"/g, '""');
        const meansVal = (wp.means_of_verification || 'Published Statistical Report').replace(/"/g, '""');
        const baselineVal = (wp.baseline || '—').replace(/"/g, '""');
        const targetVal = (wp.target || '').replace(/"/g, '""');
        const annualTargetVal = (wp.annual_target || wp.target || '').replace(/"/g, '""');
        const budgetVal = wp.total_budget || 0;
        const fundingVal = (wp.funding_source || 'Appropriation').replace(/"/g, '""');
        const officerVal = (wp.responsible_officer || wp.staff_responsible || 'Unassigned').replace(/"/g, '""');
        const divisionVal = (wp.division || '').replace(/"/g, '""');

        csvContent += `"${outcomeVal}","${alignmentVal}","${outputVal}","${kpiVal}","${freqVal}","${annualIndVal}","${typeActVal}","${meansVal}","${baselineVal}","${targetVal}","${annualTargetVal}",${budgetVal},"${fundingVal}","${officerVal}","${divisionVal}"\n`;
      });
    } else if (selectedReportType === 'monthly-me-summary') {
      csvContent += 'Reporting Period,Activity Code,Project Name,Department,Percentage Completed,KPI Target Achieved,Milestone,Actual Achievement,Status\n';
      monthlyReports.forEach(r => {
        csvContent += `"${monthNames[r.reporting_month - 1]} ${r.reporting_year}","${r.activity_code}","${r.project_name.replace(/"/g, '""')}","${r.department_name}",${r.percentage_completed}%,"${r.kpi_achieved || 'No'}","${(r.milestone_achieved || '').replace(/"/g, '""')}","${r.actual_achievement.replace(/"/g, '""')}","${r.submission_status}"\n`;
      });
    } else if (selectedReportType === 'outside-activities-report') {
      csvContent += 'Period,Activity Name,Department,Reason Not In Approved Plan,Work Plan Compliance,KPI Target Achieved,Status\n';
      outsideActivities.forEach(a => {
        csvContent += `"${monthNames[a.reporting_month - 1]} ${a.reporting_year}","${a.activity_name.replace(/"/g, '""')}","${a.department_name}","${a.reason_not_in_approved_plan.replace(/"/g, '""')}","NO","${a.kpi_achieved || 'No'}","${a.submission_status}"\n`;
      });
    } else if (selectedReportType === 'budget-execution-report') {
      csvContent += 'Activity Code,Project Name,Department,Year,Appropriation,Released,Utilized,Balance,Utilization %\n';
      budgets.forEach(b => {
        csvContent += `"${b.activity_code}","${b.project_name.replace(/"/g, '""')}","${b.department_name}",${b.year},${b.appropriation || b.total_budget},${b.released},${b.utilized},${b.balance},${b.budget_utilization_pct}%\n`;
      });
    } else {
      // Compliance report
      csvContent += 'Department,Approved Projects,Monthly Reports,Outside Plan Count,Work Plan Compliance %\n';
      departments.forEach(d => {
        const approved = workPlans.filter(w => w.department_id === d.id && w.status === 'Approved').length;
        const outside = outsideActivities.filter(a => a.department_id === d.id).length;
        const total = approved + outside;
        const pct = total > 0 ? Math.round((approved / total) * 100) : 100;
        csvContent += `"${d.name}",${approved},${monthlyReports.filter(m => m.department_id === d.id).length},${outside},${pct}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NBS_${selectedReportType}_${yearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto print:p-0 print:max-w-none">
      {/* Header (Hidden during browser print) */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Official Reports & Exports</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate and export statutory National Bureau of Statistics work plan, M&E, and budget statements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedReportType === 'annual-work-plans' && (
            <button
              id="btn-export-excel-report"
              onClick={handleExcelExport}
              disabled={isExportingExcel || workPlans.length === 0}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#006B3F] text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Export two-level grouped 15-column Excel sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isExportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>
          )}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Selectors and Filters (Hidden during print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-gray-200 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedReportType('annual-work-plans')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedReportType === 'annual-work-plans'
                ? 'bg-[#006B3F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annual Work Plan Status
          </button>
          <button
            onClick={() => setSelectedReportType('monthly-me-summary')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedReportType === 'monthly-me-summary'
                ? 'bg-[#006B3F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly M&E Performance
          </button>
          <button
            onClick={() => setSelectedReportType('compliance-report')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedReportType === 'compliance-report'
                ? 'bg-[#006B3F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Work Plan Compliance Matrix
          </button>
          <button
            onClick={() => setSelectedReportType('outside-activities-report')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedReportType === 'outside-activities-report'
                ? 'bg-[#006B3F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Outside Plan Activities
          </button>
          <button
            onClick={() => setSelectedReportType('budget-execution-report')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedReportType === 'budget-execution-report'
                ? 'bg-[#006B3F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Budget Execution Statement
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-gray-600">Year:</span>
            <select
              id="report-filter-year"
              value={yearFilter}
              onChange={e => setYearFilter(Number(e.target.value))}
              className="py-1 px-2.5 bg-gray-50 rounded-md border border-gray-200"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {!isDeskOfficer && (
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-600">Department:</span>
              <select
                id="report-filter-dept"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="py-1 px-2.5 bg-gray-50 rounded-md border border-gray-200"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Official Printable Report Card Layout */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs print:border-none print:shadow-none print:p-0">
        {/* Printable Official Letterhead */}
        <div className="text-center pb-4 border-b-2 border-[#006B3F] mb-6">
          <div className="flex justify-center mb-2">
            <NbsLogo variant="full" className="max-w-[240px] drop-shadow-xs" />
          </div>
          <h1 className="text-xs font-bold uppercase tracking-wider text-gray-700 mt-2">
            {selectedReportType === 'annual-work-plans' && `ANNUAL WORK PLAN STATUS REPORT (${yearFilter})`}
            {selectedReportType === 'monthly-me-summary' && `MONTHLY MONITORING & EVALUATION REPORT (${yearFilter})`}
            {selectedReportType === 'compliance-report' && `INSTITUTIONAL WORK PLAN COMPLIANCE MATRIX (${yearFilter})`}
            {selectedReportType === 'outside-activities-report' && `ACTIVITIES OUTSIDE APPROVED WORK PLAN REPORT (${yearFilter})`}
            {selectedReportType === 'budget-execution-report' && `DEPARTMENTAL BUDGET EXECUTION STATEMENT (${yearFilter})`}
          </h1>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Scope: {deptFilter ? `Department: ${departments.find(d => d.id === deptFilter)?.name}` : 'All NBS Departments'} &bull; Generated: {new Date().toLocaleString()} &bull; Officer: {user?.name}
          </p>
        </div>

        {/* Dynamic Report Content */}
        {selectedReportType === 'annual-work-plans' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-300">
                {/* Level 1 Grouped Headers */}
                <thead className="bg-[#006B3F] text-white font-bold text-center border-b border-emerald-900">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-emerald-700/60 uppercase">OUTCOME</th>
                    <th className="py-2 px-2.5 border-r border-emerald-700/60 uppercase">ALIGNMENT</th>
                    <th className="py-2 px-2.5 border-r border-emerald-700/60 uppercase">OUTPUT</th>
                    <th colSpan={8} className="py-2 px-2.5 border-r border-emerald-700/60 uppercase bg-[#005733]">
                      KEY ACTIVITIES & PERFORMANCE FRAMEWORK
                    </th>
                    <th colSpan={4} className="py-2 px-2.5 uppercase bg-[#004A2B]">
                      INPUT & ALLOCATION
                    </th>
                  </tr>
                </thead>
                {/* Level 2 Field Headers */}
                <thead className="bg-emerald-50/80 text-emerald-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-gray-200">Outcome</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Alignment</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Output</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">KPI</th>
                    <th className="py-2 px-2.5 border-r border-gray-200 text-center">Reporting Frequency</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Annual Performance Indicators</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Type of Activities</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Means of Verification</th>
                    <th className="py-2 px-2.5 border-r border-gray-200 text-center">Baseline</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Target</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Annual Target</th>
                    <th className="py-2 px-2.5 border-r border-gray-200 text-right">Total Budget</th>
                    <th className="py-2 px-2.5 border-r border-gray-200 text-center">Funding Source</th>
                    <th className="py-2 px-2.5 border-r border-gray-200">Responsible Officer</th>
                    <th className="py-2 px-2.5">Division</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {workPlans.map((wp, idx) => (
                    <tr key={wp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[200px]">
                        <div className="font-semibold text-gray-900">{wp.outcome || wp.objective || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{wp.activity_code}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-center whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {wp.alignment || 'National Development Plan'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 font-bold text-gray-900 max-w-[160px]">
                        {wp.output || wp.project_name}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[160px]">
                        <div className="line-clamp-2">{wp.kpi || wp.annual_performance_indicator || '—'}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-center whitespace-nowrap">
                        {wp.reporting_frequency || 'Quarterly'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[160px]">
                        <div className="line-clamp-2">{wp.annual_performance_indicators || wp.annual_performance_indicator || '—'}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 whitespace-nowrap">
                        {wp.type_of_activities || 'Survey'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[150px]">
                        <div className="line-clamp-2">{wp.means_of_verification || 'Published Statistical Report'}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-center whitespace-nowrap">
                        {wp.baseline || '—'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[140px]">
                        {wp.target || '—'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 max-w-[140px]">
                        {wp.annual_target || wp.target || '—'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 font-mono font-bold text-right whitespace-nowrap">
                        {formatCurrency(wp.total_budget)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-center whitespace-nowrap">
                        {wp.funding_source || 'Appropriation'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 whitespace-nowrap">
                        {wp.responsible_officer || wp.staff_responsible || 'Unassigned'}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {wp.division || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-[#006B3F]">
                  <tr>
                    <td colSpan={11} className="py-2.5 px-3 text-right">
                      TOTAL INSTITUTIONAL ALLOCATION:
                    </td>
                    <td className="py-2.5 px-2.5 font-mono text-right text-emerald-900 font-bold whitespace-nowrap">
                      {formatCurrency(workPlans.reduce((sum, wp) => sum + (Number(wp.total_budget) || 0), 0))}
                    </td>
                    <td colSpan={3} className="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'monthly-me-summary' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                  <tr>
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3">Activity Code & Project</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3 text-center">% Done</th>
                    <th className="py-2 px-3 text-center">KPI Met</th>
                    <th className="py-2 px-3">Actual Output & Milestone</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyReports.map(r => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">{monthNames[r.reporting_month - 1]}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] font-bold text-[#006B3F] block">{r.activity_code}</span>
                        <div className="font-bold text-gray-900">{r.project_name}</div>
                      </td>
                      <td className="py-2.5 px-3">{r.department_name}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{r.percentage_completed}%</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.kpi_achieved === 'Yes'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {r.kpi_achieved === 'Yes' ? 'Yes (Met)' : 'No (Pending)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <div>{r.actual_achievement}</div>
                        {r.milestone_achieved && <div className="text-[#006B3F] font-bold mt-0.5">Milestone: {r.milestone_achieved}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[11px] whitespace-nowrap">{r.submission_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'outside-activities-report' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                  <tr>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Activity Name</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Reason Not In Approved Plan</th>
                    <th className="py-2 px-3 text-center">Work Plan Compliance</th>
                    <th className="py-2 px-3 text-center">KPI Met</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {outsideActivities.map(a => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">{monthNames[a.reporting_month - 1]} {a.reporting_year}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{a.activity_name}</td>
                      <td className="py-2.5 px-3">{a.department_name}</td>
                      <td className="py-2.5 px-3 text-[11px]">{a.reason_not_in_approved_plan}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          NO
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          a.kpi_achieved === 'Yes'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {a.kpi_achieved === 'Yes' ? 'Yes (Met)' : 'No (Pending)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[11px]">{a.submission_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'budget-execution-report' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                  <tr>
                    <th className="py-2 px-3">Activity & Project</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3 text-right">Appropriation (NGN)</th>
                    <th className="py-2 px-3 text-right">Released (NGN)</th>
                    <th className="py-2 px-3 text-right">Utilized (NGN)</th>
                    <th className="py-2 px-3 text-right">Balance (NGN)</th>
                    <th className="py-2 px-3 text-center">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono">
                  {budgets.map(b => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-mono text-[10px] text-[#006B3F] font-bold block">{b.activity_code}</span>
                        <div className="font-bold text-gray-900">{b.project_name}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-gray-800">{b.department_name}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(b.appropriation || b.total_budget)}</td>
                      <td className="py-2.5 px-3 text-right text-blue-900">{formatCurrency(b.released)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-900">{formatCurrency(b.utilized)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-900 font-bold">{formatCurrency(b.balance)}</td>
                      <td className="py-2.5 px-3 text-center font-sans font-bold">{b.budget_utilization_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'compliance-report' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                  <tr>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3 text-center">Approved Work Plans</th>
                    <th className="py-2 px-3 text-center">Monthly M&E Filed</th>
                    <th className="py-2 px-3 text-center">Outside Plan Activities</th>
                    <th className="py-2 px-3 text-center">Work Plan Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map(d => {
                    const approved = workPlans.filter(w => w.department_id === d.id && w.status === 'Approved').length;
                    const monthly = monthlyReports.filter(m => m.department_id === d.id).length;
                    const outside = outsideActivities.filter(a => a.department_id === d.id).length;
                    const total = approved + outside;
                    const compPct = total > 0 ? Math.round((approved / total) * 100) : 100;

                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{d.name} ({d.code})</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{approved}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">{monthly}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700">{outside}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {compPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Signature & Authentication Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-2 text-xs text-gray-600 print:mt-16">
          <div>
            <div className="w-48 border-b border-gray-400 pb-1 mb-1 font-bold text-gray-800">
              {user?.name}
            </div>
            <p className="text-[10px] text-gray-500">Prepared by / Reporting Officer ({user?.role})</p>
          </div>

          <div className="text-right">
            <div className="w-48 border-b border-gray-400 pb-1 mb-1 font-bold text-gray-800 ml-auto">
              Statistician-General / Director
            </div>
            <p className="text-[10px] text-gray-500">Executive Approval & Verification</p>
          </div>
        </div>
      </div>
    </div>
  );
};
