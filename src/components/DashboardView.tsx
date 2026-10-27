import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { DashboardStats } from '../types.js';
import {
  Building2,
  Users,
  CalendarRange,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  Wallet,
  TrendingUp,
  Percent,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  FolderKanban,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { DepartmentTrendsComparison } from './DepartmentTrendsComparison.js';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeptActivitiesModal, setShowDeptActivitiesModal] = useState<boolean>(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Administrator Access Required</h3>
        <p className="text-xs text-gray-500 mt-1">
          The Executive Dashboard is strictly restricted to System Administrators. Departmental Desk Officers report through the Annual Work Plan and Monthly M&E modules.
        </p>
      </div>
    );
  }

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // For Desk Officer, backend automatically filters by user.department_id!
      const res = await api.dashboards.getStats();
      setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
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

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#006B3F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500 font-medium">Loading live database figures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with greeting and stage notice */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900">
              {isAdmin && 'Executive Administration Dashboard'}
              {isDeskOfficer && `${user?.department_name || 'Departmental'} Performance Dashboard`}
              {isManagement && 'Executive Management Performance Dashboard'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-[#006B3F] border border-emerald-200">
              Live Database
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isDeskOfficer
              ? `Authorized Desk Officer: ${user?.name} (${user?.department_name}). Data strictly partitioned.`
              : `Logged in as ${user?.name} &bull; ${user?.role}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-right text-xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Reporting Stage</span>
            <span className="font-bold text-[#006B3F]">{systemSettings?.reporting_stage}</span>
          </div>
        </div>
      </div>

      {/* Pending Reviews Warning (Admin Only) */}
      {isAdmin && stats && stats.pending_reviews_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Action Required: {stats.pending_reviews_count} Submission{stats.pending_reviews_count > 1 ? 's' : ''} Awaiting Approval
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Work plans, monthly M&E reports, and outside-plan submissions require administrative review.
              </p>
            </div>
          </div>
          <button
            id="btn-dash-review-queue"
            onClick={() => onNavigateTab('reviews')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
          >
            <span>Open Review Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Returned Reports Notice (Desk Officer Only) */}
      {isDeskOfficer && stats && stats.returned_reports_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-900">
                Attention: {stats.returned_reports_count} Submission{stats.returned_reports_count > 1 ? 's' : ''} Returned for Correction
              </h4>
              <p className="text-[11px] text-red-700 mt-0.5">
                Please check review comments and re-submit with necessary amendments.
              </p>
            </div>
          </div>
          <button
            id="btn-dash-check-returned"
            onClick={() => onNavigateTab('work-plans')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            View Returned Items
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SYSTEM PERFORMANCE METRICS SUMMARY CARDS SECTION        */}
      {/* ======================================================== */}
      {stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006B3F] inline-block"></span>
              <span>Current System Performance Metrics</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Performance Year: {systemSettings?.active_reporting_year || stats.active_year || 2026}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Average % */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-[#006B3F]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <span>Average %</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    System Score
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.overall_system_average_pct ?? stats.performance_summary?.average_progress_pct ?? 0}%
                  </div>
                  <span className="text-xs font-medium text-gray-500">overall system performance</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006B3F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, stats.overall_system_average_pct ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 block">
                    Composite average calculated across all statistical pillars
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: KPI Quarterly Achievement Rate % */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span>Quarterly KPI Rate</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Quarter Target Met
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-emerald-900 tracking-tight">
                    {stats.kpi_stats?.achieved_rate_pct ?? (stats.kpi_stats?.total_evaluated ? Math.round((stats.kpi_stats.achieved_count / stats.kpi_stats.total_evaluated) * 100) : 0)}%
                  </div>
                  <span className="text-xs font-medium text-gray-500">fully completed</span>
                </div>
                <div className="mt-3 text-[11px] text-gray-600 flex items-center justify-between pt-2 border-t border-gray-100">
                  <span>
                    <strong className="text-emerald-700">{stats.kpi_stats?.achieved_count ?? 0}</strong> Yes (Met)
                  </span>
                  <span className="text-gray-300">&bull;</span>
                  <span>
                    <strong className="text-amber-700">{stats.kpi_stats?.not_achieved_count ?? 0}</strong> No (Pending)
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Budget Utilization % */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                      <Percent className="w-4 h-4" />
                    </span>
                    <span>Budget Utilization %</span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    Month {stats.current_reporting_month || systemSettings?.active_reporting_month || 1}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.current_monthly_budget_utilization_pct ?? stats.budget_performance?.utilization_pct ?? 0}%
                  </div>
                  <span className="text-xs font-medium text-gray-500">capital released</span>
                </div>
                <div className="mt-3 text-[11px] text-gray-500 pt-2 border-t border-gray-100 truncate">
                  Released: <strong className="text-gray-900">{formatCurrency(stats.budget_performance?.total_released ?? 0)}</strong>
                </div>
              </div>
            </div>

            {/* Card 4: Monitoring Submission Rate */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-[#006B3F]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                      <ClipboardCheck className="w-4 h-4" />
                    </span>
                    <span>M&E Submission Rate</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Compliance
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.work_plan_projects_count > 0
                      ? Math.min(100, Math.round(((stats.performance_summary?.total_reports_count ?? 0) / stats.work_plan_projects_count) * 100))
                      : 100}%
                  </div>
                  <span className="text-xs font-medium text-gray-500">filing compliance</span>
                </div>
                <div className="mt-3 text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span><strong className="text-gray-900">{stats.performance_summary?.approved_reports_count ?? 0}</strong> approved</span>
                  <span className="text-amber-600 font-bold">{stats.pending_me_reports_count ?? 0} pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EXECUTIVE SUMMARY CARDS (Total activities by departments, pending M&E submissions, current monthly budget utilization percentage) */}
      {isAdmin && stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006B3F] inline-block"></span>
              <span>Executive Operations & Monitoring Summary</span>
            </h3>
            {stats.activities_by_department && stats.activities_by_department.length > 0 && (
              <button
                id="btn-open-activities-by-dept-top"
                onClick={() => setShowDeptActivitiesModal(true)}
                className="text-xs font-bold text-[#006B3F] hover:text-[#004D2A] flex items-center space-x-1 transition-colors"
              >
                <span>Department Activities Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: Total Number of Activities by Departments */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-[#006B3F]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                      <FolderKanban className="w-4 h-4" />
                    </span>
                    <span>Total Activities by Departments</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {stats.departments_count} Depts
                  </span>
                </div>

                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.total_activities_count ?? ((stats.work_plan_projects_count ?? 0) + (stats.outside_activities_count ?? 0))}
                  </div>
                  <span className="text-xs font-medium text-gray-500">total tracked activities</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                    <span>{stats.work_plan_projects_count} Approved Plan</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold border border-amber-100">
                    <span>{stats.outside_activities_count} Outside Plan (Ad-Hoc)</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  id="btn-card-view-dept-breakdown"
                  onClick={() => setShowDeptActivitiesModal(true)}
                  className="text-xs font-bold text-[#006B3F] hover:underline flex items-center space-x-1"
                >
                  <span>View All Department Tallies</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-gray-400">Live Breakdown</span>
              </div>
            </div>

            {/* CARD 2: Pending M&E Submissions */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                      <ClipboardCheck className="w-4 h-4" />
                    </span>
                    <span>Pending M&E Submissions</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      (stats.pending_me_reports_count ?? 0) > 0
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {(stats.pending_me_reports_count ?? 0) > 0 ? 'Action Required' : 'All Clear'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.pending_me_reports_count ?? 0}
                  </div>
                  <span className="text-xs font-medium text-gray-500">monthly reports awaiting approval</span>
                </div>

                <p className="mt-2 text-[11px] text-gray-500">
                  {(stats.pending_me_reports_count ?? 0) > 0
                    ? `Monthly progress submissions filed by desk officers awaiting sign-off.`
                    : `All monthly M&E filings are reviewed and fully up to date.`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  id="btn-card-goto-me-reviews"
                  onClick={() => onNavigateTab('reviews')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 hover:underline"
                >
                  <span>Open Review Queue</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-gray-400">
                  {stats.pending_reviews_count ?? 0} total reviews
                </span>
              </div>
            </div>

            {/* CARD 3: Current Monthly Budget Utilization Percentage */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <span className="p-1.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                      <Percent className="w-4 h-4" />
                    </span>
                    <span>Monthly Budget Utilization</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Month {stats.current_reporting_month || systemSettings?.active_reporting_month || 1}: {stats.current_reporting_month_name || 'Current'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline space-x-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    {stats.current_monthly_budget_utilization_pct ?? stats.budget_performance?.utilization_pct ?? 0}%
                  </div>
                  <span className="text-xs font-medium text-gray-500">utilization of capital released</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006B3F] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, stats.current_monthly_budget_utilization_pct ?? stats.budget_performance?.utilization_pct ?? 0)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Utilized: <strong className="text-gray-900">{formatCurrency(stats.budget_performance?.total_utilized ?? 0)}</strong></span>
                    <span>Released: <strong className="text-gray-900">{formatCurrency(stats.budget_performance?.total_released ?? 0)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  id="btn-card-view-budget-execution"
                  onClick={() => onNavigateTab('budget-performance')}
                  className="text-xs font-bold text-[#006B3F] hover:underline flex items-center space-x-1"
                >
                  <span>View Capital Execution</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-gray-400">
                  Bal: {formatCurrency(stats.budget_performance?.total_balance ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIMARY STAT COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Departments</span>
                <Building2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats?.departments_count ?? 0}</div>
              <p className="text-[10px] text-gray-400 mt-1">Configured in system</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">System Users</span>
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats?.users_count ?? 0}</div>
              <p className="text-[10px] text-gray-400 mt-1">Desk officers & viewers</p>
            </div>
          </>
        )}

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Annual Work Plans</span>
            <CalendarRange className="w-4 h-4 text-[#006B3F]" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.work_plan_projects_count ?? 0}</div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-700 mt-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{stats?.approved_projects_count ?? 0} Approved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Monthly M&E Records</span>
            <ClipboardCheck className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.monthly_reports_count ?? 0}</div>
          <p className="text-[10px] text-gray-400 mt-1">Linked to approved plans</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Outside Plan Activities</span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.outside_activities_count ?? 0}</div>
          <span className="text-[10px] text-amber-700 font-semibold mt-1 inline-block">
            Compliance = NO
          </span>
        </div>

        {isDeskOfficer && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-medium">Pending Reviews</span>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">{stats?.pending_reviews_count ?? 0}</div>
            <p className="text-[10px] text-gray-400 mt-1">Awaiting admin review</p>
          </div>
        )}
      </div>

      {/* SECTION 6: THE FOUR SEPARATE M&E INDICATORS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Core M&E Institutional Indicators
            </h3>
            <p className="text-xs text-gray-500">
              Separately computed metrics according to NBS statutory standards. Never combined into a single score.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Reporting Compliance */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">1. Reporting Compliance</span>
              <span className="text-xs font-bold text-blue-700">{stats?.reporting_compliance_pct ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${stats?.reporting_compliance_pct ?? 0}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Ratio of submitted monthly reports against expected period reports.
            </p>
          </div>

          {/* 2. Work Plan Compliance */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">2. Work Plan Compliance</span>
              <span className="text-xs font-bold text-[#006B3F]">{stats?.work_plan_compliance_pct ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#006B3F] h-full rounded-full transition-all"
                style={{ width: `${stats?.work_plan_compliance_pct ?? 0}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Approved work plan projects vs unapproved outside activities.
            </p>
          </div>

          {/* 3. Achievement */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">3. M&E Achievement</span>
              <span className="text-xs font-bold text-emerald-700">{stats?.average_achievement_pct ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${stats?.average_achievement_pct ?? 0}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Average completed milestone percentage on monthly evaluations.
            </p>
          </div>

          {/* 4. Budget Performance */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">4. Budget Utilization</span>
              <span className="text-xs font-bold text-amber-700">{stats?.budget_performance.utilization_pct ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stats?.budget_performance.utilization_pct ?? 0)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Utilized funds relative to releases/appropriation.
            </p>
          </div>
        </div>
      </div>

      {/* BUDGET EXECUTION OVERVIEW */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Budget Execution Breakdown</h3>
              <p className="text-xs text-gray-500">
                Summary of total appropriations, fund releases, utilized expenditure, and calculated balance.
              </p>
            </div>
            <button
              id="btn-dash-goto-budget"
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-semibold text-[#006B3F] hover:underline flex items-center space-x-1"
            >
              <span>Detailed Budget Sheet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F8F5] p-3 rounded-lg border border-emerald-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Appropriation</span>
              <div className="text-sm sm:text-base font-extrabold text-gray-900 mt-0.5">
                {formatCurrency(stats.budget_performance.total_appropriation)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Released</span>
              <div className="text-sm sm:text-base font-extrabold text-blue-900 mt-0.5">
                {formatCurrency(stats.budget_performance.total_released)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Utilized</span>
              <div className="text-sm sm:text-base font-extrabold text-emerald-900 mt-0.5">
                {formatCurrency(stats.budget_performance.total_utilized)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Calculated Balance</span>
              <div className="text-sm sm:text-base font-extrabold text-amber-900 mt-0.5">
                {formatCurrency(stats.budget_performance.total_balance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY MONITORING & EVALUATION REPORTING TRENDS WITH DEPARTMENTAL COMPARISON, CONSISTENCY & PERFORMANCE LEVELS */}
      {stats && (
        <DepartmentTrendsComparison stats={stats} />
      )}

      {/* DEPARTMENTAL PERFORMANCE COMPARATIVE TABLE (Admin & Management) */}
      {(isAdmin || isManagement) && stats && stats.department_summaries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Departmental Compliance & Achievement Matrix</h3>
              <p className="text-xs text-gray-500">
                Live performance breakdown across established NBS departments, tracking consistency and achievement.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Dept Code</th>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4 text-center">Approved Projects</th>
                  <th className="py-2.5 px-4 text-center">Monthly Reports</th>
                  <th className="py-2.5 px-4 text-center">Consistency</th>
                  <th className="py-2.5 px-4 text-center">Performance Level</th>
                  <th className="py-2.5 px-4 text-center">Reporting Comp.</th>
                  <th className="py-2.5 px-4 text-center">Plan Comp.</th>
                  <th className="py-2.5 px-4 text-center">Budget Util.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {stats.department_summaries.map(dept => {
                  const consistency = dept.reporting_consistency;
                  const perf = dept.performance_level;

                  return (
                    <tr key={dept.department_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-[#006B3F]">{dept.department_code}</td>
                      <td className="py-2.5 px-4 text-gray-900 font-semibold">{dept.department_name}</td>
                      <td className="py-2.5 px-4 text-center">{dept.approved_projects}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-gray-900">{dept.monthly_reports}</td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                            consistency?.status === 'Consistent'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : consistency?.status === 'Regular'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : consistency?.status === 'Inconsistent'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {consistency?.status === 'Consistent' && '🌟 '}
                          {consistency?.consistency_rate || 0}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                            perf?.tier === 'High'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : perf?.tier === 'Moderate'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : perf?.tier === 'Low'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          {dept.achievement_rate}% ({perf?.tier || 'Critical'})
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {dept.reporting_compliance}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {dept.work_plan_compliance}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {dept.budget_utilization}%
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

      {/* Empty State message if fresh install with no data */}
      {stats && stats.work_plan_projects_count === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <CalendarRange className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-800">Database is Clean and Ready</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            No work plans, projects, or reports have been submitted yet.
            {isAdmin && ' As Administrator, add Departments and Users to get started.'}
            {isDeskOfficer && ' Submit your department’s Annual Work Plan to initiate records.'}
          </p>
          {isAdmin && (
            <div className="mt-4 flex justify-center space-x-3">
              <button
                id="btn-dash-create-dept"
                onClick={() => onNavigateTab('departments')}
                className="px-3.5 py-1.5 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                + Create Department
              </button>
              <button
                id="btn-dash-create-user"
                onClick={() => onNavigateTab('users')}
                className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-xs"
              >
                + Create User
              </button>
            </div>
          )}
        </div>
      )}
      {/* MODAL: Department Activities Breakdown */}
      {showDeptActivitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Total Activities by Department</h3>
                  <p className="text-xs text-gray-500">
                    Comprehensive count of approved work plan activities and ad-hoc outside plan activities per department.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-dept-activities-modal"
                onClick={() => setShowDeptActivitiesModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="mt-3 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  id="input-search-dept-activities"
                  type="text"
                  placeholder="Search department name or code..."
                  value={activitySearchQuery}
                  onChange={e => setActivitySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-[#006B3F]"
                />
              </div>
            </div>

            {/* Table of departments and activity tallies */}
            <div className="overflow-y-auto flex-1 rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Approved Plan</th>
                    <th className="py-2.5 px-3 text-center">Outside Plan</th>
                    <th className="py-2.5 px-3 text-center font-bold">Total Activities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {stats?.activities_by_department
                    ?.filter(d =>
                      d.department_name.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                      d.department_code.toLowerCase().includes(activitySearchQuery.toLowerCase())
                    )
                    .sort((a, b) => b.total_activities - a.total_activities)
                    .map(dept => (
                      <tr key={dept.department_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-[#006B3F] bg-[#006B3F]/10 px-1.5 py-0.5 rounded">
                            {dept.department_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {dept.department_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                            {dept.work_plan_activities}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 font-semibold">
                            {dept.outside_activities}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-gray-900 text-white font-extrabold text-xs">
                            {dept.total_activities}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {(!stats?.activities_by_department || stats.activities_by_department.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-gray-400">
                        No departmental activities recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Total Bureau Activities: <strong className="text-gray-900">{stats?.total_activities_count ?? 0}</strong></span>
              <button
                id="btn-close-modal-bottom"
                onClick={() => setShowDeptActivitiesModal(false)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
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
